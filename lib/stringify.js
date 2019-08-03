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
  const ch = String.fromCharCode(c);

  if (!escapes[ch]) {
    escapes[ch] = '\\u' + (c < 16 ? '000' : '00') + c.toString(16).toUpperCase();
  }
}

const quoteRegexes = {
  "'": /'/g,
  '"': /"/g,
  '`': /`/g,
};

module.exports = function stringify(value, replacer, space) {
  const stack = [];
  const options = {};
  let indent = '';
  let propertyList;
  let replacerFunc;
  let gap = '';
  let fixedQuote;

  Object.assign(options, optionsMgr.getOptions());

  if (typeof replacer === 'object' && !Array.isArray(replacer)) {
    Object.assign(options, replacer);
    replacer = options.replacer;
  }

  if (space === undefined) {
    space = options.space;
  }

  const trailingComma = options.trailingComma ? ',' : '';
  const quoteAllKeys = !!options.quoteAllKeys;
  const quote = options.quote;
  const sparseArrays = options.sparseArrays;
  const extendedPrimitives = options.extendedPrimitives;
  const extendedTypes = options.extendedTypes;
  const revealHiddenArrayProperties = options.revealHiddenArrayProperties;

  if (quote === '"' || quote === optionsMgr.Quote.DOUBLE) {
    fixedQuote = '"';
  }
  else if (quote === "'" || quote === optionsMgr.Quote.SINGLE) {
    fixedQuote = "'";
  }

  const preferredQuote = fixedQuote || (quote === optionsMgr.Quote.PREFER_DOUBLE ? '"' : "'");

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

    if (value && extendedTypes !== optionsMgr.ExtendedTypeMode.OFF) {
      const entendedValue = optionsMgr.serializeExtendedType(value, options, module.exports);

      if (entendedValue) {
        if (extendedTypes === optionsMgr.ExtendedTypeMode.AS_FUNCTIONS) {
          return entendedValue;
        }
        else {
          value = entendedValue;
        }
      }
    }

    if (value) {
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
      case undefined: return extendedPrimitives ? 'undefined' : 'null';
      case util.DELETE: return util.DELETE;
    }

    if (typeof value === 'string') {
      return quoteString(value, false);
    }

    if (big.isNumberOrBigNumber(value)) {
      return big.stringify(value, options, preferredQuote);
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

    const stepback = indent;
    indent = indent + gap;

    const keys = propertyList || Object.keys(value);
    const partial = [];

    for (const key of keys) {
      const propertyString = serializeProperty(key, value, false);

      if (propertyString !== util.DELETE) {
        let member = serializeKey(key) + ':' + (gap ? ' ' : '');

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

      if (gap === '' || gap === ' ' || util.isTypeContainer(value)) {
        properties = partial.join(',' + gap);
        final = `{${properties}}`;
      }
      else {
        const separator = ',\n' + indent;

        properties = partial.join(separator);
        final = `{\n${indent}${properties}${trailingComma}\n${stepback}}`;
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

    const stepback = indent;
    indent = indent + gap;

    // TODO: What about arrays which have non-numeric keys?
    const partial = [];

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

    if (revealHiddenArrayProperties) {
      const keys = Object.keys(value);

      // This gets a little weird. We need to skip over keys that are numbers, because they've already been handled by
      // the previous loop, but all of the keys "Object,keys()" returns are represented as strings even when they're
      // for numeric indices, so typeof doesn't help. Further, a key can parse as a valid number, like "00", but that
      // is a distinct key from "0", and would need to be covered here.
      //
      // Oh, and negative or non-integer number keys can exist too, and they don't change the length property of an
      // array either, and need to be handled here as well.
      for (const key of keys) {
        const n = Number(key);

        if (n < 0 || n.toString() !== key || Math.floor(n) !== n) {
          const propertyString = serializeProperty(key, value, false);

          if (propertyString !== util.DELETE) {
            let member = serializeKey(key) + ':' + (gap ? ' ' : '');

            member += propertyString;
            partial.push(member);
          }
        }
      }
    }

    let final;

    if (partial.length === 0) {
      final = '[]';
    }
    else {
      if (gap === '' || gap === ' ') {
        const properties = partial.join(',' + gap);

        final = `[${properties}]`;
      }
      else {
        const separator = ',\n' + indent;
        const properties = partial.join(separator);

        final = `[\n${indent}${properties}${trailingComma}\n${stepback}]`;
      }
    }

    stack.pop();
    indent = stepback;

    return final;
  }
};
