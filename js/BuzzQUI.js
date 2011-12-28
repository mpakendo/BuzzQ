

function BuzzQUI() {
	this.searchString ="";	
}

// Now we define the object BuzzQUI
(function() {


function buzzQServiceAPI() {
	
	this.url = "http://127.0.0.1:8125/"; //need exact same url domain incl. port to avoid cross site scripting issues
	this.endPoint = "query";
	
}

function getAttrFromEvent (event, attr) { 
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
	    }
	  }
	  return xmlHttp;
}

function invokeAJAXCall(xmlHttp,url, func) {
	xmlHttp.onreadystatechange= 
		function() {
		  //debug.printf("READYSTATECHANGE:"+xmlHttp.readyState+" STATUS:"+xmlHttp.status+" TEXT: "+xmlHttp.statusText);
			if (xmlHttp.readyState==4) {
				if (xmlHttp.status==200) {
					func();
					return;
				}
			}
	    };
	 xmlHttp.open("GET",url,true);
	 xmlHttp.send(null);
}


BuzzQUI.prototype.setSearchString = function(event) {
	var id = getAttrFromEvent(event,"id");
	this.searchString = $("#"+id).val();
};

BuzzQUI.prototype.goFind = function(event) {
	var 
	   id = getAttrFromEvent(event,"id"),
	   api = new buzzQServiceAPI(),
	   url,
	   callbackFunction,
	   xmlHttp = getXmlHttpObject();
	
	if (xmlHttp==null) {
	       alert ("Your browser does not support AJAX.");
	       return;
	}
	callbackFunction = 
		function () {
	      var resultObjects = eval('('+xmlHttp.responseText+')'); 
	      
	      var twitterResults = '';
	      var twitpicResults ='';
          var flickrResults = '';
          var flickrTab = '<div id="flickr-gallery"></div>';
          var twitpicTab = '<div id="twitpic-gallery"></div>';
	      $('#twitter-tab').html('');
	      $('#twitpic-tab').html(twitpicTab);
          $('#flickr-tab').html(flickrTab);

	      for (var i = 0;i<resultObjects.length;i++) {

    		  if (resultObjects[i].source == "twitter") {
    			var linkPattern = new RegExp("http://([.]|[^ ])*","g");
                var links = resultObjects[i].text.match(linkPattern);
                var newText = resultObjects[i].text;
    			twitterResults += '<p>';
    	   		twitterResults += ('<img src=\"'+ resultObjects[i].imageUrl+'\" alt=\"'+resultObjects[i].user+'\" /> <br>');

    	   		if (links) {
    	          //<a href="http://URL" target="_blank">TEXT</a>
                       for (var j = 0; j<links.length; j++) {
                           var htmlLink = '<a href=\"'+links[j] + '\" target=\"_blank\"/>' + links[j] +'</a>';
                           newText = newText.replace(links[j],htmlLink);
                       }
                     twitterResults += newText;
                     twitterResults += '<br>';

                } else {
                     twitterResults += (newText+'<br>');
                }


    			twitterResults += (resultObjects[i].timestamp+'<br>');
    			twitterResults += (resultObjects[i].user+'</p>');
    			// <img src="angry.gif" alt="Angry face" title="Angry face" />
    		  }
    		  else if (resultObjects[i].source == "twitpic") {
                  twitpicResults ='<img src=\"'+resultObjects[i].imageUrl+'\" ';
    			  twitpicResults += 'title = \"'+ resultObjects[i].text + '\" alt=\"'+ resultObjects[i].timestamp + ' ';
    			  twitpicResults += resultObjects[i].user + '\" class=\"image'+i+'\">';
                   $('#twitpic-gallery').append(twitpicResults);

    		  }
              else if (resultObjects[i].source == "flickr") {
   
                  flickrResults ='<img src=\"'+resultObjects[i].imageUrl+'\" ';
    			  flickrResults += 'title = \"'+ resultObjects[i].text + '\" alt=\"'+ resultObjects[i].text + ' ';
    			  flickrResults += resultObjects[i].user + '\" class=\"image'+i+'\">';
                   $('#flickr-gallery').append(flickrResults);

              }
    	  }

          //$('#twitter-tab').append(twitterResults); // HUH? Jquery version does not work properly. But getElementById does.
          document.getElementById('twitter-tab').innerHTML = twitterResults+'<br>';

          if (flickrResults != '') {
              Galleria.loadTheme('galleria/themes/classic/galleria.classic.min.js');
                $('#flickr-gallery').galleria({
                width: 500,
                height: 500
            });
          }

    	  if (twitpicResults != '') {
              Galleria.loadTheme('galleria/themes/classic/galleria.classic.min.js');
                $('#twitpic-gallery').galleria({
                width: 500,
                height: 500
            });
   
    	  }

	      return;
	};
	
    url=api.url;
    url=url+api.endPoint+"?q="+this.searchString;
    
    if (!(this.searchString == "")) {  
        invokeAJAXCall(xmlHttp,url,callbackFunction);
    }
		
};


}) ();