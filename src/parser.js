"use strict";

const { tokenize } = require("./tokenizer");

// const RemoteExtension = require("./extensions/custom-extension");
// const nunjucks = require("nunjucks");
// const ast = require("./ast");

// const mustache = require("mustache");
// const flatMap = require("array.prototype.flatmap");

// const env = new nunjucks.Environment();
// env.addExtension('RemoteExtension', new RemoteExtension());

// function buildPlaceholderTag(id, isAttributePlaceholder, type, nextId) {
//   const pid = `p${id}`;
//   const keepLine = type === TAG_INLINE || type === TAG_FORK;

//   const tagOpenStartChar = isAttributePlaceholder ? "o$" : keepLine ? "<" : "\n<";
//   const tagOpenEndChar = isAttributePlaceholder ? " " : keepLine ? "/> " : ">\n";
//   const tagCloseStartChar = isAttributePlaceholder ? " c$" : `\n</`;

//   let placeholder = "";
//   let key = "";

//   switch (type) {
//     case TAG_END:
//       placeholder = `${tagCloseStartChar}${pid}${tagOpenEndChar}`;
//       key = placeholder.trim();
//       break;
//     case TAG_FORK:
//       const nextPid = `p${nextId}`;
//       placeholder = `${tagCloseStartChar}${pid}${tagOpenEndChar.replace(
//         "/",
//         ""
//       )}${tagOpenStartChar}${nextPid}${tagOpenEndChar.replace("/", "")}`;
//       key = `${tagCloseStartChar}${pid}${tagOpenEndChar.replace("/", "")}`.trim();
//       break;
//     default:
//       placeholder = `${tagOpenStartChar}${pid}${tagOpenEndChar}`;
//       key = `${tagOpenStartChar}${pid}`.trim();
//   }

//   return {
//     placeholder,
//     key,
//   };
// }

// function buildValue(value, options) {
//   if (typeof value !== "string") {
//     return value;
//   }

//   return value
//     .split(" ")
//     .filter((x) => Boolean(x))
//     .join(" ");
// }

// // TODO: Split out
// const TAG_INLINE = 0;
// const TAG_BLOCK = 1;
// const TAG_END = 2;
// const TAG_FORK = 3;

// // TODO: Split out
// const TAG_MAP = new Map([
//   ["if", TAG_BLOCK],
//   ["for", TAG_BLOCK],
//   ["asyncEach", TAG_BLOCK],
//   ["asyncAll", TAG_BLOCK],
//   ["macro", TAG_BLOCK],
//   ["block", TAG_BLOCK],
//   ["raw", TAG_BLOCK],
//   ["verbatim", TAG_BLOCK],
//   ["filter", TAG_BLOCK],
//   ["call", TAG_BLOCK],
//   ["set", TAG_INLINE],
//   ["extends", TAG_INLINE],
//   ["include", TAG_INLINE],
//   ["import", TAG_INLINE],
//   ["from", TAG_INLINE],
//   ["else", TAG_FORK],
//   ["elseif", TAG_FORK],
//   ["elif", TAG_FORK],
// ]);

// function parseTag(token, tagStack, latestText, forceInline, tags = ["{%", "%}"], tagMap = new Map()) {
//   const { type, value, start, end } = token;

//   // Parsed tag
//   if (type === "name") {
//     // TODO: Solidify
//     const tagName = value.split(" ")[0];

//     let tagType = forceInline ? TAG_INLINE : tagName.startsWith("end") ? TAG_END : tagMap.get(tagName);
//     if (tagType === undefined) tagType = TAG_BLOCK;

//     let tagId;
//     let nextId;

//     const lastTagStartChar = latestText.lastIndexOf("<");
//     const lastTagEndChar = latestText.lastIndexOf(">");
//     let isAttributePlaceholder = lastTagStartChar > lastTagEndChar;

//     if (tagType === TAG_BLOCK && tagStack.length && !forceInline) {
//       // Support nested tags within an element
//       const endStackTag = tagStack[tagStack.length - 1];
//       isAttributePlaceholder = endStackTag.isAttributePlaceholder;
//     }

//     if (tagType === TAG_END || (tagType === TAG_FORK && !forceInline)) {
//       const offStackTag = tagStack.pop();
//       tagId = offStackTag.tagId;
//       isAttributePlaceholder = offStackTag.isAttributePlaceholder;

//       if (tagType === TAG_FORK) {
//         nextId = placeholderId++;
//       }
//     } else {
//       tagId = placeholderId++;
//     }

//     const tagLength = end - start;

//     const { placeholder, key } = buildPlaceholderTag(tagId, isAttributePlaceholder, tagType, nextId);

//     token.type = "tag";
//     token.tag = tagName;
//     token.tagId = nextId || tagId;
//     token.tagType = tagType;
//     token.placeholder = placeholder;
//     token.key = key;
//     token.isAttributePlaceholder = isAttributePlaceholder;
//     token.isFork = tagType === TAG_FORK;

//     // TODO: Rewrite value
//     token.print = `${tags[0]} ${buildValue(value, {})} ${tags[1]}`; // TODO: Use configured tags

//     if (tagType === TAG_BLOCK || tagType === TAG_FORK) {
//       tagStack.push(token);
//     }
//   }

//   return token;
// }

// let placeholderId = 0;

// // args: text, parsers, options
// function parse(text, parsers, options) {
//   const variableTags = ["{{", "}}"];
//   // const nunjParsed = nunjucks.parser.parse(text, env.extensionsList);
//   // const mustacheParsed = mustache.parse(text, ["{%", "%}"]);
//   const variableRegex = new RegExp(variableTags[0]);

//   const tagMap = new Map(TAG_MAP);
//   options.blockTags.forEach((t) => tagMap.set(t, TAG_BLOCK));
//   options.inlineTags.forEach((t) => tagMap.set(t, TAG_INLINE));
//   options.forkTags.forEach((t) => tagMap.set(t, TAG_FORK));

//   const tagStack = [];
//   let latestText = "";

//   // TODO: Split out
//   // Handle tags
//   return flatMap(mustacheParsed, ([type, value, start, end]) => {
//     let token = {
//       type,
//       value,
//       start,
//       end,
//     };

//     const isVariable = variableRegex.test(value);

//     if (type === "text") {
//       // Text tag, check to see if it contains the variable opening tags
//       if (isVariable) {
//         const parsed = mustache.parse(value, variableTags);
//         let varLatestText = latestText;

//         return parsed.map(([type, value, start, end]) => {
//           const varToken = {
//             type,
//             value,
//             start,
//             end,
//           };

//           if (type === "text") {
//             varLatestText = value.trim() ? value : varLatestText;
//             return varToken;
//           }

//           return parseTag(varToken, tagStack, varLatestText, true, variableTags, tagMap);
//         });
//       } else {
//         latestText = value.trim() ? value : latestText;
//       }
//     } else {
//       token = parseTag(token, tagStack, latestText, false, ["{%", "%}"], tagMap);
//     }

//     return token;
//   });
// }

// TODO: figure this shit out
function locStart(node) {
  // eslint-disable-next-line no-console
  console.log("locStart", node);
  return -1;
}

// TODO: figure this shit out

function locEnd(node) {
  // eslint-disable-next-line no-console
  console.log("locEnd", node);
  return -1;
}
// TODO: figure this shit out

function hasPragma(/* text */) {
  return false;
}
// function hasPragma(text) {}

// function preprocess(text, options) {}
function eexParse(text, parsers, options) {
  // console.log(tokenize(text));
  return tokenize(text);
}
module.exports = {
  parse: eexParse,
  // The name of the AST that
  astFormat: "eex-ast",
  hasPragma,
  locStart,
  locEnd,
  //preprocess: preprocess
};
