const util = require('./util');
const big = require('./bignumber-util');

module.exports = function stringify(value, replacer, space) {
  const stack = [];
  let indent = '';
  let propertyList;
  let replacerFunc;
  let gap = '';
  let quote;

  if (
    replacer != null &&
        typeof replacer === 'object' &&
        !Array.isArray(replacer)
  ) {
    space = replacer.space;
    quote = replacer.quote;
    replacer = replacer.replacer;
  }

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
    space = Number(space);
  }
  else if (space instanceof String) {
    space = String(space);
  }

  if (typeof space === 'number') {
    if (space > 0) {
      space = Math.min(10, Math.floor(space));
      gap = '          '.substr(0, space);
    }
  }
  else if (typeof space === 'string') {
    gap = space.substr(0, 10);
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
      value = replacerFunc.call(holder, key, value);
    }

    if (value && (value instanceof String || value instanceof Boolean)) {
      value = value.valueOf();
    }

    switch (value) {
    case null: return 'null';
    case true: return 'true';
    case false: return 'false';
    case undefined: return 'undefined';
    case util.DELETE: return util.DELETE;
    }

    if (typeof value === 'string') {
      return quoteString(value, false);
    }

    if (big.isNumberOrBigNumber(value)) {
      return big.stringify(value);
    }

    if (typeof value === 'object') {
      return Array.isArray(value) ? serializeArray(value) : serializeObject(value);
    }

    return forArray ? 'null' : util.DELETE;
  }

  function quoteString(value) {
    const quotes = {
      "'": 0.1,
      '"': 0.2,
    };

    const replacements = {
      "'": "\\'",
      '"': '\\"',
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

    let product = '';

    for (const c of value) {
      switch (c) {
      case "'":
      case '"':
        quotes[c]++;
        product += c;
        continue;
      }

      if (replacements[c]) {
        product += replacements[c];
        continue;
      }

      if (c < ' ') {
        let hexString = c.charCodeAt(0).toString(16);
        product += '\\x' + ('00' + hexString).substring(hexString.length);
        continue;
      }

      product += c;
    }

    const quoteChar = quote || Object.keys(quotes).reduce((a, b) => (quotes[a] < quotes[b]) ? a : b);

    product = product.replace(new RegExp(quoteChar, 'g'), replacements[quoteChar]);

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
      if (gap === '') {
        properties = partial.join(',');
        final = '{' + properties + '}';
      }
      else {
        let separator = ',\n' + indent;
        properties = partial.join(separator);
        final = '{\n' + indent + properties + ',\n' + stepback + '}';
      }
    }

    stack.pop();
    indent = stepback;
    return final;
  }

  function serializeKey(key) {
    if (key.length === 0) {
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
      if (i in value) {
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
      if (gap === '') {
        let properties = partial.join(',');
        final = '[' + properties + ']';
      }
      else {
        let separator = ',\n' + indent;
        let properties = partial.join(separator);
        final = '[\n' + indent + properties + ',\n' + stepback + ']';
      }
    }

    stack.pop();
    indent = stepback;
    return final;
  }
};
