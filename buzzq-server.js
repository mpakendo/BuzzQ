/**
 * BuzzQ node.js server
 *
 * buzzq-server.js: Combined web and application server using Node.js.
  The web server serves static files, the application server takes AJAX queries, calls  different API's
  and returns a JSON response.
  API's:
  - Twitter
  - Twitpic (no longer, as of fall 2014)
  - Flickr
  - Instagram
  - Tumblr

  EJS (https://npmjs.org/package/ejs) is used together with Express (http://expressjs.com/) for server side templating.
 *
 */


var util = require('util');
var http = require('http');
var https = require('https');
var urlModule = require('url');
var fs = require('fs');
var express = require('express');
var nodeStatic = require('node-static');
var mime = require('node-static/lib/node-static/mime');
var oauth = require('oauth'); // https://npmjs.org/package/oauth
var Q = require('q'); // Promises package, https://www.npmjs.org/package/q
                      // also http://promises-aplus.github.io/promises-spec/

mime.contentTypes.ejs='text/plain';


process.on('uncaughtException', function(e) {
    util.log('UNCAUGHT EXCEPTION:'+ e);
});

var Config = {
    flickr: {apiKey:null, perPage:50},
    instagram: {accessToken:null},
    twitter: {  consumerKey:null, // new Twitter API, see https://dev.twitter.com/docs/auth/application-only-auth
                consumerSecret:null,
                accessToken: null },
    tumblr: {consumerKey:null},
    debug: {debugOn:false},
    api: {url:null}};
var API = {
    queryEndPoint:  "query",
    configEndPoint: "config",
    rssEndPoint: "feed.rss"};
var oauth2 = null; //initialize during app.configure

var app = express();
var staticHttpServer = new nodeStatic.Server('./');


function callApiPromise(options) {
    var deferred = Q.defer();
    var buffer = '';

    function httpCallback(APIresponse) {
        (APIresponse).setEncoding('utf8');
        (APIresponse).on('data',
            function (chunk) {
                buffer = buffer + chunk; //need to buffer
            });
        (APIresponse).on('end',
            function () {
                try {
                    var info = eval('(' + buffer + ')'); // Instagram returns a 404 html page crashing eval.. TODO: elegant error handling?
                    deferred.resolve(info);
                }
                catch (e) {
                    util.log('EXCEPTION in Call API for host:' + options.host);
                    deferred.reject(e);
                }
            });
    }

    if (options.port == 443)
        https.get(options, httpCallback).on('error', deferred.reject);
    else
        http.get(options, httpCallback).on('error', deferred.reject);

    return deferred.promise;
}

function queryServices(queryString, response, template) {
    if (Config.debug.debugOn) {
        util.log('Buzz Query for:' + encodeURIComponent(queryString));
    }
    var resultObjects = [];


    /*  Twitpic
     *  -------
     *  http://api.twitpic.com/2/tags/show.json?tag=vic20
     *  http://twitpic.com/show/thumb/1e10q
     *  */

    var twitPicOptions = {
        host:'api.twitpic.com',
        path:'/2/tags/show.json?tag=' + encodeURIComponent(queryString)
    };

    function twitpicEndCallback(apiPayload) {
        if (apiPayload !== null && apiPayload.images !== null) {
            for (var i = 0; i < apiPayload.images.length; i++) {
                resultObjects.push({
                    text:apiPayload.images[i].message,
                    timestamp:apiPayload.images[i].timestamp,
                    user:null,
                    imageUrl:'http://twitpic.com/show/thumb/' + apiPayload.images[i].short_id,
                    source:'twitpic',
                    val1: null,
                    val2: null,
                    val3: null,
                    val4: null
                });
            }
        }
    }


    /*  Twitter
     *  -------
     *  https://api.twitter.com/1.1/search/tweets.json, see  https://dev.twitter.com/docs/api/1.1/get/search/tweets#
     *  https://api.twitter.com/1.1/search/tweets.json?q=%23freebandnames
     *
     *  */

    var twitterOptions = {

        host:'api.twitter.com',
        port: 443,
        path:'/1.1/search/tweets.json?q='+encodeURIComponent(queryString)+'&count=100',
        headers: {
            Authorization: 'Bearer '+Config.twitter.accessToken
        }
    };

    function twitterEndCallback(apiPayload) {
        if (apiPayload !== null && apiPayload.statuses !== null) {
            for (var i = 0; i < apiPayload.statuses.length; i++) {
                resultObjects.push({
                    text:apiPayload.statuses[i].text,
                    timestamp:apiPayload.statuses[i].created_at,
                    user:apiPayload.statuses[i].user.screen_name,
                    imageUrl:apiPayload.statuses[i].user.profile_image_url,
                    source:'twitter',
                    val1: apiPayload.statuses[i].id_str,
                    val2: null,
                    val3: null,
                    val4: null
                });
            }
        }
    }

    /*  Flickr
     *  -------

     Flickr formats:
     http://farm{farm-id}.static.flickr.com/{server-id}/{photo-id}_{photo-secret}.jpg
     ..
     Size Suffixes
     The letter suffixes are as follows:

     s	small square 75x75
     t	thumbnail, 100 on longest side
     m	small, 240 on longest side
     -	medium, 500 on longest side
     z	medium 640, 640 on longest side
     b	large, 1024 on longest side*
     o	original image, either a jpg, gif or png, depending on source format
     */


    var flickrOptions = { // http://www.flickr.com/services/api/flickr.photos.search.html
        host:'api.flickr.com',
        path:'/services/rest/?&method=flickr.photos.search&api_key=' + Config.flickr.apiKey + '&text=' +
            encodeURIComponent(queryString) + '&format=json&nojsoncallback=1' + '&per_page='+Config.flickr.perPage
    };

    function flickrEndCallback(apiPayload) {
        if (apiPayload !== null && apiPayload.photos !== null && apiPayload.stat === 'ok' && apiPayload.photos.page !== 0) {
            for (var i = 0; i < apiPayload.photos.photo.length; i++) {
                var photo = apiPayload.photos.photo[i];
                resultObjects.push({
                    text:photo.title,
                    timestamp:null,
                    user:photo.owner,
                    imageUrl:'http://farm' + photo.farm + '.static.flickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '_z.jpg',
                    source:'flickr',
                    val1: null,
                    val2: null,
                    val3: null,
                    val4: null
                });
            }
        }
    }

    /*  Instagram
     *  -------
     *
     *  */


    var instagramOptions = { // https://api.instagram.com/v1/tags/tag/media/recent?access_token=TOKEN
        host:'api.instagram.com',
        port:443,
        path:'/v1/tags/' + encodeURIComponent(queryString) + '/media/recent?access_token=' + Config.instagram.accessToken
    };

    function instagramEndCallback(apiPayload) {
        if (apiPayload !== null && apiPayload.meta.code === 200) {
            for (var i = 0; i < apiPayload.data.length; i++) {
                var tags = apiPayload.data[i].user.username + ' (' + apiPayload.data[i].user.full_name + '): ';
                for (var j = 0; j < apiPayload.data[i].tags.length; j++) {
                    tags = tags + apiPayload.data[i].tags[j] + " ";
                }
                resultObjects.push({
                    text:tags,
                    timestamp:new Date(apiPayload.data[i].created_time * 1000),
                    user:apiPayload.data[i].user.username + '(' + apiPayload.data[i].user.full_name + ')',
                    imageUrl:apiPayload.data[i].images.standard_resolution.url,
                    source:'instagram',
                    val1: null,
                    val2: null,
                    val3: null,
                    val4: null
                });
            }
        }
    }


    /* Tumblr
     * ------
     *
     */


    var tumblrOptions = { // http://api.tumblr.com/v2/tagged?tag=lol&api_key=TUMBLR_CONSUMERKEY

        host:'api.tumblr.com',
        port:80,
        path:'/v2/tagged?tag=' + encodeURIComponent(queryString) + '&limit=20&filter=text' + '&api_key=' + Config.tumblr.consumerKey
    };

    function tumblrEndCallback(apiPayload) {
        if (apiPayload !== null && apiPayload.meta.status === 200) {
            for (var i = 0; i < apiPayload.response.length; i++) {
                var tags = apiPayload.response[i].tags;
                var tagsText = "";
                var imageUrl = "";

                for (var j=0; j < tags.length; j++) {
                    if (j == (tags.length - 1)) {
                        tagsText = tagsText + tags[j];
                    }
                    else {
                        tagsText = tagsText + tags[j] + ', ';
                    }
                }

                switch (apiPayload.response[i].type) {
                    case 'photo':
                        imageUrl = apiPayload.response[i].photos[0].original_size.url;
                        break;
                    case 'audio':
                        imageUrl =  apiPayload.response[i].album_art;
                        break;
                    case 'video':
                        imageUrl = apiPayload.response[i].thumbnail_url;
                        break;
                    case 'text':
                        break;
                }

                resultObjects.push({
                    text:apiPayload.response[i].type+'- Tags: '+tagsText,
                    timestamp:new Date(apiPayload.response[i].timestamp),
                    user:'TumblR:'+apiPayload.response[i].blog_name,
                    imageUrl:imageUrl,
                    source:'tumblr',
                    val1: apiPayload.response[i].post_url,
                    val2: null,
                    val3: null,
                    val4: null
                });
            }
        }
    }



    function errorCallback (param) {
        return function (err) {
            util.log('Error in API call:' + param + ' ' + err.message);
        }
    }

    var tumblrCallPromise = callApiPromise(tumblrOptions)
        .then(tumblrEndCallback, errorCallback('Tumblr'));
    var flickrCallPromise = callApiPromise(flickrOptions)
        .then(flickrEndCallback, errorCallback('Flickr'));
    var twitterCallPromise = callApiPromise(twitterOptions)
        .then(twitterEndCallback, errorCallback('Twitter'));
    var instagramCallPromise = callApiPromise(instagramOptions)
        .then(instagramEndCallback, errorCallback('Instagram'));

    function fulfilledPromisesHandler() {
        try {
            response.render(template, {results:resultObjects});
        } catch (e) {
            util.log('EXCEPTION in fulfilled promises Handler:' + e);
        }
    }

    var allPromises = Q.allSettled([flickrCallPromise, tumblrCallPromise, twitterCallPromise, instagramCallPromise]);
    allPromises.then(fulfilledPromisesHandler, errorCallback('All Promises'));

}


app.configure('all',function() {
    if (Config.flickr.apiKey == null) { //assume this means all configs have not been set
        if (process.env.FLICKR_APIKEY &&
            process.env.DEBUG_DEBUGON &&
            process.env.INSTAGRAM_ACCESSTOKEN &&
            process.env.TWITTER_CONSUMERKEY &&
            process.env.TWITTER_CONSUMERSECRET) {
            Config.flickr.apiKey = process.env.FLICKR_APIKEY;
            Config.instagram.accessToken = process.env.INSTAGRAM_ACCESSTOKEN;
            Config.twitter.consumerKey = process.env.TWITTER_CONSUMERKEY;
            Config.twitter.consumerSecret = process.env.TWITTER_CONSUMERSECRET;
            Config.tumblr.consumerKey = process.env.TUMBLR_CONSUMERKEY;
            Config.debug.debugOn = (process.env.DEBUG_DEBUGON=='true'?true:false);
            util.log('Read config var flickr API key:' + Config.flickr.apiKey);
            util.log('Read config var instagram access token:' + Config.instagram.accessToken);
            util.log('Read config var twitter consumer key:' + Config.twitter.consumerKey);
            util.log('Read config var twitter consumer secret:' + Config.twitter.consumerSecret);
            util.log('Read config var tumblr consumer secret:' + Config.tumblr.consumerKey);
            util.log('Read config var debug:' + Config.debug.debugOn +'type:' + typeof(Config.debug.debugOn));
        }
        else {
            util.log('Configuration variables missing. Node server cannot function.');
            throw 'Configuration missing. Server broken.';
        }
        // http://webapplog.com/node-js-oauth1-0-and-oauth2-0-twitter-api-v1-1-examples
        var OAuth2 = oauth.OAuth2;
        oauth2 = new OAuth2(
            Config.twitter.consumerKey,
            Config.twitter.consumerSecret,
            'https://api.twitter.com/',
            null,
            'oauth2/token',
            null);
        oauth2.getOAuthAccessToken('', {'grant_type':'client_credentials'},
            function (e, access_token, refresh_token, results) {
                Config.twitter.accessToken = access_token;
                util.log('Twitter access token, bearer: ' + Config.twitter.accessToken);
        });
    }
});



app.get('/'+ API.rssEndPoint + '*', function (req, res) {

    var url = urlModule.parse(req.url, true);

    if (Config.debug.debugOn) {
        util.log('RSS request.');
        util.log('Url query keyword:'+url.query.q);
    }

    res.set('Content-Type', 'application/rss+xml');

    // No reference to the EJS library.
    // Express parses the view template’s filename and uses the extension (in this case,
    // the ejs from rss.ejs) to determine which view engine should be used.

    queryServices(url.query.q,res,'rss.ejs');

});





app.get('/'+ API.queryEndPoint + '*', function (req, res) {
    var url = urlModule.parse(req.url, true);
    if (Config.debug.debugOn) {
        util.log('REST request.');
        util.log('Url query keyword:'+url.query.q);
    }

    res.set('Content-Type', 'application/json');

    // No reference to the EJS library.
    // Express parses the view template’s filename and uses the extension (in this case,
    // the ejs from json.ejs) to determine which view engine should be used.

    queryServices(url.query.q,res,'json.ejs');
});




app.get('/', function (req, res) {
    if (Config.debug.debugOn) {
        var url = urlModule.parse(req.url, true);

        util.log('ROUTE: / Req.url:' + req.url);
        util.log('Url.href:' + url.href);
        util.log('Url.host:' + url.host);
        util.log('Url.search:' + url.search);
        util.log('Url.query:' + url.query);
        util.log('Url.pathname:' + url.pathname);

    }
    staticHttpServer.serve(req, res);
});


app.get('/*.:format(html|js|css|jpg|png|ejs|gif)', function (req, res) {
    if (Config.debug.debugOn) {
        var url = urlModule.parse(req.url, true);

        util.log('ROUTE: /*.:format(html|js|css|jpg|png|ejs) Req.url:' + req.url);
        util.log('Url.href:' + url.href);
        util.log('Url.host:' + url.host);
        util.log('Url.search:' + url.search);
        util.log('Url.query:' + url.query);
        util.log('Url.pathname:' + url.pathname);
    }
    staticHttpServer.serve(req, res);
});



app.get('/'+ API.configEndPoint, function (req, res) {
    var config = {debug:Config.debug};
    if (Config.debug.debugOn) {
        util.log('Configuration request.');
    }
    res.writeHead(200, {'Content-Type':'text/plain'});
    res.end(JSON.stringify(config), encoding = 'utf8');
});



app.listen(process.env.PORT);
console.log('Listening on port:'+process.env.PORT);
