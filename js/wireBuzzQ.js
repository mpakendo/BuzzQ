

function WireBuzzQ() {
}

(function () {
    WireBuzzQ.prototype.connectHTML =  function (UI) {
        debug.println('Wiring UI');

        var fireQuery = function (event) {
            if (UI.searchString != ""  ) {
                UI.goFind(event);
            }
        };

        $("#BuzzQ-html-searchAction").click(function(event) {
            debug.println('Click: BuzzQ-html-searchAction');
            fireQuery(event);
        });

       $("#BuzzQ-html-searchString").blur(function(event) {
            UI.setSearchString(event);
           debug.println('Blur: BuzzQ-html-searchString:'+UI.searchString);

        });

        /* TODO: Get root cause why keydown causes window.load
        $("#BuzzQ-html-searchString").keydown(function (event) {
            if (event.which == 13) { //Mozilla event.which, ASC(13) = return
                UI.setSearchString(event);
                fireQuery(event);
            }
        });*/

        $("#BuzzQ-html-rssAction").click(function(event) {
            UI.gotoURL(event);
        });
/*
        $('#tabs').bind('tabsshow', function(event, ui) {
            UI.selectedDisplayTab = UI.querySources[ui.index];
            UI.displayGallery();
        });
*/

        debug.println('CALLING AJAX URL:'+UI.api.url+UI.api.configEndPoint);
        $.getJSON(UI.api.url+UI.api.configEndPoint, function(configData) { 
            if ('true'==configData.debug.debugOn) {
                $("#BuzzQ-html-debugZone").html("<table><tr>" +
                    "<td><a href='#' onclick='{return debug.displayDebugInfo();}'>Debug Information</a></td>" +
                    "<td><a href='#' onclick='{return debug.clearDebugInfo();}'>Clear Debug Information</a></td>" +
                    "</tr></table><div style='background:white' id='BuzzQ-html-displayDebugInfo'></div>"
                );
            }
        });
    }; //WireBuzzQ.prototype.connectHTML

})();