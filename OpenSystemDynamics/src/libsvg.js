/*

This file may distributed and/or modified under the
terms of the Affero General Public License (http://www.gnu.org/licenses/agpl-3.0.html).

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
function svg_rect(x, y, width, height, stroke, fill, markclass, extraAttributes) {
	//<rect width="300" height="100" style="fill:rgb(0,0,255);stroke-width:3;stroke:rgb(0,0,0)" />
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect'); // Create a path in SVG's namespace
	newElement.setAttribute("class",markclass); // Set path's data
	newElement.setAttribute("x", x); // Set path's data
	newElement.setAttribute("y", y); // Set path's data	
	newElement.setAttribute("width", width); // Set path's data
	newElement.setAttribute("height", height); // Set path's data
	newElement.setAttribute("fill", fill);
	newElement.setAttribute("stroke", stroke);

	if (extraAttributes) {
		for(var key in extraAttributes) {
			newElement.setAttribute(key, extraAttributes[key]);
		}
	}

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


function svgEllipse(cx, cy, rx, ry, stroke, fill, markclass, extraAttributes) {
	let newElement = document.createElementNS("http://www.w3.org/2000/svg", 'ellipse');

	newElement.setAttribute("class", markclass);
	newElement.setAttribute("cx", cx);
	newElement.setAttribute("cy", cy);
	newElement.setAttribute("rx", rx);
	newElement.setAttribute("ry", ry);
	newElement.setAttribute("fill", fill);
	newElement.setAttribute("stroke", stroke);
	newElement.setAttribute("data-attr", "selected");
	
	if (extraAttributes) {
		for (let key in extraAttributes) {
			newElement.setAttribute(key, extraAttributes[key]);
			
		}
	}

	svgplane.appendChild(newElement);
	return newElement;
}

// Drawing primitive for drawing svg circles
function svg_line(x1, y1, x2, y2, stroke, fill,markclass,extra_attributes) {
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'line'); //Create a path in SVG's namespace
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

function svgArrowHead(stroke, fill, extraAttributes = null) {
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
	newElement.setAttribute("d", "m 9.9828659,-2.772745 c 0,1.3775907 0.2255841,11.8988413 -0.2819803,13.083087 C 9.1933216,11.50264 7.203349,7.3618143 6.3090708,8.2640961 5.4067353,9.1663779 5.0844728,10.004211 3.8921001,10.511744 2.699728,11.011221 1.3945641,8.1996473 0.01689062,8.1996473 -1.3607825,8.1996473 -2.6659466,11.011221 -3.858319,10.511744 -5.050691,10.004211 -5.2601616,9.6014057 -6.1624971,8.6991239 -7.0648332,7.7968422 -9.2320496,11.542923 -9.7396135,10.350622 -10.239121,9.1583207 -9.9490844,-1.3951543 -9.9490844,-2.772745 c 0,-5.4942523 4.4633386,-9.957325 9.96597502,-9.957325 5.50263598,0 9.96597528,4.4630727 9.96597528,9.957325 z");

	newElement.setAttribute("class", markclass);
	
	return newElement;
}

function svgDice(stroke, fill, markclass) {
	let newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	newElement.setAttribute("stroke", stroke);
	newElement.setAttribute("fill", fill);
	newElement.setAttribute("stroke-width", "1");
	newElement.setAttribute("d", "m -3.5463331,-9.2427435 -4.2426784,4.7879684 V 6.5315532 l 12.8085634,0.6925413 2.4411505,-6.1592462 0.052919,-9.52762 z m 0.2231778,0.4831683 10.0499019,0.6626308 -2.1719568,3.7180958 -11.338351,-0.441754 z m 5.8900524,1.0284584 a 1.4725126,0.6828872 0 0 0 -1.4725131,0.683338 1.4725126,0.6828872 0 0 0 1.4725131,0.6810374 1.4725126,0.6828872 0 0 0 1.4725131,-0.6810374 1.4725126,0.6828872 0 0 0 -1.4725131,-0.683338 z m -5.5265258,0.8535974 a 1.4725126,0.72416619 0 0 0 -1.472513,0.7247526 1.4725126,0.72416619 0 0 0 1.472513,0.7247525 1.4725126,0.72416619 0 0 0 1.4725131,-0.7247525 1.4725126,0.72416619 0 0 0 -1.4725131,-0.7247526 z m -4.2288736,2.645922 11.5868376,0.43025 -0.073626,10.491656 -11.4763991,-0.6879398 z m 2.9450262,1.4357003 a 1.472513,1.472513 0 0 0 -1.4725131,1.4725131 1.472513,1.472513 0 0 0 1.4725131,1.47251311 1.472513,1.472513 0 0 0 1.4725132,-1.47251311 1.472513,1.472513 0 0 0 -1.4725132,-1.4725131 z m 5.22742159,0.1840641 a 1.4725131,1.4725131 0 0 0 -1.35747298,0.8973128 1.4725131,1.4725131 0 0 0 -0.0506177,0.1403489 1.4725131,1.4725131 0 0 0 -0.0644225,0.4348514 A 1.4725131,1.4725131 0 0 0 0.98394549,0.33319327 1.4725131,1.4725131 0 0 0 2.4564586,-1.1393199 1.4725131,1.4725131 0 0 0 0.98394549,-2.611833 Z M -4.0225991,1.8425192 a 1.4725126,1.4725126 0 0 0 -1.4725131,1.4725132 1.4725126,1.4725126 0 0 0 1.4725131,1.4725131 1.4725126,1.4725126 0 0 0 1.472513,-1.4725131 1.4725126,1.4725126 0 0 0 -1.472513,-1.4725132 z m 4.93291896,0.2576899 a 1.472513,1.472513 0 0 0 -1.47251311,1.472513 1.472513,1.472513 0 0 0 0.522282,1.1250922 1.472513,1.472513 0 0 0 0.11734089,0.089731 A 1.472513,1.472513 0 0 0 0.91031986,5.0452349 1.472513,1.472513 0 0 0 2.3828329,3.5727221 1.472513,1.472513 0 0 0 0.91031986,2.1002091 Z");
	
	newElement.setAttribute("class", markclass);
	return newElement;
}

function svgQuestionmark(color) {
	// svg_text(x, y, text, markclass, extra_attributes) 
	let newElement = svg_text(0, 6, "?", "questionmark", {"font-size": "18px", "font-weight": "bold"});
	// newElement.setAttribute("font-weight", "bold");
	return newElement;
}

function svgIcons(stroke, fill, markclass) {
	let newElement = svg_group([
		svgGhost(stroke, fill, "ghost"), 
		svgQuestionmark(stroke),
		svgDice(fill, stroke)
	]);
	newElement.setAttribute("class", markclass);
	newElement.elements = {
		"ghost": newElement.children[0],
		"questionmark": newElement.children[1],
		"dice": newElement.children[2]
	};

	for (let child of newElement.children) {
		child.setAttribute("visibility", "hidden");
	}
	
	newElement.setColor = function (color) {
		this.elements["ghost"].setAttribute("stroke", color);
		this.elements["questionmark"].setAttribute("style", `fill: ${color}`);
		this.elements["dice"].setAttribute("style", `fill: ${color}` );
	}

	newElement.set = function (icon, visibility) {
		this.elements[icon].setAttribute("visibility", visibility);
	}
	return newElement;
}