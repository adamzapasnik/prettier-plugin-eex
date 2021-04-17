const prettier = require('prettier');
const { mapDoc } = require('prettier').doc.utils;
const { concat, hardline } = require('prettier').doc.builders;
const { encodeExpressions, decodeExpressions } = require('prettier-html-templates');
const { formatEex } = require('./formatter');
const { liveViewFormForPlaceholder } = require('./liveview');

let embedTextToDoc;

function embed(path, _print, textToDoc, options) {
  embedTextToDoc = textToDoc;
}

function print(path, options, _print) {
  const { tokens, liveViewFormExpressions } = path.stack[0];

  const expressionsCount = tokens.filter((token) => token.type !== 'text').length;

  if (expressionsCount === 0) {
    return prettier.format(options.originalText, { ...options, parser: 'html' });
  }

  const formattedTokens = formatEex(tokens, options);

  const isTextOnlyWithSingleExpression =
    expressionsCount === 1 && !tokens.find((token) => token.type === 'text' && token.content.trim());

  if (isTextOnlyWithSingleExpression) {
    return concat([formattedTokens.find((token) => token.type !== 'text').content, hardline]);
  }

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
