/**
 * Used also in parsers.parseType
 * TODO outsource
 */
const PRIMITIVE = 0;
const KEYPATH = 1;

const QUOTED_STR = /^'.*'$|^".*"$/; // regex to test if string is wrapped in " or '

// Used in parsers.parseTemplate
const TEXT = 0;
const BINDING = 1;

// Test if string is a json string
export function isJson(str) {
  try {
    const val = JSON.parse(str);
    return (val instanceof Array || val instanceof Object) ? true : false;
  }
  catch (error) {
    return false;
  }
}

// Parser and tokenizer for getting the type and value from a string.
export function parseType(string) {
  let type = PRIMITIVE;
  let value = string;
  if (QUOTED_STR.test(string)) {
    value = string.slice(1, -1);
  } else if (string === 'true') {
    value = true;
  } else if (string === 'false') {
    value = false;
  } else if (string === 'null') {
    value = null;
  } else if (string === 'undefined') {
    value = undefined;
  } else if (!isNaN(string)) {
    value = Number(string);
  } else if (isJson(string)) {
    value = JSON.parse(string);
  } else {
    type = KEYPATH;
  }
  return {type: type, value: value};
}

// Template parser and tokenizer for mustache-style text content bindings.
// Parses the template and returns a set of tokens, separating static portions
// of text from binding declarations.
export function parseTemplate(template, delimiters) {
  var tokens;
  let length = template.length;
  let index = 0;
  let lastIndex = 0;
  let open = delimiters[0], close = delimiters[1];

  while (lastIndex < length) {
    index = template.indexOf(open, lastIndex);

    if (index < 0) {
      if (tokens) {
        tokens.push({
          type: TEXT,
          value: template.slice(lastIndex)
        });
      }

      break;
    } else {
      tokens = tokens || [];
      if (index > 0 && lastIndex < index) {
        tokens.push({
          type: TEXT,
          value: template.slice(lastIndex, index)
        });
      }

      lastIndex = index + open.length;
      index = template.indexOf(close, lastIndex);

      if (index < 0) {
        let substring = template.slice(lastIndex - close.length);
        let lastToken = tokens[tokens.length - 1];

        if (lastToken && lastToken.type === TEXT) {
          lastToken.value += substring;
        } else {
          tokens.push({
            type: TEXT,
            value: substring
          });
        }

        break;
      }

      let value = template.slice(lastIndex, index).trim();

      tokens.push({
        type: BINDING,
        value: value
      });

      lastIndex = index + close.length;
    }
  }

  return tokens;
}
