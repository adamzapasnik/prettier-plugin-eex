const liveViewFormForPlaceholder = '<form>';

const encodeFormForExpressions = (text) => {
  const liveViewFormExpressions = [];
  const textWithPlaceholders = text.replace(/(<%=?[^%>]*=\s+form_for[\s\S]*?%>|<form>)/gm, (match) => {
    if (match.match(/->\s*%>$/gm)) {
      return match;
    }
    liveViewFormExpressions.push(match);
    return liveViewFormForPlaceholder;
  });

  return { liveViewFormExpressions, textWithPlaceholders };
};

module.exports = {
  encodeFormForExpressions,
  liveViewFormForPlaceholder,
};
