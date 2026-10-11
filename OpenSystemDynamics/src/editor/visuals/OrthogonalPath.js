// @ts-check
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
     * Segment i goes from points[i] to points[i + 1]. Axes alternate, starting with firstAxis.
     * @param {number} segmentIndex
     * @returns {"horizontal" | "vertical"}
     */
    segmentAxis(segmentIndex) {
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
            if (this.segmentAxis(segmentIndex) === "horizontal") {
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

    /**
     * Removes bends where a segment has become shorter than minLength, e.g. when a bend is pulled back in line.
     * An inner segment is removed together with both its ends, so its neighbors merge into one segment.
     * The points around the removed ones are brought in line by nudging one of them,
     * the one on the side of the moving point, so the other side stays put.
     * @param {number} minLength
     * @param {number} [movingIndex] index of the point being dragged, if any
     */
    removeShortSegments(minLength, movingIndex = -1) {
        const moving = this.points[movingIndex];
        let segmentIndex = this.#shortSegmentIndex(minLength);
        while (segmentIndex !== -1) {
            const isFirst = segmentIndex === 0;
            const isLast = segmentIndex === this.points.length - 2;
            // The segment at an end is removed by its bend alone, merging it into the next segment
            const lower = isFirst ? 0 : segmentIndex - 1;
            const removeCount = isFirst || isLast ? 1 : 2;
            const upper = lower + removeCount + 1;
            const mergedAxis = this.segmentAxis(isFirst ? 1 : lower);

            const movingNow = this.points.indexOf(moving);
            const nudgeLower = movingNow !== -1 && movingNow <= lower;
            const [nudged, reference] = nudgeLower ? [lower, upper] : [upper, lower];
            const coordinate = mergedAxis === "horizontal" ? 1 : 0;
            this.points[nudged][coordinate] = this.points[reference][coordinate];

            this.points.splice(lower + 1, removeCount);
            if (isFirst) {
                this.firstAxis = mergedAxis;
            }
            segmentIndex = this.#shortSegmentIndex(minLength);
        }
    }

    /**
     * @param {number} minLength
     * @returns {number} index of the first segment shorter than minLength, or -1. A straight path has none.
     */
    #shortSegmentIndex(minLength) {
        if (this.points.length <= 2) return -1;
        for (let i = 0; i < this.points.length - 1; i++) {
            const [[x0, y0], [x1, y1]] = [this.points[i], this.points[i + 1]];
            if (Math.abs(x1 - x0) + Math.abs(y1 - y0) < minLength) {
                return i;
            }
        }
        return -1;
    }

    /**
     * @param {number} diffX
     * @param {number} diffY
     */
    translate(diffX, diffY) {
        this.points = this.points.map(([x, y]) => [x + diffX, y + diffY]);
    }

}