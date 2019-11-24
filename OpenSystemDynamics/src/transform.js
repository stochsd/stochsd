function translate(point, translation) {
	return [point[0]+translation[0], point[1]+translation[1]];
}

function tranlatePoints(points, translation) {
	var newPoints = []
	for (i = 0; i < points.length; i++) {
		let newx = points[i][0]+translation[0];
		let newy = points[i][1]+translation[1];
		newPoints.push([newx, newy]);
	}
	return newPoints;
}

function distance(point1, point2) {
	const dx = point2[0]-point1[0];
	const dy = point2[1]-point1[1];
	return Math.sqrt(dx*dx + dy*dy);
}

function cos(point1 ,point2){
	const dist = distance(point1, point2)
	if (dist == 0) {
		return 0;
	} else {
		return  (point2[0]-point1[0])/(dist)
	}
}

function sin(point1 ,point2){
	const dist = distance(point1, point2)
	if (dist == 0) {
		return 0;
	} else {
		return  (point2[1]-point1[1])/(dist)
	}
}

function rotate(point, sine, cosine) {
	var x = point[0]*cosine - point[1]*sine;
	var y = point[0]*sine + point[1]*cosine;
	return [x, y];
}

function rotatePoints(points, sine, cosine) {
	var newPoints = [];
	for (let i = 0; i < points.length; i++) {
		newPoints.push(rotate(points[i], sine, cosine));
	}
	return newPoints;
}

// Returns "north, east, west or south. Closest direction to the two points vector."
function neswDirection(point1, point2) {
	let sine = sin(point1, point2);
	let cosine = cos(point1, point2);
	sin45 = 1/Math.sqrt(2);
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

function isInLimits(lowerLimit, value, upperLimit) {
	return (lowerLimit < value && value < upperLimit);
}