function encodeExpressions(tokens) {
  const expressionMap = new Map();
  const open = [];
  const conds = [];
  let id = 0;
  let lastId = 0;
  let firstCond = false;

  const textWithPlaceholders = tokens
    .map((token) => {
      const {
        type,
        subType,
        content,
        inElement,
        afterInlineEndTag,
        inScript,
        inComment,
        afterWhitespace,
        inElementWithoutNeedToEncode,
      } = token;

      if (inComment || inElementWithoutNeedToEncode) {
        return content;
      }

      switch (type) {
        case 'text':
          return content;

        case 'multiline_expr': {
          id++;
          open.push(id);

          if (subType === 'case' || subType === 'cond') {
            conds.push(id);
            firstCond = false;
          }

          if (inElement) {
            expressionMap.set(`eexa${id}`, { print: content, ...token });

            return `eexa${id} `;
          }

          expressionMap.set(`<eext${id}>`, { print: content, ...token });
          // TODO: added space
          const addNewLineBefore = afterWhitespace ? '' : '\n';
          return `${addNewLineBefore}<eext${id}>\n`;
        }
        case 'expr': {
          id++;

          if (inScript) {
            expressionMap.set(`eexs${id}eexs`, { print: content, ...token });

            return `eexs${id}eexs`;
          }

          if (inElement) {
            expressionMap.set(`eex${id}eex`, { print: content, ...token });

            return `eex${id}eex`;
          }

          expressionMap.set(`<eext${id}`, { print: content, ...token });

          const addBeforeSpace = afterInlineEndTag ? '' : ' ';

          return `${addBeforeSpace}<eext${id} /> `;
        }
        case 'mid_expr':
          lastId = open.pop();
          id++;
          open.push(id);

          if (inElement) {
            expressionMap.set(`eexc${lastId}`, { print: '', ...token });
            expressionMap.set(`eexa${id}`, { print: content, ...token });

            return ` eexc${lastId} eexa${id} `;
          }

          expressionMap.set(`</eext${lastId}>`, { print: '', isMidExpression: true, ...token });
          expressionMap.set(`<eext${id}>`, { print: content, isMidExpression: true, ...token });

          return `\n</eext${lastId}> <eext${id}> `;

        case 'mid_cond':
          if (!firstCond) {
            firstCond = true;
            id++;
            open.push(id);
            expressionMap.set(`<eext${id}>`, { print: content, ...token });

            return `<eext${id}>\n`;
          } else {
            lastId = open.pop();
            id++;
            open.push(id);

            expressionMap.set(`</eext${lastId}>`, { print: '', isMidExpression: true, type: type });
            expressionMap.set(`<eext${id}>`, { print: content, isMidExpression: true, type: type });

            return `\n</eext${lastId}> <eext${id}>`;
          }

        case 'end_expr':
          lastId = open.pop();

          if (open.length && conds.length && conds.includes(open[open.length - 1])) {
            const condEnd = open.pop();

            expressionMap.set(`</eext${lastId}>`, { print: '', ...token });
            expressionMap.set(`</eext${condEnd}>`, { print: content, ...token });

            return `</eext${lastId}> </eext${condEnd}>`;
          }

          if (inElement) {
            expressionMap.set(`eexc${lastId}`, { print: content, ...token });

            return ` eexc${lastId} `;
          }

          expressionMap.set(`</eext${lastId}>`, { print: content, ...token });

          return ` </eext${lastId}>`;
      }
    })
    .join('');

  if (open.length > 0) {
    // TODO: better error wording?
    throw 'missing <% end %>';
  }

  return [textWithPlaceholders, expressionMap];
}

module.exports = {
  encodeExpressions,
};
