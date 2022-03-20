const { tokenizeHTML } = require('prettier-html-templates');
const expressionTypeMatcher = require('./expression_type_matcher');
const { encodeFormForExpressions } = require('./liveview');

function parseEex(text, parsers, options) {
  let liveViewFormExpressions = [];
  let textWithPlaceholders = text;
  // console.log(options)
  console.log('inparser', options)
  console.log('pp', options.parentParser)
  // TODO: don't do anything here when in initial .ex
  if ((options.filepath === undefined || options.filepath.endsWith('.leex')) && text.includes('</form>')) {
    ({ liveViewFormExpressions, textWithPlaceholders } = encodeFormForExpressions(text));
  }

  return {
    tokens: tokenizeHTML(textWithPlaceholders, /<%[\s\S]*?%>/gm, expressionTypeMatcher),
    liveViewFormExpressions,
  };
}

function parseEx(text, parsers, options) {
  return [];
}

module.exports = {
  parserEex: {
    parse: parseEex,
    astFormat: 'eex-ast',
  },
  parserEx: {
    parse: parseEx,
    astFormat: 'ex-ast'
  }
};


// module.exports = {
//   parse,
//   astFormat: 'eex-ast',
// };
