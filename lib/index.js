const parser = require('./parser');
const printers = require('./printers');

module.exports = {
  options: {
    eexMultilineLineLength: {
      type: 'int',
      category: 'Global',
      default: 98,
      description: 'The line length passed to Code.formatted_string to format multiline expressions.',
      range: { start: 0, end: Infinity, step: 1 },
    },
    eexMultilineNoParens: {
      type: 'string',
      category: 'Global',
      array: true,
      default: [{ value: [] }],
      description: "The functions that shouldn't have arguments wrapped in parens when formatted multiline expression.",
    },
  },
  defaultOptions: {},
  parsers: {
    eex: parser,
  },
  printers,
  languages: [
    {
      name: 'html-eex',
      parsers: ['eex'],
      // TODO: ADD mjml?
      extensions: ['.html.eex', '.html.leex'],
      vscodeLanguageIds: ['html-eex'],
    },
  ],
};
