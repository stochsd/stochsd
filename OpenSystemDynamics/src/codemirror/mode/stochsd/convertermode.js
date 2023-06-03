



CodeMirror.defineSimpleMode("convertermode", {
  // The start state contains the rules that are intially used
  start: [
      // The regex matches the token, the token property contains the type
      {regex: /^(\t| )*\d+(\.\d+)?(\t| )*(?=,)/, token: "x"}, 
      {regex:  /(\t| )*\d+(\.\d+)?(\t| )*(?=;)/, token: "y"}, 
      {regex:  /(\t| )*\d+(\.\d+)?(\t| )*$/, token: "y"}, 
  ],
  // The meta property contains global information about the mode. It
  // can contain properties like lineComment, which are supported by
  // all modes, and also directives like dontIndentStates, which are
  // specific to simple modes.
  meta: {
      dontIndentStates: ["comment"],
      lineComment: "//"
  }
});