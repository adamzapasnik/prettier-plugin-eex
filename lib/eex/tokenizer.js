const getLastIndexOfRegexp = (string, regexp) => {
  const match = string.match(new RegExp(regexp, 'mg'));

  return match ? string.lastIndexOf(match[match.length - 1]) : -1;
};

const isWithinElement = (htmlBeforeExpression, element) => {
  const regexp = new RegExp(`<${element}[\\s\\S]*?>`);

  return getLastIndexOfRegexp(htmlBeforeExpression, regexp) > htmlBeforeExpression.lastIndexOf(`</${element}>`);
};

function tokenize(text) {
  const regexp = /<%[\s\S]*?%>/gm;

  const tokens = [];
  let cursorPosition = 0;
  let html = '';
  let htmlWithPlaceholders = ''; // <meta name="apple-itunes-app" content="app-id=<%= apple_id %>" />

  const closedTags = text.match(/<\/\w+>/gm);
  const uniqueClosedTags = new Set(closedTags);
  const rawElementsInText = [
    'pre',
    'code',
    'samp',
    'kbd',
    'var',
    'ruby',
    'noscript',
    'canvas',
    'style',
    'title',
  ].filter((tag) => uniqueClosedTags.has(`</${tag}>`));

  text.replace(regexp, (match, offset) => {
    // when two expressions are next to each other <% %><% %>
    // we don't want to create an empty text tag
    if (cursorPosition !== offset) {
      const string = text.slice(cursorPosition, offset);
      tokens.push({ type: 'text', content: string });
      html += string;
      htmlWithPlaceholders += string + 'e';
    }
    cursorPosition = offset + match.length;

    const inAttribute = () => {
      const beginning = htmlWithPlaceholders.lastIndexOf('="') + 1;
      if (beginning === 0) return false;

      return beginning >= htmlWithPlaceholders.lastIndexOf('"');
    };

    const lastTokenType = tokens.length && tokens[tokens.length - 1].type;

    const beforeWhitespace = /\s/.test(text[offset + match.length]);
    const afterWhitespace =
      lastTokenType === 'multiline_expr' || (lastTokenType === 'text' && /\s/.test(html[html.length - 1]));

    const beforeInlineEndTag = /^<\/\w+(?<!address|article|aside|blockquote|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|header|li|main|nav|noscript|ol|p|pre|section|table|tfoot|thead|tbody|ul|video|tr|td|th|button)\s*>/.test(
      text.slice(offset + match.length)
    );
    const afterInlineEndTag =
      lastTokenType === 'text' &&
      (html.endsWith('/>') || // TODO: FIX THIS
        /<\/\w+(?<!address|article|aside|blockquote|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|header|li|main|nav|noscript|ol|p|pre|section|table|tfoot|thead|tbody|ul|video|tr|td|th|button)\s*>$/.test(
          html
        ));

    const inElement = html.lastIndexOf('<') > html.lastIndexOf('>') || inAttribute();
    const inComment = html.lastIndexOf('<!--') > html.lastIndexOf('-->');

    let type;
    let subType;

    if (/\s+do\s*%>/.test(match) || /fn[\s\S]+->\s*%>/.test(match)) {
      type = 'multiline_expr';
      if (/cond\s/.test(match)) {
        subType = 'cond';
      } else if (/case\s/.test(match)) {
        subType = 'case';
      }
    } else if (/<%\s*end\s*%>/.test(match)) {
      type = 'end_expr';
    } else if (/<%\s*else\s*%>/.test(match)) {
      type = 'mid_expr';
    } else if (/->\s*%>/.test(match)) {
      type = 'mid_cond';
    } else {
      type = 'expr';
    }

    tokens.push({
      type,
      subType,
      content: match,
      afterWhitespace,
      beforeWhitespace,
      beforeInlineEndTag,
      afterInlineEndTag,
      inElement,
      inScript: isWithinElement(html, 'script'),
      inComment: inComment,
      inElementWithoutNeedToEncode:
        !inElement && !inComment && rawElementsInText.find((tag) => isWithinElement(html, tag)),
    });
  });

  if (cursorPosition !== text.length) {
    tokens.push({ type: 'text', content: text.slice(cursorPosition) });
  }

  return tokens;
}

module.exports = {
  tokenize,
};
