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

  isBigInt,

  isBigDecimal,

  isBigNumber,

  isNumberOrBigNumber(value) {
    return typeof value === 'number' || value instanceof Number || isBigNumber(value);
  },

  stringify(value, options, preferredQuote, noSuffix) {
    if (value instanceof Number) {
      value = value.valueOf();
    }

    let str = String(value);
    let suffix = '';
    let goBig = false;

    if (isBigInt(value)) {
      suffix = 'n';
      goBig = options.primitiveBigInt;
    }
    else if (isBigDecimal(value)) {
      suffix = 'm';
      goBig = options.primitiveBigDecimal;
    }

    // Try to recover sign of negative zero.
    if (!str.startsWith('-') && (Object.is(value, -0) || /-0\b/.test(value.valueOf().toString()))) {
      str = '-' + str;
    }

    const special = /[-+]?Infinity|NaN/.test(str);

    if (goBig) {
      if (special && suffix && !noSuffix) {
        str += '_';
      }

      return str + (noSuffix ? '' : suffix);
    }
    else if (special) {
      return options.extendedPrimitives ? str : 'null';
    }
    else if (suffix) {
      return preferredQuote + str + preferredQuote;
    }

    return str;
  },
};
