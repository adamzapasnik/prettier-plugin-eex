const prettier = require('prettier');
const { mapDoc } = require('prettier').doc.utils;
const { encodeExpressions, decodeExpressions } = require('prettier-html-templates');
const { formatEex } = require('./formatter');

// args: path, print, textToDoc, options
function embed(path, _print, textToDoc, options) {
  const tokens = path.stack[0];

  const isTextWithExpressions = tokens.find((token) => token.type !== 'text');

  if (!isTextWithExpressions) {
    return prettier.format(options.originalText, { ...options, parser: 'html' });
  }

  const formattedTokens = formatEex(tokens, options);
  const [text, expressionMap] = encodeExpressions(formattedTokens);

  const htmlDoc = textToDoc(text, { parser: 'html' });

  const callback = decodeExpressions(expressionMap);

  return mapDoc(htmlDoc, callback);
}

module.exports = {
  'eex-ast': {
    embed: (path, _print, textToDoc, options) => {
      try {
        return embed(path, _print, textToDoc, options);
      } catch (e) {
        console.error(e);
        return options.originalText;
      }
    },
  },
};
