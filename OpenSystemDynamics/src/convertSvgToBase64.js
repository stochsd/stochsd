
/**
 * @param {SVGElement} svgElement 
 * @param {number} cropX
 * @param {number} cropY
 * @param {number} cropWidth
 * @param {number} cropHeight
 * @returns {string}
 */
function convertSvgToBase64(svgElement, cropX=0, cropY=0, cropWidth=800, cropHeight=800) {
// 1. Clone the SVG so we don't mutate the original DOM element
  const clone = svgElement.cloneNode(true);

  // 2. Adjust viewBox to set the crop window (X, Y, Width, Height)
  clone.setAttribute('viewBox', `${cropX} ${cropY} ${cropWidth} ${cropHeight}`);
  clone.setAttribute('width', cropWidth);
  clone.setAttribute('height', cropHeight);

  // 3. Serialize and convert to Base64
  let svgString = new XMLSerializer().serializeToString(clone);
  if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const utf8Bytes = new TextEncoder().encode(svgString);
  const base64 = btoa(String.fromCharCode(...utf8Bytes));

  return `data:image/svg+xml;base64,${base64}`;
}