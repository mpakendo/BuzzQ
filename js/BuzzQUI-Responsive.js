/**
 * Responsive Web Design UI based on Twitter Bootstrap
 *
 * http://twitter.github.com/bootstrap/index.html
 */
function BuzzQUI() {
    this.searchString ="";

    this.querySources = ["twitter","twitpic","flickr","instagram"]; // order needs to match the order in the HTML tabs
    this.selectedDisplayTab = "twitter";
    this.hasDisplayedSources = {"twitter": false,
        "twitpic": false,
        "flickr":  false,
        "instagram": false};
    this.api = {
        url: document.location,
        queryEndPoint:  "query",
        configEndPoint: "config",
        rssEndPoint: "feed"
    };
    this.debug = false;

}

// Now we define the object BuzzQUI
(function() {


    function getXmlHttpObject() {
           var xmlHttp=null;
           try {
               // Firefox, Opera 8.0+, Safari
               xmlHttp=new XMLHttpRequest();
           }
           catch (e) {
               // Internet Explorer
               try {
                   xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");
               }
               catch (ex) {
                   xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");
               }
           }
           return xmlHttp;
       }

       function invokeAJAXCall(xmlHttp,url, func) {
           xmlHttp.onreadystatechange=
               function() {
                   //debug.println("READYSTATECHANGE:"+xmlHttp.readyState+" STATUS:"+xmlHttp.status+" TEXT: "+xmlHttp.statusText);
                   if (xmlHttp.readyState==4) {
                       if (xmlHttp.status==200) {
                           func();
                       }
                   }
               };
           debug.println("Calling AJAX URL:" + url);

           xmlHttp.open("GET",url,true);
           xmlHttp.send(null);
       }

    //debug.println("document.location:"+document.location);
    function getAttrFromEvent (event, attr) {
        var id;
        if (!event) event = window.event;
        if (!event.target) { //IE
            id = window.event.srcElement.getAttribute(attr);
        }
        else { // Mozilla
            id = event.target.getAttribute(attr);
        }
        return id;
    }


    BuzzQUI.prototype.setSearchString = function (event) {
        try {
            var id = getAttrFromEvent(event, "id");
            this.searchString = $("#" + id).val();
            this.hasDisplayedSources = {'twitter':false,
                'twitpic':false,
                'flickr':false,
                'instagram':false};
        }
        catch (e) {
            alert('Exception:' + e.toString())
        }
    };

    BuzzQUI.prototype.gotoURL = function(event) {
        /* http://localhost:8125/rss?q=vic20 */
        window.open(this.api.url+this.api.rssEndPoint+".rss?q="+this.searchString);
    };

    BuzzQUI.prototype.goFind = function (event) {
        try {
            var callbackFunction;
            debug.println('Go Find');

            callbackFunction =
                function (data) { // TODO Refactor
                    var twitterResults = '<div id=\"twittercontent\">';
                    var twitpicResults = '';
                    var flickrResults = '';
                    var instagramResults = '';
                    debug.println('CallBackeroni!'+JSON.stringify(data[0]));
                    for (var i = 0; i < data.length; i++) {
                        debug.println(data[i].text);
                    }
                };

            url = this.api.url + this.api.queryEndPoint + "?q=" + this.searchString;
            if (!(this.searchString == "")) {
                $.getJSON(url, callbackFunction);
            }
        }
        catch (e) {
            alert('Exception:' + e.toString());
        }
    };


}) ();