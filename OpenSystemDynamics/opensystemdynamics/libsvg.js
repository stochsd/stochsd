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
	var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'circle'); //Create a path in SVG's namespace
	newElement.setAttribute("class",markclass); //Set path's data
	newElement.setAttribute("cx",cx); //Set path's data
	newElement.setAttribute("cy",cy); //Set path's data
	newElement.setAttribute("r",r); //Set path's data
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
	newElement.setAttribute("class",markclass); //Set path's data
	newElement.setAttribute("x1",x1); //Set path's data
	newElement.setAttribute("y1",y1); //Set path's data
	newElement.setAttribute("x2",x2); //Set path's data
	newElement.setAttribute("y2",y2); //Set path's data
	newElement.setAttribute("fill",fill);
	newElement.setAttribute("stroke",stroke);
	newElement.setAttribute("data-attr","selected");
	newElement.setAttribute("stroke-width","1");
	
	// Is set last so it can override default attributes
	if(extra_attributes!=undefined) {
		for(var key in extra_attributes) {
			newElement.setAttribute(key,extra_attributes[key]); //Set path's data
		}
	}
	
	svgplane.appendChild(newElement);
	return newElement;
}
