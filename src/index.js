"use strict";

// const options = require("./options");
const parser = require("./parser");
const printers = require("./printers");

module.exports = {
  options: {},
  defaultOptions: {},
  parsers: {
    eex: parser,
  },
  printers,
  languages: [
    {
      // The language name
      name: "Eex",
      // Parsers that can parse this language.
      // This can be built-in parsers, or parsers you have contributed via this plugin.
      parsers: ["eex"],
      extensions: [".eex", ".html.eex"],
    },
  ],
};
