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

function printEex(path, options, _print) {
  return ''
  console.time('printEex')

  const { tokens, liveViewFormExpressions } = path.stack[0];

  const isTextWithExpressions = tokens.find((token) => token.type !== 'text');

  if (!isTextWithExpressions) {
    // const doc = embedTextToDoc(options.originalText, { ...options, parser: 'html' })
    // const {formatted} = require('prettier').doc.printer.printDocToString(doc, options)
    // return formatted
    // console.log(options)
    const r = prettier.format(options.originalText, { ...options, parser: 'html' });

    return r
  }

  const formattedTokens = formatEex(tokens, options);
  const [textWithPlaceholders, expressionMap] = encodeExpressions(formattedTokens);

  const htmlDoc = embedTextToDoc(textWithPlaceholders, { parser: 'html' });

  const callback = decodeExpressions(expressionMap);
  
  const r = mapDoc(htmlDoc, (doc) => {
    let newDoc = doc;
    if (doc === liveViewFormForPlaceholder && liveViewFormExpressions.length) {
      newDoc = liveViewFormExpressions.shift();
    }
    
    return callback(newDoc);
  });
  console.timeEnd('printEex')
  return  r
}

const printEx = (path, options, print) => {
  const text = options.originalText;
  
  if (!text.match('~L"""')) return text
  // console.log(options)
  // TODO: ~e/~E
  const newText = text.replace(/([\s]*)~L"""([\s\S]*?)\S*?"""/gm, (match, indent, html) => {
    // const matcher = match.match(/<%(#=|%=|=|%|#)?([\S\s]*?)\s*%>/m);
    // const tag = matcher[1] || '';
    // const expression = matcher[2];
    // console.log('htm', html);
    const indentSpaces = indent.replace(/(\r\n|\n|\r)/gm, '');
    // console.time('textToDoc')
    // // const doc = embedTextToDoc(html, { ...options, parser: 'eex', originalText: html })
    // // const {formatted} = require('prettier').doc.printer.printDocToString(doc, options)
    // console.timeEnd('textToDoc')
    // console.log(formatted)
    console.time('format')
    const newDoc = prettier.format(html, { plugins: options.plugins, parser: 'eex'});
    console.timeEnd('format')
    // console.log('f', newDoc)
    const newDocIndented = html.trim().replace(/(\r\n|\n|\r)+/gm, `$&${indentSpaces}`);
    return `${indent}~L"""\n${indentSpaces}${newDocIndented}\n${indentSpaces}"""`;
  });

  return newText;
};

module.exports = {
  'eex-ast': {
    embed,
    print: printEex,
  },
  'ex-ast': {
    embed,
    print: printEx,
  },
};
