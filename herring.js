var connsSparql = ([
"SELECT ?email ?school_lat ?school_long ?data_lat ?data_long ?strength",
"WHERE{",
"  ?school <http://data.ordnancesurvey.co.uk/ontology/postcode/postcode> ?pc.",
"  ?school <http://www.w3.org/2006/vcard/ns#hasEmail> ?email.",
"  ?pc <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?school_lat.",
"  ?pc <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?school_long.",
"  ?zone <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?data_lat.",
"  ?zone <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?data_long.",
"  ?nop <http://data.opendatascotland.org/def/education/numberOfPupils> ?strength.",
"  ?nop <http://data.opendatascotland.org/def/statistical-dimensions/education/school> ?school.",
"  ?nop <http://data.opendatascotland.org/def/statistical-dimensions/refArea> ?zone.",
"  ?school <http://data.opendatascotland.org/def/education/department> ?dep.",
"  ?dep <http://data.opendatascotland.org/def/education/stageOfEducation> <http://data.opendatascotland.org/def/concept/education/stages-of-education/%{stage}>.",
"}",
"ORDER BY ?email"]).join("\n");

var connsUrl = "http://data.opendatascotland.org/sparql.csv?query=" + encodeURIComponent(connsSparql);

var schoolsSparql = ([
"SELECT ?email ?lat ?long (SUM (?nop) as ?size) ?name",
"WHERE{",
"  ?school <http://data.ordnancesurvey.co.uk/ontology/postcode/postcode> ?pc.",
"  ?school <http://www.w3.org/2006/vcard/ns#hasEmail> ?email.",
"  ?pc <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?lat.",
"  ?pc <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?long.",
"  OPTIONAL{",
"    ?school <http://www.w3.org/2000/01/rdf-schema#label> ?name",
"  }",
"  GRAPH <http://data.opendatascotland.org/graph/education/pupils-by-school-and-datazone>{",
"    ?x <http://data.opendatascotland.org/def/statistical-dimensions/education/school> ?school.",
"    ?x <http://data.opendatascotland.org/def/education/numberOfPupils> ?nop.",
"  }",
"  ?school <http://data.opendatascotland.org/def/education/department> ?dep.",
"  ?dep <http://data.opendatascotland.org/def/education/stageOfEducation> <http://data.opendatascotland.org/def/concept/education/stages-of-education/%{stage}>.",
"}",
"GROUP BY ?email ?lat ?long ?size ?name",
"ORDER BY ?email"]).join("\n");

var DEBUG = true;

var schoolsUrl = "http://data.opendatascotland.org/sparql.csv?query=" + encodeURIComponent(schoolsSparql);

var schools = [];


// schoolType one of "secondary", "primary", "pre-school"
//do not call directly, called from "redraw()"
function requestData(schoolType){
  var connsUrl = "http://data.opendatascotland.org/sparql.csv?query=" +
    encodeURIComponent(connsSparql) + "&stage=" +
    encodeURIComponent(schoolType);
  var schoolsUrl = "http://data.opendatascotland.org/sparql.csv?query=" +
    encodeURIComponent(schoolsSparql) + "&stage=" +
    encodeURIComponent(schoolType);
  $.ajax({
    dataType: 'text',
    url: schoolsUrl,
    success: function(data){
      data = data.split("\n");
      for(var i = 1; i < data.length - 1; i++){
        var row = data[i].split(',');
        schools.push({
          'email': row[0],
          'name': row[4],
          'latLong': new google.maps.LatLng(parseFloat(row[1]),
              parseFloat(row[2])),
          'size': parseInt(row[3]),
          'conns': []
        });
      }
      $.ajax({
        dataType: 'text',
        url: connsUrl,
        success: function(data){
          data = data.split("\n");
          var j = 0;
          for(var i = 1; i < data.length - 1; i++){
            var row = data[i].split(',');
            while(schools[j].email != row[0])
              j++;
            schools[j].conns.push({
              'latLong': new google.maps.LatLng(parseFloat(row[3]),
                  parseFloat(row[4])),
              'strength': parseInt(row[5])
            });
          }
          drawConns();
          drawSchools();
        }
      });
    }
  });
}

//boolean values as objects so that they are mutable form inside the button listener
var showingPreSchools = {value: false};
var showingPrimarySchools = {value: false};
var showingSecondarySchools = {value: true};

//TODO make redraw hide and show objects rather than re-calling the database.
function redraw() {
  clean(); //remove everything
  
  if(DEBUG) {
	console.log("Showing Pre-Schools: " + showingPreSchools.value);
	console.log("Showing Primary Schools: " + showingPrimarySchools.value);
	console.log("Showing Secondary Schools: " + showingSecondarySchools.value);
  }
  
  if(showingPreSchools.value) { //if supposed to be drawing; draw.
    requestData("pre-school");
  }
  
  if(showingPrimarySchools.value) {
    requestData("primary");
  }
  
  if(showingSecondarySchools.value) {
    requestData("secondary");
  }
}

redraw();

//removed all currently drawing map objects.
function clean() {
  for(var i = 0; i < schools.length; i++){ 
    schools[i].ui.circle.setMap(null);
    schools[i].ui.infowindow.close();
    for(var j = 0; j < schools[i].conns.length; j++){
      var conn = schools[i].conns[j];
      if(conn.ui)
        schools[i].conns[j].ui.setMap(null);
    }
  }
  schools = [];
}

function drawSchools(data){
var totStudents = 0;
  for(var i = 0; i < schools.length; i++){
    drawSchool(schools[i]);
  }
}

function drawConns(data){
  for(var i = 0; i < schools.length; i++){
    for(var j = 0; j < schools[i].conns.length; j++){
      var conn = schools[i].conns[j];
      if(conn.strength < 10)
        continue;
      drawPath(schools[i], conn);
    }
  }
}

function drawZone(map, zoneLatLong){
  drawPoint //what this? //
}

function drawArrow(map, zoneLatLong, schoolLatLong) {}

var map;

var mapStyles = [ { "featureType": "poi", "stylers": [ { "weight": 1.9 }, { "visibility": "off" } ] },{ "featureType": "poi.school", "stylers": [ { "visibility": "on" } ] },{ "featureType": "landscape.man_made", "stylers": [ { "visibility": "on" } ] },{ "featureType": "landscape.natural", "stylers": [ { "visibility": "off" } ] } ] ;


function initialize() {
  var centerLatlng = new google.maps.LatLng(56.632064,-3.729858);
  var mapOptions = {
    zoom: 7,
	disableDefaultUI: true,
    center: centerLatlng ,
    mapTypeControlOptions: {
        mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
      }
  }
  
  var mapDiv = document.getElementById('map-canvas');
  map = new google.maps.Map(mapDiv, mapOptions);

  map.setOptions({styles : mapStyles})
  
  var defStyle = [{}]
 
  var styledMap = new google.maps.StyledMapType(defStyle, {name: "Default"});
  map.mapTypes.set('map_style', styledMap);
  map.setMapTypeId('map_style');

  button(" Pre-", showingPreSchools);
  button(" Primary ", showingPrimarySchools);
  button(" Secondary ", showingSecondarySchools);
}

function button(type, bool) {
  var homeControlDiv = document.createElement('div');
  var bc = new buttonControl(homeControlDiv, type, bool);
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(homeControlDiv);  
}

function buttonControl(controlDiv, type, bool) {
  var startDrawing = "Show" + type + "Schools";
  var stopDrawing = "Hide" + type + "Schools";
  var info = "Toggle" + type + "Schools";
  var showColor = "green";
  var hideColor = "red";
  
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

function drawPath(LatSchool, LongSchool, LatDataZone, LongDataZone) {
  drawPath(map, new google.maps.LatLng(LatSchool, LongSchool),
			new google.maps.LatLng(LatDataZone, LongDataZone)
  );
}

function drawPath(school, conn) {
  var options = {
    path: [conn.latLong, school.latLong],
    strokeOpacity: Math.min(1.0, (Math.log(conn.strength) - 2) / 2),
    strokeWeight: 1.0,
    icons: [{
      offset: '100%'
    }],
    map: map
  };
  
  conn.ui = new google.maps.Polyline(options);
} 

function drawSchool(school) {
  var options = {
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.25,
    map: map,
    center: school.latLong,
    radius: (school.size * 0.5)
  };
  
  var circ = new google.maps.Circle(options);
  school.ui = {
    'circle': circ,
    'infowindow': new google.maps.InfoWindow({
      content: '<p><b>' + school.name + '</b></p><p><b>' + "Students: " + school.size +  '</b></p>',
      position: circ.center
    })
  }
  
  google.maps.event.addListener(school.ui.circle, 'mouseover', function() {
    if (map.getZoom() > 8) {
      school.ui.infowindow.open(map) }
  });
  
  google.maps.event.addListener(school.ui.circle, 'mouseout', function() {
    school.ui.infowindow.close();
  });
}

//on load, run initialize
google.maps.event.addDomListener(window, 'load', initialize);

