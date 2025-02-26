class SVG {
  /** @type {SVGElement} @Static  */
  static svgElement;
  /** @type {SVGGElement} @static  */
  static stockLayer;
  /** @type {SVGGElement} @static  */
  static variableLayer;
  /** @type {SVGGElement} @static  */
  static constantLayer;
  /** @type {SVGGElement} @static  */
  static converterLayer;
  /** @type {SVGGElement} @static  */
  static flowLayer;
  /** @type {SVGGElement} @static  */
  static linkLayer;
  /** @type {SVGGElement} @static  */
  static plotLayer;
  /** @type {SVGGElement} @static  */
  static anchorLayer;
  static init() {
    SVG.svgElement = document.getElementById("svgplane");
    SVG.stockLayer = SVG.svgElement.querySelector("g.layer.stock");
    SVG.variableLayer = SVG.svgElement.querySelector("g.layer.variable");
		SVG.constantLayer = SVG.svgElement.querySelector("g.layer.constant");
		SVG.converterLayer = SVG.svgElement.querySelector("g.layer.converter");
		SVG.flowLayer = SVG.svgElement.querySelector("g.layer.flow");
		SVG.linkLayer = SVG.svgElement.querySelector("g.layer.link");
		SVG.plotLayer = SVG.svgElement.querySelector("g.layer.plot");
    SVG.anchorLayer = SVG.svgElement.querySelector("g.layer.anchor");
  }

  /**
   * @param {Element} parent 
   * @param {Element} element 
   */
  static append(parent, element) {
    if (!parent || !element) {
      console.trace(parent, element)
    }
    parent.appendChild(element);
    return element;
  }

  static translate(element, x, y) {
    element.setAttribute("transform","translate("+x+","+y+") rotate(0)");
  }
  static transform(element, x, y, r, s) {
    element.setAttribute("transform", "translate("+x+","+y+") rotate("+r+") scale("+s+")");
  }

  /**
   * @param {string} inString 
   * @returns {Element}
   */
	static fromString(inString) {
		var container = document.createElementNS("http://www.w3.org/2000/svg", 'temp'); //Create a path in SVG's namespace
		container.innerHTML = inString;
		const result = container.children[0];
		return result;
	}

  /**
   * Groups multiple elements into an SVG group (`<g>` element).
   * @param {Element[]} elements - The elements to group.
   * @param {string} [transform] - Optional transform attribute for the group.
   * @param {string} [markclass] - Optional class attribute for the group.
   * @returns {SVGGElement} The created group element.
   */
  static group(elements, transform, markclass) {
    const result = document.createElementNS("http://www.w3.org/2000/svg", 'g');
    for (let i = 0; i < elements.length; i++) {
      result.appendChild(elements[i]);
    }
    if (transform) {
      result.setAttribute("transform", transform);
    }
    if (markclass) {
      result.setAttribute("class", markclass);
    }
    return result;
  }

  /** 
   * @typedef {SVGPathElement & 
   *           Record<"x1" | "y1" | "x2" | "y2" | "x3" | "y3" | "x4" | "y4", number> & 
   *           { way: "oneway" | "twoway", 
   *             x1: number, 
   *             y1: number, 
   *             x2: number, 
   *             y2: number, 
   *             x3: number, 
   *             y3: number, 
   *             x4: number, 
   *             y4: number, 
   *             draggable?: boolean, 
   *             update: () => void } 
   * } Curve
   */
  /**
   * Creates a curve path element.
   * @param {"oneway" | "twoway"} way
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {number} x3
   * @param {number} y3
   * @param {number} x4
   * @param {number} y4
   * @param {{ [k: string]: string } | null} [extraAttributes=null]
   * @returns {SVG<Curve>}
   */
  static curve(way, x1, y1, x2, y2, x3, y3, x4, y4, extraAttributes = null) {
    const result = document.createElementNS("http://www.w3.org/2000/svg", 'path')
    result.way = way
    result.x1 = x1
    result.y1 = y1
    result.x2 = x2
    result.y2 = y2
    result.x3 = x3
    result.y3 = y3
    result.x4 = x4
    result.y4 = y4
    result.setAttribute("stroke", "black");
    // fill must be "none" otherwise it may cover up objects behind
    result.setAttribute("fill", result.way == "oneway" ? "none" : "transparent");
    // Is set last so it can override default attributes
    if (extraAttributes) {
      for (var key in extraAttributes) {
        result.setAttribute(key, extraAttributes[key]); //Set path's data
      }
    }

    result.update = () => {
      let d = `M${result.x1},${result.y1} C${result.x2},${result.y2} ${result.x3},${result.y3} ${result.x4},${result.y4}`
      if (result.way == "twoway") {
        // Only twoway should curve should be used as a click object
        d += `C ${result.x3},${result.y3} ${result.x2},${result.y2} ${result.x1},${result.y1}`;
      }
      result.setAttribute("d", d);
    }
    result.update();
    return result
  }
	/** @typedef {SVGPathElement & { update: () => void, dstring: string }} Path  */
  /**
   * Creates a path element.
   * @param {string} dstring
   * @param {string} stroke
   * @param {string} fill
   * @param {string} markclass
   * @param {{ [k: string]: string } | null} [extraAttributes=null]
   * @returns {Path}
   * @static
   * @example
   * SVG.path("M 0 0 L 100 100", "black", "none", "path")
   */
	static path(dstring, stroke, fill, markclass, extraAttributes = null) {
		const result = document.createElementNS("http://www.w3.org/2000/svg", 'path')
		result.dstring = dstring
		result.setAttribute("class", markclass) //Set path's data
		result.setAttribute("stroke", "black")
		result.setAttribute("fill", "transparent")
		result.setAttribute("fill", fill)
		result.setAttribute("stroke", stroke)

		if (extraAttributes) {
			for (var key in extraAttributes) {
				result.setAttribute(key, extraAttributes[key]) //Set path's data
			}
		}
		result.update = function () {
			result.setAttribute("d", result.dstring)
		}
    result.update()
		return result
	}
  static text(x, y, text, markclass, extraAttributes=null) {
		const result = document.createElementNS("http://www.w3.org/2000/svg", 'text')
		result.setAttribute("class", markclass);
		result.setAttribute("x", `${x}`);
		result.setAttribute("y", `${y}`);
		result.setAttribute("stroke", `none`);
		result.innerHTML = text;
		result.setAttribute("text-anchor", "middle");
		result.setAttribute("font-size", Settings.primitiveFontSize + "px");

		if (extraAttributes != undefined) {
			for (var key in extraAttributes) {
				result.setAttribute(key, extraAttributes[key]);
			}
		}
		return result
	}

   /** 
    * @typedef {SVGGElement & {
	  *   cutDiv: HTMLDivElement;
		*   contentDiv: HTMLDivElement;
		*   scrollDiv: HTMLDivElement;
		*   innerDiv: HTMLDivElement;
		*   setX: (value: number) => void
		*   setY: (value: number) => void
		*   setWidth: (value: number) => void
		*   setHeight: (value: number) => void
    * }} ForeignScrollable 
    */
	static foreignScrollable(x, y, width, height, innerHTML, fill = "white") {
		let result = document.createElementNS("http://www.w3.org/2000/svg", 'g')
		// foreignObject tag must be camel case to work which is weird
		// Using a tag on top might be better http://stackoverflow.com/questions/6538918/can-i-embed-html-into-an-html5-svg-fragment
		let foreign = document.createElementNS("http://www.w3.org/2000/svg", 'foreignObject');
		foreign.setAttribute("style", "width: 100%; height: 100%; pointer-events: none;");

		result.cutDiv = document.createElement("div");
		// This div is nessecary to avoid overflow in some browsers
		result.cutDiv.setAttribute("style", "overflow: hidden; pointer-events: all;");
		result.cutDiv.setAttribute("class", "cutDiv");

		// This div holds the scrolling and sets the background color
		result.scrollDiv = document.createElement("div");
		result.scrollDiv.setAttribute(`style`, `background-color: ${fill}; overflow: auto;`);
		result.scrollDiv.setAttribute("class", "scrollDiv");

		// This div is on the inside of the scroll div and reacts to things such as clicks
		result.innerDiv = document.createElement("div");
		result.innerDiv.setAttribute(`style`, `width: 100%; height: 100%; overflow: visible; background-color: ${fill}`);
		result.innerDiv.setAttribute("class", "innerDiv");

		// This div is where we put the content
		result.contentDiv = document.createElement("div");
		result.contentDiv.innerHTML = innerHTML;
		result.contentDiv.setAttribute(`style`, `overflow: visible; background-color: ${fill}`);
		result.contentDiv.setAttribute("class", "contentDiv");

		result.innerDiv.appendChild(result.contentDiv);
		result.scrollDiv.appendChild(result.innerDiv);
		result.cutDiv.appendChild(result.scrollDiv);
		foreign.appendChild(result.cutDiv);
		result.appendChild(foreign);

		result.setAttribute("x", `${x}`);
		result.setAttribute("y", `${y}`);
		result.setAttribute("width", `${width}`);
		result.setAttribute("height", `${height}`);
    SVG.svgElement.appendChild(result);

		result.setX = function (x) {
			this.cutDiv.style.marginLeft = `${x}px`;
		}
		result.setY = function (y) {
			this.cutDiv.style.marginTop = `${y}px`;
		}
		result.setWidth = function (w) {
			this.cutDiv.style.width = `${w}px`;
		}
		result.setHeight = function (h) {
			this.cutDiv.style.height = `${h}px`;
		}
		return result
	}
  /**
   * @typedef {SVGGElement & {
   *  cutDiv: HTMLDivElement;
   *  contentDiv: HTMLDivElement;
   *  setX: (value: number) => void
   *  setY: (value: number) => void
   *  setWidth: (value: number) => void
   *  setHeight: (value: number) => void
   *  }} Foreign
   */
	static foreign(x, y, width, height, innerHtml, fill = "white") {
		const result = document.createElementNS("http://www.w3.org/2000/svg", 'g')
		// covers entire screen - never moves
		// if foreignObject moves in Chrome then automatic scroll
		let foreign = document.createElementNS("http://www.w3.org/2000/svg", 'foreignObject');
		foreign.setAttribute("style", `height: 100%; width: 100%; pointer-events: none;`);

		result.cutDiv = document.createElement("div");
		result.cutDiv.setAttribute("style", `background: ${fill}; overflow: hidden; pointer-events: all;`);

		result.contentDiv = document.createElement("div");
		result.contentDiv.innerHTML = innerHtml;
		let padding = 8;
		result.contentDiv.setAttribute("style", `
        position: relative; 
        left: ${padding}px; 
        top: ${padding}px; 
        width: calc( 100% - ${2 * padding}px );
        height: calc( 100% - ${2 * padding}px );
      `);
		result.contentDiv.setAttribute("class", "contentDiv");

		result.appendChild(foreign);
		foreign.appendChild(result.cutDiv);
		result.cutDiv.appendChild(result.contentDiv);

		result.cutDiv = result.cutDiv;
		result.contentDiv = result.contentDiv;

		result.setAttribute("x", `${x}`);
		result.setAttribute("y", `${y}`);
		result.setAttribute("width", `${width}`);
		result.setAttribute("height", `${height}`);
    SVG.svgElement.appendChild(result);

		result.setX = function (x) {
			result.cutDiv.style.marginLeft = `${x}px`;
		}
		result.setY = function (y) {
			this.cutDiv.style.marginTop = `${y}px`;
		}
		result.setWidth = function (w) {
			this.cutDiv.style.width = `${w}px`;
		}
		result.setHeight = function (h) {
			this.cutDiv.style.height = `${h}px`;
		}
		return result
	}
  static rect(x, y, width, height, stroke, fill, markclass=null, extraAttributes) {
		const element = document.createElementNS("http://www.w3.org/2000/svg", 'rect'); // Create a path in SVG's namespace
		markclass && element.setAttribute("class", markclass);
		element.setAttribute("x", `${x}`);
		element.setAttribute("y", `${y}`);
		element.setAttribute("width", `${width}`);
		element.setAttribute("height", `${height}`);
		element.setAttribute("fill", fill);
		element.setAttribute("stroke", stroke);

		if (extraAttributes) {
			for (var key in extraAttributes) {
				element.setAttribute(key, extraAttributes[key]);
			}
		}
		return element;
	}
	static circle(cx, cy, r, stroke, fill, markclass=null, extraAttributes=null) {
		const result = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
		result.setAttribute("class", markclass);
		result.setAttribute("cx", `${cx}`);
		result.setAttribute("cy", `${cy}`);
		result.setAttribute("r", `${r}`);
		result.setAttribute("fill", fill);
		result.setAttribute("stroke", stroke);
		result.setAttribute("data-attr", "selected");
		if (extraAttributes) {
			for (var key in extraAttributes) {
				result.setAttribute(key, extraAttributes[key]);
			}
		}
		return result
	}
	static ellipse(cx, cy, rx, ry, stroke, fill, markclass=null, extraAttributes=null) {
		const result = document.createElementNS("http://www.w3.org/2000/svg", 'ellipse');
		result.setAttribute("class", markclass);
		result.setAttribute("cx", `${cx}`);
		result.setAttribute("cy", `${cy}`);
		result.setAttribute("rx", `${rx}`);
		result.setAttribute("ry", `${ry}`);
		result.setAttribute("fill", fill);
		result.setAttribute("stroke", stroke);
		result.setAttribute("data-attr", "selected");
		if (extraAttributes) {
			for (let key in extraAttributes) {
				result.setAttribute(key, extraAttributes[key]);
			}
		}
		return result
	}
	static line(x1, y1, x2, y2, stroke, fill, markclass=null, extraAttributes=null) {
		const result = document.createElementNS("http://www.w3.org/2000/svg", 'line')
		result.setAttribute("class", markclass);
		result.setAttribute("x1", `${x1}`);
		result.setAttribute("y1", `${y1}`);
		result.setAttribute("x2", `${x2}`);
		result.setAttribute("y2", `${y2}`);
		result.setAttribute("fill", fill);
		result.setAttribute("stroke", stroke);
		result.setAttribute("data-attr", "selected");
		result.setAttribute("stroke-width", "1");

		if (extraAttributes != undefined) {
			for (var key in extraAttributes) {
				result.setAttribute(key, extraAttributes[key]);
			}
		}
		return result
	}
  /**
   * @typedef {SVGPathElement & {
   * templateArrowPoints: [number,number][]
   * arrowPoints: [number,number][]
   * setTemplatePoints: (newPoints: [number,number][]) => void
   * setPosition: (pos: [number, number], directionVector?: [number,number]) => void
   * update: () => void
   * }} ArrowHead
   */
  /**
   * 
   * @param {string} stroke
   * @param {string} fill
   * @param {Record<string, string>} [extraAttributes = null]
   * @returns 
   */
	static arrowHead(stroke, fill, extraAttributes = null) {
		const result = document.createElementNS("http://www.w3.org/2000/svg", 'path')
		result.setAttribute("stroke", stroke);
		result.setAttribute("fill", fill);
		result.templateArrowPoints = [[12, -2], [12, -6], [0, 0], [12, 6], [12, 2]]
		result.arrowPoints = [];

		if (extraAttributes) {
			for (var key in extraAttributes) {
				result.setAttribute(key, extraAttributes[key]);
			}
		}

    /**
     * @param {[number,number][]} newPoints 
     */
		result.setTemplatePoints = function (newPoints) {
			this.templateArrowPoints = newPoints;
		}

    /**
     * @param {[number, number]} pos 
     * @param {[number, number]} [directionVector=[1,0]]
     */
		result.setPosition = function (pos, directionVector) {
			const sine = sin([0,0], directionVector);
		  const cosine = cos([0,0], directionVector);
		  this.arrowPoints = rotatePoints(this.templateArrowPoints, sine, cosine);
		  this.arrowPoints = translatePoints(this.arrowPoints, pos);
		};

		result.update = function () {
			let d = "M" + this.arrowPoints[0][0] + "," + this.arrowPoints[0][1];
			for (let i = 1; i < this.arrowPoints.length; i++) {
				d += "L" + this.arrowPoints[i][0] + "," + this.arrowPoints[i][1] + " ";
			}
			// d += "Z";
			this.setAttribute("d", d);
		}
		return result;
	}
  /**
   * @typedef {SVGPathElement & {
   * points: [number, number][]
   * setPoints: (points: [number, number][]) => void
   * update: () => void
   * }} WidePath
   */
  /**
   * @param {number} width
   * @param {string} color
   * @param {Record<string, string>} [extraAttributes=null]
   * @returns {WidePath}
   */
	static widePath(width, color, extraAttributes = null) {
		const result = document.createElementNS("http://www.w3.org/2000/svg", 'path')
		result.points = [];
		result.setAttribute("stroke", color);
		result.setAttribute("fill", "transparent");
		result.setAttribute("stroke-width", width.toString());

		// Is set last so it can override default attributes
		if (extraAttributes) {
			for (var key in extraAttributes) {
				result.setAttribute(key, extraAttributes[key]); //Set path's data
			}
		}
		result.setPoints = function (points) {
			result.points = points;
		}
		result.update = function () {
			let points = result.points;
			if (points.length < 1) { return; }
			let d = "M" + points[0][0] + "," + points[0][1];
			for (let i = 1; i < result.points.length; i++) {
				d += "L" + points[i][0] + "," + points[i][1] + " ";
			}
			for (let i = result.points.length - 2; 0 < i; i--) { 	// Draw path back upon itself - Reason: remove area in which to click on
				d += "L" + points[i][0] + "," + points[i][1] + " ";
			}
			// d += "Z";
			result.setAttribute("d", d);
		}
		return result
	}
  /**
   * @typedef {SVGPathElement & {
   * visible: boolean
   * pos: [number, number]
   * defaultStroke: string
   * defaultFill: string
   * setPosition: (pos: [number, number], adjacentPos: [number, number]) => void
   * update: () => void
   * setVisibility: (isVisible: boolean) => void
   * }} Cloud
   */
  /**
   * @param {string} stroke
   * @param {string} fill
   * @param {Record<string, string>} extraAttributes
   * @returns {Cloud}
   * @static
   */
	static cloud(stroke, fill, extraAttributes = null) {
		const result = document.createElementNS("http://www.w3.org/2000/svg", 'path')
		result.setAttribute("stroke", stroke);
		result.setAttribute("stroke-width", "1");
		result.setAttribute("fill", fill);
		result.setAttribute("d", "m -0.8447564,-11.14014 c -4.6214865,0.0079 -8.5150638,3.4528784 -9.0815386,8.0394981 -2.433142,0.4797384 -4.187489,2.61298232 -4.188373,5.0929775 -6.93e-4,2.8681392 2.323935,5.1936858 5.1920483,5.1941646 H 7.671332 C 11.368943,7.1872852 14.36665,4.1896043 14.365861,0.49198425 14.223787,-3.916487 10.814437,-6.550028 7.2876342,-6.1810461 5.7167742,-9.2242012 2.5799338,-11.137323 -0.84475524,-11.140887 Z");
		result.visible = true;
		result.pos = [0, 0];
		result.defaultStroke = stroke;
		result.defaultFill = fill;

		// Is set last so it can override default attributes
		if (extraAttributes) {
			for (var key in extraAttributes) {
				result.setAttribute(key, extraAttributes[key]); //Set path's data
			}
		}
		result.setPosition = function (pos, adjacentPos) {
			let offset = [0, 0];
			switch (neswDirection(adjacentPos, pos)) {
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

		result.update = function () {
			this.setAttribute("transform", "translate(" + this.pos[0] + "," + this.pos[1] + ")");
		}

		result.setVisibility = function (isVisible) {
			this.visible = isVisible;
			if (this.visible) {
				this.setAttribute("visibility", "visible");
			} else {
				this.setAttribute("visibility", "hidden");
			}
		}
		return result
	}
	static ghost(stroke, fill, markclass = "") {
		let newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
		newElement.setAttribute("stroke", stroke);
		newElement.setAttribute("fill", fill);
		newElement.setAttribute("stroke-width", "1");
		newElement.setAttribute("d", "m 9.9828659,-2.772745 c 0,1.3775907 0.2255841,11.8988413 -0.2819803,13.083087 C 9.1933216,11.50264 7.203349,7.3618143 6.3090708,8.2640961 5.4067353,9.1663779 5.0844728,10.004211 3.8921001,10.511744 2.699728,11.011221 1.3945641,8.1996473 0.01689062,8.1996473 -1.3607825,8.1996473 -2.6659466,11.011221 -3.858319,10.511744 -5.050691,10.004211 -5.2601616,9.6014057 -6.1624971,8.6991239 -7.0648332,7.7968422 -9.2320496,11.542923 -9.7396135,10.350622 -10.239121,9.1583207 -9.9490844,-1.3951543 -9.9490844,-2.772745 c 0,-5.4942523 4.4633386,-9.957325 9.96597502,-9.957325 5.50263598,0 9.96597528,4.4630727 9.96597528,9.957325 z");
		newElement.setAttribute("class", markclass);
		return newElement;
	}

	static dice(stroke, fill, markclass = "") {
		let newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
		newElement.setAttribute("stroke", stroke);
		newElement.setAttribute("fill", fill);
		newElement.setAttribute("stroke-width", "1");
		newElement.setAttribute("d", "m -3.5463331,-9.2427435 -4.2426784,4.7879684 V 6.5315532 l 12.8085634,0.6925413 2.4411505,-6.1592462 0.052919,-9.52762 z m 0.2231778,0.4831683 10.0499019,0.6626308 -2.1719568,3.7180958 -11.338351,-0.441754 z m 5.8900524,1.0284584 a 1.4725126,0.6828872 0 0 0 -1.4725131,0.683338 1.4725126,0.6828872 0 0 0 1.4725131,0.6810374 1.4725126,0.6828872 0 0 0 1.4725131,-0.6810374 1.4725126,0.6828872 0 0 0 -1.4725131,-0.683338 z m -5.5265258,0.8535974 a 1.4725126,0.72416619 0 0 0 -1.472513,0.7247526 1.4725126,0.72416619 0 0 0 1.472513,0.7247525 1.4725126,0.72416619 0 0 0 1.4725131,-0.7247525 1.4725126,0.72416619 0 0 0 -1.4725131,-0.7247526 z m -4.2288736,2.645922 11.5868376,0.43025 -0.073626,10.491656 -11.4763991,-0.6879398 z m 2.9450262,1.4357003 a 1.472513,1.472513 0 0 0 -1.4725131,1.4725131 1.472513,1.472513 0 0 0 1.4725131,1.47251311 1.472513,1.472513 0 0 0 1.4725132,-1.47251311 1.472513,1.472513 0 0 0 -1.4725132,-1.4725131 z m 5.22742159,0.1840641 a 1.4725131,1.4725131 0 0 0 -1.35747298,0.8973128 1.4725131,1.4725131 0 0 0 -0.0506177,0.1403489 1.4725131,1.4725131 0 0 0 -0.0644225,0.4348514 A 1.4725131,1.4725131 0 0 0 0.98394549,0.33319327 1.4725131,1.4725131 0 0 0 2.4564586,-1.1393199 1.4725131,1.4725131 0 0 0 0.98394549,-2.611833 Z M -4.0225991,1.8425192 a 1.4725126,1.4725126 0 0 0 -1.4725131,1.4725132 1.4725126,1.4725126 0 0 0 1.4725131,1.4725131 1.4725126,1.4725126 0 0 0 1.472513,-1.4725131 1.4725126,1.4725126 0 0 0 -1.472513,-1.4725132 z m 4.93291896,0.2576899 a 1.472513,1.472513 0 0 0 -1.47251311,1.472513 1.472513,1.472513 0 0 0 0.522282,1.1250922 1.472513,1.472513 0 0 0 0.11734089,0.089731 A 1.472513,1.472513 0 0 0 0.91031986,5.0452349 1.472513,1.472513 0 0 0 2.3828329,3.5727221 1.472513,1.472513 0 0 0 0.91031986,2.1002091 Z");
		newElement.setAttribute("class", markclass);
		return newElement;
	}
	static questionmark(color) {
		return SVG.text(0, 6, "?", "questionmark", { "font-size": "18px", "font-weight": "bold", "fill": color })
	}
  /**
   * @typedef {SVGGElement & {
   * elements: Record<"ghost" | "questionmark" | "dice", Element>
   * setColor: (color: string) => void
   * set: (icon: "ghost" | "questionmark" | "dice", visibility: "visible" | "hidden") => void
   * }} Icons
   */
	static icons(stroke, fill, markclass = null) {
		const result = SVG.group(
			[
				SVG.ghost(stroke, fill, "ghost"),
				SVG.questionmark(stroke),
				SVG.dice(fill, stroke)
			], undefined, markclass)
		result.elements = {
			"ghost": result.children[0],
			"questionmark": result.children[1],
			"dice": result.children[2]
		}
    for (let child of result.children) {
      child.setAttribute("visibility", "hidden");
    }

		result.setColor = (color) => {
			result.elements["ghost"].setAttribute("stroke", color);
			result.elements["questionmark"].setAttribute("fill", color);
			result.elements["dice"].setAttribute("fill", color);
		}
    /**
     * @param {"ghost" | "questionmark" | "dice"}
     * @param {"visible" | "hidden"}
     */
		result.set = (icon, visibility) => {
			result.elements[icon].setAttribute("visibility", visibility);
		}
		return result
	}
}