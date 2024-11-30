/*

This file may distributed and/or modified under the
terms of the Affero General Public License (http://www.gnu.org/licenses/agpl-3.0.html).

*/
export type Point = [number, number]

export function neg(vector: Point): Point
export function neg(vector: number[]): number[] {
	return vector.map(x => -x) as any;
}

export function translate(point: Point, translation: Point): Point {
	return [point[0] + translation[0], point[1] + translation[1]];
}

export function translatePoints(points: Point[], translation: Point): Point[] {
	var newPoints: Point[] = []
	for (let i = 0; i < points.length; i++) {
		let newx = points[i][0] + translation[0];
		let newy = points[i][1] + translation[1];
		newPoints.push([newx, newy]);
	}
	return newPoints;
}

export function distance(point1: Point, point2: Point) {
	const dx = point2[0] - point1[0];
	const dy = point2[1] - point1[1];
	return Math.sqrt(dx * dx + dy * dy);
}

export function scale(point: Point, pivot: Point, scaleFactor: number) {
	let a = translate(point, neg(pivot));
	let b: Point = [a[0] * scaleFactor, a[1] * scaleFactor];
	return translate(b, pivot);
}

export function cos(point1: Point, point2: Point) {
	const dist = distance(point1, point2)
	if (dist == 0) {
		return 0;
	} else {
		return (point2[0] - point1[0]) / (dist)
	}
}

export function sin(point1: Point, point2: Point) {
	const dist = distance(point1, point2)
	if (dist == 0) {
		return 0;
	} else {
		return (point2[1] - point1[1]) / (dist)
	}
}

export function rotate(point: Point, sine: number, cosine: number): Point {
	var x = point[0] * cosine - point[1] * sine;
	var y = point[0] * sine + point[1] * cosine;
	return [x, y];
}

export function rotatePoints(points: Point[], sine: number, cosine: number): Point[] {
	var newPoints = [];
	for (let i = 0; i < points.length; i++) {
		newPoints.push(rotate(points[i], sine, cosine));
	}
	return newPoints;
}

// Returns "north, east, west or south. Closest direction to the two points vector."
export function neswDirection(point1: Point, point2: Point) {
	const sine = sin(point1, point2);
	const cosine = cos(point1, point2);
	const sin45 = 1 / Math.sqrt(2);
	if (sin45 < sine) {
		return "north";
	} else if (sin45 < cosine) {
		return "east"
	} else if (sine < -sin45) {
		return "south"
	} else {
		return "west"
	}
}

(window as any).neg = neg;
(window as any).translate = translate;
(window as any).translatePoints = translatePoints;
(window as any).distance = distance;
(window as any).scale = scale;
(window as any).cos = cos;
(window as any).sin = sin;
(window as any).rotate = rotate;
(window as any).rotatePoints = rotatePoints;
(window as any).neswDirection = neswDirection;