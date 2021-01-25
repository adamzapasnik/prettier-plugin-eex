const { concat, indent, hardline, group } = require('prettier').doc.builders;

const isInElement = (parts) => parts.some((part) => typeof part === 'string' && part.match(/eex[a|c]?\d+/));

const decodeInAttributes = (parts, expressionMap) => {
  const partlyDecodedParts = decodeInAttributeValues(parts, expressionMap);

  return decodeInAttributeNames(partlyDecodedParts, expressionMap);
};

const decodeInAttributeNames = (parts, expressionMap, shouldIndent = false) => {
  const decodedParts = [];
  let skipIndex = false;

  for (const [index, part] of parts.entries()) {
    if (skipIndex && index <= skipIndex) {
      continue;
    }

    skipIndex = false;

    if (shouldIndent && typeof part === 'object' && part.type === 'line') {
      decodedParts.push(hardline);

      continue;
    }

    if (typeof part !== 'string' || !/^eexa\d+$/.test(part)) {
      decodedParts.push(part);

      continue;
    }

    if (/^eexa\d+$/.test(part)) {
      const endPart = part.replace('a', 'c');
      const endIndex = parts.indexOf(endPart);
      const endOriginal = expressionMap.get(parts[endIndex]);
      expressionMap.delete(parts[endIndex]);

      const indentGroup = parts.slice(index + 1, endIndex);
      const nested = decodeInAttributeNames(indentGroup, expressionMap, true);
      nested.pop(); //removes indented extra line

      const expr = expressionMap.get(part);
      expressionMap.delete(part);
      const list = [expr.print, indent(concat(nested))];

      if (endOriginal.print !== '') {
        list.push(hardline);
        list.push(endOriginal.print);
      }

      decodedParts.push(group(concat(list)));
      skipIndex = endIndex;
    }
  }

  return decodedParts;
};

const decodeInAttributeValues = (parts, expressionMap) => {
  const decodedParts = [];

  for (const part of parts) {
    if (typeof part !== 'string') {
      decodedParts.push(part);

      continue;
    }

    let decoded = part.replace(/eex\d+eex/g, (match) => {
      const expr = expressionMap.get(match);
      expressionMap.delete(match);

      return expr.print;
    });

    if (!/^eex[a|c]\d+$/.test(decoded)) {
      // class="<% %>" doesn't have whitespace
      decoded = decoded.replace(/\s?eex[a|c]\d+\s/g, (match) => {
        const expr = expressionMap.get(match.trim());
        expressionMap.delete(match.trim());
        const afterSpace = expr.afterWhitespace ? ' ' : '';
        const beforeSpace = expr.beforeWhiteSpace ? ' ' : '';

        return afterSpace + expr.print + beforeSpace;
      });
    }

    decodedParts.push(decoded);
  }

  return decodedParts;
};

module.exports = {
  isInElement,
  decodeInAttributes,
};
