/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/

function svg_from_string_with_group(instring) {
	  var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'g'); //Create a path in SVG's namespace
	  newElement.innerHTML=instring;
	  svgplane.appendChild(newElement);
	  return newElement;
}

function svg_from_string(instring) {
	  var container = document.createElementNS("http://www.w3.org/2000/svg", 'temp'); //Create a path in SVG's namespace
	  container.innerHTML=instring;
	  newElement=container.children[0];
	  svgplane.appendChild(newElement);
	  return newElement;
}

function svg_image(x,y,width,height,image_file) {
	// Does no work because image does not load byt XML object is created
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'image'); //Create a path in SVG's namespace
	newElement.setAttribute("x",x);
	newElement.setAttribute("y",y);
	newElement.setAttribute("width",width);
	newElement.setAttribute("height",height);
	newElement.setAttribute("xlink:href",image_file);
	svgplane.appendChild(newElement);
	return newElement;
}

//   Make a group
function svg_group(elementArray,transform=null,markclass=null) {
	//<rect width="300" height="100" style="fill:rgb(0,0,255);stroke-width:3;stroke:rgb(0,0,0)" />
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'g'); //Create a path in SVG's namespace
	for(i=0;i<elementArray.length;i++) {
		newElement.appendChild(elementArray[i]);
	}
	if(transform!=null) {
		newElement.setAttribute("transform",transform);
	}
	if(markclass!=null) {
		newElement.setAttribute("class",markclass);
	}
	svgplane.appendChild(newElement);
	return newElement;
}

function svg_translate(element,x,y) {
	element.setAttribute("transform","translate("+x+","+y+") rotate(0)");
}

function svg_transform(element,x,y,r,s) {
	element.setAttribute("transform",svg_transform_string(x,y,r,s));
}

function svg_transform_string(x,y,r,s) {
	return "translate("+x+","+y+") rotate("+r+") scale("+s+")";
}

function svg_curve(x1,y1,x2,y2,x3,y3,x4,y4,extra_attributes=null) {
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path'); //Create a path in SVG's namespace
	//var d="M"+x1+","+y1+" Q"+x2+","+x2+" "+x3+","+y3+" "+x4+","+y4;
	//newElement.setAttribute("d",d);
	newElement.setAttribute("stroke","black");
	newElement.setAttribute("fill","transparent");
	newElement.x1=x1;
	newElement.y1=y1;
	newElement.x2=x2;
	newElement.y2=y2;
	newElement.x3=x3;
	newElement.y3=y3;
	newElement.x4=x4;
	newElement.y4=y4;
	
	// Is set last so it can override default attributes
	if(extra_attributes) {
		for(var key in extra_attributes) {
			newElement.setAttribute(key,extra_attributes[key]); //Set path's data
		}
	}
	
	newElement.update=function() {
		var d="M"+this.x1+","+this.y1+" C"+this.x2+","+this.y2+" "+this.x3+","+this.y3+" "+this.x4+","+this.y4;
		this.setAttribute("d",d);
	};
	newElement.update();
	svgplane.appendChild(newElement);
	return newElement;
}

function svg_path(dstring,stroke,fill , markclass) {
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path'); //Create a path in SVG's namespace
	newElement.setAttribute("class",markclass); //Set path's data
	newElement.setAttribute("stroke","black");
	newElement.setAttribute("fill","transparent");
	newElement.dstring=dstring;
	newElement.setAttribute("fill",fill);
	newElement.setAttribute("stroke",stroke);
	newElement.update=function() {
		this.setAttribute("d",this.dstring);
	};
	newElement.update();
	svgplane.appendChild(newElement);
	return newElement;
}

// Drawing primitive for drawing svg rects
function svg_text(x, y, text, markclass, extra_attributes) {
	
	/* example
	 * 	<text class="svgtext" x="400" y="35" font-family="Verdana" font-size="35">
    		Hello, out there
		</text>
	*/
	//<rect width="300" height="100" style="fill:rgb(0,0,255);stroke-width:3;stroke:rgb(0,0,0)" />
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'text'); // Create a path in SVG's namespace
	newElement.setAttribute("class",markclass); // Set path's data
	newElement.setAttribute("x", x); // Set path's data
	newElement.setAttribute("y", y); // Set path's data
	newElement.innerHTML = text;
	newElement.setAttribute("text-anchor", "middle");
	newElement.setAttribute("style", "font-size: "+Settings.primitiveFontSize+"px");
	
	// Is set last so it can override default attributes
	if(extra_attributes != undefined) {
		for(var key in extra_attributes) {
			newElement.setAttribute(key, extra_attributes[key]); // Set path's data
		}
	}
	svgplane.appendChild(newElement);
	return newElement;
}

// Drawing primitive for drawing svg rects
function svg_rect(x, y, width, height, stroke, fill, markclass) {
	//<rect width="300" height="100" style="fill:rgb(0,0,255);stroke-width:3;stroke:rgb(0,0,0)" />
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect'); // Create a path in SVG's namespace
	newElement.setAttribute("class",markclass); // Set path's data
	newElement.setAttribute("x", x); // Set path's data
	newElement.setAttribute("y", y); // Set path's data	
	newElement.setAttribute("width", width); // Set path's data
	newElement.setAttribute("height", height); // Set path's data
	newElement.setAttribute("fill", fill);
	newElement.setAttribute("stroke", stroke);
	svgplane.appendChild(newElement);
	return newElement;
}

// Drawing primitive for drawing svg rects
function svg_foreignobject(x, y, width, height, innerHTML) {
	//<rect width="300" height="100" style="fill:rgb(0,0,255);stroke-width:3;stroke:rgb(0,0,0)" />
	// foreignObject tag must be cammel case to work which is wierd
	
	// Using a tag on top might be better http://stackoverflow.com/questions/6538918/can-i-embed-html-into-an-html5-svg-fragment
	let newElement = document.createElementNS("http://www.w3.org/2000/svg", 'foreignObject'); //Create a path in SVG's namespace

	let cutDiv = document.createElement("div");
	// This div is nessecary to avoid overflow in some browsers
	cutDiv.setAttribute("style","overflow: hidden");
	cutDiv.setAttribute("class","cutDiv");

	// This div holds the scrolling and sets the background color
	let scrollDiv = document.createElement("div");
	scrollDiv.setAttribute("style","background-color: white; overflow: scroll");
	scrollDiv.setAttribute("class","scrollDiv");

	// This div is on the inside of the scroll div and reacts to things such as clicks
	let innerDiv = document.createElement("div");
	innerDiv.setAttribute("style","width: 100%; height: 100%; overflow: visible;background-color: white");
	innerDiv.setAttribute("class","innerDiv");
	
	// This div is where we put the content
	let contentDiv = document.createElement("div");
	contentDiv.innerHTML=innerHTML;
	contentDiv.setAttribute("style","overflow: visible;background-color: hite");
	contentDiv.setAttribute("class","contentDiv");
	
	innerDiv.appendChild(contentDiv);
	scrollDiv.appendChild(innerDiv);
	cutDiv.appendChild(scrollDiv);
	newElement.appendChild(cutDiv);
	
	newElement.contentDiv = contentDiv;
	newElement.scrollDiv = scrollDiv;
	newElement.innerDiv = innerDiv;
		
	newElement.setAttribute("x",x); //Set path's data
	newElement.setAttribute("y",y); //Set path's data	
	newElement.setAttribute("width",width); //Set path's data
	newElement.setAttribute("height",height); //Set path's data
	svgplane.appendChild(newElement);
	return newElement;
}

// Drawing primitive for drawing svg circles
function svg_circle(cx, cy, r, stroke, fill,markclass) {
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'circle'); // Create a path in SVG's namespace
	newElement.setAttribute("class",markclass); // Set path's data
	newElement.setAttribute("cx",cx); // Set path's data
	newElement.setAttribute("cy",cy); // Set path's data
	newElement.setAttribute("r",r); // Set path's data
	newElement.setAttribute("fill",fill);
	newElement.setAttribute("stroke",stroke);
	newElement.setAttribute("data-attr","selected");
	svgplane.appendChild(newElement);
	return newElement;
}

// Drawing primitive for drawing svg circles
function svg_line(x1, y1, x2, y2, stroke, fill,markclass,dasharray,extra_attributes) {
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'line'); //Create a path in SVG's namespace
	if(dasharray!=undefined && dasharray!="") {
		newElement.setAttribute("stroke-dasharray",dasharray);
	}
	newElement.setAttribute("class",markclass); // Set path's data
	newElement.setAttribute("x1",x1); // Set path's data
	newElement.setAttribute("y1",y1); // Set path's data
	newElement.setAttribute("x2",x2); // Set path's data
	newElement.setAttribute("y2",y2); // Set path's data
	newElement.setAttribute("fill",fill);
	newElement.setAttribute("stroke",stroke);
	newElement.setAttribute("data-attr","selected");
	newElement.setAttribute("stroke-width","1");
	
	// Is set last so it can override default attributes
	if(extra_attributes!=undefined) {
		for(var key in extra_attributes) {
			newElement.setAttribute(key,extra_attributes[key]); // Set path's data
		}
	}
	
	svgplane.appendChild(newElement);
	return newElement;
}

function svgArrowHead(stroke, directionVector) {
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	newElement.setAttribute("stroke", stroke);
	newElement.setAttribute("fill", "white");
	this.pointsA = [[0,0], [10,10]]; // Arbitrary start points

	newElement.setPos = function (pos, directionVector=[1,0]) {
		let points = [[12, -3],[12, -7], [0,0], [12, 7],[12, 3]];
		let sine = sin([0,0], directionVector);
		let cosine = cos([0,0], directionVector);
		points = rotatePoints(points, sine, cosine);
		points = tranlatePoints(points, pos);
		this.pointsArrow = points;
	};

	newElement.update = function () {
		var points = this.pointsArrow;
		let d = "M"+points[0][0]+","+points[0][1];
		for (i = 1; i < this.pointsArrow.length; i++) {
			d += "L"+points[i][0]+","+points[i][1]+" ";
		}
		// d += "Z";
		this.setAttribute("d", d);
	};

	svgplane.appendChild(newElement);
	return newElement;
}

function svgWidePath(width, color) {
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	newElement.points = [];
	newElement.setAttribute("stroke", color);
	newElement.setAttribute("fill", "transparent");
	newElement.setAttribute("stroke-width", width.toString());
	
	newElement.setPoints = function (points) {
		this.points = points;
	}
	
	newElement.update = function () {
		let points = this.points;
		if (points.length < 1) {return;}
		let d = "M"+points[0][0]+","+points[0][1];
		for (i = 1; i < this.points.length; i++) {
			d += "L"+points[i][0]+","+points[i][1]+" ";
		}
		for (i = this.points.length-2; 0 < i; i-- ) { 	// Draw path back upon itself - Reason: remove area in which to click on
			d += "L"+points[i][0]+","+points[i][1]+" ";
		}
		// d += "Z";
		this.setAttribute("d", d);
	}
	// newElement.update();
	svgplane.appendChild(newElement);
	return newElement;
}

class svgsFlowArrow {
	constructor() {
		this.points = [[0,0],[10,10]]; // path for arrow - (Arbitrary starting values)
		this.outerLine = svgWidePath(7, "black");
		this.innerLine = svgWidePath(5, "white");
		this.arrow = svgArrowHead("black", this.getDirection());
		this.setPoints(points);
	}


	setPoints(points) {
		this.points = points;
		this.outerLine.setPoints(this.shortenLastPoint(12));
		this.innerLine.setPoints(this.shortenLastPoint(11));
		this.arrow.newPos(points[points.length-1], this.getDirection());
	}

	shortenLastPoint(shortenAmount) {
		let points = this.points.slice();
		if (points.length < 2) {
			return points;
		} else {
			let last = points[points.length-1];
			let sndlast = points[points.length-2];
			let sine = sin(last, sndlast);
			let cosine = cos(last, sndlast);
			let newLast = rotate([shortenAmount, 0], sine, cosine);
			newLast = translate(newLast, last);
			points[points.length-1] = newLast;
			return points;
		}
	}

	update() {
		this.outerLine.update();
		this.innerLine.update();
		this.arrow.update();
	}

	getDirection() {
		let len = this.points.length;
		if (len < 2) {
			return [0,0];
		} else {
			let p1 = this.points[len-1];
			let p2 = this.points[len-2];
			return [p2[0]-p1[0], p2[1]-p1[1]];
		}
	} 
}

function svgCloud() {
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	newElement.setAttribute("stroke", "black");
	newElement.setAttribute("stroke-width", "1");
	newElement.setAttribute("fill", "white");
	newElement.setAttribute("d", "m -1.698631,-21.919908 c -8.659549,0.01471 -15.955172,6.469861 -17.016609,15.0640783 -4.55912,0.898914 -7.846344,4.8960976 -7.847997,9.5430092 -0.0013,5.3742001 4.354491,9.7317125 9.728642,9.7326095 H 14.258461 C 21.186891,12.42126 26.803868,6.8043302 26.802389,-0.12411639 26.536181,-8.3845263 20.147881,-13.319146 13.539504,-12.627763 10.596092,-18.3299 4.7184111,-21.914628 -1.6986288,-21.921306 Z");
	this.visibility = true;

	newElement.setPos = function (pos, adjecentPos) {
		let offset = [0,0];
		switch (neswDirection(adjecentPos, pos)) {
			case "north":
				offset = [-1.7, 21.9];	
				break;
			case "east":
				offset = [26.8, 0];
				break;
			case "south":
				offset = [-1.7, -12.4];
				break;
			default: // west
				offset = [-26.6, 3.2];	
				break;
		}
		this.pos = translate(pos, offset);
	}
	
	newElement.update = function () {
		if(this.visible) {
			this.setAttribute("transform","translate("+this.pos[0]+","+this.pos[1]+")");
		} else {
			// setting visibility to "hidden" causes bugs, like clicking on invisible objects
			this.setAttribute("transform","translate("+this.pos[0]+","+this.pos[1]+") scale(0)");
		}
	}

	newElement.setVisibility = function (isVisible) {
		this.visible = isVisible;
	}
	
	svgplane.appendChild(newElement);
	return newElement;
}
