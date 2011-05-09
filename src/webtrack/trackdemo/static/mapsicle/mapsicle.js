/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @name Streetview Mapsicle
 * @version 1.1
 * @author Stephen Davis &lt;stephen@projectx.co.nz&gt;.
 * @author Cameron Prebble &lt;cameron@projectx.co.nz&gt;.
 * @copyright (c) 2008-2009 ProjectX Technology Ltd.
 * @fileOverview A library to put overlays - images, text or HTML content - 
 * on top of a panorama in Street View. They can follow a location (given by
 * lat/lng) or be at a fixed position on screen (coming soon).
 * 
 * For now, Mapsicle doesn't work in full-screen mode.
 * 
 * To register callbacks for events, use the GEvent interface and register for
 * events on the Mapsicle object that you create.
 * 
 * You can use mapsicle from the development branch 
 * (http://gmaps-utility-library-dev.googlecode.com/svn/trunk/mapsicle/src/mapsicle.js)
 * or a tagged stable release
 * (http://gmaps-utility-library-dev.googlecode.com/svn/tags/mapsicle/[version]/src/mapsicle.js)
 * or copy it and serve locally. Make sure that mapsicle.css is in the same directory as the JavaScript file.
 * You can also use the packed version: use mapsicle_packed.js instead of mapsicle.js
 */
/*global
GEvent,
GLatLng,
GScreenPoint,
GScreenSize,
GStreetviewClient,
GStreetviewPanorama,
GUnload,
Mapsicle,
MapsicleParams,
google,
window
*/

/**
 * @class Parent class of anything that can be plonked on top of the panorama.
 *
 * @constructor do not construct this directly
 * @private
 */
/*global SVOverlay*/
var SVOverlay = function () {};

SVOverlay.prototype = {
  /** @private */
  overlayInit: function (params) {
    this.x = params.x;
    this.y = params.y;
    this.width = params.width;
    this.height = params.height;
    this.scalingFactor = 1;
    this.showOffscreen = params.showOffscreen;

    if (params.overlayAnchor) {
      this.widthOffset = params.overlayAnchor.x;
      this.heightOffset = params.overlayAnchor.y;
    } else {
      this.widthOffset = (this.width / 2);
      this.heightOffset = (this.height / 2);
    }
    
    Mapsicle.Utils.registerEvent(this.elem, "mousedown", function (e) {
      e.preventDefault();
    });
    
    /* adds an iframe shim if using Chrome */
    if (/chrome/.test(navigator.userAgent.toLowerCase())) {
      this.iframe = document.createElement("iframe");
      this.iframe.setAttribute("allowtransparency", "true");
      this.iframe.src = "http://mapsicle.projectx.co.nz/trans_background.html";
      this.iframe.frameborder = "0";
      this.iframe.scrolling = "false";
      this.iframe.style.display = "block";
      this.iframe.style.width = "100%";
      this.iframe.style.height = "100%";
      this.iframe.style.zIndex = "-1";
      this.iframe.style.filter = "mask()";
      this.iframe.style.position = "absolute";
      this.iframe.style.top = "0px";
      this.iframe.style.left = "0px";
      this.iframe.style.border = "none";
      this.elem.appendChild(this.iframe, this.elem.firstChild);
    }
  },

  /** @private */
  displayWidth: function () {
    return this.width * this.scalingFactor;
  },

  /** @private */
  displayHeight: function () {
    return this.height * this.scalingFactor;
  },

  /** @private */
  displayWidthOffset: function () {
    return this.widthOffset * this.scalingFactor;
  },

  /** @private */
  displayHeightOffset: function () {
    return this.heightOffset * this.scalingFactor;
  },

  /** @private */
  displayLeft: function (x) {
    return x - this.displayWidthOffset();
  },

  /** @private */
  displayTop: function (y) {
    return y - this.displayHeightOffset();
  },

  /** @private */
  displayRight: function (x) {
    return this.displayLeft(x) + this.displayWidth();
  },

  /** @private */
  displayBottom: function (y) {
    return this.displayTop(y) + this.displayHeight();
  },

  /** @private */
  onAddToMapsicle: function (mapsicle) {
    this.labelId = mapsicle.generateOverlayId();
    mapsicle.elems.labels.appendChild(this.elem);
  },

  /** @private */
  selfTerminate: function (mapsicle) {
    mapsicle.elems.labels.removeChild(this.elem);
  },

  shouldBeVisible: true,

  /** @private */
  setVisibility: function (vis) {
    this.shouldBeVisible = vis;
    if (vis) {
      this.elem.style.display = "inline";
    } else {
      this.elem.style.display = "none";
    }
  },

  /** @private */
  setOverlayView: function (mode, xTopLeft, yTopLeft, bounded) {
    if (isNaN(xTopLeft) || isNaN(yTopLeft)) {
      throw "tried to setOverlayView with NaN parameter...";
    }

    this.elem.style.display = "none";

    var leftArrow = false;
    var rightArrow = false;

    if (this.setArrows) {
      this.setArrows(false, false);
    }

    if (mode === "invisible") {
      return;
    } else {
      if (mode === "offscreen" || mode === "prominent") {
        leftArrow = (bounded === "left");
        rightArrow = (bounded === "right");
      }
      if (mode === "prominent") {
        // FIXME: there's got to be a less hackish way
        if (xTopLeft < Mapsicle.Bounds.CONTROLS_WIDTH) {
          xTopLeft = Mapsicle.Bounds.CONTROLS_WIDTH;
          leftArrow = true;
        }
        yTopLeft = 0;
      }
      this.setTopLeftCorner(xTopLeft, yTopLeft, leftArrow, rightArrow);
      if (this.shouldBeVisible) {
        this.elem.style.display = "inline";
      }
    }
  },

  /** @private */
  setOpacity: function (opac) {
    var retval = this.prevOpac;

    if (isNaN(opac)) {
      this.elem.style.display = "none";
      // FIXME: only set the style for the browser the user is actually using
      this.elem.style.filter = "alpha(opacity = 0)";
      this.elem.style.opacity = "0.0";
      this.prevOpac = -1;
    }
    /* Don't do DOM update if change is less than 0.01,
     * as Internet Explorer can't keep up otherwise
     */
    if (!(Math.abs(this.prevOpac - opac) < 0.01)) {
      if (opac <= 0) {
        this.elem.style.display = "none";
      } else {
        this.elem.style.display = "inline";
        // FIXME: only set the style for the browser the user is actually using
        this.elem.style.filter = "alpha(opacity = " + Math.ceil(opac * 100) + ")";
        this.elem.style.opacity = opac.toString();
      }
      this.prevOpac = opac;
    } else if (opac > 0.99) {
      this.elem.style.display = "inline";
      // FIXME: only set the style for the browser the user is actually using
      this.elem.style.filter = "alpha(opacity = 100)";
      this.elem.style.opacity = "1.0";
      this.prevOpac = 1.0;
    }
    return retval;
  },

  /** @private */
  setTopLeftCorner: function (xTopLeft, yTopLeft, leftArrow, rightArrow) {
    if (this.setArrows) {
      if (rightArrow) {
        xTopLeft = xTopLeft - MapsicleParams.ARROW_WIDTH;
      }
      this.setArrows(leftArrow, rightArrow);
    }

    var xTopLeftRounded = Math.ceil(xTopLeft);
    var yTopLeftRounded = Math.ceil(yTopLeft);

    var leftStyle = xTopLeftRounded.toString() + 'px';
    var topStyle = yTopLeftRounded.toString() + 'px';
    this.elem.style.left = leftStyle;
    this.elem.style.top = topStyle;
  }
};

/**
 * @class Parent class of overlays that track an SVLocation.
 *
 * @constructor do not construct directly
 * @extends SVOverlay
 */
/*global SVTrackingOverlay*/
var SVTrackingOverlay = function () {};

SVTrackingOverlay.prototype = new SVOverlay();

/** @private */
SVTrackingOverlay.prototype.trackingInit = function (params) {
  params.x = (-1001);
  params.y = (-1001);
  this.overlayInit(params);
  this.location = params.location;

  this.setTopLeftCorner(-1002, -1002, false, false);
};

/** @private */
SVTrackingOverlay.prototype.buildCroppingBounds = function () {
  return {
    top: 0 - this.height,
    bottom: 0 - this.height,
    left: 0 - this.width,
    right: 0 - this.width
  };
};

/** @private */
SVTrackingOverlay.prototype.registerLocation = function (loc) {
  this.location = loc;
};

/**
 * Get the location being tracked by this overlay.
 * @returns {SVLocation} the location being tracked by this overlay
 */
SVTrackingOverlay.prototype.getLocation = function () {
  return this.location;
};

/**
 * For points known to be not in FOV, in which direction are they?
 * @private
 */
SVTrackingOverlay.prototype.pointDirectionInfo = function (pov, theMapsicle) {
  var diff = Mapsicle.Utils.newMod(pov.yaw - theMapsicle.getPOV().yaw, 360);
  if (diff < 180) {
    return "right";
  } else {
    return "left";
  }
};

/** @private */
SVTrackingOverlay.prototype.updatePos = function (mapsicle) {
  var distance = this.location.distance(mapsicle.position.latlng);
  if (this.scale) {
    this.scalingFactor = Mapsicle.Utils.calculateScalingFactor(this.scale, mapsicle.config.normalDistance, distance);
  }

  var pov = this.location.pov(mapsicle);

  if (!pov) {
    throw "no POV!";
  }

  var spc = mapsicle.panorama.getScreenPoint(pov);

  var bounded;

  if (spc && !isNaN(spc.x) && !isNaN(spc.y)) {
    var top = this.displayTop(spc.y);
    var bottom = this.displayBottom(spc.y);
    var left = this.displayLeft(spc.x);
    var right = this.displayRight(spc.x);

    bounded = mapsicle.bounds.inBounds(top, bottom, left, right);
  } else {
    bounded = this.pointDirectionInfo(pov, mapsicle);
  }

  if (bounded === "controls") {
    bounded = "left";
  } else if (bounded === "logo") {
    bounded = "down";
  }

  var xTopLeft, yTopLeft;

  // FIXME someday, someone might want more than one tracking overlay per location, by using the clickable info-window feature.
  this.location.visInfo = bounded;

  switch (bounded) {

  case "left":
    xTopLeft = 0;
    yTopLeft = mapsicle.sizeY / 2 - this.displayHeightOffset();
    break;

  case "right":
    xTopLeft = mapsicle.sizeX - this.displayWidth();
    yTopLeft = mapsicle.sizeY / 2 - this.displayHeightOffset();
    break;

  case "up":
    xTopLeft = mapsicle.sizeX / 2 - this.displayWidthOffset();
    yTopLeft = 0;
    break;

  case "down":
    xTopLeft = mapsicle.sizeX / 2 - this.displayWidthOffset();
    yTopLeft = mapsicle.sizeY - this.displayHeight();
    break;

  case "within":
    if (!spc) {
      throw "Need a screen point";
    }
    if (isNaN(spc.x) || isNaN(spc.y)) {
      throw "Screen point's values are NaN!";
    }
    xTopLeft = this.displayLeft(spc.x);
    yTopLeft = this.displayTop(spc.y);
    break;

  default:
    throw "Unknown boundedness: " + bounded;
  }

  var pastCutoff;
  if (this.location.cutoff) {
    pastCutoff = (distance > this.location.cutoff);
  } else {
    pastCutoff = false;
  }

  var overlayViewMode = this.selectViewMode(pastCutoff, this.location.goal, (bounded === "within"), this.showOffscreen);
  this.setOverlayView(overlayViewMode, xTopLeft, yTopLeft, bounded);
};

/** @private */
SVTrackingOverlay.prototype.selectViewMode = function (pastCutoff, isGoal, inFOV, allowOffscreen) {
  if (pastCutoff) {
    if (isGoal) {
      return "prominent";
    } else {
      return "invisible";
    }
  } else {
    if (inFOV) {
      return "normal";
    } else if (allowOffscreen || isGoal) {
      return "offscreen";
    } else {
      return "invisible";
    }
  }
};

/**
 * @name SVMiniInfoBox
 * @extends SVTrackingOverlay
 * @class
 */
/**
 * An overlay that shows a box with a line of text.
 * @constructor
 * @param {SVMiniInfoBoxParams} params
 */
/*global SVMiniInfoBox*/
var SVMiniInfoBox = function (params) {
  this.prevOpac = -999;

  this.inner = params.inner;
  this.targetURL = params.targetURL;

  this.callback = params.callback instanceof Function ? params.callback : function () {};
  this.width = params.width;
  params.height = SVMiniInfoBox.STANDARD_HEIGHT;
  this.height = params.height;

  this.generateHTML(params);
  this.trackingInit(params);
};

// TODO: automatic width, like before? Logic is there in SVMiniInfoBox#setSize, just need to figure out when to calculate.
/**
 * @class The parameters when constructing an SVMiniInfoBox. SVMiniInfoBoxParams are not constructed: create
 * one with an object literal containing all the necessary properties.
 * @property {String} inner The text to display inside the info window
 * @property {number} width The width of the marker, in pixels. Note that you cannot set the height.
 * @property {GPoint} overlayAnchor (optional) Position on the image, relative to the top-left corner, measured in pixels on the original, unscaled image, to "anchor" the overlay to Street View. Defaults to the centre of the image.
 */
/*global SVMiniInfoBoxParams*/
var SVMiniInfoBoxParams = {
  prototype: {
    inner: null,
    width: null,
    overlayAnchor: null,
    /** @ignore callback if mouse is pressed down on marker. */
    callback: null,
    /** @ignore link for text within window */
    targetURL: null
  }
};

SVMiniInfoBox.prototype = new SVTrackingOverlay();

SVMiniInfoBox.STANDARD_HEIGHT = 30;
SVMiniInfoBox.STANDARD_WIDTH = 130;

/** @private */
SVMiniInfoBox.prototype.generateHTML = function (params) {
  var width = this.width;
  var targetURL = this.targetURL || '#sv_info_window_targetURL';

  var label = Mapsicle.Utils.createDiv("mapsicle-overlays");
  label.className += " " + MapsicleParams.INFO_WINDOW_GENERIC_CLASS;
  label.className += " " + MapsicleParams.INFO_WINDOW_COLOURISED_CLASS;

  var left = Mapsicle.Utils.createDiv("left");
  var middle = Mapsicle.Utils.createDiv("middle");
  var right = Mapsicle.Utils.createDiv("right");
  var clear = Mapsicle.Utils.createDiv("clear");

  var h2 = document.createElement("h2");

  var labelLink = document.createElement("a");
  labelLink.setAttribute("href", targetURL);
  labelLink.setAttribute("onclick", "return false;");
  labelLink.innerHTML = this.inner;
  h2.appendChild(labelLink);

  middle.appendChild(h2);

  label.appendChild(left);
  label.appendChild(middle);
  label.appendChild(right);

  this.elemLeft = left;
  this.elemMiddle = middle;
  this.elemRight = right;

  label.appendChild(clear);

  var parentLabel = this;

  var overlayMgr = this.overlayMgr;

  label.onclick = function (e) {
    parentLabel.location.infoWindowClicked(e);
    parentLabel.callback(e);
  };

  var height = SVMiniInfoBox.STANDARD_HEIGHT;

  this.elem = label;
  this.setSize(width, height);
};

/** @private */
SVMiniInfoBox.prototype.setSize = function (width, height) {
  var middle = this.elemMiddle;
  var left = this.elemLeft;
  var right = this.elemRight;

  if (!width || isNaN(width)) {
    var oldD = this.elem.style.display;
    var oldOpac = this.setOpacity(0.02);

    this.elem.style.zIndex = Mapsicle.ZIndices.RIGHT_BACK.toString();
    this.elem.style.display = "inline";

    this.elem.style.width = "auto";
    middle.style.width = "auto";

    width = this.elem.offsetWidth;

    this.elem.style.display = oldD;
    this.setOpacity(oldOpac);
  }
  this.elem.style.width = width + "px";
  middle.style.width = (width - 16) + "px";
  this.width = width;

  this.elem.style.height = height + "px";
  middle.style.height = (height - 4) + "px";
  left.style.height = (height) + "px";
  right.style.height = (height) + "px";
  this.height = height;

  this.elem.style.zIndex = Mapsicle.ZIndices.LABEL_BOTTOM;
};

/**
 * @name SVCustomInfoWindow
 * @class
 * @extends SVTrackingOverlay
 */
/**
 * An overlay that shows user-specified content.
 * @constructor
 * @param {SVCustomInfoWindowParams} params
 */
/*global SVCustomInfoWindow*/
var SVCustomInfoWindow = function (params) {
  this.inner = params.inner;

  this.callback = params.callback instanceof Function ? params.callback : function () {};

  this.generateHTML(params.width, params.height);
  this.trackingInit(params);
};

/**
 * @class The parameters when constructing an SVCustomInfoWindow. SVCustomInfoWindowParams are not constructed: create
 * one with an object literal containing all the necessary properties.
 * @property {element} inner A DOM element to display inside the info window
 * @property {number} width The width of the info window, in pixels
 * @property {number} height The height of the info window, in pixels
 * @property {GPoint} overlayAnchor (optional) Position on the image, relative to the top-left corner, measured in pixels on the original, unscaled image, to "anchor" the overlay to Street View.
 */
/*global SVCustomInfoWindowParams*/
var SVCustomInfoWindowParams = {
  prototype: {
    inner: null,
    width: null,
    height: null,
    overlayAnchor: null,
    /** @ignore callback if mouse is pressed down on marker. */
    callback: null
  }
};

SVCustomInfoWindow.prototype = new SVTrackingOverlay();

/** @private */
SVCustomInfoWindow.prototype.generateHTML = function (width, height) {
  this.elem = Mapsicle.Utils.createDiv("mapsicle-overlays");
  this.elem.style.height = height;
  this.elem.style.width = width;
  this.elem.style.zIndex = Mapsicle.ZIndices.LABEL_BOTTOM;
  this.elem.appendChild(this.inner);
};

/**
 * @class
 * @extends SVTrackingOverlay
 * @name SVMarker
 */
/**
 * An overlay that tracks a location with a simple icon.
 * @constructor
 * @param {SVMarkerParams} params
 */
/*global SVMarker*/
var SVMarker = function (params) {
  this.scale = params.scale;
  this.iconURL = params.iconURL || MapsicleParams.DEFAULT_ICON_URL;
  this.callback = params.callback instanceof Function ? params.callback : function () {};
  this.generateHTML();

  this.setImageParameter('width', 0);
  this.setImageParameter('height', 0);

  this.trackingInit(params);
};

/**
 * @class The parameters when constructing an SVMarker. SVMarkerParams are not constructed: create one with an object
 * literal containing all the necessary properties.
 * @property {boolean} showOffscreen (optional) For non-goal markers, whether to show their direction while offscreen.
 * @property {String} iconURL The URL of the image to use as the marker
 * @property {number} width The width of the info window, in pixels
 * @property {number} height The height of the info window, in pixels
 * @property {number} scale (optional) If 1 or undefined, the marker will always be the same size. If less than 1, the marker will be downscaled as it gets further away until it is the given fraction of its normal size.
 * @property {GPoint} overlayAnchor (optional) Position on the image, relative to the top-left corner, measured in pixels on the original, unscaled image, to "anchor" the overlay to Street View.
 */
/*global SVMarkerParams*/
var SVMarkerParams = {
  prototype: {
    showOffscreen: null,
    iconURL: null,
    width: null,
    height: null,
    overlayAnchor: null,
    /** @ignore callback if mouse is pressed down on marker. */
    callback: null,
    scale: null
  }
};

SVMarker.prototype = new SVTrackingOverlay();

SVMarker.prototype.width = null;
SVMarker.prototype.height = null;

/** @private */
SVMarker.prototype.toString = function () {
  var locDesc = this.location ? this.location.toString() : "undefined location";
  return "SVMarker of " + locDesc + " url: " + this.iconURL;
};

/** @private */
SVMarker.prototype.generateHTML = function () {
  var doImageBoxAttrs = function (div, url) {
    div.src = url;
    div.alt =  "an arrow pointing left to show you that the marker indicates a place offscreen";
    div.width = "0";
  };

  var elem = Mapsicle.Utils.createDiv("mapsicle-overlays");
  this.imageTag = document.createElement("img");

  this.updateImageTitle("(anonymous)");

  this.imageTag.src = this.iconURL;

  var leftBox = Mapsicle.Utils.createSpan("mapsicle-svmarker-left-side");
  this.leftArrow = document.createElement("img");
  doImageBoxAttrs(this.leftArrow, MapsicleParams.LEFT_ARROW);
  leftBox.appendChild(this.leftArrow);

  var rightBox = Mapsicle.Utils.createSpan("mapsicle-svmarker-right-side");
  this.rightArrow = document.createElement("img");
  doImageBoxAttrs(this.rightArrow, MapsicleParams.RIGHT_ARROW);
  rightBox.appendChild(this.rightArrow);

  var bottomBox = Mapsicle.Utils.createDiv("clear");

  elem.appendChild(leftBox);
  elem.appendChild(this.imageTag);
  elem.appendChild(rightBox);
  elem.appendChild(bottomBox);

  var marker = this;
  elem.onclick = function (e) {
    marker.location.markerClicked(e);
    marker.callback(e);
  };

  this.elem = elem;
};

/** @private */
SVMarker.prototype.setArrows = function (left, right) {
  var extraWidth = 0;
  var marker = this;

  var setArrowVisible = function (elem, show) {
    var newWidth = show ? MapsicleParams.ARROW_WIDTH : 0;
    extraWidth += newWidth;
    elem.width = newWidth;
  };

  setArrowVisible(this.leftArrow, left);
  setArrowVisible(this.rightArrow, right);

  this.setImageParameter('width', extraWidth);
  this.setImageParameter('height', 0);
  this.elem.width = this.displayWidth() + extraWidth;
};

/** @private */
SVMarker.prototype.registerLocation = function (loc) {
  this.location = loc;
  this.updateImageTitle(loc.name);
};

/** @private */
SVMarker.prototype.updateImageTitle = function (title) {
  this.imageTag.alt = "marker indicating the location of " + title;
  this.imageTag.title = title;
};

/**
 * @private
 * @param {String} dimension either "width" or "height"
 */
SVMarker.prototype.setImageParameter = function (dimension, bonus) {
  var dimVal = this[dimension];

  if (Mapsicle.Utils.nonexistent(dimVal)) {
    this.imageTag.removeAttribute(dimension);
  } else {
    this.imageTag.setAttribute(dimension, (dimVal * this.scalingFactor).toString());
  }
};

/**
 * @name SVLocation
 * @class
 */
/**
 * A location derived from a lat/lng that can be followed by markers and labels.
 * @constructor
 * @param {SVLocationParams} params
 */
/*global SVLocation*/
var SVLocation = function (params) {
  this.lat = params.lat;
  this.lng = params.lng;
  this.name = params.name;

  this.cutoff = params.cutoff;
  this.goal = params.goal;

  this.marker = params.marker;
  this.info = params.info;
};

// TODO: construct with GLatLng?
/**
 * @class The parameters when constructing an SVLocation. SVLocationParams are not constructed: create one with an object
 * literal containing all the necessary properties.
 * @property {number} lat Latitude
 * @property {number} lng Longitude
 * @property {String} name The location's name
 * @property {SVMarker} marker (optional) A marker to be displayed hovering at this location
 * @property {SVCustomInfoWindow/SVMiniInfoBox} info (optional) An info window: SVCustomInfoWindow or SVMiniInfoBox.
 * @property {number} cutoff (optional) Distance, in metres, beyond which markers and info windows
 *     are not displayed. Defaults to infinite.
 * @property {boolean} goal (optional) Whether the location is a goal. If so markers and info windows
 *     will be displayed beyond the cutoff in "prominent" mode. It is possible,
 *     but not recommended to have more than one goal marker.
 */
/*global SVLocationParams*/
var SVLocationParams = {
  prototype: {
    lat: null,
    lng: null,
    name: null,
    marker: null,
    info: null,
    cutoff: null,
    goal: null
  }
};

SVLocation.prototype = {
  targetPitch: null,
  targetYaw: null,
  label: null,
  visInfo: "unknown"
};

/**
 * Is this location currently in our field of view? (Not necessarily visible, but we're facing in its direction).
 *
 * @returns {boolean} whether the location is in the field of view.
 */
SVLocation.prototype.inFOV = function () {
  return this.visInfo === "within";
};

/**
 * What direction, relative to the way we're facing, is the location? One of "left",
 *     "right", "up", "down" if the location is offscreen in that direction, "within"
 *     if visible, or "unknown" if called in a situation where it makes no sense
 *     (not registered within a Mapsicle, or no current Street View imagery)
 *
 * @returns {String}
 */
SVLocation.prototype.whereOffscreen = function () {
  return this.visInfo;
};

/** @private */
SVLocation.prototype.toString = function () {
  return "(SVLocation: " + this.name + ")";
};

/**
 * @returns {GLatLng} The geographic co-ordinates the location is at
 */
SVLocation.prototype.latlng = function () {
  return new GLatLng(this.lat, this.lng);
};

/**
 * Find the distance in metres between this location and another position
 *
 * @param {GLatLng} position The other position
 * @returns {number} The distance in metres
 */
SVLocation.prototype.distance = function (position) {
  return position.distanceFrom(this.latlng());
};

/** @private */
SVLocation.prototype.pov = function (mapsicle) {
  if (!mapsicle.up) {
    throw new Error("SVLocation#pov(): should not be trying to position overlays until mapsicle is up");
  } else if (Mapsicle.Utils.nonexistent(this.targetYaw)) {
    throw new ReferenceError("Need a valid targetYaw to calculate pixelPosition");
  } else if (Mapsicle.Utils.nonexistent(this.targetPitch)) {
    throw new ReferenceError("Need a valid targetPitch to calculate pixelPosition");
  } else {
    return {
      yaw: this.targetYaw,
      pitch: this.targetPitch,
      zoom: mapsicle.getPOV().zoom
    };
  }
};

/** @private */
SVLocation.prototype.calcVectors = function (currentLatLng) {
  this.targetYaw = Mapsicle.Utils.findBearing(currentLatLng, this.latlng());
  this.targetPitch = 0;
};

/** @private */
SVLocation.prototype.markerClicked = function (mouseEvent) {
  if (this.info) {
    this.info.setVisibility(true);
    this.marker.setVisibility(false);
  }
};

/** @private */
SVLocation.prototype.infoWindowClicked = function (mouseEvent) {
  if (this.marker) {
    this.marker.setVisibility(true);
    this.info.setVisibility(false);
  }
};

/**
 * @name Mapsicle
 * @class
 */
/**
 * Creates a new Street View Mapsicle: a street view panorama which you can overlay with markers.
 *
 * @constructor
 * @param {Element} container The container in which to put Mapsicle
 * @param {GLatLng} glatlng (Optional) The starting location for Street View. If not given, Street View won't launch until the position is set with Mapsicle#setPosition.
 * @param {MapsicleParams} custom (Optional) Any custom configuration parameters
 */
/*global Mapsicle*/
var Mapsicle = function (container, glatlng, custom) {
  this.mapsicleId = (Mapsicle.numMapsicles++);
  Mapsicle.instances[this.mapsicleId] = this;
  
  this.config = new MapsicleParams();
  for (var v in custom) {
    if (custom.hasOwnProperty(v)) {
      this.config[v] = custom[v];
    }
  }

  if (container instanceof String || typeof container === "string") {
    container = document.getElementById(container);  
  }
  
  var elems = new Mapsicle.PageElements(this, container, this.mapsicleId);
  this.elems = elems;

  // TODO: allow sizeX, sizeY as MapsicleParams
  this.sizeX = Math.max(MapsicleParams.MIN_PANORAMA_SIZE_X, elems.svc.clientWidth, elems.container.clientWidth);
  this.sizeY = Math.max(MapsicleParams.MIN_PANORAMA_SIZE_Y, elems.svc.clientHeight, elems.container.clientHeight);

  this.overlayMgr = new Mapsicle.OverlayDisplayManager(this);
  this.client = new GStreetviewClient();

  var theMapsicle = this;

  if (glatlng) {
    this.setPosition(glatlng, null, function (code) {
      theMapsicle.setCannedMessage(code);
    });
  } else {
    this.elems.svc.innerHTML = "<h2>Waiting for position to be set.</h2>";
  }
  // Otherwise, the user will need to call setPosition to start Mapsicle.
};

Mapsicle.numMapsicles = 0;
Mapsicle.instances = [];
  
Mapsicle.prototype = {
  config: null,
  elems: null,
  overlayMgr: null,

  up: false, // whether upStreetView() has been called
  jumping: false,

  target: {
    yaw: 0,
    pitch: 0,
    zoom: 0
  }, // GPov

  panorama: null,
  locations: [],
  position: null, // GStreetviewLocation
  zoom: 0,
  client: null,

  // TODO: Store as GScreenSize
  sizeX: 0,
  sizeY: 0,
  currentRequest: false,

  labelIdCount: 0,
  mapsicleId: 0  
};

/**
 * Get the current position of the Panorama
 * @returns {GStreetviewLocation}
 */
Mapsicle.prototype.getPosition = function () {
  return this.position;
};

/** @private */
Mapsicle.prototype.generateOverlayId = function () {
  var overlayId = "mapsicle-instance-" + this.mapsicleId.toString() + "-overlay-" + this.labelIdCount.toString();
  this.labelIdCount++;
  return overlayId;
};

/** @private */
Mapsicle.prototype.upStreetView = function () {
  if (!this.position) {
    return false;
  }

  this.elems.svc.innerHTML = "";

  this.panorama = new GStreetviewPanorama(this.elems.svc, {
    latlng: this.position.latlng,
    pov: this.target
  });

  var theMapsicle = this;

  GEvent.addListener(this.panorama, "error", function (errorCode) {
    if (errorCode === Mapsicle.SVErrorCodes.NO_FLASH) {
      theMapsicle.setCannedMessage(errorCode, true);
    } else if (errorCode === Mapsicle.SVErrorCodes.NO_NEARBY_PANO) {
      theMapsicle.setCannedMessage(errorCode);
    } else {
      theMapsicle.setCannedMessage(errorCode);
    }

    GEvent.trigger(theMapsicle, "error", errorCode);
  });

  var overlayMgr = this.overlayMgr;

  GEvent.addListener(this.panorama, "yawchanged", function (yaw) {
    overlayMgr.onPOVChange();
    GEvent.trigger(theMapsicle, "yawchanged", yaw);
  });
  GEvent.addListener(this.panorama, "pitchchanged", function (pitch) {
    overlayMgr.onPOVChange();
    GEvent.trigger(theMapsicle, "pitchchanged", pitch);
  });
  GEvent.addListener(this.panorama, "zoomchanged", function (zoom) {
    // TODO: change apparent size of markers
    overlayMgr.onPOVZoomChange();
    GEvent.trigger(theMapsicle, "zoomchanged", zoom);
  });
  GEvent.addListener(this.panorama, "initialized", function (loc) {
    /* Note that this is called whenever the USER goes to a NEW location,
       or when we use panorama.followLink, but NOT when we set the location
       with setLocationAndPOV.
       (changed in Maps API v2.170 so called when the panorama is first loaded)
     */
    theMapsicle.onPositionChangeComplete(loc);
    GEvent.trigger(theMapsicle, "initialized", loc);
  });

  var mouseHeld = false;

  this.elems.svc.onclick = function (e) {
    theMapsicle.handleClick(e);
    overlayMgr.stopMotion();
  };

  this.elems.svc.onmousedown = function (e) {
    overlayMgr.startMotion();
    mouseHeld = true;
  };

  this.elems.svc.onkeydown = function (e) {
    overlayMgr.startMotion();
  };
  this.elems.svc.onmouseout = function (e) {
    overlayMgr.stopMotion();
  };
  // FIXME: mouseover is not the same as mouseenter!
  this.elems.svc.onmouseover = function (e) {
    if (mouseHeld) {
      overlayMgr.startMotion();
    }
  };
  // FIXME: This is the jQuery version. Hopefully the non-jQuery version will someday emulate it.
  /*$(this.elems.svc).bind("mouseenter", function (e) {
    if (mouseHeld) {
      //console.log("mouse enters street view container: held");
      overlayMgr.startMotion();
    } else {
      //console.log("mouse enters street view container: not held");
    }
  });*/
  this.elems.svc.onmouseup = function (e) {
    mouseHeld = false;
    overlayMgr.stopMotion();
  };
  this.elems.svc.onkeyup = function (e) {
    overlayMgr.stopMotion();
  };

  this.elems.updatePanelXY();
  this.setPanoramaSize(this.sizeX, this.sizeY);

  this.elems.listenForResize(this);
  
  GEvent.trigger(this, "mapsicle_ready", this);
  return true;
};

/**
 * Trigger the mapsicle_click event from being given a UI MouseEvent.
 * Needs to get a GPov from the screen position, currently broken.
 *
 * @private
 */
Mapsicle.prototype.handleClick = function (e) {
  //var panoX = e.pageX - this.elems.panelX;
  //var panoY = e.pageY - this.elems.panelY;

  //var screenPoint = new GScreenPoint(panoX, panoY);
  //var pov = this.panorama.getPOV(screenPoint);

  GEvent.trigger(this, "mapsicle_click", /*pov*/ null);
};

/*
 * EVENTS
 */

/**
 * @name Mapsicle#yawchanged
 * @event
 * @param {number} yaw
 */
/**
 * @name Mapsicle#pitchchanged
 * @event
 * @param {number} pitch
 */
/**
 * @name Mapsicle#zoomchanged
 * @event
 * @param {number} zoom
 */
/**
 * @name Mapsicle#initialized
 * @event
 * @param {GStreetviewLocation} location
 */
/**
 * @name Mapsicle#error
 * @event
 * @param {Mapsicle.SVErrorCodes} yaw
 */
/**
 * @name Mapsicle#mapsicle_end
 * @event
 */
/**
 * @name Mapsicle#mapsicle_resized
 * @event
 * @param {GScreenSize} size
 */
/**
 * @name Mapsicle#mapsicle_position_changed
 * @event
 * @param {GStreetviewLocation} location
 */
/**
 * @name Mapsicle#mapsicle_ready
 * @event
 * @param {Mapsicle} mapsicle
 */
/**
 * @name Mapsicle#mapsicle_set_position_failed
 * @event
 * @param {Mapsicle.SVErrorCodes} errorCode
 */
/**
 * @name Mapsicle#mapsicle_set_position_success
 * @event
 * @param {GStreetviewLocation} location
 */
/**
 * @name Mapsicle#mapsicle_set_position_panned
 * @event
 * @param {GPov} pov
 */
/**
 * @name Mapsicle#mapsicle_set_position_jumped
 * @event
 * @param {GStreetviewLocation} location
 */
/**
 * @name Mapsicle#mapsicle_set_position_launched
 * @event
 * @param {GStreetviewLocation} location
 */
/**
 * @name Mapsicle#mapsicle_click
 * @event
 * @param {GPov} pov
 */
/**
 * @name Mapsicle#mapsicle_pov_changed
 * @event
 * @param {Mapsicle} mapsicle
 */

/**
 * Close down this instance of Mapsicle
 */
Mapsicle.prototype.close = function () {
  this.clearAllOverlays();
  if (this.panorama) {
    this.panorama.remove();
  }
  Mapsicle.instances[this.mapsicleId] = null;
  GEvent.trigger(this, "mapsicle_end", null);
};

/**
 * @function
 *
 * TODO: document
 * @private
 */
Mapsicle.prototype.setMessage = alert;

Mapsicle.prototype.bounds = null;

// TODO use GScreenSize?
/**
 * Set the panorama to be a particular size
 *
 * @param {number} x
 * @param {number} y
 */
Mapsicle.prototype.setPanoramaSize = function (x, y) {
  this.sizeX = Math.max(MapsicleParams.MIN_PANORAMA_SIZE_X, x);
  this.sizeY = Math.max(MapsicleParams.MIN_PANORAMA_SIZE_Y, y);

  this.bounds = new Mapsicle.Bounds(0, y, 0, x);

  this.elems.setAllContainerSizes(this.sizeX, this.sizeY);

  if (this.panorama) {
    this.panorama.checkResize();
  }

  if (this.up) {
    this.overlayMgr.stopMotion();
  }
  GEvent.trigger(this, "mapsicle_resized", new GScreenSize(this.sizeX, this.sizeY));
};

/**
 * Automatically resize the panorama to fit the container
 */
Mapsicle.prototype.panoramaResized = function () {
  this.setPanoramaSize(this.elems.container.clientWidth, this.elems.container.clientHeight);
};

/** @private */
Mapsicle.prototype.onPositionChangeComplete = function (loc) {
  this.position = loc;
  this.refreshTargets(loc.latlng);

  if (this.locations.length > 0) {
    this.locations.sort(function (a, b) {
      return a.targetYaw - b.targetYaw;
    });
  }

  this.overlayMgr.stopMotion();

  if (!this.up) {
    this.up = this.upStreetView();
    this.overlayMgr.setAllOpacities(0.0);
  }

  GEvent.trigger(this, "mapsicle_position_changed", loc);
};

/** @private */
Mapsicle.prototype.refreshTargets = function (latlng) {
  if (!this.locations) {
    throw new ReferenceError("Mapsicle#refreshTargets(): locations is null");
  }
  Mapsicle.Utils.each(this.locations, function (loc) {
    loc.calcVectors(latlng);
  });
};

/**
 * Add a list of locations
 *
 * @param {Array[SVLocation]} results array of locations to add
 */
Mapsicle.prototype.setLocations = function (results) {
  var theMapsicle = this;
  Mapsicle.Utils.each(results, function (loc) {
    theMapsicle.addLocation(loc);
  });
};

/**
 * Add a new location
 *
 * @param {SVLocation} newLocation the location to add
 */
Mapsicle.prototype.addLocation = function (newLocation) {
  if (this.position) {
    newLocation.calcVectors(this.position.latlng);
  }

  this.locations.push(newLocation);

  if (newLocation.marker) {
    newLocation.marker.registerLocation(newLocation);
    this.addTrackingOverlay(newLocation.marker);
  }

  if (newLocation.info) {
    newLocation.info.registerLocation(newLocation);
    if (newLocation.marker) {
      newLocation.info.setVisibility(false);
    }
    this.addTrackingOverlay(newLocation.info);
  }
};

/**
 * Get all current locations
 * @returns {Array[SVLocation]}
 */
Mapsicle.prototype.getLocations = function () {
  return this.locations;
};

/**
 * Remove the given location
 *
 * @param {SVLocation} doomedLocation
 */
Mapsicle.prototype.removeLocation = function (doomedLocation) {
  var theMapsicle = this;

  Mapsicle.Utils.deleteFromArray(doomedLocation, this.locations, function (obj) {
    theMapsicle.removeTrackingOverlay(obj.info);
    theMapsicle.removeTrackingOverlay(obj.marker);
  });
};

/**
 * Remove all locations
 */
Mapsicle.prototype.clearLocations = function () {
  this.clearTrackingOverlays();
  this.locations = [];
};

/** @private */
Mapsicle.prototype.addTrackingOverlay = function (newOverlay) {
  this.overlayMgr.trackingOverlays.push(newOverlay);
  newOverlay.onAddToMapsicle(this);
  this.overlayMgr.updateAll();
};

/** @private */
Mapsicle.prototype.removeTrackingOverlay = function (doomedOverlay) {
  var theMapsicle = this;

  Mapsicle.Utils.deleteFromArray(doomedOverlay, this.overlayMgr.trackingOverlays, function (obj) {
    obj.selfTerminate(theMapsicle);
  });
};

/** @private */
Mapsicle.prototype.clearTrackingOverlays = function () {
  var theMapsicle = this;
  Mapsicle.Utils.each(this.overlayMgr.trackingOverlays, function (t) {
    t.selfTerminate(theMapsicle);
  });
  this.overlayMgr.trackingOverlays = [];
};

/** @private */
Mapsicle.prototype.clearAllOverlays = function () {
  this.clearTrackingOverlays();
};

/**
 * Follow a link from the current position. This will fire the initialized event.
 * This works exactly the same as GStreetviewPanorama#followLink.
 *
 * @param {number} yaw the yaw to travel in - follows the closest link to this direction
 */
Mapsicle.prototype.followLink = function (yaw) {
  this.panorama.followLink(yaw);
};

/**
 * Attempt to change the position of the panorama
 *
 * @param {GLatLng} targetLatLng the co-ordinates to try to find a panorama near
 * @param {GPov} pov a point of view to set position to. If left undefined, the pov will point toward the requested lat/lng.
 * @param {Function} errorCallback (optional) a callback if a panorama cannot be found
 */
Mapsicle.prototype.setPosition = function (targetLatLng, pov, errorCallback) {
  if (!this.currentRequest) {
    this.currentRequest = true;
    var theMapsicle = this;

    this.client.getNearestPanorama(targetLatLng, function (streetViewData) {
      theMapsicle.currentRequest = false;

      if (streetViewData.code === Mapsicle.SVErrorCodes.SUCCESS) {
        var target = pov || {
          yaw: Mapsicle.Utils.findBearing(streetViewData.location.latlng, targetLatLng),
          pitch: 0,
          zoom: 0
        };

        theMapsicle.switchToPano(streetViewData.location, target);
      } else if (streetViewData.code === Mapsicle.SVErrorCodes.NO_NEARBY_PANO || streetViewData.code === Mapsicle.SVErrorCodes.SERVER_ERROR) {
        if (!Mapsicle.Utils.nonexistent(errorCallback)) {
          errorCallback.call(null, streetViewData.code);
        }
        GEvent.trigger(theMapsicle, "mapsicle_set_position_failed", streetViewData.code);
      } else {
        var errorMsg = "getNearestPanorama(): streetViewData.code had an unrecognised value";
        throw new Error(errorMsg);
      }
    });
  }
};

/** @private */
Mapsicle.prototype.switchToPano = function (panoLocation, target) {
  this.target = target;

  if (this.up) {
    var base = panoLocation.latlng;

    if (panoLocation.panoId === this.position.panoId) {
      this.panToTarget();
      GEvent.trigger(this, "mapsicle_set_position_panned", this.getPOV());
    } else {
      this.jumping = true;

      // TODO: error handling. Shouldn't ever fail, as the client just said there was a pano here, but still...
      this.panorama.setLocationAndPOV(panoLocation.latlng, this.target);
      this.onPositionChangeComplete(panoLocation);
      GEvent.trigger(this, "mapsicle_set_position_jumped", panoLocation);
    }

    this.overlayMgr.stopMotion();
    //this.overlayMgr.updateAll(this.overlayMgr.pauseMode);
  } else {
    this.elems.svc.innerHTML = "<h2>Launching the Panorama Viewer...</h2>";
    this.onPositionChangeComplete(panoLocation);
    GEvent.trigger(this, "mapsicle_set_position_launched", panoLocation);
  }

  GEvent.trigger(this, "mapsicle_set_position_success", panoLocation);
};

/** @private */
Mapsicle.prototype.setCannedMessage = function (code, replace) {
  var theMapsicle = this;
  var show = replace ? function (inner) {
    theMapsicle.elems.svc.innerHTML = "<h2>" + inner + "</h2>";
  } : this.setMessage;

  switch (code) {
  case Mapsicle.SVErrorCodes.NO_FLASH:
    show("You need to install <a href='http://get.adobe.com/flashplayer/'>Flash</a> to use Street View.");
    break;
  case Mapsicle.SVErrorCodes.NO_NEARBY_PANO:
    if (this.config.noPano instanceof Function) {
      this.elems.updatePanelXY();
      this.setPanoramaSize(this.sizeX, this.sizeY);
      this.config.noPano.call();
    } else {
      show("We're sorry, but there is no Street View of that location");  
    }
    break;
  case Mapsicle.SVErrorCodes.SERVER_ERROR:
    show("We're sorry, but the server is not responding. Try refreshing the page.");
    break;
  case Mapsicle.SVErrorCodes.SUCCESS:
    show("Error: Unexpected success.");
    break;
  default:
    show("Unknown error " + code.toString());
    break;
  }
};

/**
 * Set the contents of the "curtain", an overlay the covers the whole of street view
 */
Mapsicle.prototype.setCurtainContents = function (html) {
  this.elems.curtain.innerHTML = html;
};

/**
 * Set whether the "curtain" is shown.
 */
Mapsicle.prototype.showCurtain = function (show) {
  if (show) {
    this.elems.curtain.style.visibility = 'visible';
  } else {
    this.elems.curtain.style.visibility = 'hidden';
  }
};

/**
 * Get either the current POV of the panorama, or what the POV will be initialized to.
 * @returns {GPov}
 */
Mapsicle.prototype.getPOV = function () {
  if (this.up) {
    return this.panorama.getPOV();
  } else {
    return this.target;
  }
};

/**
 * Works the same as {@link jumpTo}, but works instantly rather than a slow pan.
 *
 * @param {GPov} pov
 */
Mapsicle.prototype.setPOV = function (pov) {
  if (this.up) {
    this.panorama.setPOV(pov);
  }
  this.target = this.pov;
};

/**
 * Pan the Street View panorama around to a particlar point of view.
 *
 * @param {GPov} target
 */
Mapsicle.prototype.panTo = function (target) {
  if (this.up) {
    this.panorama.panTo(target);
  }
  this.target = target;
};

/** @private */
Mapsicle.prototype.panToTarget = function () {
  this.panTo(this.target);
};

/**
 * @namespace Policies for displaying labels
 *
 * @private
 */
Mapsicle.OverlayDisplayMode = {
  PROXIMITY: "proximity",
  HIDDEN: "hidden",
  TRACK: "track",
  FADE_TO_HIDDEN: "fade to hidden",
  SOLID: "solid",
  UNSTARTED: "have not set display mode yet"
};

/**
 * @private
 * @namespace Error codes of Google Streetview callbacks
 */
Mapsicle.SVErrorCodes = {
  /** the operation was a success */
  SUCCESS: 200,
  /** there was an error at the server end, or the request was made with malformed data */
  SERVER_ERROR: 500,
  /** there is no street view imagery nearby */
  NO_NEARBY_PANO: 600,
  /** the user's browser does not have Flash */
  NO_FLASH: 603
};

/**
 * @namespace keep track of the various CSS Z-levels
 *
 * @private
 */
Mapsicle.ZIndices = {
  RIGHT_BACK: -9999,
  STREETPANEL: 40,
  LABELS_OUTER: 80,
  LABEL_INIT: 90,
  LABEL_BOTTOM: 99,
  LABEL_EXPAND: 101,
  LABEL_TOP: 500,
  MESSAGE: 800
};

/**
 * @class Configuration options when initializing Mapsicle.
 *
 * Do not use the constructor for this class, instead, instantiate it as an object literal.
 * All of the properties (and the object itself) are optional.
 * @property {boolean} avoidOverlaps Whether to push tracking markers away from each other so they don't cover each other up.
 * @property {number} normalDistance At this distance (in metres), and any closer, a scaled marker will be displayed at full size
 */
/*global MapsicleParams*/
var MapsicleParams = function () {};

MapsicleParams.prototype = {
  avoidOverlaps: false,
  defaultOpacity: 0.5,
  fadeTime: 4000,
  fadeSpeed: "normal",
  noPano: null,
  normalDistance: 30,
  proximityDivisor: 120000,
  proximityYScale: 1.5,
  /**
   * how many pixels to move markers up or down if they overlap
   * @type number
   * @deprecated
   */
  verticalOffset: 10
};

/*
 * Guesses at Google constants
 */
MapsicleParams.MIN_PANORAMA_SIZE_X = 300;
MapsicleParams.MIN_PANORAMA_SIZE_Y = 200;

MapsicleParams.DEFAULT_ICON_URL = "images/crosshair2.png";

MapsicleParams.INFO_WINDOW_GENERIC_CLASS = "mapsicle-svinfowindow";
MapsicleParams.INFO_WINDOW_COLOURISED_CLASS = "mapsicle-svinfowindow_black";

MapsicleParams.LEFT_ARROW = "images/marker_left_arrow.png";
MapsicleParams.RIGHT_ARROW = "images/marker_right_arrow.png";
MapsicleParams.ARROW_WIDTH = 50;

/**
 * @private
 *
 * When putting markers offscreen, needs to be larger or smaller than edge (as appropriate).
 * Only needs to be out by one pixel, but magic number makes it easier to debug.
 */
MapsicleParams.WELL_OFFSCREEN = 577;

/** @private */
Mapsicle.Bounds = function (top, bottom, left, right, subBounds, name) {
  this.top = top;
  this.bottom = bottom;
  this.left = left;
  this.right = right;
};

/** @private */
Mapsicle.Bounds.prototype.inBounds = function (top, bottom, left, right) {
  var retval;

  if (left < this.left) {
    retval = "left";
  } else if (top < this.top) {
    retval = "up";
  } else if (bottom > this.bottom) {
    retval = "down";
  } else if (right > this.right) {
    retval = "right";
  } else {
    retval = "within";
  }

  if (retval === "within") {
    if (left < Mapsicle.Bounds.CONTROLS_WIDTH && top < Mapsicle.Bounds.CONTROLS_HEIGHT) {
      retval = "controls";
    } else if (bottom > (this.bottom - Mapsicle.Bounds.LOGO_HEIGHT) && left < Mapsicle.Bounds.LOGO_WIDTH) {
      retval = "logo";
    }
  }

  return retval;
};

Mapsicle.Bounds.CONTROLS_WIDTH = 105;
Mapsicle.Bounds.CONTROLS_HEIGHT = 140;
Mapsicle.Bounds.LOGO_WIDTH = 260;
Mapsicle.Bounds.LOGO_HEIGHT = 35;

/**
 * @namespace various helper functions
 *
 * @private
 */
Mapsicle.Utils = {};

Mapsicle.Utils.createDiv = function (className) {
  var div = document.createElement('div');
  div.className = className;
  return div;
};

Mapsicle.Utils.registerEvent = function (element, event, func) {
  if (element.addEventListener) {
    element.addEventListener(event, func, false);
  } else if (element.attachEvent) {
    element.attachEvent('on' + event, func);    
  } else {
    throw "No way to register events!";
  }
};
  
Mapsicle.Utils.createSpan = function (className) {
  var span = document.createElement('span');
  span.className = className;
  return span;
};

Mapsicle.Utils.map = function (collection, transform) {
  var retval;

  if (collection instanceof Array) {
    retval = [];
  } else {
    retval = {};
  }
  for (var i in collection) {
    if (collection.hasOwnProperty(i)) {
      retval[i] = transform(collection[i]);
    }
  }
};

Mapsicle.Utils.each = function (collection, fn) {
  for (var i in collection) {
    if (collection.hasOwnProperty(i)) {
      fn(collection[i]);
    }
  }
};

/**
 * convert radians to degrees
 *
 * @private
 */
Mapsicle.Utils.rad2Deg = function (rads) {
  return rads * (180 / Math.PI);
};

Mapsicle.Utils.findBearing = function (src, dest) {
  var dlat, dlong, angleRads, bearing;

  dlat = dest.lat() - src.lat();
  dlong = dest.lng() - src.lng();

  angleRads = Math.atan2(dlat, dlong);
  bearing = 90 - Mapsicle.Utils.rad2Deg(angleRads);

  bearing %= 360;
  return bearing;
};

/**
 * Calculate modulus but put negative numbers in positive range.
 */
Mapsicle.Utils.newMod = function (num, modulus) {
  return ((num % modulus) + modulus) % modulus;
};

// TODO: change size when zoomed?
Mapsicle.Utils.calculateScalingFactor = function (minimumScale, standardDistance, actualDistance) {
  var distanceRatio = standardDistance / actualDistance;

  if (!isFinite(distanceRatio)) {
    return 1;
  } else if (distanceRatio > 1) {
    return 1;
  } else if (distanceRatio < minimumScale) {
    return minimumScale;
  } else {
    return distanceRatio;
  }
};

Mapsicle.Utils.deleteFromArray = function (obj, array, destructor) {
  var idx;

  if (Mapsicle.Utils.nonexistent(obj)) {
    idx = -1;
  } else if (obj instanceof Number) {
    idx = obj;
  } else {
    idx = -1;
    for (var i in array) {
      if (obj === array[i]) {
        idx = i;
      }
    }
  }

  if (idx >= 0 && idx < array.length) {
    destructor(array[idx]);
    array.splice(idx, 1);
  }
};

Mapsicle.Utils.nonexistent = function (value) {
  return (value === undefined || value === null);
};

// TODO: something at all better?
/**
 * @class keep track of how many label heights are stacked in the way of each level
 *
 * @private
 */
Mapsicle.OffsetSequence = function (start) {
  this.start = start;
  this.items = [];
};

Mapsicle.OffsetSequence.prototype = {
  addItem: function (loc, width) {
    for (var i = 0; i < this.items.length; ++i) {
      if (loc > this.items[i]) {
        this.items[i] = loc + width;
        return i;
      }
    }
    this.items.push(loc + width);
    return this.items.length - 1;
  }
};

Mapsicle.OffsetSequence.sign = function (number) {
  if (number < 0) {
    return -1;
  }
  return 1;
};

/**
 * @class Mapsicle.PageElements
 *
 * @private
 */
Mapsicle.PageElements = function (theMapsicle, container, uid) {
  var prefix = 'mapsicle-' + uid.toString();
  this.panelId = prefix + '-panel';
  this.svcId = prefix + '-streetview';
  this.labelsId = prefix + '-labels';
  this.curtainId = prefix + "-curtain";

  this.container = container;
  this.panel = document.createElement('div');
  this.panel.id = this.panelId;
  this.panel.className += " mapsicle-panel";
  this.container.appendChild(this.panel);

  this.svc = document.createElement('div');
  this.svc.setAttribute('id', this.svcId);
  this.svc.innerHTML = "<h2>Setting up...</h2>";
  this.svc.className += " mapsicle-streetview";
  this.panel.appendChild(this.svc);

  this.curtain = document.createElement('div');
  this.curtain.setAttribute('id', this.curtainId);
  this.curtain.className += " mapsicle-curtain";
  this.curtain.style.position = 'absolute';
  this.curtain.style.top = '0px';
  this.curtain.style.left = '0px';
  this.curtain.style.right = '0px';
  this.curtain.style.bottom = '0px';
  this.curtain.style.backgroundColor = 'white';
  this.curtain.style.zIndex = Mapsicle.ZIndices.MESSAGE.toString();
  this.curtain.style.visibility = 'hidden';
  this.panel.appendChild(this.curtain);

  this.labels = document.createElement('div');
  this.labels.setAttribute('id', this.labelsId);
  this.labels.className += " mapsicle-labels";
  this.panel.appendChild(this.labels);
};

Mapsicle.PageElements.prototype = {
  panel: null,
  svc: null,
  labels: null,

  panelId: '',
  svcId: '',
  labelsId: '',

  panelX: 0,       // Top left corner of streetpanel
  panelY: 0,
  container: null, // Element given by user

  updatePanelXY: function () {
    var streetPanelXY = this.findPos(this.svc);
    this.panelX = streetPanelXY[0];
    this.panelY = streetPanelXY[1];
  },

  listenForResize: function (theMapsicle) {
    var onResize = function (e) {
      theMapsicle.panoramaResized();
    };

    Mapsicle.Utils.registerEvent(window, 'resize', onResize);
    Mapsicle.Utils.registerEvent(document, 'resize', onResize);
    Mapsicle.Utils.registerEvent(this.svc, 'resize', onResize);
  },

  // Thanks to http://www.quirksmode.org/js/findpos.html
  findPos: function (obj) {
    var curleft = 0;
    var curtop = 0;
    if (obj.offsetParent) {
      do {
        curleft += obj.offsetLeft;
        curtop += obj.offsetTop;
      } while ((obj = obj.offsetParent)); // yes, that's supposed to be assignment
      return [curleft, curtop];
    } else {
      return [obj.offsetLeft, obj.offsetTop];
    }
  },

  setAllContainerSizes: function (x, y) {
    function setContainerSizes(container, sizeX, sizeY) {
      container.style.width = Math.ceil(sizeX).toString() + 'px';
      container.style.height = Math.ceil(sizeY).toString() + 'px';
    }

    setContainerSizes(this.panel, x, y);
    setContainerSizes(this.svc, x, y);
    setContainerSizes(this.curtain, x, y);
  }
};

/**
 * @class handle displaying, moving, opacitising etc. of overlays
 *
 * @private
 */
Mapsicle.OverlayDisplayManager = function (mapsicle) {
  this.mapsicle = mapsicle;
};

Mapsicle.OverlayDisplayManager.prototype = {
  staticOverlays: [],
  trackingOverlays: [],
  timeout: null, // ID of setTimeout for fading

  proximityMode: false, /* Whether we are currently doing proximity-fade */
  finishFading: false,
  focusChangeFunction: null,
  focusChangeTimeout: null,
  currentDisplayMode: Mapsicle.OverlayDisplayMode.UNSTARTED,

  seq: null,

  movementMode: Mapsicle.OverlayDisplayMode.HIDDEN,
  pauseMode: Mapsicle.OverlayDisplayMode.SOLID,

  hideAllOverlays: function () {
    this.mapsicle.elems.labels.style.visibility = "hidden";
  },

  unHideAllOverlays: function () {
    this.mapsicle.elems.labels.style.visibility = "visible";
  },

  startMotion: function () {
    this.updateAll(this.movementMode);
  },

  stopMotion: function () {
    this.updateAll(this.pauseMode);
  },

  updateAll: function (newMode) {
    var mode = newMode || this.currentDisplayMode;

    if (this.mapsicle.up) {
      this.displayMode(Mapsicle.OverlayDisplayMode.HIDDEN);
      this.refreshTrackingOverlays();
      GEvent.trigger(this.mapsicle, "mapsicle_pov_changed", this.mapsicle);
      this.displayMode(mode);
    }
  },

  refreshTrackingOverlays: function () {
    this.seq = new Mapsicle.OffsetSequence(-10000);
    var mapsicle = this.mapsicle;

    Mapsicle.Utils.each(this.trackingOverlays, function (t) {
      t.updatePos(mapsicle);
    });
    this.seq = null;
  },

  onPOVChange: function () {
    this.updateAll();
  },

  onPOVZoomChange: function () {
    this.stopMotion();
  },

  setAllOpacities: function (opac) {
    Mapsicle.Utils.each(this.trackingOverlays, function (t) {
      t.setOpacity(opac);
    });
  },

  displayMode: function (mode) {
    this.currentDisplayMode = mode;

    var overlayMgr = this;
    var config = this.mapsicle.config;

    this.finishFading = false;
    this.proximityMode = false;

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.mapsicle.elems.panel.onmousemove = "";

    switch (mode) {

    case Mapsicle.OverlayDisplayMode.TRACK:
      this.unHideAllOverlays();
      this.setAllOpacities(config.defaultOpacity);
      this.mapsicle.elems.panel.mousemove = function (e) {
        overlayMgr.updateAll(Mapsicle.OverlayDisplayMode.TRACK);
      };
      break;

    case Mapsicle.OverlayDisplayMode.FADE_TO_HIDDEN:
      this.finishFading = true;
      this.fadeAll(function () {
        if (this.finishFading) {
          this.displayMode(Mapsicle.OverlayDisplayMode.movementMode);
        }
      });
      break;

    case Mapsicle.OverlayDisplayMode.SOLID:
      this.unHideAllOverlays();
      break;

    case Mapsicle.OverlayDisplayMode.HIDDEN:
      this.hideAllOverlays();
      break;

    default:
      this.hideAllOverlays();
      break;
    }
  }
};

/**
 * @namespace do various things required on startup shared between Mapsicle instances (stylesheet, javascript dependencies, etc.)
 *
 * @private
 */
Mapsicle.Startup = {};

Mapsicle.Startup.start = function () {
  var findScriptPath = function () {
    var scripts = document.getElementsByTagName('script');
    
    for (var i = 0; i < scripts.length; ++i) {
      var path = scripts[i].getAttribute('src');
      if (path) {
        var matchData = path.match(/mapsicle(_packed)?.js/);
        if (matchData) {
          return path.split(matchData[0])[0];
        }
      }
    }
      
    var msg = "Couldn't find the mapsicle script within the page: you need to include Mapsicle in a file called 'mapsicle.js' or 'mapsicle_packed.js'";
    GLog.write(msg);
    throw new Error(msg);
  };
  
  Mapsicle.Startup.addStyleSheet(findScriptPath());
  Mapsicle.Startup.addUnloadHandler();
};

Mapsicle.Startup.addStyleSheet = function (path) {
  // TODO: just add styles via javascript
  var cssLink = document.createElement("link");
  cssLink.href = path + "mapsicle.css";
  cssLink.media = "screen";
  cssLink.rel = "stylesheet";
  cssLink.type = "text/css";
  var head = document.getElementsByTagName("head")[0];
  head.appendChild(cssLink);
};

Mapsicle.Startup.addUnloadHandler = function () {
  if (window.addEventListener) {
    // FIXME is this needed in browsers that have addEventListener?
    window.addEventListener("unload", GUnload, false);
  } else if (window.attachEvent) {
    window.attachEvent("onunload", GUnload);
  }
};

Mapsicle.Startup.start();
/* ( end of mapsicle.js ) */
