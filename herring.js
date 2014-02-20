//DEBUG boolean, should debug console prints be shown
var DEBUG = true;

//boolean values as objects so that they are mutable form inside the button listener
var showingPrimarySchools = {value: false};
var showingSecondarySchools = {value: true};

function redraw() {
  clean(); //remove everything
  
  if(DEBUG) {
	console.log("Showing Primary Schools: " + showingPrimarySchools.value);
	console.log("Showing Secondary Schools: " + showingSecondarySchools.value);
  }

  if(showingPrimarySchools.value) { //if supposed to be drawing; draw.
    draw("primary");
  }
  
  if(showingSecondarySchools.value) {
    draw("secondary");
  }
}

//draw all schools of the given type
//types "secondary", "primary"
function draw(type) {
  for(var key in schools){
    if(schools[key].type == type){
      schools[key].show();
      for(var i = 0; i < schools[key].conns.length; i++)
        schools[key].conns[i].show();
    }
  }
}

// hide everything
function clean() {
  for(var key in schools){
    schools[key].hide();
    for(var i =0; i < schools[key].conns.length; i++){
      schools[key].conns[i].hide();
    }
  }
}

var zones = []

function testZones() {
	zones.push({
		"ui" : null,
		"latLong" : new google.maps.LatLng(56.632064, -3.729858),
		"rank" : {
			"income" : 100,
			"crime" : 6505,
			"education" : 1,
			"employment" : 1000,
			"health" : 2000,
			"overall" : 3000,
			"housing" : 4000
		}
	});
	drawZones("Education");
}

//Accepts the arguments Overall, Crime, Education, Income, Employment, Health and Housing
function drawZones(type) {
	for (var key in dataZones) {
		numZones++ ;
	}
	for (var key in dataZones) {
		switch (type) {
		case "Crime" : drawZone(dataZones[key], dataZones[key].educationRank);
			break;
		case "Education" : drawZone(dataZones[key], dataZones[key].educationRank);
		    break;
		case "Income" : drawZone(dataZones[key], dataZones[key].educationRank);
			break;
		case "Employment" : drawZone(dataZones[key], dataZones[key].educationRank);
		    break;
		case "Overall" : drawZone(dataZones[key], dataZones[key].educationRank);
			break;
		case "Health" : drawZone(dataZones[key], dataZones[key].educationRank);
			break;
		case "Housing" : drawZone(dataZones[key], dataZones[key].educationRank);
			break;
		default : drawZone(dataZones[key], dataZones[key].educationRank);
			break;
		}
	}
}

var map; //holds the map

var mapStyles = [ { "featureType": "poi", "stylers": [ { "weight": 1.9 }, { "visibility": "off" } ] },{ "featureType": "poi.school", "stylers": [ { "visibility": "on" } ] },{ "featureType": "landscape.man_made", "stylers": [ { "visibility": "on" } ] },{ "featureType": "landscape.natural", "stylers": [ { "visibility": "off" } ] } ] ;

//called on load
function initialize() {
  var centerLatlng = new google.maps.LatLng(56.632064, -3.729858); //The centre of Scotland
  var mapOptions = {
    zoom: 7,
	disableDefaultUI: true,
    center: centerLatlng ,
    mapTypeControlOptions: {
        mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
      }
  }
  
  var mapDiv = document.getElementById('map-canvas');
  map = new google.maps.Map(mapDiv, mapOptions); //create the map

  map.setOptions({styles : mapStyles});
  
  var defStyle = [{}];
 
  var styledMap = new google.maps.StyledMapType(defStyle, {name: "Default"});
  map.mapTypes.set('map_style', styledMap);
  map.setMapTypeId('map_style');

  button(" Primary ", showingPrimarySchools);
  button(" Secondary ", showingSecondarySchools);

  for(var key in schools){
    schools[key].draw();
    for(var i = 0; i < schools[key].conns.length; i++){
      schools[key].conns[i].draw();
    }
  }
  
  
  redraw(); //draw all schools
  drawZones("Education");
}

function button(type, bool) {
  var homeControlDiv = document.createElement('div');
  var bc = new buttonControl(homeControlDiv, type, bool);
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(homeControlDiv);  
}

function buttonControl(controlDiv, type, bool) {
  //button names and colours
  var startDrawing = "Show" + type + "Schools";
  var stopDrawing = "Hide" + type + "Schools";
  var info = "Toggle" + type + "Schools";
  var showColor = "green";
  var hideColor = "red";
  
  //setting the visual variables -->
  controlDiv.style.padding = '5px';

  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = bool.value ? hideColor : showColor;
  controlUI.style.width = '160px';
  controlUI.style.borderStyle = 'solid';
  controlUI.style.borderWidth = '2px';
  controlUI.style.cursor = 'pointer';
  controlUI.style.textAlign = 'center';
  controlUI.title = info;
  controlDiv.appendChild(controlUI);

  var controlText = document.createElement('div');
  controlText.style.fontFamily = 'Arial,sans-serif';
  controlText.style.fontSize = '12px';
  controlText.style.paddingLeft = '4px';
  controlText.style.paddingRight = '4px';
  controlText.innerHTML = bool.value ? stopDrawing : startDrawing;
  controlUI.appendChild(controlText);
  // <--
  
  google.maps.event.addDomListener(controlUI, 'click', function() {
	bool.value = !bool.value; //toggle the drawing state
	
    if(bool.value) { //if drawing
	  controlText.innerHTML = stopDrawing; //set button text to "stop drawing"
      controlUI.style.backgroundColor = hideColor;
	} else {
	  controlText.innerHTML = startDrawing; // set button text to "draw"
	  controlUI.style.backgroundColor = showColor;
	}
	redraw(); //redraw all the schools
  });
}

var numZones = 0  
	
//Draws a zone with a colour that scales from Green to Red depending on the rank supplied
function drawZone(zone, rank) {
	  var options = {
	    strokeColor: 'rgb(' + Math.round(255*(rank/numZones)) + ',' + Math.round(255 - 255*(rank/numZones)) + ',' + 0 + ')',
	    strokeOpacity: 0.8,
	    strokeWeight: 2,
	    fillColor: 'rgb(' + Math.round(255*(rank/numZones)) + ',' + Math.round(255 - 255*(rank/numZones)) + ',' + 0 + ')',
	    fillOpacity: 0.8,
	    map: map,
	    center: zone.latLong,
	    radius: 100
	  };
	  var circ = new google.maps.Circle(options);
	  zone.ui = {
			  'circle' : circ
	  };
}
var openInfoWindow = null;
