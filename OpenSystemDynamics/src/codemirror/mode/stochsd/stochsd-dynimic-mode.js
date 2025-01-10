CodeMirror.defineMode("stochsd-dynamic-mode", () => {

  function getColorFromPrimitive(primitiveName) {
    const primitives = findName(primitiveName)
    const primitive = Array.isArray(primitives) ? primitives[0] : primitives
    return primitive?.getAttribute("Color")
  }


  function tokenStart(stream, state) {
    if (stream.match(/"(?:[^\\]|\\.)*?(?:"|$)/)) {
      return "string";
    } else if (stream.match(/0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i)) {
      return "number";
    } else if (stream.match(/\[[A-Za-z_]+[A-Za-z_0-9]*\]/)) {
      const primitiveName = stream.current().slice(1, -1);
      const color = getColorFromPrimitive(primitiveName)
      return `primitive ${color}`;
    } else if (stream.match(/#.*/)) {
      return "comment";
    } else if (stream.match(/[\w]+(?=\()/)) {
      return "functioncall";
    }
    stream.next();
  }

  function tokenComment(stream, state) {
    if (stream.match(/.*?\*\//)) {
      state.currentState = "start"; // Return to 'start' state
      return "comment";
    }
    stream.skipToEnd();
    return "comment";
  }

  return {
    startState: function () {
      return { currentState: "start" };
    },
    token: function (stream, state) {
      if (state.currentState === "start") {
        return tokenStart(stream, state);
      }
      if (state.currentState === "comment") {
        return tokenComment(stream, state);
      }

      stream.next();
      return null;
    }
  }
});