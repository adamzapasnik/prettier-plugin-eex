/**
 * Restore Functions
 */

const { breakParent, concat, indent, softline, hardline, group } = require("prettier").doc.builders;
const { PLACEHOLDER_REGEX, ATTRIBUTE_PLACEHOLDER_REGEX } = require("./placeholders");
const { isBuilderLine } = require("./helpers");

function findKey(key, placeholderMap) {
  if (placeholderMap.has(key)) return key;

  const altKey = key.replace(">", "");
  if (placeholderMap.has(altKey)) return altKey;

  return undefined;
}

function findOriginal(part, placeholderMap) {
  let key = "";
  const partIsString = typeof part === "string";
  const partIsPlaceholder = partIsString && PLACEHOLDER_REGEX.test(part);

  if (partIsString && part === "") return;

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

  if (!key) return;

  if (placeholderMap.has(key)) {
    const original = placeholderMap.get(key);
    placeholderMap.delete(key);
    return original;
  }

  // eslint-disable-next-line no-console
  // console.warn("Unable to find original for placeholder:", key);
}

const isElementAttributePlaceholder = (part) =>
  // TODO: Pull strings from constants file
  part.startsWith("o$") || part.startsWith("c$");

const hasElementAttributePlaceholder = (part) =>
  // TODO: Pull strings from constants file
  part.includes("o$") || part.includes("c$");

function printAttributePlaceholder(arr, placeholderMap) {
  // Find "blocks" and indent contents. Remember to support nested.
  const parts = [];
  let index = -1;

  for (const part of arr) {
    index++;

    // Only care about placeholder strings
    if (typeof part !== "string" || !hasElementAttributePlaceholder(part)) {
      parts.push(part);
      continue;
    }

    // Placeholder is within a string, break into parts and recurse
    if (typeof part === "string" && !isElementAttributePlaceholder(part)) {
      let partBreakdown = part;
      const placeholders = part.match(ATTRIBUTE_PLACEHOLDER_REGEX);
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

        if (placeholders.length === 0) attributeParts.push(splitAttribute[1].trim());
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

          if (arr[captureIndex] === endPlaceholder) found = true;
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
        if (isBuilderLine(arr[index + 1])) {
          deleteCount = 1;
        }

        arr.splice(index + 1, deleteCount, doc);
      }
      continue;
    }

    // Fallback to doing nothing
    parts.push(part);
  }

  return parts;
}

function mapRestoreTags(placeholderMap) {
  return function (doc) {
    if (!doc.parts) {
      return doc;
    }

    const arr = [...doc.parts];
    const parts = [];

    // Markup within an element?
    const isAttributePlaceholder = arr.some((part) =>
      typeof part === "string" ? hasElementAttributePlaceholder(part) : false
    );

    // Self Closing
    if (isSelfClosingPlaceholder(arr)) {
      const selfClosingPlaceholder = getSelfClosingPlaceholder(
        {
          parts: arr,
        },
        placeholderMap
      );

      parts.push(selfClosingPlaceholder.print);

      // Maintain whitespace if it's there.
      if (arr[2] && arr[2].type === "line") parts.push(arr[2]);
    }

    // Within Element
    else if (isAttributePlaceholder) {
      parts.push(...printAttributePlaceholder(arr, placeholderMap));
    }

    // Block (probably)
    else {
      let index = -1;

      for (const part of arr) {
        index++;
        const original = findOriginal(part, placeholderMap);

        if (original) {
          if (original.print !== "") {
            if (original.isFork) {
              parts.push(concat([original.print, breakParent]));
            } else {
              parts.push(original.print);
            }
            continue;
          }

          if (original.isFork && original.print === "") {
            // If not within an element, end immediately to prevent excess blank lines
            if (!original.isAttributePlaceholder) break;
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
  };
}

// TODO: Split out
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

module.exports = {
  mapRestoreTags,
};
