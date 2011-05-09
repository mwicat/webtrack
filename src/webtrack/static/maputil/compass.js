function Compass() {
	var svgDoc = document.getElementById("kompas");
	this.arrow = svgDoc.getElementById('strzalka_rot');
	this.distance = svgDoc.getElementById('distance').firstChild;
}

Compass.prototype.setAngle = function(angle) {
	this.arrow.setAttribute('transform', 'rotate(' + angle + ')');
}

Compass.prototype.setDistance = function(dist) {
	var methods = [];
	for (var m in this.distance) {
	    if (typeof this.distance[m] == "function") {
	        methods.push(m);
	    }
	}
	//alert(methods.join(","));

	this.distance.replaceWholeText(dist + ' m');
}
