

function BuzzQUI() {
	this.searchString ="";	
};

// Now we define the object BuzzQUI
(function() {


function buzzQServiceAPI() {
	
	this.url = "http://127.0.0.1:8125/"; //need exact same url domain incl. port to avoid cross site scripting issues
	this.endPoint = "query";
	
};

function getAttrFromEvent (event, attr) { 
	var id;
	if (!event) event = window.event;
	if (!event.target) { //IE
	 id = window.event.srcElement.getAttribute(attr);
	}
	else { // Mozilla
	 id = event.target.getAttribute(attr);
	};
	return id;
};

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
	   catch (e) {
	      xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");
	    };
	  };
	  return xmlHttp;
};

function invokeAJAXCall(xmlHttp,url, func) {
	xmlHttp.onreadystatechange= 
		function() {
		  //debug.printf("READYSTATECHANGE:"+xmlHttp.readyState+" STATUS:"+xmlHttp.status+" TEXT: "+xmlHttp.statusText);
			if (xmlHttp.readyState==4) {
				if (xmlHttp.status==200) {
					func();
					return;
				};
			};
	    };  
	 xmlHttp.open("GET",url,true);
	 xmlHttp.send(null);
};


BuzzQUI.prototype.setSearchString = function(event) {
	var id = getAttrFromEvent(event,"id");
	this.searchString = $("#"+id).val();
	//debug.println("EVENT HANDLER: set search string on DOM Element "+id+" for VAL: "+this.searchString);
};

BuzzQUI.prototype.goFind = function(event) {
	var 
	   id = getAttrFromEvent(event,"id"),
	   api = new buzzQServiceAPI(),
	   url,
	   callbackFunction,
	   xmlHttp = getXmlHttpObject();
	
	if (xmlHttp==null) {
	       alert ("Your browser does not support AJAX!");
	       return;
	};
	callbackFunction = 
		function () {
	      var resultObjects = eval('('+xmlHttp.responseText+')'); 
	      
	      var twitterResults = '';
	      var twitpicResults ='';
	      var twitpicTab = '<div id="gallery" class="ad-gallery"><div class="ad-image-wrapper"></div><div class="ad-controls"></div><div class="ad-nav"><div class="ad-thumbs"><ul id="twitpic-gallery-thumbs" class="ad-thumb-list"></ul></div></div></div>';	
	      
	      $('#twitter-tab').html(twitterResults);
	      $('#twitpic-tab').html(twitpicTab);
	    //  $('#twitpic-gallery-thumbs').empty();

	      //debug.println('RESULTS:');
	      for (var i = 0;i<resultObjects.length;i++) {
    		  /*debug.println('text: '+resultObjects[i].text);
    		  debug.println('date: '+ resultObjects[i].timestamp);
    		  debug.println('user: '+ resultObjects[i].user);
    		  debug.println('imageUrl: '+ resultObjects[i].imageUrl);
    		  debug.println('source: '+ resultObjects[i].source);
    		  debug.println('----');*/
    		  if (resultObjects[i].source == "twitter") {
    			var linkPattern = new RegExp("http://([.]|[^ ])*","g");
                var links = resultObjects[i].text.match(linkPattern);
                var newText = resultObjects[i].text;
    			twitterResults += '<p>';
    	   		twitterResults += ('<img src=\"'+ resultObjects[i].imageUrl+'\" alt=\"'+resultObjects[i].user+'\" /> <br>');

    	   		if (links) {
    	          //<a href="http://URL" target="_blank">TEXT</a>
                       debug.println("LINKS FOUND:"+links.length);
                       for (var j = 0; j<links.length; j++) {
                       debug.println("LINK "+links[j]);
                           var htmlLink = '<a href=\"'+links[j] + '\" target=\"_blank\"/>' + links[j] +'</a>';
                           newText = newText.replace(links[j],htmlLink);
                           debug.println("REPL TEXT:"+newText);
                       }
                     twitterResults += newText;
                     twitterResults += '<br>';

                } else {
                     twitterResults += (newText+'<br>');
                }



                //twitterResults += (newText+'<br>');
    			twitterResults += (resultObjects[i].timestamp+'<br>');
    			twitterResults += (resultObjects[i].user+'</p>');
    			// <img src="angry.gif" alt="Angry face" title="Angry face" />
    		  }
    		  else if (resultObjects[i].source == "twitpic") {
    			  
    			  twitpicResults = '<li><a href=\"'+resultObjects[i].imageUrl+'\"><img src=\"'+resultObjects[i].imageUrl+'\" ';
    			  twitpicResults += 'title = \"'+ resultObjects[i].text + '\" alt=\"'+ resultObjects[i].timestamp + ' ';
    			  twitpicResults += resultObjects[i].user + '\" class=\"image'+i+'\"></a></li>';
    			  $('#twitpic-gallery-thumbs').append(twitpicResults);
    		  };
    	  };
    	
    	  //twitterResults += '</p>';
    	  //$('#twitter-tab').html(twitterResults);
            //console.log("TWITTER RESULTS: "+twitterResults);
          //$('#twitter-tab').append(twitterResults);
            document.getElementById('twitter-tab').innerHTML = twitterResults+'<br>';

    	  if (twitpicResults != '') {
    	  //var galleries = $('.ad-gallery').adGallery();
    		  
		     
	    	  var galleries = $('.ad-gallery').adGallery({
	    		  loader_image: 'loader.gif',
	    		  width: 650, // Width of the image, set to false and it will read the CSS width
	    		  height: 175, // Height of the image, set to false and it will read the CSS height
	    		  thumb_opacity: 0.7, // Opacity that the thumbs fades to/from, (1 removes fade effect)
	    		                      // Note that this effect combined with other effects might be resource intensive
	    		                      // and make animations lag
	    		  start_at_index: 0, // Which image should be displayed at first? 0 is the first image
	    		  description_wrapper: $('#descriptions'), // Either false or a jQuery object, if you want the image descriptions
	    		                                           // to be placed somewhere else than on top of the image
	    		  animate_first_image: false, // Should first image just be displayed, or animated in?
	    		  animation_speed: 400, // Which ever effect is used to switch images, how long should it take?
	    		  display_next_and_prev: true, // Can you navigate by clicking on the left/right on the image?
	    		  display_back_and_forward: true, // Are you allowed to scroll the thumb list?
	    		  scroll_jump: 0, // If 0, it jumps the width of the container
	    		  slideshow: {
	    		    enable: true,
	    		    //autostart: true,
	    		    speed: 5000,
	    		    start_label: 'Start',
	    		    stop_label: 'Stop',
	    		    stop_on_scroll: true, // Should the slideshow stop if the user scrolls the thumb list?
	    		    countdown_prefix: '(', // Wrap around the countdown
	    		    countdown_sufix: ')',
	    		    onStart: function() {
	    		      // Do something wild when the slideshow starts
	    		    },
	    		    onStop: function() {
	    		      // Do something wild when the slideshow stops
	    		    }
	    		  },
	    		  effect: 'slide-hori', // or 'slide-vert', 'resize', 'fade', 'none' or false
	    		  enable_keyboard_move: true, // Move to next/previous image with keyboard arrows?
	    		  cycle: true, // If set to false, you can't go from the last image to the first, and vice versa
	    		  // All callbacks has the AdGallery objects as 'this' reference
	    		  callbacks: {
	    		    // Executes right after the internal init, can be used to choose which images
	    		    // you want to preload
	    		    init: function() {
	    		      // preloadAll uses recursion to preload each image right after one another
	    		      this.preloadAll();
	    		     
	    		    },
	    		    // This gets fired right after the new_image is fully visible
	    		    afterImageVisible: function() {
	    		      // For example, preload the next image
	    		      var context = this;
	    		      this.loading(true);
	    		      this.preloadImage(this.current_index + 1,
	    		        function() {
	    		          // This function gets executed after the image has been loaded
	    		          context.loading(false);
	    		        }
	    		      );
	    		    },
	    		    // This gets fired right before old_image is about to go away, and new_image
	    		    // is about to come in
	    		    beforeImageVisible: function(new_image, old_image) {
	    		      // Do something wild!
	    		    }
	    		  }
	    		});
    	  };
	      return;
	};
	
	//debug.println("EVENT HANDLER: GOFIND on DOM Element"+id);
    url=api.url;
    url=url+api.endPoint+"?q="+this.searchString;
    
    if (!(this.searchString == "")) {  
    	//debug.println('AJAX call on:'+this.searchString + url);
    	// $('#twitter-tab').html('');
        invokeAJAXCall(xmlHttp,url,callbackFunction);
    };
		
};


}) ();