

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
		  debug.printf("READYSTATECHANGE:"+xmlHttp.readyState+" STATUS:"+xmlHttp.status+" TEXT: "+xmlHttp.statusText);
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
	debug.println("EVENT HANDLER: set search string on DOM Element "+id+" for VAL: "+this.searchString);
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
	      
	      var twitterResults = '<p>';
	      var twitpicResults ='';

	      debug.println('RESULTS:');
	      for (var i = 0;i<resultObjects.length;i++) {
    		  debug.println('text: '+resultObjects[i].text);
    		  debug.println('date: '+ resultObjects[i].timestamp);
    		  debug.println('user: '+ resultObjects[i].user);
    		  debug.println('imageUrl: '+ resultObjects[i].imageUrl);
    		  debug.println('source: '+ resultObjects[i].source);
    		  debug.println('----');
    		  if (resultObjects[i].source == "twitter") {
    			twitterResults += (resultObjects[i].text+'<br>');
    			twitterResults += (resultObjects[i].timestamp+'<br>');
    			twitterResults += (resultObjects[i].user+'<br>');
    			// <img src="angry.gif" alt="Angry face" title="Angry face" />
    			twitterResults += ('<img src=\"'+ resultObjects[i].imageUrl+'\" alt=\"'+resultObjects[i].user+'\" /> <br>');
    		  }
    		  else if (resultObjects[i].source == "twitpic") {
    			  
    			  
    			  twitpicResults = '<li><a href=\"'+resultObjects[i].imageUrl+'\"><img src=\"'+resultObjects[i].imageUrl+'\" ';
    			  twitpicResults += 'title = \"'+ resultObjects[i].text + '\" alt=\"'+ resultObjects[i].timestamp + ' ';
    			  twitpicResults += resultObjects[i].user + '\" class=\"image'+i+'\"></a></li>';
    			  $('#twitpic-gallery-thumbs').append(twitpicResults);
    			     
    		  };
    	  };
    	
    	  twitterResults += '</p>';
    	  $('#twitter-tab').html(twitterResults);
    	 
    	  var galleries = $('.ad-gallery').adGallery();
	      return;
	};
	
	debug.println("EVENT HANDLER: GOFIND on DOM Element"+id);
    url=api.url;
    url=url+api.endPoint+"?q="+this.searchString;
    
    if (!(this.searchString == "")) {  
    	debug.println('AJAX call on:'+this.searchString + url);
        invokeAJAXCall(xmlHttp,url,callbackFunction);
    };
		
};


}) ();