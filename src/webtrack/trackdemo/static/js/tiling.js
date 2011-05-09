var MERCATOR_RANGE = 256;

function Point(x, y) {
	this.x = x;
	this.y = y;
}

function LatLng(lat, lng) {
	this.lat = lat;
	this.lng = lng;
}


function bound(value, opt_min, opt_max) {
  if (opt_min != null) value = Math.max(value, opt_min);
  if (opt_max != null) value = Math.min(value, opt_max);
  return value;
}
 
function degreesToRadians(deg) {
  return deg * (Math.PI / 180);
}
 
function radiansToDegrees(rad) {
  return rad / (Math.PI / 180);
}
 
function MercatorProjection() {
  this.pixelOrigin_ = new Point(
      MERCATOR_RANGE / 2, MERCATOR_RANGE / 2);
  this.pixelsPerLonDegree_ = MERCATOR_RANGE / 360;
  this.pixelsPerLonRadian_ = MERCATOR_RANGE / (2 * Math.PI);
};
 
MercatorProjection.prototype.fromLatLngToPoint = function(latLng, opt_point) {
  var me = this;

  var point = opt_point || new Point(0, 0);

  var origin = me.pixelOrigin_;
  point.x = origin.x + latLng.lng * me.pixelsPerLonDegree_;
  // NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
  // 89.189.  This is about a third of a tile past the edge of the world tile.
  var siny = bound(Math.sin(degreesToRadians(latLng.lat)), -0.9999, 0.9999);
  point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -me.pixelsPerLonRadian_;
  return point;
};
 
MercatorProjection.prototype.fromPointToLatLng = function(point) {
  var me = this;
  
  var origin = me.pixelOrigin_;
  var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
  var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
  var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
  return new LatLng(lat, lng);
};

function TileEngine(width, height, zoom) {
	this.width = width;
	this.height = height;
	this.zoom = zoom;
	this.projection = new MercatorProjection();	
}

TileEngine.prototype.getMarkerFor = function(tile, lat, lng) {
    var worldCoordinate = this.projection.fromLatLngToPoint(new LatLng(lat, lng));
    var zoom_sc = Math.pow(2, this.zoom)
	var pixelCoordinate = new Point(worldCoordinate.x * zoom_sc, worldCoordinate.y * zoom_sc);
    return new Point(pixelCoordinate.x - tile.pixelCoordinate.x, pixelCoordinate.y - tile.pixelCoordinate.y)
}

TileEngine.prototype.getTileFor = function(lat, lng) {
    var worldCoordinate = this.projection.fromLatLngToPoint(new LatLng(lat, lng));
    var zoom_sc = Math.pow(2, this.zoom)
	var pixelCoordinate = new Point(worldCoordinate.x * zoom_sc, worldCoordinate.y * zoom_sc);	

	var num_x = Math.floor(pixelCoordinate.x / width);
	var num_y = Math.floor(pixelCoordinate.y / height);
	
	var px_center_x = num_x * width + width/2;
	var px_center_y = num_y * height + height/2;
	var deg_center = this.projection.fromPointToLatLng(new Point(px_center_x / zoom_sc, px_center_y / zoom_sc));
	
	var tile = {
			"num_x": num_x,
			"num_y": num_y,
			"pixelCoordinate": new Point(px_center_x, px_center_y),
			"center": {"lat": deg_center.lat, "lng": deg_center.lng},
	};
	return tile;
}
