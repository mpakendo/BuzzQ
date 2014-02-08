/**
 * BuzzQ node.js server
 *
 * buzzq-server.js: Combined web and application server using Node.js.
  The web server serves static files, the application server takes AJAX queries, calls  different API's
  and returns a JSON response.
  API's:
  - Twitter
  - Twitpic
  - Flickr
  - Instagram
  EJS (https://npmjs.org/package/ejs) is used together with Express (http://expressjs.com/) for server side templating.
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

mime.contentTypes.ejs='text/plain';


process.on('uncaughtException', function(e) {
    util.log('UNCAUGHT EXCEPTION:'+ e);
});

var TwitterCallComplete = false;
var TwitPicCallComplete = false;
var FlickrCallComplete = false;
var InstagramCallComplete = false;
var Config = {
    flickr: {apiKey:null, perPage:50},
    instagram: {accessToken:null},
    twitter: {  consumerKey:null, // new Twitter API, see https://dev.twitter.com/docs/auth/application-only-auth
                consumerSecret:null,
                accessToken: null },
    debug: {debugOn:false},
    api: {url:null}};
var API = {
    queryEndPoint:  "query",
    configEndPoint: "config",
    rssEndPoint: "feed.rss"};
var oauth2 = null; //initialize during app.configure

var app = express();
var staticHttpServer = new nodeStatic.Server('./');



function callApi(options, resultObjects, endCallback, errorCallback, buffer) {
    var callback = function(APIresponse) {
        (APIresponse).setEncoding('utf8');
        (APIresponse).on('data',
            function(chunk){
                buffer = buffer + chunk; //need to buffer
            });
        (APIresponse).on('end',
            function() {
               try {
                  var info = eval('('+buffer+')'); // Instagram returns a 404 html page crashing eval.. TODO: elegant error handling?
                  endCallback(info,resultObjects);
                }
                catch (e) {
                    util.log('EXCEPTION in Call API for host:'+ options.host);
                    errorCallback(e);
                }
            });
    };

    if (options.port == 443)
        https.get(options,callback).on('error',errorCallback);
    else
        http.get(options,callback).on('error',errorCallback);
}


function queryServices(queryString, response, template) {
    util.log('Buzz Query for:' + encodeURIComponent(queryString));
    var resultObjects = [];

    function endHandler() {
        if (TwitterCallComplete && TwitPicCallComplete && FlickrCallComplete && InstagramCallComplete) { //TODO: timeouts
            try {
                response.render(template,{results: resultObjects});
            } catch (e) {
                util.log('EXCEPTION in END Handler:' + e);
            }
        }
    }


    /*  Twitpic
     *  -------
     *  http://api.twitpic.com/2/tags/show.json?tag=vic20
     *  http://twitpic.com/show/thumb/1e10q
     *  */

    var twitPicOptions = {
        host:'api.twitpic.com',
        path:'/2/tags/show.json?tag=' + encodeURIComponent(queryString)
    };

    var twitpicEndCallback = function (apiPayload, resultObjects) {
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
        TwitPicCallComplete = true;
        endHandler();
    };

    var twitpicErrorCallback = function (err) {
        util.log('Twitpic Call Error:' + err.message);
        TwitPicCallComplete = true;
        endHandler();
    };

    var twitpicBuffer = '';

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

    var twitterEndCallback = function (apiPayload, resultObjects) {
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
        TwitterCallComplete = true;
        endHandler();
    };

    var twitterErrorCallback = function (err) {
        util.log('Twitter Error:' + err.message);
        TwitterCallComplete = true;
        endHandler();
    };

    var twitterBuffer = '';


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

    var flickrEndCallback = function (apiPayload, resultObjects) {
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
        FlickrCallComplete = true;
        endHandler();
    };

    var flickrErrorCallback = function (err) {
        util.log('Flickr Error:' + err.message);
        FlickrCallComplete = true;
        endHandler();
    };

    var flickrBuffer = '';

    /*  Instagram
     *  -------
     *  */


    var instagramOptions = { // https://api.instagram.com/v1/tags/tag/media/recent?access_token=TOKEN
        host:'api.instagram.com',
        port:443,
        path:'/v1/tags/' + encodeURIComponent(queryString) + '/media/recent?access_token=' + Config.instagram.accessToken
    };

    var instagramEndCallback = function (apiPayload, resultObjects) {
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
        InstagramCallComplete = true;
        endHandler();
    };

    var instagramErrorCallback = function (err) {
        util.log('Instagram Error:' + err.message);
        InstagramCallComplete = true;
        endHandler();
    };

    var instagramBuffer = '';

    TwitterCallComplete = false;
    TwitPicCallComplete = false;
    FlickrCallComplete = false;
    InstagramCallComplete = false;
    callApi(flickrOptions, resultObjects, flickrEndCallback, flickrErrorCallback, flickrBuffer);
    callApi(twitPicOptions, resultObjects, twitpicEndCallback, twitpicErrorCallback, twitpicBuffer);
    callApi(twitterOptions, resultObjects, twitterEndCallback, twitterErrorCallback, twitterBuffer);
    callApi(instagramOptions, resultObjects, instagramEndCallback, instagramErrorCallback, instagramBuffer);

}


app.configure(function() {
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
            Config.debug.debugOn = process.env.DEBUG_DEBUGON;
            util.log('Read config var flickr API key:' + Config.flickr.apiKey);
            util.log('Read config var instagram access token:' + Config.instagram.accessToken);
            util.log('Read config var twitter consumer key:' + Config.twitter.consumerKey);
            util.log('Read config var twitter consumer secret:' + Config.twitter.consumerSecret);
            util.log('Read config var debug:' + Config.debug.debugOn);
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

    /*util.log('RSS request.');
    util.log('Url query keyword:'+url.query.q);*/

    res.set('Content-Type', 'application/rss+xml');

    // No reference to the EJS library.
    // Express parses the view template’s filename and uses the extension (in this case,
    // the ejs from rss.ejs) to determine which view engine should be used.

    queryServices(url.query.q,res,'rss.ejs');

});





app.get('/'+ API.queryEndPoint + '*', function (req, res) {
    var url = urlModule.parse(req.url, true);
    /*
    util.log('REST request.');
    util.log('Url query keyword:'+url.query.q);
    */
    res.set('Content-Type', 'application/json');

    // No reference to the EJS library.
    // Express parses the view template’s filename and uses the extension (in this case,
    // the ejs from json.ejs) to determine which view engine should be used.

    queryServices(url.query.q,res,'json.ejs');

});




app.get('/', function (req, res) {
/*
    var url = urlModule.parse(req.url, true);

    util.log('ROUTE: / Req.url:' + req.url);
    util.log('Url.href:' + url.href);
    util.log('Url.host:' + url.host);
    util.log('Url.search:' + url.search);
    util.log('Url.query:' + url.query);
    util.log('Url.pathname:' + url.pathname);
*/
    staticHttpServer.serve(req, res);
});


app.get('/*.:format(html|js|css|jpg|png|ejs)', function (req, res) {
/*
    var url = urlModule.parse(req.url, true);

    util.log('ROUTE: /*.:format(html|js|css|jpg|png|ejs) Req.url:' + req.url);
    util.log('Url.href:' + url.href);
    util.log('Url.host:' + url.host);
    util.log('Url.search:' + url.search);
    util.log('Url.query:' + url.query);
    util.log('Url.pathname:' + url.pathname);
*/
    staticHttpServer.serve(req, res);
});



app.get('/'+ API.configEndPoint, function (req, res) {
    var config = {debug:Config.debug};
    util.log('Configuration request.');
    res.writeHead(200, {'Content-Type':'text/plain'});
    res.end(JSON.stringify(config), encoding = 'utf8');
});



app.listen(process.env.PORT);
console.log('Listening on port:'+process.env.PORT);
