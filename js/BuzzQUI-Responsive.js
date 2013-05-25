/**
 * Responsive Web Design UI based on Twitter Bootstrap
 *
 * http://twitter.github.com/bootstrap/index.html
 */
function BuzzQUI() {
    this.searchString ="";

    this.querySources = ["twitter","twitpic","flickr","instagram"]; // need this to remember the active tabs
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
    this.templates = {
        twitterView: "",
        flickrView: "",
        twitpicView: "",
        instagramView: ""
    };
    this.debug = false;

}

// Now we define the object BuzzQUI
(function() {


    //debug.println("document.location:"+document.location);
    function getAttrFromEvent(event, attr) {
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

    BuzzQUI.prototype.initUI = function () {
        // load client templates
        this.templates.twitterView = $.ajax({
            type:"GET",
            url:"./clientviews/twitterresults.ejs",
            async:false
        }).responseText;
        this.templates.instagramView = $.ajax({
            type:"GET",
            url:"./clientviews/instagramresults.ejs",
            async:false
        }).responseText;
        this.templates.flickrView = $.ajax({
             type:"GET",
             url:"./clientviews/flickrresults.ejs",
             async:false
         }).responseText;
    };

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
            var ui = this; // bind 'this' for callback closure
            var url = this.api.url + this.api.queryEndPoint + "?q=" + this.searchString;
            var callbackFunction =
                function (data) {
                    var html = ejs.render(ui.templates.twitterView, {results: data});
                     //console.log(html);
                     $('#BuzzQ-html-Twitter-pane').html(html);
                    html = ejs.render(ui.templates.instagramView, {results: data});
                    //console.log(html);
                    $('#BuzzQ-html-Instagram-pane').html(html);
                    html = ejs.render(ui.templates.flickrView, {results: data});
                    console.log(html);
                    $('#BuzzQ-html-Flickr-pane').html(html);
                };

            if (!(this.searchString == "")) {
                $.getJSON(url, callbackFunction);
            }
        }
        catch (e) {
            alert('Exception:' + e.toString());
        }
    };


}) ();