

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


}


(window as any).SVG = SVG;



