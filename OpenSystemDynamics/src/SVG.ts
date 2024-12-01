
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
    console.log("curve1", result)
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

    console.log("curve result", result)
    return result
  }


}


(window as any).SVG = SVG;



