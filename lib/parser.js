const { tokenizeHTML } = require('prettier-html-templates');
const expressionTypeMatcher = require('./expression_type_matcher');

function parse(text, parsers, options) {
  return tokenizeHTML(text, /<%[\s\S]*?%>/gm, expressionTypeMatcher);
}

module.exports = {
  parse,
  astFormat: 'eex-ast',
};
