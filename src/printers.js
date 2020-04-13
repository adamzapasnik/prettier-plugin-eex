"use strict";

// const { mapRestoreTags } = require("./printer/restore");
const { mapPlaceholders } = require("./printer/placeholders");
const { mapDoc } = require("prettier").doc.utils;
const PLACEHOLDER_REGEX = /f\d+/;

const { breakParent, concat, indent, softline, hardline, group, line, join } = require("prettier").doc.builders;
let embedTextToDoc;

// args: path, options, print
function print(path) {
  const parsedArray = path.stack[0];
  // 1. Need to find all Nunjucks nodes and replace them with placeholders.
  // 2. Run the place-held doc through the HTML formatter.
  // 3. Upon return, re-instate the Nunjucks template tags with formatting.

  const placeholderMap = new Map();

  // 1. Install placeholders.
  const placeheldString = mapPlaceholders(parsedArray, placeholderMap);

  // 2. Run through HTML formatter.
  const htmlDoc = hoistedTextToDoc(placeheldString, { parser: "html" });

  // 3. Restore Tags.
  const callback = mapRestoreTags(placeholderMap);
  return mapDoc(htmlDoc, callback);
}

// TODO: later
// args: path, print, textToDoc, options
function embed(path, print, textToDoc) {
  embedTextToDoc = textToDoc;

  return null;
}

const hasElementAttributePlaceholder = (part) => part.match(/eex\d+/);

function printAttributePlaceholder(arr, placeholderMap) {
  // Find "blocks" and indent contents. Remember to support nested.
  const parts = [];
  let index = -1;
  console.log("inPRINT");
  console.log(arr);
  let subParts = [];
  let indenta = false;
  for (const part of arr) {
    index++;
    // console.log("nextedpart", part);
    // Only care about placeholder strings
    console.log("parts", parts);
    console.log("subParts", subParts);
    console.log("part", part);

    if (typeof part !== "string" || !hasElementAttributePlaceholder(part)) {
      if (typeof part === "object" && part.type === "line") {
        if (indenta) {
          continue;
        }
      }
      //   // parts.push({ type: "softline" });
      //   // parts.push(indent);
      //   continue;
      // }
      // parts.push(indent([part, softline]));
      if (indenta) {
        subParts.push(concat([hardline, part]));
      } else {
        parts.push(part);
      }
      // } else {
      // }
      // // parts.push(concat([indent, part]));
      continue;
    }
    //NOTE:  MMM, TO DZIALA fajnie

    let el = null;
    const tt = part.replace(/eex\d+/, function (match) {
      // let key = findKey(match, placeholderMap);
      // console.log()
      el = placeholderMap.get(match);
      return el.print;
    });
    console.log(el);
    // parts.push(newPart);
    if (el.type === "multiline_expr") {
      // parts.push(indent(concat([tt, hardline])));
      parts.push(concat(tt));
      indenta = true;
      // subParts.push(tt);
    } else if (el.type === "end_expr") {
      // subParts.push(tt);
      // join(concat([',', line])
      parts.push(indent(concat(subParts)));
      parts.push(concat([hardline, tt]));
      console.log("subParts", subParts);
      console.log(JSON.stringify(parts, null, 2));
      subParts = [];
    } else {
    }
    // https://dev.to/fvictorio/how-to-write-a-plugin-for-prettier-6gi
    // }
    // parts.push(concat([el, softline]));

    // parts.push(indent);
    // parts.push(softline);
    // parts.push(newPart);

    continue;
    // Placeholder is within a string, break into parts and recurse
    if (typeof part === "string") {
      // && !hasElementAttributePlaceholder(part)) {
      let partBreakdown = part;
      const placeholders = part.match(PLACEHOLDER_REGEX);
      // console.log("ppp", placeholders);
      const attributeParts = [];

      while (placeholders.length) {
        const placeholder = placeholders.shift();
        const splitAttribute = partBreakdown.split(placeholder);

        if (splitAttribute[0]) {
          // Include the attribute part if it's not just whitespace
          if (splitAttribute[0].trim()) {
            attributeParts.push(splitAttribute[0]);
          } else {
            // If it's whitespace, it's a softline
            attributeParts.push(" ");
            attributeParts.push(softline);
          }
        }

        attributeParts.push(placeholder);
        partBreakdown = splitAttribute[1];

        if (placeholders.length === 0) {
          attributeParts.push(splitAttribute[1].trim());
        }
      }

      const attributePartGroup = printAttributePlaceholder(attributeParts, placeholderMap);
      parts.push(group(concat(attributePartGroup)));
      continue;
    }

    const original = findOriginal(part, placeholderMap);

    if (original) {
      parts.push(original.print);

      if (original.tagType === 1 || original.tagType === 3) {
        // Capture parts until end tag found
        const endPlaceholder = part.replace("o", "c");
        let found = false;
        let captureIndex = index;
        const maxIndex = arr.length;
        let captureCount = 0;

        while (!found && captureIndex < maxIndex) {
          captureIndex++;
          captureCount++;

          if (arr[captureIndex] === endPlaceholder) {
            found = true;
          }
        }

        const indentGroup = arr.splice(index + 1, captureCount).map((item) =>
          // Change all softlines to hardlines
          typeof item === "object" && item.type === "line" ? hardline : item
        );

        const lastGroupItem = indentGroup[indentGroup.length - 1];
        let closeGroup = hardline;

        // Remove end placeholder if it's a fork
        if (lastGroupItem === endPlaceholder) {
          const originalLastGroupItem = findOriginal(lastGroupItem, placeholderMap);

          if (originalLastGroupItem.isFork) {
            indentGroup.pop(); // Empty tag
            indentGroup.pop(); // Extra line
          } else if (originalLastGroupItem.tagType === 2) {
            indentGroup.pop(); // End tag
            indentGroup.pop(); // Extra line
            closeGroup = concat([hardline, originalLastGroupItem.print]);
          }
        }

        // Indent group
        const doc = concat([group(indent(concat(printAttributePlaceholder(indentGroup, placeholderMap)))), closeGroup]);

        // Remove extra line
        let deleteCount = 0;
        // if (isBuilderLine(arr[index + 1])) {
        //   deleteCount = 1;
        // }

        arr.splice(index + 1, deleteCount, doc);
      }
      continue;
    }

    // Fallback to doing nothing
    parts.push(part);
  }
  console.log("beforeleave", group(concat(parts)));
  console.log(JSON.stringify(group(concat(parts)), null, 2));
  return [group(concat(parts))];
  // return parts;
}
function mapRestoreTags(mapEex) {
  return function (doc) {
    if (!doc.parts) {
      return doc;
    }

    const arr = [...doc.parts];
    const parts = [];

    const isInElement = arr.some((part) => (typeof part === "string" ? hasElementAttributePlaceholder(part) : false));

    // Self Closing
    if (isSelfClosingPlaceholder(arr)) {
      const selfClosingPlaceholder = getSelfClosingPlaceholder(
        {
          parts: arr,
        },
        mapEex
      );

      parts.push(selfClosingPlaceholder.print);

      // Maintain whitespace if it's there.
      if (arr[2] && arr[2].type === "line") {
        parts.push(arr[2]);
      }
    }

    // Within Element
    else if (isInElement) {
      console.log("wtf");
      // console.log("\nbuattr");
      // console.log("partsss", arr);
      parts.push(...printAttributePlaceholder(arr, mapEex));
      // parts.push(...arr);
    }

    // Block (probably)
    else {
      for (const part of arr) {
        const original = findOriginal(part, mapEex);

        // console.log("part", part);
        if (original) {
          if (original.print !== "") {
            if (original.isMidExpression) {
              parts.push(concat([original.print, breakParent]));
            } else {
              parts.push(original.print);
            }
            continue;
          }

          if (original.isMidExpression && original.print === "") {
            break;
            // If not within an element, end immediately to prevent excess blank lines
            // if (!original.isAttributePlaceholder) {
            // }
          }

          continue;
        }

        parts.push(part);
      }

      if (parts.some((part) => part === undefined)) {
        throw Error("Cannot have undefined parts");
      }
    }

    return Object.assign({}, doc, { parts });
    return doc;
  };
}

function isSelfClosingPlaceholder(arr) {
  if (!Array.isArray(arr) || !arr.length) {
    return false;
  }

  const isOpeningGroup = arr[0].type === "group";
  const isSelfClosing = arr[1] === "/>";

  if (!isOpeningGroup || !isSelfClosing) {
    return;
  }

  return PLACEHOLDER_REGEX.test(arr[0].contents.contents);
}

// TODO: Split out
function getSelfClosingPlaceholder(doc, placeholderMap) {
  if (typeof doc !== "object") {
    return;
  }

  const { parts } = doc;

  if (!parts) {
    return;
  }

  const isPlaceholder = isSelfClosingPlaceholder(parts);
  if (!isPlaceholder) {
    return;
  }

  const placeholder = parts[0].contents.contents.trim();
  return placeholderMap.get(placeholder);
}

function findKey(key, placeholderMap) {
  if (placeholderMap.has(key)) {
    return key;
  }

  const altKey = key.replace(">", "");
  if (placeholderMap.has(altKey)) {
    return altKey;
  }

  return undefined;
}
function findOriginal(part, placeholderMap) {
  let key = "";
  const partIsString = typeof part === "string";
  const partIsPlaceholder = partIsString && PLACEHOLDER_REGEX.test(part);

  if (partIsString && part === "") {
    return;
  }

  if (partIsPlaceholder) {
    key = findKey(part, placeholderMap);
  } else {
    // These are usually elements
    // TODO: Split this out
    const partIsObject = typeof part === "object";
    const contentsIsString = partIsObject && typeof part.contents === "string";
    const contentsIsPlaceholder = contentsIsString && PLACEHOLDER_REGEX.test(part.contents);

    if (contentsIsPlaceholder) {
      key = findKey(part.contents, placeholderMap);
    }
  }

  if (!key) {
    return;
  }

  if (placeholderMap.has(key)) {
    const original = placeholderMap.get(key);
    placeholderMap.delete(key);
    return original;
  }
}

function printEex(path, options, print) {
  const text = options.originalText;

  const regexp = /<%.*%>/g;

  let id = 0;
  let open = [];

  const mapEex = new Map([]);
  const replaced = text.replace(regexp, function (match, offset) {
    if (/ do %>/.test(match) || / -> %>/.test(match)) {
      id++;
      open.push(id);
      mapEex.set(`<f${id}`, { print: match });
      return `<f${id}>`;
    } else if (/<% end %>/.test(match)) {
      const lastId = open.pop();
      mapEex.set(`</f${lastId}>`, { print: match });

      return `\n</f${lastId}>`;
    } else if (/<% else %>/.test(match)) {
      const lastId = open.pop();

      let s = "";
      s = s.concat(`\n</f${lastId}> `);
      mapEex.set(`</f${lastId}>`, { print: "", isMidExpression: true });

      id++;
      open.push(id);
      s = s.concat(`<f${id}>`);
      mapEex.set(`<f${id}`, { print: match, isMidExpression: true });

      return s;
    } else {
      const latestText = text.slice(0, offset);
      const lastTagStartChar = latestText.lastIndexOf("<");
      const lastTagEndChar = latestText.lastIndexOf(">");
      const isAttributePlaceholder = lastTagStartChar > lastTagEndChar;
      if (isAttributePlaceholder) {
        return "eex12";
      }
      id++;
      mapEex.set(`<f${id}`, { print: match, isAttributePlaceholder });

      return `<f${id} />`;
    }
  });
  const htmlDoc = embedTextToDoc(replaced, { parser: "html" });
  const callback = mapRestoreTags(mapEex);

  return mapDoc(htmlDoc, callback);
}

function printEext(path, options, print) {
  let id = 0;
  let open = [];
  let lastId;
  const mapEex = new Map([]);

  const tokens = path.stack[0];
  // console.log(tokens);
  const placeholder = tokens
    .map((token) => {
      const { type: type, content: content, isInElement: isInElement } = token;
      switch (type) {
        case "text":
          return content;

        case "multiline_expr":
          id++;
          open.push(id);
          if (isInElement) {
            mapEex.set(`eex${id}`, { print: content, isInElement, type: type });

            return `eex${id}`;
          }
          mapEex.set(`<f${id}`, { print: content, type: type });
          return `<f${id}>`;

        case "expr":
          id++;
          if (isInElement) {
            mapEex.set(`eex${id}`, { print: content, isInElement, type: type });

            return `eex${id}`;
          }

          mapEex.set(`<f${id}`, { print: content, isInElement, type: type });

          return `<f${id} />`;

        case "mid_expr":
          if (isInElement) {
            id++;
            mapEex.set(`eex${id}`, { print: content, isInElement, type: type });
            return `eex${id}`;
          }
          lastId = open.pop();

          let s = `\n</f${lastId}> `;
          mapEex.set(`</f${lastId}>`, { print: "", isMidExpression: true, type: type });

          id++;
          open.push(id);
          s = s.concat(`<f${id}>`);
          mapEex.set(`<f${id}`, { print: content, isMidExpression: true, type: type });

          return s;

        case "end_expr":
          if (isInElement) {
            id++;
            mapEex.set(`eex${id}`, { print: content, isInElement, type: type });
            return `eex${id}`;
          }
          lastId = open.pop();
          mapEex.set(`</f${lastId}>`, { print: content, type: type });

          return `\n</f${lastId}>`;

        default:
          // return "";
          break;
      }
    })
    .join("");

  console.log(placeholder);
  const htmlDoc = embedTextToDoc(placeholder, { parser: "html" });

  const callback = mapRestoreTags(mapEex);
  return mapDoc(htmlDoc, callback);
  return [];
}

module.exports = {
  "eex-ast": {
    print: printEext,
    embed,
  },
};

// if 1
//   if 2
//    ...
//   end /2
// else /1 3
//   if 4
//     ...
//   else /4 5
//     ...
//   end /5
// end /3

// if
//   if
//    ...
//   end
// else
//   if
//     ...
//   else
//     ...
//   end
// end

// const replaced = text.replace(regexp, function (match, offset) {
//   if (/ do %>/.test(match) || / -> %>/.test(match)) {
//     id++;
//     open.push(id);
//     mapEex.set(`<f${id}`, { print: match });
//     return `<f${id}>`;
//   } else if (/<% end %>/.test(match)) {
//   } else if (/<% else %>/.test(match)) {
//     const lastId = open.pop();

//     let s = "";
//     s = s.concat(`\n</f${lastId}> `);
//     mapEex.set(`</f${lastId}>`, { print: "", isMidExpression: true });

//     id++;
//     open.push(id);
//     s = s.concat(`<f${id}>`);
//     mapEex.set(`<f${id}`, { print: match, isMidExpression: true });

//     return s;
//   } else {
//     const latestText = text.slice(0, offset);
//     const lastTagStartChar = latestText.lastIndexOf("<");
//     const lastTagEndChar = latestText.lastIndexOf(">");
//     const isAttributePlaceholder = lastTagStartChar > lastTagEndChar;
//     if (isAttributePlaceholder) {
//       return "eex12";
//     }
//     id++;
//     mapEex.set(`<f${id}`, { print: match, isAttributePlaceholder });

//     return `<f${id} />`;
//   }
// });
