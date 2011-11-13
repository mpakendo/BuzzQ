

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
    
    /*$('#tabs').bind('tabsshow', function(event, ui) {
    	debug.println('Showing Tab'+event.target.getAttribute('id'));
    	//$('#twitpic-gallery-thumbs').width(644);
    });*/
    
    $('#tabs').bind('tabsselect', function(event, ui) {

        // Objects available in the function context:
       debug.println('Tab select - ui.tab:' +ui.tab);     // anchor element of the selected (clicked) tab
       debug.println('Tab select - ui.panel:'+ ui.panel);   // element, that contains the selected/clicked tab contents
       debug.println('Tab select - ui.index:'+ ui.index);   // zero-based index of the selected (clicked) tab
       
       if (ui.index ==1) {
    	   //var galleries = $('.ad-gallery').adGallery();
    	 $('#twitpic-gallery-thumbs').width(9000);
       };

    });
    
    
    	//$(window).keydown(returnKeyHandler);

};
  

})();