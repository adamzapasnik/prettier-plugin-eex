const expressionTypeMatcher = (expression) => {
  let type;
  let subType;

  if (/<%[^#]=?[\s\S]*?\sdo\s*%>/.test(expression) || /<%[^#]=?[\s\S]*?\sfn[\s\S]+->\s*%>/.test(expression)) {
    type = 'start';
    if (/(cond|case)\s/.test(expression)) {
      subType = 'nested';
    }
  } else if (/<%\s*end\s*%>/.test(expression)) {
    type = 'end';
  } else if (/<%\s*else\s*%>/.test(expression)) {
    type = 'middle';
  } else if (/<%[^#]=?[\s\S]*?\s->\s*%>/.test(expression)) {
    type = 'middle_nested';
  } else {
    type = 'plain';
  }

  return { type, subType };
};

module.exports = expressionTypeMatcher;
