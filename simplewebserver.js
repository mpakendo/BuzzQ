
var http = require('http');
var fs = require('fs');
var path = require('path');
var https = require('https');
var util = require('util');
var urlmodule = require('url');


http.createServer(function (request, response) {
	   
	  var url = urlmodule.parse(request.url,true);
	  	  
	  console.log('req.url:'+request.url);
	  console.log('Url.href:'+url.href);		
	  console.log('Url.host:'+url.host);	
	  console.log('Url.search:'+url.search);
	  console.log('Url.query:'+url.query);
	  
	if (url.query.q == null) {
	  
    console.log('http file serving starting...');
	
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
	else { 
		var twitterOptions = {
				host: 'search.twitter.com',
				port:80,
				path: '/search.json?q='+url.query.q
		};
		
		var twitPicOptions = {
				host: 'api.twitpic.com',
				//port:80,
				path: '/2/tags/show.json?tag='+url.query.q
		};
	  
	
	var twitterBuffer = '';
	var twitPicBuffer = '';
	var twitterCallComplete = false;
	var twitPicCallComplete = false;
	
	var endHandler = function() {
			console.log ('END Handler!');
			if (twitterCallComplete && twitPicCallComplete) {
				try {	   
						response.writeHead(200, {'Content-Type': 'text/plain'});
						response.write(twitterBuffer,encoding='utf8');
						response.write(twitPicBuffer,encoding='utf8');
				}
				catch (e) {
						console.log('EXCEPTION in END Handler:'+e);
				};
				response.end();
			};
	};
	 
	  http.get(twitterOptions, 
		function(twitterAPIresponse) {
		  console.log("Calling Twitter");
		  twitterAPIresponse.setEncoding('utf8');
		  
		  twitterAPIresponse.on('data',
			function(chunk){
			  twitterBuffer = twitterBuffer + chunk; //need to buffer for AJAX response handling in the browser
			   console.log('TWITTER RESPONSE SEGMENT, code:'+twitterAPIresponse.statusCode); 
			 });
		  twitterAPIresponse.on('end',
					 function() {
			          console.log('TWITTER RESPONSE END');
			          var info = eval('('+twitterBuffer+')');
			          twitterBuffer = 'TWITTER<BR>';
			          if (info!=null && info.results!=null) {
			        	  for (var i = 0;i<info.results.length;i++) {	  
			        		  twitterBuffer = twitterBuffer + info.results[i].text + '--'+ info.results[i].created_at +'<BR>';
			        	  };
			          };
			          twitterCallComplete = true;
			          endHandler();
				  });
	     }).on('error',function(err) {
	    	 			util.log('Twitter Error'+err.message);
	    	 			twitterCallComplete = true;
	    	 			endHandler();
	    	 			});
	 
	 
	/*  http://api.twitpic.com/2/tags/show.json?tag=vic20 */
	  
	  
	  http.get(twitPicOptions, 
				function(twitPicAPIresponse) {
		  		  console.log("Calling twitpic");	
				  twitPicAPIresponse.setEncoding('utf8');
				 
				  twitPicAPIresponse.on('data',
					function(chunk){
					  twitPicBuffer = twitPicBuffer + chunk; //need to buffer for AJAX response handling in the browser
					   console.log('TWITPIC RESPONSE SEGMENT, code:'+twitPicAPIresponse.statusCode); 
					 });
				  
				  twitPicAPIresponse.on('end',
							 function() {
					          console.log('TWITPIC RESPONSE END');
					          var info = eval('('+twitPicBuffer+')');
					          twitPicBuffer = 'TWITPIC<BR>';
					          if (info!=null && info.images!=null) {
					        	  for (var i = 0;i<info.images.length;i++) {	  
					        		  twitPicBuffer = twitPicBuffer + info.images[i].message + '--'+ info.images[i].timestamp +'<BR>';
					        	  };
					          };
					          twitPicCallComplete = true;
					          endHandler(); 
						  });
			     }).on('error',function(err) {
			    	 			util.log('Twitpic Call Error'+err.message);
			    	 			twitPicCallComplete = true;
			    	 			endHandler();
			    	 			});
	};
	
}).listen(8125);

console.log('Server running at http://127.0.0.1:8125/');

