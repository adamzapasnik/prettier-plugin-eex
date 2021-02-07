const { concat, indent, hardline, group } = require('prettier').doc.builders;
const { execSync } = require('child_process');
const path = require('path');

// TODO: add formatting option to format multiline by urself
// TODO: better naming please

const formatEex = (tokens, options = {}) => {
  const collectedMultiLine = {};

  tokens.forEach((token, index) => {
    if (token.type !== 'text' && token.content.match(/\r?\n/)) {
      collectedMultiLine[index] = true;
    }
  });

  const outputMap = {};
  const encodedCode = Object.keys(collectedMultiLine)
    .sort()
    .map((tokenIndex, index) => {
      const matcher = tokens[tokenIndex].content.match(/<%(#=|%=|=|%|#)?([\S\s]*?)\s*%>/m);
      const expression = matcher[2];
      outputMap[index] = tokenIndex;
      return Buffer.from(expression).toString('base64');
    });

  if (encodedCode.length) {
    const { eexMultilineLineLength, eexMultilineNoParens } = options;
    let eexFormatterOptions = `--line-length=${eexMultilineLineLength}`;
    if (eexMultilineNoParens.length) {
      eexFormatterOptions = eexFormatterOptions.concat(' --no-parens=${eexFormatterOptions.join(", ")}');
    }

    const binPath = path.join(__dirname, '..', 'prettier_eex_formatter_release');
    execSync(`${binPath} ${encodedCode.join(' ')} ${eexFormatterOptions}`, {
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .forEach((encodedFormattedCode, index) => {
        const tokenIndex = outputMap[index];
        collectedMultiLine[tokenIndex] = Buffer.from(encodedFormattedCode, 'base64').toString();
      });
  }

  return tokens
    .map((token) => ({ ...token }))
    .map((token, index) => {
      if (token.type === 'text') return token;

      const matcher = token.content.match(/<%(#=|%=|=|%|#)?([\S\s]*?)\s*%>/m);
      const tag = matcher[1] || '';
      const expression = matcher[2];
      const ssq = expression.match(/^\s*\r?\n\s*\S/) ? hardline : ' ';
      const exprr = '<%' + tag;

      if (expression.match(/\r?\n/)) {
        const formattedCode = collectedMultiLine[index];

        let cursorPosition = 0;
        let formattedExpression = [];

        formattedCode.replace(/\r?\n/g, (match, offset) => {
          if (cursorPosition !== offset) {
            let string = formattedCode.slice(cursorPosition, offset);
            if (formattedExpression.length && ssq === ' ') {
              string = ' '.repeat(exprr.length + 1 - 2) + string;
            }
            formattedExpression.push(string);
          }

          formattedExpression.push(hardline);
          cursorPosition = offset + match.length;
        });

        let string = formattedCode.slice(cursorPosition);
        if (string.length && ssq === ' ') {
          string = ' '.repeat(exprr.length + 1 - 2) + string;
        }
        formattedExpression.push(string);

        token.content = group(concat([exprr, indent(concat([ssq, concat(formattedExpression)])), ssq, '%>']));
      } else {
        token.content = `${exprr} ${expression.trim()} %>`;
      }

      return token;
    });
};

module.exports = {
  formatEex,
};
