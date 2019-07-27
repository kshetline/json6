const util = require('./util');
const big = require('./bignumber-util');
const optionsMgr = require('./options-manager');

const escapes = {
  "'": "\\'",
  '"': '\\"',
  '`': '\\`',
  '\\': '\\\\',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\v': '\\v',
  '\0': '\\0',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

for (let c = 0; c < 32; ++c) {
  let ch = String.fromCharCode(c);

  if (!escapes[ch]) {
    escapes[ch] = '\\x' + (c < 16 ? '0' : '') + c.toString(16).toUpperCase();
  }
}

const quoteRegexes = {
  "'": /'/g,
  '"': /"/g,
  '`': /`/g,
};

module.exports = function stringify(value, replacer, space) {
  const stack = [];
  let options = {};
  let indent = '';
  let propertyList;
  let replacerFunc;
  let gap = '';
  let quote;
  let fixedQuote;
  let trailingComma;
  let quoteAllKeys;
  let sparseArrays;
  let expandedPrimitives;
  let preferredQuote;

  Object.assign(options, optionsMgr.getOptions());

  if (typeof replacer === 'object' && !Array.isArray(replacer)) {
    Object.assign(options, replacer);
    replacer = options.replacer;
  }

  if (space === undefined) {
    space = options.space;
  }

  trailingComma = options.trailingComma ? ',' : '';
  quoteAllKeys = !!options.quoteAllKeys;
  quote = options.quote;
  sparseArrays = options.sparseArrays;
  expandedPrimitives = options.expandedPrimitives;

  if (quote === '"' || quote === optionsMgr.Quote.DOUBLE) {
    fixedQuote = '"';
  }
  else if (quote === "'" || quote === optionsMgr.Quote.SINGLE) {
    fixedQuote = "'";
  }

  preferredQuote = fixedQuote || (quote === optionsMgr.Quote.PREFER_DOUBLE ? '"' : "'");

  if (typeof replacer === 'function') {
    replacerFunc = replacer;
  }
  else if (Array.isArray(replacer)) {
    propertyList = [];
    for (const v of replacer) {
      let item;

      if (typeof v === 'string') {
        item = v;
      }
      else if (
        typeof v === 'number' ||
                v instanceof String ||
                v instanceof Number
      ) {
        item = String(v);
      }

      if (item !== undefined && propertyList.indexOf(item) < 0) {
        propertyList.push(item);
      }
    }
  }

  if (space instanceof Number) {
    space = space.valueOf();
  }
  else if (space instanceof String) {
    space = space.toString();
  }

  if (typeof space === 'number') {
    if (space > 0) {
      space = Math.min(10, Math.floor(space));
      gap = ' '.repeat(space);
    }
  }
  else {
    gap = space.toString().substr(0, 10);
  }

  const result = serializeProperty('', {'': value});

  return result === util.DELETE ? undefined : result;

  function serializeProperty(key, holder, forArray) {
    let value = holder[key];
    if (value != null) {
      if (typeof value.toJSONZ === 'function') {
        value = value.toJSONZ(key);
      }
      else if (typeof value.toJSON === 'function') {
        value = value.toJSON(key);
      }
    }

    if (replacerFunc) {
      value = replacerFunc.call(holder, key, value, holder);
    }

    if (value && (value instanceof String || value instanceof Boolean)) {
      value = value.valueOf();
    }

    switch (value) {
    case null: return 'null';
    case true: return 'true';
    case false: return 'false';
    case undefined: return expandedPrimitives ? 'undefined' : 'null';
    case util.DELETE: return util.DELETE;
    }

    if (typeof value === 'string') {
      return quoteString(value, false);
    }

    if (big.isNumberOrBigNumber(value)) {
      return big.stringify(value, expandedPrimitives, preferredQuote);
    }

    if (typeof value === 'object') {
      return Array.isArray(value) ? serializeArray(value) : serializeObject(value);
    }

    return forArray ? 'null' : util.DELETE;
  }

  function quoteString(value) {
    const quotes = {
      "'": 0.2 - (quote === optionsMgr.Quote.PREFER_SINGLE ? 0.1 : 0),
      '"': 0.2 - (quote === optionsMgr.Quote.PREFER_DOUBLE ? 0.1 : 0),
      '`': 0.3,
    };

    let product = '';

    for (const c of value) {
      switch (c) {
      case "'":
      case '"':
      case '`':
        quotes[c]++;
        product += c;
        continue;
      }

      if (escapes[c]) {
        product += escapes[c];
      }
      else {
        product += c;
      }
    }

    const quoteChar = fixedQuote || Object.keys(quotes).reduce((a, b) => (quotes[a] < quotes[b]) ? a : b);

    product = product.replace(quoteRegexes[quoteChar], escapes[quoteChar]);

    return quoteChar + product + quoteChar;
  }

  function serializeObject(value) {
    if (stack.indexOf(value) >= 0) {
      throw TypeError('Converting circular structure to JSON-Z');
    }

    stack.push(value);

    let stepback = indent;
    indent = indent + gap;

    let keys = propertyList || Object.keys(value);
    let partial = [];
    for (const key of keys) {
      const propertyString = serializeProperty(key, value, false);
      if (propertyString !== util.DELETE) {
        let member = serializeKey(key) + ':';
        if (gap !== '') {
          member += ' ';
        }
        member += propertyString;
        partial.push(member);
      }
    }

    let final;
    if (partial.length === 0) {
      final = '{}';
    }
    else {
      let properties;
      if (gap === '' || gap === ' ') {
        properties = partial.join(',' + gap);
        final = '{' + properties + '}';
      }
      else {
        let separator = ',\n' + indent;
        properties = partial.join(separator);
        final = '{\n' + indent + properties + trailingComma + '\n' + stepback + '}';
      }
    }

    stack.pop();
    indent = stepback;
    return final;
  }

  function serializeKey(key) {
    if (quoteAllKeys || key.length === 0) {
      return quoteString(key, true);
    }

    const firstChar = String.fromCodePoint(key.codePointAt(0));
    if (!util.isIdStartChar(firstChar)) {
      return quoteString(key, true);
    }

    for (let i = firstChar.length; i < key.length; i++) {
      if (!util.isIdContinueChar(String.fromCodePoint(key.codePointAt(i)))) {
        return quoteString(key, true);
      }
    }

    return key;
  }

  function serializeArray(value) {
    if (stack.indexOf(value) >= 0) {
      throw TypeError('Converting circular structure to JSON-Z');
    }

    stack.push(value);

    let stepback = indent;
    indent = indent + gap;

    let partial = [];
    for (let i = 0; i < value.length; i++) {
      if (!sparseArrays || i in value) {
        const propertyString = serializeProperty(String(i), value, true);

        if (propertyString === util.DELETE) {
          partial.push('');
        }
        else {
          partial.push(propertyString);
        }
      }
      else {
        partial.push('');
      }
    }

    let final;
    if (partial.length === 0) {
      final = '[]';
    }
    else {
      if (gap === '' || gap === ' ') {
        let properties = partial.join(',' + gap);
        final = '[' + properties + ']';
      }
      else {
        let separator = ',\n' + indent;
        let properties = partial.join(separator);
        final = '[\n' + indent + properties + trailingComma + '\n' + stepback + ']';
      }
    }

    stack.pop();
    indent = stepback;
    return final;
  }
};
