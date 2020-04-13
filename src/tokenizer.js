"use strict";

function tokenize(text) {
  const regexp = /<%.*?%>/g;

  let id = 0; // dont need
  let tokens = [];
  // let open = [];
  let cursorPosition = 0;
  let htmlString = "";

  text.replace(regexp, function (match, offset) {
    if (cursorPosition !== offset) {
      // TODO: not sure if I need it
      const string = text.slice(cursorPosition, offset);
      tokens.push({ type: "text", content: string });
      htmlString += string;
      cursorPosition = offset + match.length; // + 1?
    }
    // const latestText = htmlString.slice(0, offset);
    const lastTagStartChar = htmlString.lastIndexOf("<");
    const lastTagEndChar = htmlString.lastIndexOf(">");
    const isInElement = lastTagStartChar > lastTagEndChar;
    let type;

    if (/ do %>/.test(match) || / -> %>/.test(match)) {
      type = "multiline_expr";
    } else if (/<% end %>/.test(match)) {
      type = "end_expr";
    } else if (/<% else %>/.test(match)) {
      type = "mid_expr";
    } else {
      type = "expr";
    }
    tokens.push({ type: type, content: match, isInElement });
  });

  const string = text.slice(cursorPosition);

  if (cursorPosition !== text.length) {
    // TODO: check if length or -1
    tokens.push({ type: "text", content: string });
  }
  console.log(tokens);

  return tokens;
}
module.exports = {
  tokenize,
};
