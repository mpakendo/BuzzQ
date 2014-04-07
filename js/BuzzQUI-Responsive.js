/**
 * Responsive Web Design UI based on Twitter Bootstrap
 *
 * http://twitter.github.com/bootstrap/index.html
 */
function BuzzQUI() {
    this.searchString ="";
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
        instagramView: "",
        layoutLargeEntrySmallList: "",
        renderTweet: "",
        renderTwitpic: "",
        layoutSmallListLargeEntry: ""
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
        /*
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
         this.templates.twitpicView = $.ajax({
         type:"GET",
         url:"./clientviews/twitpicresults.ejs",
         async:false
         }).responseText;
         */
        this.templates.renderTweet = $.ajax({
            type: "GET",
            url: "./clientviews/renderTweet.ejs",
            async: false
        }).responseText;
        this.templates.layoutLargeEntrySmallList = $.ajax({
            type: "GET",
            url: "./clientviews/layoutLargeEntrySmallList.ejs",
            async: false
        }).responseText;
        this.templates.renderTwitpic = $.ajax({
            type: "GET",
            url: "./clientviews/renderTwitpic.ejs",
            async: false
        }).responseText;
        this.templates.layoutSmallListLargeEntry = $.ajax({
            type: "GET",
            url: "./clientviews/layoutSmallListLargeEntry.ejs",
            async: false
        }).responseText;

    };

    BuzzQUI.prototype.setSearchString = function (event) {
        try {
            var id = getAttrFromEvent(event, "id");
            this.searchString = $("#" + id).val();
        }
        catch (e) {
            alert('Exception:' + e.toString())
        }
    };

    BuzzQUI.prototype.gotoURL = function(event) {
        window.open(this.api.url+this.api.rssEndPoint+".rss?q="+this.searchString);
    };

    BuzzQUI.prototype.goFind = function (event) {
        try {
            var ui = this; // bind 'this' for callback closure
            var url = this.api.url + this.api.queryEndPoint + "?q=" + this.searchString;


            function filter(results,tagStrings){
                var filteredList = [];

                results.forEach(function(res){
                    tagStrings.forEach(function(tag) {
                        if (res.source == tag) {
                            filteredList.push(res);
                        }
                    });
                });

                return filteredList;
            }


            function callbackFunction(data) {
                var html = "";
                var largeLayoutResults = filter(data, ['instagram', 'flickr']);
                var twitterResults = filter(data, ['twitter']);
                var twitpicResults = filter(data, ['twitpic']);
                var count = 0;

                largeLayoutResults.forEach(function (res) {
                    var model = {largeLayoutEntry: res, smallLayoutEntries: []};
                    var i = 0;
                    var a = {};
                    var renderConfig1 = {
                        outerTemplate: ui.templates.layoutLargeEntrySmallList,
                        innerTemplate: ui.templates.renderTweet,
                        limitSmallEntries: 4,
                        list: twitterResults
                    };
                    var renderConfig2 = {
                        outerTemplate: ui.templates.layoutSmallListLargeEntry,
                        innerTemplate: ui.templates.renderTwitpic,
                        limitSmallEntries: 3,
                        list: twitpicResults
                    };
                    var config = renderConfig1;
                    var altConfig = renderConfig2;

                    if ((count++ % 2) == 0) {
                        config = renderConfig2;
                        altConfig = renderConfig1;
                    }

                    if (config.list.length== 0) {
                        config.list = altConfig.list;
                        config.limitSmallEntries = altConfig.limitSmallEntries;
                        config.innerTemplate = altConfig.innerTemplate;
                    }

                    while (i < config.limitSmallEntries && ((a = config.list.shift()) != null)) {
                        model.smallLayoutEntries.push(ejs.render(config.innerTemplate, {model: a}));
                        i++;
                    }
                    html = ejs.render(config.outerTemplate, {model: model});
                    $('#BuzzQ-html-renderHere').replaceWith(html);
                });

/*
                    $('#BuzzQ-html-searchAction').popover('destroy');
                    html = ejs.render(ui.templates.twitterView, {results: data});
                    $('#BuzzQ-html-Twitter-pane').html(html);
                    html = ejs.render(ui.templates.instagramView, {results: data});
                    $('#BuzzQ-html-Instagram-pane').html(html);
                    html = ejs.render(ui.templates.flickrView, {results: data});
                    $('#BuzzQ-html-Flickr-pane').html(html);
                    html = ejs.render(ui.templates.twitpicView, {results: data});
                    $('#BuzzQ-html-Twitpic-pane').html(html);
*/
                }

            if (!(this.searchString == "")) {
                //$('#BuzzQ-html-searchAction').popover('show');
                $('#BuzzQ-html-results').html('<h3> </h3><div id=\"BuzzQ-html-renderHere\" > <br><br><h2>Loading..</h2></div>');
                $.getJSON(url, callbackFunction);
            }
        }
        catch (e) {
            alert('Exception:' + e.toString());
        }
    };


}) ();