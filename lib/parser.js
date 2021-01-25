'use strict';

const { tokenize } = require('./eex/tokenizer');

function parse(text, parsers, options) {
  return tokenize(text);
}

module.exports = {
  parse,
  astFormat: 'eex-ast',
};
