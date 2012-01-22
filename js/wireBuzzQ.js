

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
        /*
    debug.println('FOO: Tab show - ui.tab:' +ui.tab);     // anchor element of the selected (clicked) tab
   debug.println('Tab show - ui.panel:'+ ui.panel);   // element, that contains the selected/clicked tab contents
   debug.println('Tab show - ui.index:'+ ui.index);   // zero-based index of the selected (clicked) tab
    debug.println('THIS type:'+this.constructor.name);
    */
        debug.println('FOO: Tab show - ui.tab:' +ui.tab );
        UI.selectedDisplayTab = UI.querySources[ui.index];
        UI.displayGallery();
});

/*
    $('#tabs').bind('tabsselect', function(event, ui) {

        // Objects available in the function context:
       debug.println('Tab select - ui.tab:' +ui.tab);     // anchor element of the selected (clicked) tab
      // debug.println('Tab select - ui.panel:'+ ui.panel);   // element, that contains the selected/clicked tab contents
       //debug.println('Tab select - ui.index:'+ ui.index);   // zero-based index of the selected (clicked) tab

          if (ui.index ==1) { // Tab index 1: Twitpic
            Galleria.loadTheme('galleria/themes/classic/galleria.classic.min.js');
                $('#twitpic-gallery').galleria({
                width: 500,
                height: 500
            });
          }

    	  if (ui.index ==2) { // Tab index 2: Flickr
              Galleria.loadTheme('galleria/themes/classic/galleria.classic.min.js');
                $('#flickr-gallery').galleria({
                width: 500,
                height: 500
            });
          }


    });
    */


};
  

})();