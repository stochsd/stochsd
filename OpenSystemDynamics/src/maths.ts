
export function safeDivision(nominator: number, denominator: number) {
  // Make sure division by Zero does not happen 
  if (denominator == 0) {
    return 9999999;
  } else {
    return nominator / denominator;
  }
}

export function sign(value: number) {
  if (value < 0) {
    return -1;
  } else {
    return 1;
  }
}

export function isInLimits(lowerLimit: number, value: number, upperLimit: number) {
  return (lowerLimit < value && value < upperLimit);
}

export function clampValue(value: number, min: number, max: number) {
  return Math.max(Math.min(value, max), min);
}


(window as any).safeDivision = safeDivision;
(window as any).sign = sign;
(window as any).isInLimits = isInLimits;
(window as any).clampValue = clampValue;