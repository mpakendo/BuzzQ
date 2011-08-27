

function WireBuzzQ() {
};

(function () {

WireBuzzQ.prototype.connectHTML =  function (UI) {
	debug.println("WIRING UI");
	var returnKeyHandler = function (event) {
		if (event.which == 13) { //Mozilla event.which, ASC(13) = return
			UI.goFind(event);
		};
	};
    $("#BuzzQ-html-searchAction").click(function(event) {UI.goFind(event);});
    $("#BuzzQ-html-searchString").blur(function(event) {UI.setSearchString(event);});
    $("#BuzzQ-html-searchString").keydown(function (event) {
    	if (event.which == 13) { //Mozilla event.which, ASC(13) = return
    		UI.setSearchString(event);
    		UI.goFind(event);
    	};
    });
    	//$(window).keydown(returnKeyHandler);

};
  

})();