const platform = require('./platform-specifics');

/* eslint-disable new-cap */
let bigInt = platform.getNativeBigInt();
const nativeBigInt = bigInt;
let hasBigInt = !!bigInt;
const hasNativeBigInt = hasBigInt;

let bigDecimal;
let hasBigDecimal = false;

function isBigInt(value) {
  // eslint-disable-next-line valid-typeof
  return typeof value === 'bigint' || (hasBigInt && value instanceof bigInt);
}

function isBigDecimal(value) {
  return hasBigDecimal && value instanceof bigDecimal;
}

function isBigNumber(value) {
  return isBigInt(value) || isBigDecimal(value);
}

module.exports = {
  hasBigInt() { return hasBigInt; },

  hasNativeBigInt() { return hasNativeBigInt; },

  hasBigDecimal() { return hasBigDecimal; },

  getBigIntType() { return hasBigInt ? 'bigint' : 'numeric'; },

  getBigDecimalType() { return hasBigDecimal ? 'bigdecimal' : 'numeric'; },

  setBigInt(bigIntClass) {
    if (bigIntClass === true) {
      hasBigInt = !!nativeBigInt;
      bigInt = nativeBigInt;
    }
    else {
      hasBigInt = !!bigIntClass;
      bigInt = bigIntClass;
    }
  },

  setBigDecimal(bigDecimalClass) {
    hasBigDecimal = !!bigDecimalClass;
    bigDecimal = bigDecimalClass;
  },

  toBigInt(s) {
    return platform.toBigInt(bigInt, s);
  },

  toBigDecimal(s) {
    return platform.toBigDecimal(bigDecimal, s);
  },

  isBigNumber,

  isNumberOrBigNumber(value) {
    return typeof value === 'number' || value instanceof Number || isBigNumber(value);
  },

  stringify(value, expandedPrimitives, preferredQuote) {
    if (value instanceof Number) {
      value = value.valueOf();
    }

    let str = String(value);

    // Try to recover sign of negative zero.
    if (Object.is(value, -0) || /-0\b/.test(value.valueOf().toString())) {
      str = '-' + str;
    }

    let special = /[-+]?Infinity|NaN/.test(str);

    if (expandedPrimitives) {
      if (special) {
        return str;
      }

      return str + (isBigInt(value) ? 'n' : (isBigDecimal(value) ? 'm' : ''));
    }
    else if (special) {
      return 'null';
    }
    else if (isBigNumber(value)) {
      return preferredQuote + str + preferredQuote;
    }

    return str;
  },
};
