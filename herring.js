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

var schoolsUrl = "http://data.opendatascotland.org/sparql.csv?query=" + encodeURIComponent(schoolsSparql);

var schools = [];


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
        }
      });
      drawSchools();
    }
  });
}

requestData("secondary");

function drawSchools(data){
  for(var i = 0; i < schools.length; i++){
    drawSchool(map, schools[i].latLong, schools[i].size, schools[i].name);
  }
}

function drawConns(data){
  for(var i = 0; i < schools.length; i++){
    for(var j = 0; j < schools[i].conns.length; j++){
      var conn = schools[i].conns[j];
      if(conn.strength < 10)
        continue;
      drawPath(map, conn.latLong, schools[i].latLong,
          Math.min(1.0, (Math.log(conn.strength) - 2) / 2));
    }
  }
}

function drawArrow(map, zoneLatLong, schoolLatLong) {}

var map;

var mapStyles = [ { "featureType": "poi", "stylers": [ { "weight": 1.9 }, { "visibility": "off" } ] },{ "featureType": "poi.school", "stylers": [ { "visibility": "on" } ] },{ "featureType": "landscape.man_made", "stylers": [ { "visibility": "on" } ] },{ "featureType": "landscape.natural", "stylers": [ { "visibility": "off" } ] } ] ;


function initialize() {
  var centerLatlng = new google.maps.LatLng(56.632064,-3.729858);
  var mapOptions = {
    zoom: 7,
    center: centerLatlng ,
    mapTypeControlOptions: {
        mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
      }
  }
  
  var mapDiv = document.getElementById('map-canvas');
  map = new google.maps.Map(mapDiv, mapOptions);

  map.setOptions({styles : mapStyles})
  var x = new google.maps.LatLng(-24.363882, 130.044922);
  
  var defStyle = [{}]
 
  var styledMap = new google.maps.StyledMapType(defStyle,
{name: "Default"});
  map.mapTypes.set('map_style', styledMap);
  map.setMapTypeId('map_style');




}

function drawPath(LatSchool, LongSchool, LatDataZone, LongDataZone) {
  drawPath(map, new google.maps.LatLng(LatSchool, LongSchool),
			new google.maps.LatLng(LatDataZone, LongDataZone)
  );
}

function drawPath(map, LatLongDataZone, LatLongSchool, weight, opacity) {
  var options = {
    path: [LatLongDataZone, LatLongSchool],
    strokeOpacity: opacity,
    strokeWeight: weight,
    icons: [{
      offset: '100%'
    }],
    map: map
  };
  
  var line = new google.maps.Polyline(options);
  return line;
} 

function drawSchool(map, LatSchool, LongSchool, students) {
  drawSchool(map,
			 new google.maps.LatLng(LatSchool, LongSchool),
			 students
  );
}

function drawSchool(map, LatLongSchool, students, name) {
  var options = {
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.25,
    map: map,
    center: LatLongSchool,
    radius: (students * 0.5)
  };
  
  var circ = new google.maps.Circle(options);
  
  var infowindow = new google.maps.InfoWindow({
      content: '<p><b>' + name +  '</b></p><p><b>' + "Enrolment: " + students +  '</b></p>',
      position : circ.center });
  
  google.maps.event.addListener(circ, 'mouseover', function() {
	    if (map.getZoom() > 8) {
	    	infowindow.open(map) }
	  });
  
    google.maps.event.addListener(circ, 'mouseout', function() {
	    infowindow.close();
	  });
  
  return circ;
}

//on load, run initialize
google.maps.event.addDomListener(window, 'load', initialize);

