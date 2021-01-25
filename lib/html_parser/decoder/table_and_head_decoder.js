const PLACEHOLDER_REGEXP = /<eext\d+/;

const isInTableOrHead = (parts) => {
  for (let [index, part] of parts.entries()) {
    if (part === '/>') {
      // TODO: change name
      const shouldBeBreakPoint = parts[index - 2];

      if (
        typeof shouldBeBreakPoint === 'object' &&
        (shouldBeBreakPoint.type === 'break-parent' || shouldBeBreakPoint.type === 'line')
      ) {
        const partWithEncodedEex = parts[index - 1];

        if (
          partWithEncodedEex.type === 'group' &&
          partWithEncodedEex.contents &&
          typeof partWithEncodedEex.contents.contents === 'string' &&
          partWithEncodedEex.contents.contents.trim().match(PLACEHOLDER_REGEXP)
        ) {
          return true;
        }
      }
    }
  }
};

const decodeInTableOrHead = (parts, expressionMap) => {
  const decodedParts = [];

  for (let [index, part] of parts.entries()) {
    if (part === '/>') {
      const shouldBeBreakPointIndex = index - 2;
      // TODO: change name
      if (parts[shouldBeBreakPointIndex].type === 'break-parent' || parts[shouldBeBreakPointIndex].type === 'line') {
        if (parts[index - 1].type === 'group' && PLACEHOLDER_REGEXP.test(parts[index - 1].contents.contents)) {
          const partWithEncodedEex = decodedParts.pop();
          const encodedEex = partWithEncodedEex.contents.contents.trim();
          const original = expressionMap.get(encodedEex);
          expressionMap.delete(encodedEex);

          decodedParts.push(original.print);
          continue;
        }
      }
    }

    decodedParts.push(part);
  }

  return decodedParts;
};

module.exports = {
  isInTableOrHead,
  decodeInTableOrHead,
};
