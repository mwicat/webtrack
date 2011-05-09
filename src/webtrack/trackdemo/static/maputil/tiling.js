
function Point(x, y) {
	this.x = x;
	this.y = y;
}

function LatLng(lat, lng) {
	this.lat = lat;
	this.lng = lng;
}

function TileEngine(width, height, zoom) {
	this.width = width;
	this.height = height;
	this.zoom = zoom;
	this.projection = new MercatorProjection();	
}

TileEngine.prototype.getMarkerFor = function(tile, latlng) {
    var worldCoordinate = this.projection.fromLatLngToPoint(latlng);
    var zoom_sc = Math.pow(2, this.zoom)
	var pixelCoordinate = new Point(worldCoordinate.x * zoom_sc, worldCoordinate.y * zoom_sc);
    return new Point(pixelCoordinate.x - tile.pixelCoordinate.x, pixelCoordinate.y - tile.pixelCoordinate.y)
}

TileEngine.prototype.getTileFor = function(latlng) {
    var worldCoordinate = this.projection.fromLatLngToPoint(latlng);
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

