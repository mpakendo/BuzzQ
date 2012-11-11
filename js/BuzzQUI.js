

function BuzzQUI() {
    this.searchString ="";
    this.galleriaLoaded = false;
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
    this.loadingDialog = $('<div></div>')
        .html('Loading buzz data from all sources.<div style="width: 80%; margin: 0px auto;"><img src="images/loader.gif"/> </div>')
        .dialog ({
            autoOpen: false,
            title: 'Load Buzz'
    });
}

pager = new Imtech.Pager();

// Now we define the object BuzzQUI
(function() {


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
                //debug.printf("READYSTATECHANGE:"+xmlHttp.readyState+" STATUS:"+xmlHttp.status+" TEXT: "+xmlHttp.statusText);
                if (xmlHttp.readyState==4) {
                    if (xmlHttp.status==200) {
                        func();
                        return;
                    }
                }
            };
        xmlHttp.open("GET",url,true);
        xmlHttp.send(null);
    }


    BuzzQUI.prototype.setSearchString = function(event) {
        var id = getAttrFromEvent(event,"id");
        this.searchString = $("#"+id).val();
        this.hasDisplayedSources = {'twitter': false,
            'twitpic': false,
            'flickr':  false,
            'instagram': false};
    };

    BuzzQUI.prototype.gotoURL = function(event) {
        /* http://localhost:8125/rss?q=vic20 */

        alert("HREF to:"+this.api.url+this.api.rssEndPoint+".rss?q="+this.searchString);
        window.open(this.api.url+this.api.rssEndPoint+".rss?q="+this.searchString);


        /*
        alert('HREF to:'+this.api.url+this.api.rssEndPoint+'/'+this.searchString+'/feed.xml');
        window.open(this.api.url+this.api.rssEndPoint+'/'+this.searchString+'/feed.xml');
        */

    };

    BuzzQUI.prototype.displayGallery = function() {
        //debug.println("DISPLAY GALLERY:"+JSON.stringify(this.hasDisplayedSources)+ " SEL.TAB:"+this.selectedDisplayTab);
        if (!this.galleriaLoaded &&
            ((this.selectedDisplayTab === 'flickr') ||
             (this.selectedDisplayTab === 'twitpic')||
             (this.selectedDisplayTab === 'instagram')  )) {
            this.galleriaLoaded = true;
            Galleria.loadTheme('galleria/themes/classic/galleria.classic.min.js');
        }

        if (this.selectedDisplayTab === 'flickr' && !this.hasDisplayedSources['flickr']) {
            //debug.println("OPEN FLICKR GALLERY.");
            this.hasDisplayedSources['flickr']=true;
            $('#flickr-gallery').galleria({
                width: 700,
                height: 500
            });
        }

        if (this.selectedDisplayTab === 'twitpic' && !this.hasDisplayedSources['twitpic']) {
            //debug.println("OPEN TWITPIC GALLERY.");
            this.hasDisplayedSources['twitpic']=true;
            $('#twitpic-gallery').galleria({
                width: 700,
                height: 500
            });
        }

         if (this.selectedDisplayTab === 'instagram' && !this.hasDisplayedSources['instagram']) {
            //debug.println("OPEN INSTAGRAM GALLERY.");
            this.hasDisplayedSources['instagram']=true;
            $('#instagram-gallery').galleria({
                width: 700,
                height: 500
            });
        }
    };

    BuzzQUI.prototype.goFind = function(event) {
        var callbackFunction,
            xmlHttp = getXmlHttpObject(),
            ui = this;

        if (xmlHttp==null) {
            alert ("Your browser does not support AJAX.");
            return;
        }
        callbackFunction =
            function () {
                var resultObjects = eval('('+xmlHttp.responseText+')');
                var twitterResults = '<div id=\"twittercontent\">';
                var twitpicResults ='';
                var flickrResults = '';
                var instagramResults = '';
                debug.clear();
                for (var i = 0;i<resultObjects.length;i++) {
                    switch (resultObjects[i].source) {
                        case "twitter":
                            //var linkPattern = new RegExp('((http)|(https))://([.]|[^ ])+','g');
                            var linkPattern = new RegExp('((http)|(https))://([A-Za-z0-9\.\/])+','g');

                            var links = resultObjects[i].text.match(linkPattern);
                            var newText = resultObjects[i].text;
                            //debug.println("Processing tweet info:"+newText);
                            twitterResults += '<p>';
                            twitterResults += ('<img src=\"'+ resultObjects[i].imageUrl+'\" alt=\"'+resultObjects[i].user+'\" />');
                            // https://twitter.com/#!/timoreilly
                            twitterResults += ('<a href=\"https://twitter.com/#!/'+resultObjects[i].user+'\" target=\"_blank\"/>');
                            twitterResults += (' @'+resultObjects[i].user+'</a> <br>');

                            if (links) {
                                //<a href="http://URL" target="_blank">TEXT</a>
                                for (var j = 0; j<links.length; j++) {
                                    var htmlLink = '<a href=\"'+links[j] + '\" target=\"_blank\"/>' + links[j] +'</a>';
                                    newText = newText.replace(links[j],htmlLink);
                                }
                                twitterResults += newText;
                                twitterResults += '<br>';
                            } else {
                                twitterResults += (newText+'<br>');
                            }
                            twitterResults += (resultObjects[i].timestamp+'</p>');
                            break;
                        case "twitpic":
                            twitpicResults ='<img src=\"'+resultObjects[i].imageUrl+'\" ';
                            twitpicResults += 'title = \"'+ resultObjects[i].text + '\" alt=\"'+ resultObjects[i].timestamp + ' ';
                            twitpicResults += resultObjects[i].user + '\" class=\"image'+i+'\">';
                            $('#twitpic-gallery').append(twitpicResults);
                            break;
                        case "flickr":
                            flickrResults ='<img src=\"'+resultObjects[i].imageUrl+'\" ';
                            flickrResults += 'title = \"'+ resultObjects[i].text + '\" alt=\"'+ resultObjects[i].text + ' ';
                            flickrResults += resultObjects[i].user + '\" class=\"image'+i+'\">';
                            $('#flickr-gallery').append(flickrResults);
                            break;
                        case "instagram":
                            instagramResults ='<img src=\"'+resultObjects[i].imageUrl+'\" ';
                            instagramResults += 'title = \"'+ resultObjects[i].text + '\" alt=\"'+ resultObjects[i].timestamp + ' ';
                            instagramResults += resultObjects[i].user + '\" class=\"image'+i+'\">';
                            $('#instagram-gallery').append(instagramResults);
                            break;
                        default:

                    }
                }

                ui.loadingDialog.dialog('close');
                //$('#twitter-tab').append(twitterResults); // HUH? Jquery version does not work properly. But getElementById does.
                document.getElementById('twitter-tab').innerHTML = twitterResults+'</div> <div id=\"pagingControls\"></div>';

                pager.paragraphsPerPage = 4; // set amount elements per page
                pager.pagingContainer = $('#twittercontent'); // set of main container
                pager.paragraphs = $('p', pager.pagingContainer); // set of required containers
                pager.showPage(1);
                ui.displayGallery();

                return;
            };

        url=this.api.url+this.api.queryEndPoint+"?q="+this.searchString;

        if (!(this.searchString == "")) {
            $('#twitter-tab').html('');
            $('#twitpic-tab').html('<div id="twitpic-gallery"></div>');
            $('#flickr-tab').html('<div id="flickr-gallery"></div>');
            $('#instagram-tab').html('<div id="instagram-gallery"></div>');

            this.loadingDialog.dialog('open');
            invokeAJAXCall(xmlHttp,url,callbackFunction);

        }
    };

}) ();