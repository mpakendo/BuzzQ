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

    var output = fs.readFileSync('/Users/martin/Development/RSS-Spec-Material/sample20.xml');
    var url = urlModule.parse(req.url, true);

    util.log('RSS request.');
    util.log('Url query keyword:'+url.query.q);

    res.writeHead(200, {'Content-Type':'application/rss+xml'});
    res.end(output, encoding = 'utf8');
});


/*
 case '/' + API.rssEndPoint:
            util.log('RSS Endpoint called for URL:' + request.url);
            util.log('Refactored req.url:' + request.url);
                        util.log('Url.href:' + url.href);
                        util.log('Url.host:' + url.host);
                        util.log('Url.search:' + url.search);
                        util.log('Url.query:' + url.query);
                        util.log('Url.pathname:' + url.pathname);
            util.log('Url query keyword:'+url.query.q);
            response.writeHead(200, {'Content-Type':'application/rss+xml'});
            queryServices(url.query.q, response, rssFormatter);
            break;

            // var output = fs.readFileSync('/Users/martin/Development/RSS-Spec-Material/sample20.xml');
 */

app.listen(process.env.PORT);
console.log('Listening on port:'+process.env.PORT);
