
declare var Settings: any
declare var sin: any
declare var cos: any
declare var rotatePoints: any
declare var translatePoints: any
type Point = [number, number]

export type Curve = SVGPathElement &
  Record<"x1" | "y1" | "x2" | "y2" | "x3" | "y3" | "x4" | "y4", number> & {
    way: "oneway" | "twoway"
    x1: number
    y1: number
    x2: number
    y2: number
    x3: number
    y3: number
    x4: number
    y4: number,
    draggable?: boolean
    update: () => void
  }

export type Path = SVGPathElement & { update: () => void, dstring: string }
export type ForeignScrollable = SVGGElement & {
  cutDiv: HTMLDivElement;
  contentDiv: HTMLDivElement;
  scrollDiv: HTMLDivElement;
  innerDiv: HTMLDivElement;
  setX: (value: number) => void
  setY: (value: number) => void
  setWidth: (value: number) => void
  setHeight: (value: number) => void
}
export type Foreign = SVGGElement & {
  cutDiv: HTMLDivElement
  contentDiv: HTMLDivElement
  setX: (value: number) => void
  setY: (value: number) => void
  setWidth: (value: number) => void
  setHeight: (value: number) => void
}
export type ArrowHead = SVGPathElement & {
  templateArrowPoints: Point[]
  arrowPoints: Point[],
  setTemplatePoints: (newPoints: Point[]) => void
  setPosition: (pos: [number, number], directionVector?: Point) => void
  update: () => void
}

export class SVG {
  /* replaces svgplane */
  static element: SVGElement = document.getElementById("svgplane") as unknown as SVGElement;

  /* replaces svg_from_string */
  static fromString(inString: string) {
    var container = document.createElementNS("http://www.w3.org/2000/svg", 'temp'); //Create a path in SVG's namespace
    container.innerHTML = inString;
    const newElement = container.children[0];
    SVG.element.appendChild(newElement);
    return newElement;
  }
  static group(elements: Element[], transform?: string, markclass?: string): SVGGElement {
    const result = document.createElementNS("http://www.w3.org/2000/svg", 'g')
    for (let i = 0; i < elements.length; i++) {
      result.appendChild(elements[i]);
    }
    if (transform) {
      result.setAttribute("transform", transform);
    }
    if (markclass) {
      result.setAttribute("class", markclass)
    }
    SVG.element.appendChild(result)
    return result
  }
  static translate(element: Element, x: number, y: number) {
    element.setAttribute("transform", `translate(${x},${y}) rotate(0)`);
  }
  static transform(element: Element, x: number, y: number, r: number, s: string | number) {
    element.setAttribute("transform", `translate(${x},${y}) rotate(${r}) scale(${s})`);
  }
  /* replaces svg_curve and svg_curve_oneway */
  static curve(way: "oneway" | "twoway", x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, extraAttributes: { [k: string]: string } | null = null): Curve {

    const result = document.createElementNS("http://www.w3.org/2000/svg", 'path') as Curve
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
    result.update = function () {
      let d = `M${result.x1},${result.y1} C${result.x2},${result.y2} ${result.x3},${result.y3} ${result.x4},${result.y4}`
      if (result.way == "twoway") {
        // Only twoway should curve should be used as a click object
        d += `C ${result.x3},${result.y3} ${result.x2},${result.y2} ${result.x1},${result.y1}`;
      }
      this.setAttribute("d", d);
    }

    result.update();
    SVG.element.appendChild(result);
    return result
  }
  static path(dstring: string, stroke: string, fill: string, markclass: string, extraAttributes?: Record<string, string>) {
    const result = document.createElementNS("http://www.w3.org/2000/svg", 'path') as Path
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
    SVG.element.appendChild(result)
    return result
  }
  static text(x: number, y: number, text: string, markclass: string, extraAttributes?: Record<string, string>) {
    const result = document.createElementNS("http://www.w3.org/2000/svg", 'text')
    result.setAttribute("class", markclass);
    result.setAttribute("x", `${x}`);
    result.setAttribute("y", `${y}`);
    result.innerHTML = text;
    result.setAttribute("text-anchor", "middle");
    result.setAttribute("style", "font-size: " + Settings.primitiveFontSize + "px");

    if (extraAttributes != undefined) {
      for (var key in extraAttributes) {
        result.setAttribute(key, extraAttributes[key]);
      }
    }
    SVG.element.appendChild(result);
    return result
  }

  static foreignScrollable(x: number, y: number, width: number, height: number, innerHTML: string, fill = "white") {
    let result = document.createElementNS("http://www.w3.org/2000/svg", 'g') as ForeignScrollable
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
    SVG.element.appendChild(result);

    result.setX = function (x: number) {
      this.cutDiv.style.marginLeft = `${x}px`;
    }
    result.setY = function (y: number) {
      this.cutDiv.style.marginTop = `${y}px`;
    }
    result.setWidth = function (w: number) {
      this.cutDiv.style.width = `${w}px`;
    }
    result.setHeight = function (h: number) {
      this.cutDiv.style.height = `${h}px`;
    }
    return result
  }


  static foreign(x: number, y: number, width: number, height: number, innerHtml: string, fill = "white") {
    const result = document.createElementNS("http://www.w3.org/2000/svg", 'g') as Foreign
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
    SVG.element.appendChild(result);

    result.setX = function (x: number) {
      result.cutDiv.style.marginLeft = `${x}px`;
    }
    result.setY = function (y: number) {
      this.cutDiv.style.marginTop = `${y}px`;
    }
    result.setWidth = function (w: number) {
      this.cutDiv.style.width = `${w}px`;
    }
    result.setHeight = function (h: number) {
      this.cutDiv.style.height = `${h}px`;
    }
    return result
  }
  /* replaces svg_rect */
  static rect(x: number, y: number, width: number, height: number, stroke: string, fill: string, markclass?: string, extraAttributes?: Record<string, string>) {
    //<rect width="300" height="100" style="fill:rgb(0,0,255);stroke-width:3;stroke:rgb(0,0,0)" />
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
    SVG.element.appendChild(element);
    return element;
  }
  static circle(cx: number, cy: number, r: number, stroke: string, fill: string, markclass: string, extraAttributes?: Record<string, string>) {
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
    SVG.element.appendChild(result);
    return result
  }
  static ellipse(cx: number, cy: number, rx: number, ry: number, stroke: string, fill: string, markclass: string, extraAttributes?: Record<string, string>) {
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
    SVG.element.appendChild(result);
    return result
  }
  static line(x1: number, y1: number, x2: number, y2: number, stroke: string, fill: string, markclass: string, extraAttributes?: Record<string, string>) {
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
    SVG.element.appendChild(result);
    return result
  }

  /* replaces svg_arrow_head */
  static arrowHead(stroke: string, fill: string, extraAttributes?: Record<string, string>) {
    const result = document.createElementNS("http://www.w3.org/2000/svg", 'path') as ArrowHead
    result.setAttribute("stroke", stroke);
    result.setAttribute("fill", fill);
    result.templateArrowPoints = [[12, -2], [12, -6], [0, 0], [12, 6], [12, 2]]
    result.arrowPoints = [];

    if (extraAttributes) {
      for (var key in extraAttributes) {
        result.setAttribute(key, extraAttributes[key]);
      }
    }

    SVG.element.appendChild(result);

    result.setTemplatePoints = function (newPoints: Point[]) {
      this.templateArrowPoints = newPoints;
    }

    result.setPosition = function (pos: [number, number], directionVector: Point = [1, 0]) {
      let sine = sin([0, 0], directionVector);
      let cosine = cos([0, 0], directionVector);
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

}


(window as any).SVG = SVG;



