const { breakParent, concat, indent, softline, hardline, group, line, join } = require('prettier').doc.builders;

const PLACEHOLDER_REGEX = /<eext\d+/;

const isSelfClosingInText = (parts) => {
  if (parts.length !== 2) return;

  const hasLine = parts[0].type === 'line' || parts[0].type === 'if-break';
  const hasOpeningGroup = hasLine && parts[1].type === 'group';
  const hasSelfClosing = hasOpeningGroup && parts[1].contents.parts && parts[1].contents.parts[1] === '/>';

  if (!hasSelfClosing) return;

  return PLACEHOLDER_REGEX.test(parts[1].contents.parts[0].contents.contents);
};

const decodeSelfClosingInText = (parts, expressionMap) => {
  const decodedParts = [];
  let removeWhitespace = false;
  let placeholder = parts[1].contents.parts[0].contents.contents.trim();

  //<span class="js-player-prev-number">4</span><%  %>
  if (placeholder.startsWith('>')) {
    placeholder = placeholder.substring(1);
    decodedParts.push('>');
  }

  const original = expressionMap.get(placeholder);
  expressionMap.delete(placeholder);
  // if-break is present in td
  // <td><strong>Email:</strong> <% sm %><br /></td>
  if (original.afterWhitespace && parts[0].type !== 'if-break') {
    decodedParts.push(line);
  }

  decodedParts.push(original.print);

  // Maintain whitespace if it's there.
  // <%= "alert" %> me
  // Space has to stay between printed `alert` and `me`

  // <p>We published <%=  :sho %> with</p>

  const rest = parts[1].contents.parts.slice(2);
  decodedParts.push(...rest);

  if (parts[2] && parts[2].type === 'line') {
    decodedParts.push(parts[2]);
  }

  // <p><%= @request.submitter.name %> (<%= submitter_name(@request) %>) on <%= ts(@request.inserted_at) %></p>
  if (!original.beforeWhitespace && decodedParts[decodedParts.length - 1].type === 'line') {
    decodedParts.pop();
  }

  // TODO: validate if it's needed!
  // <label>Post to Changelog News <%= help_icon("Disable to publish to audio feed only.") %></label>
  if (!original.beforeWhitespace && original.beforeInlineEndTag) {
    removeWhitespace = true;
  }

  return { decodedParts, removeWhitespace };
};

const isSelfClosingAfterOpenTag = (part) => {
  if (
    part.type === 'group' &&
    part.contents &&
    part.contents.contents &&
    part.contents.contents.parts &&
    part.contents.contents.parts.length &&
    part.contents.contents.parts[1] === '/>'
  ) {
    return PLACEHOLDER_REGEX.test(part.contents.contents.parts[0].contents.contents);
  }

  return false;
};

module.exports = {
  isSelfClosingInText,
  decodeSelfClosingInText,
  isSelfClosingAfterOpenTag,
};
