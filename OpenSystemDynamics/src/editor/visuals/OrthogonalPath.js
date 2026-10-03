
/** 
 * @typedef {[number, number]} Point 
 */

class OrthogonalPath {

    /** @param {Point[]} points  */
    constructor(points) {
        /** @type {Point[]} */   
        this.points = points
        /** @type {"horizontal" | "vertical"} */
        this.firstAxis
        this.fitFirstAxisToPoints()
    }

    /** Sets firstAxis from the direction of the first segment, e.g. after loading saved points. */
    fitFirstAxisToPoints() {
        const [[x0, y0], [x1, y1]] = this.points;
        this.firstAxis = Math.abs(x1 - x0) >= Math.abs(y1 - y0) ? "horizontal" : "vertical";
    }

    /**
	 * @param {string} middlePointsString 
	 * @returns {[number, number][]}
	 */
	#parseMiddlePoints(middlePointsString) {
		if (!middlePointsString) {
			return [];
		}
		return middlePointsString.trim()                  // input: "15,17 19,12 "
            .split(" ")                                         // ["15,17", "19,12"]
            .map(stringPos => stringPos.split(","))             // [["15", "17"], ["19", "12"]]
		    .map(dim => [parseInt(dim[0]), parseInt(dim[1])]);  // [[15,17], [19,12]]
	}
    
    /**
     * Segment i goes from points[i] to points[i + 1]. Axes alternate, starting with firstAxis.
     * @param {number} segmentIndex
     * @returns {"horizontal" | "vertical"}
     */
    #segmentAxis(segmentIndex) {
        const isSameAsFirst = segmentIndex % 2 === 0;
        if (isSameAsFirst) {
            return this.firstAxis;
        }
        return this.firstAxis === "horizontal" ? "vertical" : "horizontal";
    }

    /**
     * Moves a point and slides its neighbors along so every segment stays horizontal or vertical.
     * Neighbors only move along their other segment, so points further away are never affected.
     * @param {number} index
     * @param {Point} pos
     */
    movePoint(index, [x, y]) {
        if (this.points.length === 2) {
            // A straight path has no bends depending on its axis, so it follows the drag direction
            const [otherX, otherY] = this.points[1 - index];
            this.firstAxis = Math.abs(x - otherX) >= Math.abs(y - otherY) ? "horizontal" : "vertical";
        }
        const neighbors = [
            { neighborIndex: index - 1, segmentIndex: index - 1 },
            { neighborIndex: index + 1, segmentIndex: index },
        ];
        for (const { neighborIndex, segmentIndex } of neighbors) {
            const neighbor = this.points[neighborIndex];
            if (!neighbor) {
                continue;
            }
            if (this.#segmentAxis(segmentIndex) === "horizontal") {
                neighbor[1] = y;
            } else {
                neighbor[0] = x;
            }
        }
        this.points[index] = [x, y];
    }

    /** @param {Point} point  */
    addBend(point) {
        this.points.splice(-1, 0, point)
    }
    removeLastBend() {
        if (this.points.length <= 2) return;
        
        this.points.splice(-2, 1)
    }

}