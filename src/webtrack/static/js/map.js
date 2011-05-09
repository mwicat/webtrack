	var map;
	var markersArray = [];
	var tracker_counter = 0;
	
	function ButtonControl(controlDiv, map, label, onClick) {

		// Set CSS styles for the DIV containing the control
		// Setting padding to 5 px will offset the control
		// from the edge of the map
		controlDiv.style.padding = '5px';

		// Set CSS for the control border
		var controlUI = document.createElement('DIV');
		controlUI.style.backgroundColor = 'white';
		controlUI.style.borderStyle = 'solid';
		controlUI.style.borderWidth = '2px';
		controlUI.style.cursor = 'pointer';
		controlUI.style.textAlign = 'center';
		controlUI.title = 'Click to set the map to Home';
		controlDiv.appendChild(controlUI);

		// Set CSS for the control interior
		var controlText = document.createElement('DIV');
		controlText.style.fontFamily = 'Arial,sans-serif';
		controlText.style.fontSize = '100%';
		controlText.style.paddingLeft = '4px';
		controlText.style.paddingRight = '4px';
		controlText.innerHTML = label;
		controlUI.appendChild(controlText);

		// Setup the click event listeners: simply set the map to Chicago
		google.maps.event.addDomListener(controlUI, 'click', onClick);
	}

	function initialize_map() {
		var home = new google.maps.LatLng(-41.29249, 174.778889);
		var haightAshbury = new google.maps.LatLng(51.098796, 17.021662);
		var mapOptions = {
			zoom : 0,
			center : home,
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			zoomControl : true,
			zoomControlOptions : {
				style : google.maps.ZoomControlStyle.LARGE
			}

		};
		map = new google.maps.Map(document.getElementById("map_canvas"),
				mapOptions);

		addControl(map, 'Clear', function() {
			clearMarkers();
			$.post("clear");			
		});
		addControl(map, 'Reload', function() {
			clearMarkers();
			loadMarkers();
		});

		loadMarkers();
	}

	function addControl(map, label, onClick) {
		var controlDiv = document.createElement('DIV');
		var control = new ButtonControl(controlDiv, map, label, onClick);
		controlDiv.index = 1;
		map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);

	}
	
	function clearMarkers() {
		if (markersArray) {
		    for (i in markersArray) {
		      markersArray[i].setMap(null);
		    }
		  }
		markersArray = [];
	}

	function loadMarkers() {
		for ( var i in trackers_data) {
			setupTracker(trackers_data[i]);
		}
	}
	
	function setupTracker(tracker) {
		var position = new google.maps.LatLng(tracker.lat, tracker.lng);
		var marker = createMarker(map, position, tracker.name, tracker.id, tracker.battery);		
		var onPositionChanged = function() {
			tracker.lat = marker.position.lat();
			tracker.lng = marker.position.lng();
			var url = tracker_update_urls[tracker.id];
			$.post(url, tracker);
		}
		google.maps.event.addListener(marker, "dragend", onPositionChanged);
	}

	function createMarker(map, position, name, tracker_id, battery) {
		var marker = new MarkerWithLabel({
			position : position,
			map : map,
			draggable : true,
			labelContent : name,
			labelAnchor : new google.maps.Point(22, 0),
			labelClass : "labels", // the CSS class for the label
			labelStyle : {
				opacity : 0.75
			}

		});

		markersArray.push(marker);
		return marker
	}

	function addMarker(position) {
		var tracker_id = tracker_counter++;
		var name = "tracker" + tracker_id;
		var battery = 10;
		var marker = createMarker(map, position, name, tracker_id, battery);
	}

	// Removes the overlays from the map, but keeps them in the array
	function clearOverlays() {
		if (markersArray) {
			for (i in markersArray) {
				markersArray[i].setMap(null);
			}
		}
	}

	// Shows any overlays currently in the array
	function showOverlays() {
		if (markersArray) {
			for (i in markersArray) {
				markersArray[i].setMap(map);
			}
		}
	}

	// Deletes all markers in the array by removing references to them
	function deleteOverlays() {
		if (markersArray) {
			for (i in markersArray) {
				markersArray[i].setMap(null);
			}
			markersArray.length = 0;
		}
	}
	
