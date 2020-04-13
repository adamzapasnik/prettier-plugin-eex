/**
 * Printer Helpers
 */

"use strict";

function isBuilderLine(part) {
  if (typeof part !== "object") {
    return false;
  }

  switch (part.type) {
    case "line":
    case "break-parent":
      return true;
    default:
      return false;
  }
}

module.exports = {
  isBuilderLine,
};
