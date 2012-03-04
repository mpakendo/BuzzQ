

function WireBuzzQ() {
}

(function () {

    WireBuzzQ.prototype.connectHTML =  function (UI) {

        var fireQuery = function (event) {
            if (UI.searchString != ""  ) {
                UI.goFind(event);
            }
        };


        $("#BuzzQ-html-searchAction").click(function(event) {fireQuery(event);});
        $("#BuzzQ-html-searchString").blur(function(event) {UI.setSearchString(event);});
        $("#BuzzQ-html-searchString").keydown(function (event) {
            if (event.which == 13) { //Mozilla event.which, ASC(13) = return
                UI.setSearchString(event);
                fireQuery(event);
            }
        });

        $('#tabs').bind('tabsshow', function(event, ui) {

            UI.selectedDisplayTab = UI.querySources[ui.index];
            UI.displayGallery();
        });


        $.getJSON(UI.api.url+UI.api.configEndPoint, function(configData) { 
            if ('true'==configData.debug.debugOn) {
                $("#BuzzQ-html-debugZone").html("<table><tr>" +
                    "<td><a href='#' onclick='{return debug.displayDebugInfo();}'>Debug Information</a></td>" +
                    "<td><a href='#' onclick='{return debug.clearDebugInfo();}'>Clear Debug Information</a></td>" +
                    "</tr></table><div style='background:green' id='BuzzQ-html-displayDebugInfo'></div>"
                );
            }
        });

    };


})();