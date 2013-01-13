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
 */


var util = require('util');
var http = require('http');
var https = require('https');
var urlModule = require('url');
var fs = require('fs');
var express = require('express');
var nodeStatic = require('node-static');


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
    debug: {debugOn:false},
    api: {url:null}};
var API = {
    queryEndPoint:  "query",
    configEndPoint: "config",
    rssEndPoint: "feed.rss"};

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
        if (TwitterCallComplete && TwitPicCallComplete && FlickrCallComplete && InstagramCallComplete) {
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
     *  */

    var twitterOptions = {
        host:'search.twitter.com',
        port:80,
        path:'/search.json?q=' + encodeURIComponent(queryString)
    };

    var twitterEndCallback = function (apiPayload, resultObjects) {
        if (apiPayload !== null && apiPayload.results !== null) {
            for (var i = 0; i < apiPayload.results.length; i++) {
                resultObjects.push({
                    text:apiPayload.results[i].text,
                    timestamp:apiPayload.results[i].created_at,
                    user:apiPayload.results[i].from_user,
                    imageUrl:apiPayload.results[i].profile_image_url,
                    source:'twitter',
                    val1: apiPayload.results[i].id_str,
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
    if (Config.flickr.apiKey == null) {
        if (process.env.FLICKR_APIKEY &&
            process.env.DEBUG_DEBUGON &&
            process.env.INSTAGRAM_ACCESSTOKEN) {
            Config.flickr.apiKey = process.env.FLICKR_APIKEY;
            Config.instagram.accessToken = process.env.INSTAGRAM_ACCESSTOKEN;
            Config.debug.debugOn = process.env.DEBUG_DEBUGON;
            util.log('Read config var:' + Config.flickr.apiKey);
            util.log('Read config var:' + Config.instagram.accessToken);
            util.log('Read config var:' + Config.debug.debugOn);
        }
        else {
            util.log('Configuration variables missing. Node server cannot function.');
            throw 'Configuration missing. Server broken.';

        }
    }
});


app.get('/*.:format(html|js|css|jpg|png)', function (req, res) {

    var url = urlModule.parse(req.url, true);

    util.log('Req.url:' + req.url);
    /*util.log('Url.href:' + url.href);
    util.log('Url.host:' + url.host);
    util.log('Url.search:' + url.search);
    util.log('Url.query:' + url.query);
    util.log('Url.pathname:' + url.pathname);*/
    staticHttpServer.serve(req, res);
});

app.get('/'+ API.configEndPoint, function (req, res) {
    var config = {debug:Config.debug};
    util.log('Configuration request.');
    res.writeHead(200, {'Content-Type':'text/plain'});
    res.end(JSON.stringify(config), encoding = 'utf8');
});



app.get('/'+ API.rssEndPoint + '*', function (req, res) {

    /*var output = fs.readFileSync('/Users/martin/Development/RSS-Spec-Material/sample20.xml'); // Temp only. TODO: use template engine
    var url = urlModule.parse(req.url, true);

    util.log('RSS request.');
    util.log('Url query keyword:'+url.query.q);

    res.writeHead(200, {'Content-Type':'application/rss+xml'});
    res.end(output, encoding = 'utf8');*/
    var url = urlModule.parse(req.url, true);
    var data = [
        {
            text:'MPAKENDO Test 1',
            timestamp:(new Date()).toString(),
            user:'MPAKENDO1',
            imageUrl:'http://farm9.static.flickr.com/8437/7781360360_259fe57ea6_z.jpg',
            source:'twitter',
            val1:'PARAM1',
            val2:null,
            val3:null,
            val4:null
        },
        {
            text:'MPAKENDO Test 2',
            timestamp:(new Date()).toString(),
            user:'MPAKENDO2',
            imageUrl:'http://distilleryimage1.s3.amazonaws.com/2f52a80231c311e2a74f1231381b811d_7.jpg',
            source:'instagram',
            val1:null,
            val2:null,
            val3:null,
            val4:null
        },
        {
            text:'MPAKENDO Test 3',
            timestamp:(new Date()).toString(),
            user:'MPAKENDO3',
            imageUrl:'http://twitpic.com/show/thumb/4xm027',
            source:'twitpic',
            val1:null,
            val2:null,
            val3:'PARAM3',
            val4:null
        }

    ];


    util.log('RSS request.');
    util.log('Url query keyword:'+url.query.q);

    res.set('Content-Type', 'application/rss+xml');

    //The first thing to notice is the lack of any reference to the EJS library.
    // Express parses the view template’s filename and uses the extension (in this case,
    // the ejs from rss.ejs) to determine which view engine should be used.

    //res.render('rss.ejs',{results: data});
    queryServices(url.query.q,res,'rss.ejs');
/*
res.render('test.ejs', {debug:true, compileDebug: true,
    data: {
    header: 'FÜKENGRÜVEN',
    title: 'FUKYEAH',
    names: ['foo', 'bar', 'baz']
}});
*/

});


app.listen(process.env.PORT);
console.log('Listening on port:'+process.env.PORT);
