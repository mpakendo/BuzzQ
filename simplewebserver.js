/*
 simplewebserver.js: Combined web and application server using Node.js.
 The web server serves static files, the application server takes AJAX queries, calls three different API's and returns a JSON response.
 API's:
 - Twitter
 - Twitpic
 - Flickr

 */
var http = require('http');
var fs = require('fs');
var path = require('path');
var https = require('https');
var util = require('util');
var urlmodule = require('url');

var TwitterCallComplete = false;
var TwitPicCallComplete = false;
var FlickrCallComplete = false;
var CONFIGOPTIONFILENAME = './config.json';
var Config = null;
var API = {
    url:    "http://127.0.0.1:8125/",
    port: 8125,
    queryEndPoint:  "query",
    configEndPoint: "config"};


process.on('uncaughtException', function(e) {
    console.log(e);
});


function serveFiles(request, response) { // HTTP web server request handler
    //console.log('http file serving starting...'+request.url);

    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.jpg':
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
    }

    path.exists(filePath, function(exists) {

        if (exists) {
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    response.writeHead(500);
                    response.end();
                }
                else {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                }
            });
        }
        else {
            response.writeHead(404);
            response.end();
        }
    });
}



function callApi(options, resultObjects, endCallback, errorCallback, buffer) { // HTTP calls to APIs
    http.get(options,
        function(APIresponse) {

            (APIresponse).setEncoding('utf8');

            (APIresponse).on('data',
                function(chunk){
                    buffer = buffer + chunk; //need to buffer
                });

            (APIresponse).on('end',
                function() {
                    var info = eval('('+buffer+')');
                    endCallback(info,resultObjects);
                });
        }).on('error', errorCallback);
}


http.createServer(function (request, response) { // The combined web/application server
    TwitterCallComplete = false;
    TwitPicCallComplete = false;
    FlickrCallComplete = false;

    if (Config == null) {
        path.exists(CONFIGOPTIONFILENAME, function (exists) {
            if (!exists)
                throw 'Config.json missing.';
            else {
                fs.readFile(CONFIGOPTIONFILENAME, function(error, data) {
                    if (error)
                        throw error;
                    else {
                        Config = eval('(' + data + ')');
                        console.log('Read config file:'+Config.flickr.apiKey);
                        console.log('Read config file:'+Config.debug.on);
                    }
                });
            }
        });
    }


    var url = urlmodule.parse(request.url,true);


    if (url.pathname == '/'+API.configEndPoint) {

        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end(JSON.stringify(Config.debug),encoding='utf8');
   
    }
    else if (url.query.q == null) {
        serveFiles(request, response);
    }
    else {
        console.log('req.url:'+request.url);
             console.log('Url.href:'+url.href);
             console.log('Url.host:'+url.host);
             console.log('Url.search:'+url.search);
             console.log('Url.query:'+url.query);
            console.log('Url.pathname:' + url.pathname);

        console.log('Buzz Query for:'+url.query.q);
        var twitterOptions = {
            host: 'search.twitter.com',
            port:80,
            path: '/search.json?q='+encodeURIComponent(url.query.q)
        };

        var twitPicOptions = {
            host: 'api.twitpic.com',
            path: '/2/tags/show.json?tag='+encodeURIComponent(url.query.q)
        };
        // http://www.flickr.com/services/api/flickr.photos.search.html

        var flickrOptions = {
            host: 'api.flickr.com',
            path: '/services/rest/?&method=flickr.photos.search&api_key='+Config.flickr.apiKey+'&tags='+
                encodeURIComponent(url.query.q)+'&format=json&nojsoncallback=1'
        };

        var resultObjects = new Array();

        var validatedResultObjects = new Array();

        /* Send a HEAD request
         var http = require('http');
         var options = {method: 'HEAD', host: 'stackoverflow.com', port: 80, path: '/'};
         var req = http.request(options, function(res) {
         console.log('STATUS: '+ res.statusCode);
         console.log(JSON.stringify(res.headers));
         }
         );
         req.end();
         */

        var validatedImageUrlCount = 0;

        function validateImageUrls() {

            for (var i=0;i<resultObjects.length;i++) {
                (function() { //Need new block here
                    var parsedUrl;
                    var options;
                    var req;
                    var resultObject = resultObjects[i];
                    parsedUrl = urlmodule.parse(resultObject.imageUrl);
                    options = {
                        method: 'HEAD',
                        host: parsedUrl.host,
                        port: 80,
                        path: parsedUrl.pathname+(parsedUrl.search?parsedUrl.search:'')+(parsedUrl.hash?parsedUrl.hash:'')};
                    req = http.request(options, function(res) {
                            //console.log('Validating URL:'+res.statusCode+'   '+options.host+options.path);
                            if (res.statusCode != 404) {
                                validatedResultObjects.push(resultObject);
                                //console.log('ADD:'+resultObject);
                            }
                            else
                                console.log('ISSUE with URL:'+ resultObject.imageUrl +'STATUS: '+ res.statusCode);
                            validatedImageUrlCount++;
                        }
                    );
                    req.on('error', function(err) {
                        util.log('Error validating URL:'+resultObjects[i].imageUrl+' ERR:'+err.message);
                        validatedImageUrlCount++;
                    });
                    req.end();
                })();
            }
        }

        function ajaxResponseWriter() {
            //console.log('In AJAX RESPONSE WRITER:'+response+'   '+validatedResultObjects.length);
            try {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                //response.write(JSON.stringify(validatedResultObjects),encoding='utf8');
                response.write(JSON.stringify(resultObjects),encoding='utf8');
            }
            catch (e) {
                console.log('EXCEPTION in END Handler:'+e);
            }
            response.end();
        }

        function endHandlerFinish() {
            //console.log('Entering Timeout Call for END Handler Finish - validatedImageUrlCount:'+validatedImageUrlCount+' resultObjects.length:'+resultObjects.length);

            if (validatedImageUrlCount != resultObjects.length) {
                setTimeout(endHandlerFinish,500);
            }
            else
                ajaxResponseWriter();
        }

        function endHandler() {
            if (TwitterCallComplete && TwitPicCallComplete && FlickrCallComplete     /*true */ ) {
                /*
                 //EITHER:
                 validateImageUrls();
                 endHandlerFinish();
                 //OR:
                 */
                ajaxResponseWriter();

            }
        }

        var twitpicEndCallback = function(apiPayload,resultObjects) {

            /*  http://api.twitpic.com/2/tags/show.json?tag=vic20
             *  http://twitpic.com/show/thumb/1e10q */

            if (apiPayload!=null && apiPayload.images!=null) {
                for (var i = 0;i<apiPayload.images.length;i++) {
                    resultObjects.push({
                        text: apiPayload.images[i].message,
                        timestamp: apiPayload.images[i].timestamp,
                        user: null,
                        imageUrl: 'http://twitpic.com/show/thumb/'+ apiPayload.images[i].short_id,
                        source: 'twitpic'
                    });
                }
            }
            TwitPicCallComplete = true;
            endHandler();
        };

        var twitpicErrorCallback = function(err) {
            util.log('Twitpic Call Error'+err.message);
            TwitPicCallComplete = true;
            endHandler();
        };

        var twitpicBuffer = '';

        var twitterEndCallback = function(apiPayload, resultObjects) {
            if (apiPayload!=null && apiPayload.results!=null) {
                for (var i = 0;i<apiPayload.results.length;i++) {
                    resultObjects.push({
                        text: apiPayload.results[i].text,
                        timestamp: apiPayload.results[i].created_at,
                        user: apiPayload.results[i].from_user,
                        imageUrl: apiPayload.results[i].profile_image_url,
                        source: 'twitter'
                    });
                }
            }
            TwitterCallComplete = true;
            endHandler();
        };

        var twitterErrorCallback = function (err) {
            util.log('Twitter Error'+err.message);
            TwitterCallComplete = true;
            endHandler();
        };

        var twitterBuffer = '';

        /*
         Flickr formats:
         http://farm{farm-id}.static.flickr.com/{server-id}/{photo-id}_{photo-secret}.jpg
         {
         "photos": {
         "page": 1,
         "pages": 7,
         "perpage": 100,
         "total": "641",
         "photo": [{
         "id": "6561255521",
         "owner": "23185552@N04",
         "secret": "620ee7ec38",
         "server": "7026",
         "farm": 8,
         "title": "vic20",
         "ispublic": 1,
         "isfriend": 0,
         "isfamily": 0
         }, ..

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

        var flickrEndCallback = function(apiPayload, resultObjects) {
            if (apiPayload!=null && apiPayload.photos!=null && apiPayload.stat == 'ok'  && apiPayload.photos.page!=0) {
                for (var i = 0;i<apiPayload.photos.photo.length;i++) {
                    var photo = apiPayload.photos.photo[i];
                    resultObjects.push({
                        text: photo.title,
                        timestamp: null,
                        user: photo.owner,
                        imageUrl: 'http://farm'+photo.farm+'.static.flickr.com/'+photo.server+'/'+photo.id+'_'+photo.secret+'_z.jpg',
                        source: 'flickr'
                    });
                }
            }
            FlickrCallComplete = true;
            endHandler();
        };

        var flickrErrorCallback = function (err) {
            util.log('Flickr Error'+err.message);
            FlickrCallComplete = true;
            endHandler();
        };

        var flickrBuffer = '';


        callApi(flickrOptions,resultObjects,flickrEndCallback,flickrErrorCallback,flickrBuffer);
        callApi(twitPicOptions,resultObjects,twitpicEndCallback,twitpicErrorCallback,twitpicBuffer);
        callApi(twitterOptions,resultObjects,twitterEndCallback,twitterErrorCallback, twitterBuffer);


    }

}).listen(API.port);

console.log('Server running at '+API.url);

