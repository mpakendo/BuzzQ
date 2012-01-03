
var http = require('http');
var fs = require('fs');
var path = require('path');
var https = require('https');
var util = require('util');
var urlmodule = require('url');

var twitterCallComplete = false;
var twitPicCallComplete = false;
var flickrCallComplete = false;
var CONFIGOPTIONFILENAME = './config.json';
var Config = null;


process.on('uncaughtException', function(e) {
    console.log(e);
});
/*
FlickR API Key for BuzzQ: FOOBAR
Secret: FOOBAROO
 */
function serveFiles(request, response) {
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



function callApi(options, resultObjects, endCallback, errorCallback, buffer) {
      http.get(options,
            function(APIresponse) {
              
              (APIresponse).setEncoding('utf8');

              (APIresponse).on('data',
                function(chunk){
                  buffer = buffer + chunk; //need to buffer
                   //console.log('API RESPONSE SEGMENT, code:'+(APIresponse).statusCode);
                 });

              (APIresponse).on('end',
                         function() {
                          var info = eval('('+buffer+')');
                          endCallback(info,resultObjects);
                      });
             }).on('error', errorCallback);
}


http.createServer(function (request, response) {
    twitterCallComplete = false;
    twitPicCallComplete = false;
    flickrCallComplete = false;

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
                }
              });
            }
        });
    }


	  var url = urlmodule.parse(request.url,true);
	  	  
	 /* console.log('req.url:'+request.url);
	  console.log('Url.href:'+url.href);		
	  console.log('Url.host:'+url.host);	
	  console.log('Url.search:'+url.search);
	  console.log('Url.query:'+url.query);*/



	if (url.query.q == null) {
        serveFiles(request, response);
	}
	else {
         console.log('Buzz Query for:'+url.query.q);
		var twitterOptions = {
				host: 'search.twitter.com',
				port:80,
				path: '/search.json?q='+encodeURIComponent(url.query.q)
		};
		
		var twitPicOptions = {
				host: 'api.twitpic.com',
				//port:80,
				path: '/2/tags/show.json?tag='+encodeURIComponent(url.query.q)
		};
        // http://www.flickr.com/services/api/flickr.photos.search.html
        // flickr API Key for BuzzQ: FOOBAR
        // Secret: FOOBAROO

        var flickrOptions = {
            host: 'api.flickr.com',
            path: '/services/rest/?&method=flickr.photos.search&api_key='+Config.flickr.apiKey+'&tags='+
                encodeURIComponent(url.query.q)+'&format=json&nojsoncallback=1'
        };

	var resultObjects = new Array();
	
	var endHandler = function() {
			//console.log ('END Handler!');
			if (twitterCallComplete && twitPicCallComplete && flickrCallComplete) {
				try {	   
						response.writeHead(200, {'Content-Type': 'text/plain'});
						response.write(JSON.stringify(resultObjects),encoding='utf8');
				}
				catch (e) {
						console.log('EXCEPTION in END Handler:'+e);
				}
				response.end();
			}
	};

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
          twitPicCallComplete = true;
          endHandler();
    };

    var twitpicErrorCallback = function(err) {
        util.log('Twitpic Call Error'+err.message);
        twitPicCallComplete = true;
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
        twitterCallComplete = true;
        endHandler();
    };

    var twitterErrorCallback = function (err) {
       util.log('Twitter Error'+err.message);
       twitterCallComplete = true;
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

*/

    var flickrEndCallback = function(apiPayload, resultObjects) {
         if (apiPayload!=null && apiPayload.photos!=null && apiPayload.stat == 'ok'  && apiPayload.photos.page!=0) {
             for (var i = 0;i<apiPayload.photos.photo.length;i++) {
               var photo = apiPayload.photos.photo[i];
               resultObjects.push({
                   text: photo.title,
                   timestamp: null,
                   user: photo.owner,
                   imageUrl: 'http://farm'+photo.farm+'.static.flickr.com/'+photo.server+'/'+photo.id+'_'+photo.secret+'_m.jpg',
                   source: 'flickr'
               });
             }
         }
         flickrCallComplete = true;
         endHandler();
     };

      var flickrErrorCallback = function (err) {
       util.log('Flickr Error'+err.message);
       flickrCallComplete = true;
       endHandler();
    };

    var flickrBuffer = '';

    callApi(twitterOptions,resultObjects,twitterEndCallback,twitterErrorCallback, twitterBuffer);
    callApi(twitPicOptions,resultObjects,twitpicEndCallback,twitpicErrorCallback,twitpicBuffer);
    callApi(flickrOptions,resultObjects,flickrEndCallback,flickrErrorCallback,flickrBuffer);


	}
	
}).listen(8125);

console.log('Server running at http://127.0.0.1:8125/');

