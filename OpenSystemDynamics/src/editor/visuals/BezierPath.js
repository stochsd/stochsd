/** 
 * @typedef {[number, number]} Point 
 */


class BezierPath {
    /** 
     * @param {Point} start
     * @param {Point} end  */
    constructor(start, end) {
        /** @type {Point} */
        this.start = start
        /** @type {Point} */
        this.end = end
        this.resetControls()
    }
    get points() {
        return [
            [this.start[0], this.start[1]],
            [this.control1[0], this.control1[1]],
            [this.control2[0], this.control2[1]],
            [this.end[0], this.end[1]],
        ]
    }
    /** Places the control points back on the straight line between the ends. */
    resetControls() {
        /** @type {Point} */
        this.control1Local = [0.3, 0];
        /** @type {Point} */
        this.control2Local = [0.7, 0];
        this.updateControlPoints();
    }
    updateControlPoints() {
        /** @type {Point} */
		this.control1 = this.#localToWorld(this.control1Local)
        /** @type {Point} */
		this.control2 = this.#localToWorld(this.control2Local)
	}
    /** @param {Point} worldPos  */
    #worldToLocal(worldPos) {
		// localPos(worldPos) = inv(S)*inv(R)*inv(T)*worldPos
		const originWorld = this.start
		const oneZeroWorld = this.end
		const scaleFactor = distance(originWorld, oneZeroWorld);
		const sine = sin(originWorld, oneZeroWorld);
		const cosine = cos(originWorld, oneZeroWorld);
		const translated = translate(worldPos, neg(originWorld));
		const rotated = rotate(translated, -sine, cosine);
		const localPos = scale(rotated, [0, 0], 1 / scaleFactor);
		return localPos;
	}
    /** @param {Point} localPos  */
    #localToWorld(localPos) {
		// worldPos(localPos) = T*R*S*localPos
		const originWorld = this.start
		const oneZeroWorld = this.end
		const scaleFactor = distance(originWorld, oneZeroWorld);
		const sine = sin(originWorld, oneZeroWorld);
		const cosine = cos(originWorld, oneZeroWorld);
		const scaled = scale(localPos, [0, 0], scaleFactor);
		const rotated = rotate(scaled, sine, cosine);
		const worldPos = translate(rotated, originWorld);
		return worldPos;
	}

    /**
     * Moving an end keeps the curve's shape, since the control points are stored relative to the ends.
     * @param {number} index 0 = start, 1 = control1, 2 = control2, 3 = end
     * @param {Point} pos
     */
    movePoint(index, pos) {
        switch (index) {
            case 0:
                this.start = pos;
                break;
            case 1:
                this.control1Local = this.#worldToLocal(pos);
                break;
            case 2:
                this.control2Local = this.#worldToLocal(pos);
                break;
            case 3:
                this.end = pos;
                break;
        }
        this.updateControlPoints();
    }

    /**
     * Moves the whole curve. The control points follow since they are stored relative to the ends.
     * @param {number} diffX
     * @param {number} diffY
     */
    translate(diffX, diffY) {
        this.start = [this.start[0] + diffX, this.start[1] + diffY];
        this.end = [this.end[0] + diffX, this.end[1] + diffY];
        this.updateControlPoints();
    }

}