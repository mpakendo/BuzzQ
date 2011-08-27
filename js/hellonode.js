

var http = require('http');
var https = require('https');
var util = require('util');
var fs = require('fs');
var urlmodule = require('url');
var TwitPic = require('./twitpic.js').TwitPic;
var twitPicApi = new TwitPic();


http.createServer(function (req, res) {
   
  var url = urlmodule.parse(req.url,true);
  var twitterRequestOptions = {
			host: 'search.twitter.com',
			port:80,
			path: '/search.json?q='+url.query.q
	};
  
  console.log('req.url:'+req.url);
  console.log('Url.href:'+url.href);		
  console.log('Url.host:'+url.host);	
  console.log('Url.search:'+url.search);
  console.log('Url.query:'+url.query);
  console.log('Url.query.q:'+url.query.q);	
  
// This crashes the server..
  /*
  twitPicApi.tags.show({tag: url.query.q}, 
		    function(apiResponse) {
	          console.log('Twitpic API Response:'+apiResponse);
	        });
  
  http.get(twitterRequestOptions, 
			function(response) {
	          console.log('Got Twitter Response - Status:'+response.statusCode);
	          res.writeHead(200, {'Content-Type': 'text/plain'}); // is the place for writing the head??
			  response.setEncoding('utf8');
			  response.on('end', 
			    function(){
				  console.log('Got Twitter Response - end event fired'); 
				  res.end();
				});
			  response.on('data',
				function(chunk){
				   console.log('Got Twitter Response - data event fired');
				   res.write(chunk,encoding='utf8'); // async write back - splice twitpic in too?				   
				 });
		     }).on('error',function(err){util.log('Error'+err.message);});
*/
	
// RESPONSE STUBS	
	
  var filename2 = '/Users/martin/Desktop/TwitterSearch.json';
  var filename = '/Users/martin/Desktop/twitpicTagQuery.json';
 
  fs.readFile(filename2,'utf8',
	function(err,data) {
	  if (err) {throw err;}; 
	  try {	   
		res.writeHead(200, {'Content-Type': 'text/plain'});
		//res.statusCode = 200;
	    res.write(data,encoding='utf8');
	  }
	  catch (e) {
		console.log('EXCEPTION:'+e);
	  };
	  res.end();
  });
   
}).listen(8124, "127.0.0.1");
console.log('Server running at http://127.0.0.1:8124/');
