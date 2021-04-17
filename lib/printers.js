const prettier = require('prettier');
const { mapDoc } = require('prettier').doc.utils;
const { encodeExpressions, decodeExpressions } = require('prettier-html-templates');
const { formatEex } = require('./formatter');
const { liveViewFormForPlaceholder } = require('./liveview');

let embedTextToDoc;

function embed(path, _print, textToDoc, options) {
  embedTextToDoc = textToDoc;
}

function print(path, options, _print) {
  const { tokens, liveViewFormExpressions } = path.stack[0];

  const isTextWithExpressions = tokens.find((token) => token.type !== 'text');

  if (!isTextWithExpressions) {
    return prettier.format(options.originalText, { ...options, parser: 'html' });
  }

  const formattedTokens = formatEex(tokens, options);
  const [textWithPlaceholders, expressionMap] = encodeExpressions(formattedTokens);

  const htmlDoc = embedTextToDoc(textWithPlaceholders, { parser: 'html' });

  const callback = decodeExpressions(expressionMap);
  return mapDoc(htmlDoc, (doc) => {
    let newDoc = doc;
    if (doc === liveViewFormForPlaceholder && liveViewFormExpressions.length) {
      newDoc = liveViewFormExpressions.shift();
    }

    return callback(newDoc);
  });
}

module.exports = {
  'eex-ast': {
    embed,
    print,
  },
};
