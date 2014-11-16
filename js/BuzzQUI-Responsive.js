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
        layoutSmallListLargeEntry: ""
    };
    this.debug = false;

    this.loadingDialog = $('<div></div>')
            .html('<img src="./images/loader.gif"/>')
            .dialog ({
                autoOpen: false,
                width: 30,
                title: 'Loading Buzz'
        });


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
                var largeLayoutResults = filter(data, ['flickr', 'tumblr', 'instagram']);

                var twitterResults = filter(data, ['twitter']);
                var count = 0;

                largeLayoutResults.forEach(function (res) {
                    var model = {largeLayoutEntry: res, smallLayoutEntries: []};
                    var i = 0;
                    var a = {};
                    var renderConfig1 = {
                        outerTemplate: ui.templates.layoutLargeEntrySmallList,
                        innerTemplate: ui.templates.renderTweet,
                        limitSmallEntries: 5,
                        list: twitterResults
                    };
                    var renderConfig2 = {
                        outerTemplate: ui.templates.layoutSmallListLargeEntry,
                        innerTemplate: ui.templates.renderTweet,
                        limitSmallEntries: 5,
                        list: twitterResults
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
                    ui.loadingDialog.dialog('close');

                    $('#BuzzQ-html-renderHere').replaceWith(html);
                    $(function() {
                      $("img.scale").imageScale();
                    });
                });


                }

            if (!(this.searchString == "")) {
                $('#BuzzQ-html-results').html('<h3> </h3><div id=\"BuzzQ-html-renderHere\" ></div>');
                this.loadingDialog.dialog('open');
                $.getJSON(url, callbackFunction);
            }
        }
        catch (e) {
            alert('Exception:' + e.toString());
        }
    };


}) ();