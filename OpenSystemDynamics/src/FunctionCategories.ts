
export type Category = {
  name: string,
  functions: {
    name: string,
    replacement: string
    description: string
    example?: {
      definition: string,
      result?: string
    }
  }[]
}

export const FunctionCategories: Category[] = <const>[
  {
    name: "Programming Functions",
    functions: [
      {
        name: "IfThenElse",
        replacement: "IfThenElse(##Test Condition$$, ##Value if True$$, ##Value if False$$)",
        description: "Tests a condition and returns one value if the condition is true and another value if the condition is false.",
        example: { definition: "IfThenElse(20 > 10, 7, 5)", result: "7" }
      },
      {
        name: "If-Then-Else",
        replacement: "If ##Condition$$ Then\n  ##Expression$$\nElse If ##Condition$$ Then\n  ##Expression$$\nElse\n  ##Expression$$\nEnd If",
        description: "Test one or more conditions and selectively execute code based on these tests.",
      },
      {
        name: "Max",
        replacement: "Max(##Values$$)",
        description: "Returns the largest of a vector or list of numbers.",
        example: { definition: "Max(2, 4, -1)", result: "4" }
      },
      {
        name: "Min",
        replacement: "Min(##Values$$)",
        description: "Returns the smallest of a vector or list of numbers.",
        example: { definition: "Min(2, 4, -1, 3)", result: "-1" }
      },
      {
        name: "StopIf",
        replacement: "StopIf(##Condition$$)",
        description: "Terminates the simulation after the current time step if the condition is true.",
        example: { definition: "StopIf(Rand() < 0.01)" }
      },
      {
        name: "Define Function",
        replacement: "Function ##Name$$()\n  ##Expression$$\nEnd Function",
        description: "Creates a reusable function.", example: { definition: 'Function Square(x)\n  x^2\nEnd Function\nSquare(5)', result: "25" }
      },
      {
        name: "Throwing Errors",
        replacement: `Throw "##Message$$"`,
        description: "Passes an error message up to the nearest Try-Catch block or aborts the simulation with the error message.",
        example: { definition: 'If T() > 50 Then\n  Throw "Error: Time exceeded 50"\nElse\n  1\nEnd If' }
      }
    ]
  },
  {
    name: "Mathematical Functions",
    functions: [
      { name: "Current Time", replacement: "T()", description: "The current simulation time." },
      { name: "Time Start", replacement: "TS()", description: "The simulation start time." },
      { name: "Time Step", replacement: "DT()", description: "The simulation time step." },
      { name: "Time Length", replacement: "TL()", description: "The total length of the simulation." },
      { name: "Time End", replacement: "TE()", description: "The time at which the simulation ends." },
      { name: "Round", replacement: "Round(##Value$$)", description: "Rounds a number to the nearest integer.", example: { definition: "Round(3.6)", result: "4" } },
      { name: "Round Up", replacement: "Ceiling(##Value$$)", description: "Rounds a number up to the nearest integer.", example: { definition: "Ceiling(3.6)", result: "4" } },
      { name: "Round Down", replacement: "Floor(##Value$$)", description: "Rounds a number down to the nearest integer.", example: { definition: "Floor(3.6)", result: "3" } },
      { name: "Pulse", replacement: "Pulse(##Time$$, ##Volume=1$$, ##Repeat=0$$)", description: "Creates a pulse input at the specified time with the specified Volume. Repeat is optional and will create a pulse train with the specified time if positive..", example: { definition: "Pulse(0, 5, 2)" } },
      { name: "Step", replacement: "Step(##Start$$, ##Height=1$$)", description: "Creates an input that is initially set to 0 and after the time of Start is set to Height. Height defaults to 1.", example: { definition: "Step(10, 5)" } },
      { name: "Ramp", replacement: "Ramp(##Start$$, ##Finish$$, ##Height=1$$)", description: "Creates a ramp input which moves linearly from 0 to Height between the Start and Finish times. Before Start, the value is 0; after Finish, the value is Height. Height defaults to 1.", example: { definition: "Ramp(10, 20, 5)" } },
      { name: "Sin", replacement: "Sin(##Angle$$)", description: "Finds the sine of an angle, where the angle is given in radians.", example: { definition: "Sin(Pi/2)", result: "1" } },
      { name: "Cos", replacement: "Cos(##Angle$$)", description: "Finds the cosine of an angle, where the angle is given in radians.", example: { definition: "Cos(Pi)", result: "-1" } },
      { name: "Tan", replacement: "Tan(##Angle$$)", description: "Finds the tangent of an angle, where the angle is given in radians.", example: { definition: "Tan(Pi/4)", result: "1" } },
      { name: "ArcSin", replacement: "ArcSin(##Value$$)", description: "Finds the arc-sine of a value. Return value is given in radians.", example: { definition: "ArcSin(1)", result: "Pi/2 = 1.57..." } },
      { name: "ArcCos", replacement: "ArcCos(##Value$$)", description: "Finds the arc-cosine of a value. Return value is given in radians.", example: { definition: "ArcCos(0)", result: "Pi/2 = 1.57..." } },
      { name: "ArcTan", replacement: "ArcTan(##Value$$)", description: "Finds the arc-tangent of a value. Return value is given in radians.", example: { definition: "ArcTan(1)", result: "Pi/4 = 0.785..." } },
      { name: "Log", replacement: "Log(##Value$$)", description: "Returns the base-10 logarithm of a number.", example: { definition: "Log(1000)", result: "3" } },
      { name: "Ln", replacement: "Ln(##Value$$)", description: "Returns the natural logarithm of a number.", example: { definition: "Ln(e^2)", result: "2" } },
      { name: "Exp", replacement: "Exp(##Value$$)", description: "Returns e taken to a power.", example: { definition: "Exp(1)", result: "e" } },
      { name: "Absolute Value", replacement: "Abs(##Value$$)", description: "Returns the absolute value of a number.", example: { definition: "Abs(-23)", result: "23" } },
      { name: "Mod", replacement: "##(Value One)$$ mod ##(Value Two)$$", description: "Returns the remainder of the division of two numbers.", example: { definition: "13 mod 5", result: "3" } },
      { name: "Square Root", replacement: "Sqrt(##Value$$)", description: "Returns the square root of a number.", example: { definition: "Sqrt(9)", result: "3" } },
      { name: "Sign", replacement: "Sign(##Value$$)", description: "1 if the value is greater than 0, -1 if it is less than 0, and 0 if it is 0.", example: { definition: "Sign(-12)", result: "-1" } },
      { name: "pi", replacement: "pi", description: "The value 3.14159265." },
      { name: "e", replacement: "e", description: "The value 2.71828183." },
      { name: "epsilon", replacement: "eps", description: "(Machine Epsilon)<br/> Maximum relative rounding error &asymp;2.220446049250313e-16" },
    ]
  },
  {
    name: "Historical Functions",
    functions: [
      { name: "Delay", replacement: "Delay(##[Primitive]$$, ##Delay Length$$, ##Default Value$$)", description: "Returns the value of a primitive for a specified length of time ago. Default Value stands in for the primitive value in the case of negative times.", example: { definition: "Delay([Income], 5)" } },
      { name: "Delay1", replacement: "Delay1(##[Primitive]$$, ##Delay Length$$, ##Initial Value$$)", description: "Returns a smoothed, first-order exponential delay of the value of a primitive. The Initial Value is optional.", example: { definition: "Delay1([Income], 5, 10000)" } },
      { name: "Delay3", replacement: "Delay3(##[Primitive]$$, ##Delay Length$$, ##Initial Value$$)", description: "Returns a smoothed, third-order exponential delay of the value of a primitive. The Initial Value is optional.", example: { definition: "Delay3([Income], 20, 10000)" } },
      { name: "Smooth", replacement: "Smooth(##[Primitive]$$, ##Length$$, ##Initial Value$$)", description: "Returns a smoothing of a primitive's past values. Results in an averaged curve fit. Length affects the weight of past values. The Initial Value is optional." },
      { name: "PastMax", replacement: "PastMax(##[Primitive]$$, ##Period = All Time$$)", description: "Returns the maximum of the values a primitive has taken on over the course of the simulation. The second optional argument is a time window to limit the calculation.", example: { definition: "PastMax([Income], 10)", result: "The maximum income in the past 10 time units" } },
      { name: "PastMin", replacement: "PastMin(##[Primitive]$$, ##Period = All Time$$)", description: "Returns the minimum of the values a primitive has taken on over the course of the simulation. The second optional argument is a time window to limit the calculation.", example: { definition: "PastMin([Income], 10)", result: "The minimum income in the past 10 units of time" } },
      { name: "PastMedian", replacement: "PastMedian(##[Primitive]$$, ##Period = All Time$$)", description: "Returns the median of the values a primitive has taken on over the course of the simulation. The second optional argument is a time window to limit the calculation." },
      { name: "PastMean", replacement: "PastMean(##[Primitive]$$, ##Period = All Time$$)", description: "Returns the mean of the values a primitive has taken on over the course of the simulation. The second optional argument is a time window to limit the calculation." },
      { name: "PastStdDev", replacement: "PastStdDev(##[Primitive]$$, ##Period = All Time$$)", description: "Returns the standard deviation of the values a primitive has taken on over the course of the simulation. The second optional argument is a time window to limit the calculation." },
      { name: "PastCorrelation", replacement: "PastCorrelation(##[Primitive]$$, ##[Primitive]$$, ##Period = All Time$$)", description: "Returns the correlation between the values that two primitives have taken on over the course of the simulation. The third optional argument is an optional time window to limit the calculation.", example: { definition: "PastCorrelation([Income], [Expenditures], 10)", result: "The correlation between income and expenditures over the past 10 time units." } },
      { name: "Fix", replacement: "Fix(##Value$$, ##Period=-1$$)", description: "Takes the dynamic value and forces it to be fixed over the course of the period. If period is -1, the value is held constant over the course of the whole simulation.", example: { definition: "Fix(Rand(), 5)", result: "A new random value every five time units" } }
    ],
  },
  {
    name: "Random Number Functions",
    functions: [
      { name: "Poisson Flow", replacement: "PoFlow(##Lambda$$)", description: "PoFlow(Lambda) is short for RandPoisson(DT()*Lambda)/DT(). <br/><span class='note'>This should only be used in flows.</span> <br/><br/>PoFlow(Lambda) generates a Poisson distributed random number of transferred entities with the expected rate of Lambda entities per time unit." },
      { name: "Uniform Distribution", replacement: "Rand(##Minimum$$, ##Maximum$$)", description: "Generates a uniformly distributed random number between the minimum and maximum. The minimum and maximum are optional and default to 0 and 1 respectively.", example: { definition: "Rand()", result: "0.7481" } },
      { name: "Normal Distribution", replacement: "RandNormal(##Mean$$, ##Standard Deviation$$)", description: "Generates a normally distributed random number with a mean and a standard deviation. The mean and standard deviation are optional and default to 0 and 1 respectively.", example: { definition: "RandNormal(10, 1)", result: "11.23" } },
      { name: "Lognormal Distribution", replacement: "RandLognormal(##Mean$$, ##Standard Deviation$$)", description: "Generates a log-normally distributed random number with a mean and a standard deviation." },
      { name: "Bernoulli Distribution", replacement: "RandBernoulli(##Probability$$)", description: "Returns 1 with the specified probability, otherwise 0. The probability is optional and defaults to 0.5: a coin flip.", example: { definition: "RandBernoulli(0.1)", result: "0" } },
      { name: "Binomial Distribution", replacement: "RandBinomial(##Count$$, ##Probability$$)", description: "Generates a binomially distributed random number. The number of successes in Count random events each with Probability of success." },
      { name: "Negative Binomial", replacement: "RandNegativeBinomial(##Successes$$, ##Probability$$)", description: "Generates a negative binomially distributed random number. The number of random events each with Probability of success required to generate the specified Successes." },
      { name: "Poisson Distribution", replacement: "RandPoisson(##Lambda$$)", description: "Generates a Poisson distributed random number with the rate Lambda events per time unit." },
      { name: "Exponential Distribution", replacement: "RandExp(##Beta$$)", description: "Generates an exponentially distributed random number where the parameter Beta is the expected time between events, e.g. time between arrivals." },
      { name: "Beta Distribution", replacement: "RandBeta(##Alpha$$, ##Beta$$)", description: "Generates a Beta distributed random number." },
      { name: "Gamma Distribution", replacement: "RandGamma(##Alpha$$, ##Beta$$)", description: "Generates a Gamma distributed random number." },
      { name: "Triangular Distribution", replacement: "RandTriangular(##Minimum$$, ##Maximum$$, ##Peak$$)", description: "Generates a triangularly distributed random number." },
      { name: "Custom Distribution", replacement: "RandDist(##X$$, ##Y$$)", description: "Generates a random number according to a custom distribution. Takes two vectors with the x- and y-coordinates respectively of points defining the distribution. Points are interpolated linearly. The distribution does not have to be normalized such that its area is 1, but the points must be sorted from smallest to largest x locations. You may also pass a single vector containing pairs of {x, y} coordinates (e.g. { {1, 0}, {3, 4}, {4, 0} } ).", example: { definition: "RandDist({0, 1, 2, 3}, {0, 5, 1, 0})", result: "1.2" } }
    ],
  },
  {
    name: "Statistical Distributions",
    functions: [
      { name: "CDFNormal", replacement: "CDFNormal(##x$$, ##Mean=0$$, ##StandardDeviation=1$$)", description: "Returns the value of x in the CDF of the Normal Distribution.", example: { definition: "CDFNormal(1.96)", result: "0.975" } },
      { name: "PDFNormal", replacement: "PDFNormal(##x$$, ##Mean=0$$, ##StandardDeviation=1$$)", description: "Returns the value of x in the PDF of the Normal Distribution.", example: { definition: "PDFNormal(1.5, 0, 1)", result: "0.12" } },
      { name: "InvNormal", replacement: "InvNormal(##p$$, ##Mean=0$$, ##StandardDeviation=1$$)", description: "Returns the value of p in the inverse CDF of the Normal Distribution.", example: { definition: "InvNormal(0.975)", result: "1.96" } },
      { name: "CDFLognormal", replacement: "CDFLognormal(##x$$, ##Mean=0$$, ##StandardDeviation=1$$)", description: "Returns the value of x in the CDF of the Lognormal Distribution." },
      { name: "PDFLognormal", replacement: "PDFLognormal(##x$$, ##Mean=0$$, ##StandardDeviation=1$$)", description: "Returns the value of x in the PDF of the Lognormal Distribution." },
      { name: "InvLognormal", replacement: "InvLognormal(##p$$, ##Mean=0$$, ##StandardDeviation=1$$)", description: "Returns the value of p in the inverse CDF of the Lognormal Distribution." },
      { name: "CDFt", replacement: "CDFt(##x$$, ##DegreesOfFreedom$$)", description: "Returns the value of x in the CDF of Student's t Distribution." },
      { name: "PDFt", replacement: "PDFt(##x$$, ##DegreesOfFreedom$$)", description: "Returns the value of x in the PDF of Student's t Distribution." },
      { name: "Invt", replacement: "Invt(##p$$, ##DegreesOfFreedom$$)", description: "Returns the value of p in the inverse CDF of Student's t Distribution." },
      { name: "CDFF", replacement: "CDFF(##x$$, ##DegreesOfFreedom1$$, ##DegreesOfFreedom2$$)", description: "Returns the value of x in the CDF of the F Distribution." },
      { name: "PDFF", replacement: "PDFF(##x$$, ##DegreesOfFreedom1$$, ##DegreesOfFreedom2$$)", description: "Returns the value of x in the PDF of the F Distribution." },
      { name: "InvF", replacement: "InvF(##p$$, ##DegreesOfFreedom1$$, ##DegreesOfFreedom2$$)", description: "Returns the value of p in the inverse CDF of the F Distribution." },
      { name: "CDFChiSquared", replacement: "CDFChiSquared(##x$$, ##DegreesOfFreedom$$)", description: "Returns the value of x in the CDF of the Chi-Squared Distribution." },
      { name: "PDFChiSquared", replacement: "PDFChiSquared(##x$$, ##DegreesOfFreedom$$)", description: "Returns the value of x in the PDF of the Chi-Squared Distribution." },
      { name: "InvChiSquared", replacement: "InvChiSquared(##p$$, ##DegreesOfFreedom$$)", description: "Returns the value of p in the inverse CDF of the Chi-Squared Distribution." },
      { name: "CDFExponential", replacement: "CDFExponential(##x$$, ##Rate$$)", description: "Returns the value of x in the CDF of the Exponential Distribution." },
      { name: "PDFExponential", replacement: "PDFExponential(##x$$, ##Rate$$)", description: "Returns the value of x in the PDF of the Exponential Distribution." },
      { name: "InvExponential", replacement: "InvExponential(##p$$, ##Rate$$)", description: "Returns the value of p in the inverse CDF of the Exponential Distribution." },
      { name: "CDFPoisson", replacement: "CDFPoisson(##x$$, ##Lambda$$)", description: "Returns the value of x in the CDF of the Poisson Distribution." },
      { name: "PMFPoisson", replacement: "PMFPoisson(##x$$, ##Lambda$$)", description: "Returns the value of x in the PMF of the Poisson Distribution." },
    ]
  }
];

export function hasRandomFunction(definition: string) {
  if (definition) {
    let randomFunctions: string[] = []
    for (let category of FunctionCategories) {
      if (category.name === "Random Number Functions") {
        randomFunctions = (category.functions).map(f => f.replacement.substring(0, f.replacement.indexOf("#")).toLowerCase())
        break
      }
    }
    return randomFunctions.some(elem => definition.toLowerCase().includes(elem))
  }
  return false
}

(window as any).FunctionCategories = FunctionCategories;
(window as any).hasRandomFunction = hasRandomFunction;
