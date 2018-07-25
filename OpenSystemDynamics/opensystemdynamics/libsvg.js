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
		let d = `M${this.x1},${this.y1} C${this.x2},${this.y2} ${this.x3},${this.y3} ${this.x4},${this.y4}`;
		// Make path go back on itself so it does not create an area
		d += `C ${this.x3},${this.y3} ${this.x2},${this.y2} ${this.x1},${this.y1}`;
		this.setAttribute("d",d);
	};
	newElement.update();
	svgplane.appendChild(newElement);
	return newElement;
}

function svg_path(dstring,stroke,fill , markclass, extraAttributes = null) {
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

	if(extraAttributes) {
		for(var key in extraAttributes) {
			newElement.setAttribute(key, extraAttributes[key]); //Set path's data
		}
	}
	
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
function svg_foreignobject(x, y, width, height, innerHTML, fill="white") {
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
	scrollDiv.setAttribute(`style`, `background-color: ${fill}; overflow: scroll`);
	scrollDiv.setAttribute("class","scrollDiv");

	// This div is on the inside of the scroll div and reacts to things such as clicks
	let innerDiv = document.createElement("div");
	innerDiv.setAttribute(`style`, `width: 100%; height: 100%; overflow: visible; background-color: ${fill}`);
	innerDiv.setAttribute("class","innerDiv");
	
	// This div is where we put the content
	let contentDiv = document.createElement("div");
	contentDiv.innerHTML=innerHTML;
	contentDiv.setAttribute(`style`, `overflow: visible; background-color: ${fill}`);
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
function svg_circle(cx, cy, r, stroke, fill, markclass, extraAttributes) {
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'circle'); // Create a path in SVG's namespace
	newElement.setAttribute("class",markclass); // Set path's data
	newElement.setAttribute("cx",cx); // Set path's data
	newElement.setAttribute("cy",cy); // Set path's data
	newElement.setAttribute("r",r); // Set path's data
	newElement.setAttribute("fill",fill);
	newElement.setAttribute("stroke",stroke);
	newElement.setAttribute("data-attr","selected");

	if (extraAttributes) {
		for(var key in extraAttributes) {
			newElement.setAttribute(key, extraAttributes[key]);
		}
	}

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

function svgArrowHead(stroke, fill, directionVector, extraAttributes = null) {
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	newElement.setAttribute("stroke", stroke);
	newElement.setAttribute("fill", fill);
	this.pointsA = [[0,0], [10,10]]; // Arbitrary start points

	if (extraAttributes) {
		for(var key in extraAttributes) {
			newElement.setAttribute(key, extraAttributes[key]);
		}
	}

	newElement.setPos = function (pos, directionVector=[1,0]) {
		let points = [[12, -2],[12, -6], [0,0], [12, 6],[12, 2]];
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

function svgWidePath(width, color, extraAttributes) {
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	newElement.points = [];
	newElement.setAttribute("stroke", color);
	newElement.setAttribute("fill", "transparent");
	newElement.setAttribute("stroke-width", width.toString());
	
	// Is set last so it can override default attributes
	if(extraAttributes) {
		for(var key in extraAttributes) {
			newElement.setAttribute(key, extraAttributes[key]); //Set path's data
		}
	}

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

function svgCloud(stroke, fill, extraAttributes) {
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	newElement.setAttribute("stroke", stroke);
	newElement.setAttribute("stroke-width", "1");
	newElement.setAttribute("fill", fill);
	newElement.setAttribute("d", "m -0.8447564,-11.14014 c -4.6214865,0.0079 -8.5150638,3.4528784 -9.0815386,8.0394981 -2.433142,0.4797384 -4.187489,2.61298232 -4.188373,5.0929775 -6.93e-4,2.8681392 2.323935,5.1936858 5.1920483,5.1941646 H 7.671332 C 11.368943,7.1872852 14.36665,4.1896043 14.365861,0.49198425 14.223787,-3.916487 10.814437,-6.550028 7.2876342,-6.1810461 5.7167742,-9.2242012 2.5799338,-11.137323 -0.84475524,-11.140887 Z");
	newElement.visibility = true;
	newElement.pos = [0, 0];
	newElement.defaultStroke = stroke;
	newElement.defaultFill = fill;

	// Is set last so it can override default attributes
	if(extraAttributes) {
		for(var key in extraAttributes) {
			newElement.setAttribute(key, extraAttributes[key]); //Set path's data
		}
	}

	newElement.setPos = function (pos, adjecentPos) {
		let offset = [0,0];
		switch (neswDirection(adjecentPos, pos)) {
			case "north":
				offset = [0, 11];	
				break;
			case "east":
				offset = [14, -1];
				break;
			case "south":
				offset = [0, -7];
				break;
			default: // west
				offset = [-14, 0];	
				break;
		}
		this.pos = translate(pos, offset);
	}
	
	newElement.update = function () {
		this.setAttribute("transform","translate("+this.pos[0]+","+this.pos[1]+")");
	}

	newElement.setVisibility = function (isVisible) {
		this.visible = isVisible;
		if (this.visible) {
			this.setAttribute("visibility", "visible");
		} else {
			this.setAttribute("visibility", "hidden");
		} 
	}
	
	svgplane.appendChild(newElement);
	return newElement;
}

function svgGhost(stroke, fill, markclass) {
	let newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	newElement.setAttribute("stroke", stroke);
	newElement.setAttribute("fill", fill);
	newElement.setAttribute("stroke-width", "1");
	newElement.setAttribute("d", "m 6.8787701,-1.172115 c 0,0.94923948 0.1554403,8.1989876 -0.1943007,9.0150008 C 6.3347285,8.6644488 4.9635227,5.8111805 4.3473135,6.4329047 3.7255523,7.0546289 3.5034948,7.6319441 2.6818813,7.9816633 1.8602682,8.3258325 0.96093505,6.3884958 0.0116386,6.3884958 c -0.94929616,0 -1.8486295,1.9373367 -2.6702428,1.5931675 C -3.4802173,7.6319441 -3.6245546,7.3543882 -4.2463158,6.7326641 -4.8680773,6.1109399 -6.3614144,8.6922061 -6.7111551,7.870641 -7.0553443,7.0490771 -6.8554926,-0.22287552 -6.8554926,-1.172115 c 0,-3.7858565 3.0754975,-6.8611709 6.8671312,-6.8611709 3.7916334,0 6.8671315,3.0753144 6.8671315,6.8611709 z");

	newElement.setAttribute("class", markclass);
	
	return newElement;
}

function svgQuestionmark(color) {
	// svg_text(x, y, text, markclass, extra_attributes) 
	let newElement = svg_text(0, 6, "?", "questionmark", {"style": `fill: ${color}; font-size: 18px;`});
	return newElement;
}

function svgIcons(stroke, fill, markclass) {
	let newElement = svg_group([
		svgGhost(stroke, fill, "ghost"), 
		svgQuestionmark(stroke)
	]);
	newElement.setAttribute("class", markclass);
	newElement.ghost = newElement.children[0];
	newElement.questionmark = newElement.children[1];
	

	for (let child of newElement.children) {
		child.setAttribute("visibility", "hidden");
	}
	
	newElement.setColor = function (color) {
		this.ghost.setAttribute("stroke", color);
		this.questionmark.setAttribute("style", `fill: ${color}`);
	}

	newElement.setState = function (state) {
		if (state == "none") {
			this.ghost.setAttribute("visibility", "hidden");
			this.questionmark.setAttribute("visibility", "hidden");
		} else if (state == "ghost") {
			this.ghost.setAttribute("visibility", "visible");
			this.questionmark.setAttribute("visibility", "hidden")
		} else if (state == "questionmark") {
			this.ghost.setAttribute("visibility", "hidden");
			this.questionmark.setAttribute("visibility", "visible")
		}
	}
	return newElement;
}