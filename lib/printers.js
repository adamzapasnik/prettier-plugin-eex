const { encodeExpressions } = require('./html_parser/encoder');
const { decodeExpressions } = require('./html_parser/decoder');
const { formatEex } = require('./eex/formatter');
const { mapDoc } = require('prettier').doc.utils;
const { concat, group } = require('prettier').doc.builders;

// args: path, print, textToDoc, options
function embed(path, _print, textToDoc, options) {
  const tokens = path.stack[0];
  const formattedTokens = formatEex(tokens, options);

  const isTextWithExpressions = tokens.find((token) => token.type === 'text' && token.content.trim());

  if (!isTextWithExpressions) {
    return group(concat(formattedTokens.map((t) => t.content)));
  }

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
