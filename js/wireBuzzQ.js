

function WireBuzzQ() {
}

(function () {
    WireBuzzQ.prototype.connectHTML =  function (UI) {

        function fireQuery (event) {
            if (UI.searchString != ""  ) {
               UI.goFind(event);
            }
        }

        $("#BuzzQ-html-Brand").attr("href", document.documentURI);

        $("#BuzzQ-html-searchAction").click(function(event) {
            fireQuery(event);
        });

       $("#BuzzQ-html-searchString").blur(function(event) {
            UI.setSearchString(event);
        });

        /* TODO: Get root cause why keydown causes window.load
        $("#BuzzQ-html-searchString").keydown(function (event) {
            if (event.which == 13) { //Mozilla event.which, ASC(13) = return
                UI.setSearchString(event);
                fireQuery(event);
            }
        }); */

        $("#BuzzQ-html-rssAction").click(function(event) {
            UI.gotoURL(event);
        });


        //debug.println('CALLING AJAX URL:'+UI.api.url+UI.api.configEndPoint);

        $.getJSON(UI.api.url+UI.api.configEndPoint, function(configData) {
            if ('true'==configData.debug.debugOn || configData.debug.debugOn) {
                $("#BuzzQ-html-debugZone").html("<table><tr>" +
                    "<td><a href='#' onclick='{return debug.displayDebugInfo();}'>Debug Information</a></td>" +
                    "<td><a href='#' onclick='{return debug.clearDebugInfo();}'>Clear Debug Information</a></td>" +
                    "</tr></table><div style='background:black' id='BuzzQ-html-displayDebugInfo'></div>"
                );
            }
        });



    }; //WireBuzzQ.prototype.connectHTML

})();