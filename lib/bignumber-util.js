const platform = require('./platform-specifics');

/* eslint-disable new-cap */
let bigInt = platform.getNativeBigInt();
const nativeBigInt = bigInt;
let hasBigInt = !!bigInt;
const hasNativeBigInt = hasBigInt;

let bigDecimal;
let hasBigDecimal = false;

let fixedBigDecimal;
let fixedBigDecimalTypeName;
let hasFixedBigDecimal = false;

let compareDecimalTypesByConstructor = false;

function isBigInt(value) {
  // eslint-disable-next-line valid-typeof
  return typeof value === 'bigint' || (hasBigInt && value instanceof bigInt);
}

function isBigDecimal(value) {
  if (compareDecimalTypesByConstructor) {
    return value && value.constructor === bigDecimal;
  }
  else {
    return hasBigDecimal && value instanceof bigDecimal;
  }
}

function isFixedBigDecimal(value) {
  if (compareDecimalTypesByConstructor) {
    return value && value.constructor === fixedBigDecimal;
  }
  else {
    return hasFixedBigDecimal && value instanceof fixedBigDecimal;
  }
}

function isBigNumber(value) {
  return isBigInt(value) || isBigDecimal(value) || isFixedBigDecimal(value);
}

function checkDecimalTypeComparison() {
  compareDecimalTypesByConstructor = false;

  if (hasBigDecimal !== hasFixedBigDecimal || !hasBigDecimal) {
    return;
  }

  const bd = module.exports.toBigDecimal('0');
  const fbd = module.exports.toFixedBigDecimal('0');

  if ((bd instanceof fixedBigDecimal || fbd instanceof bigDecimal) &&
      bd.constructor === bigDecimal && fbd.constructor === fixedBigDecimal) {
    compareDecimalTypesByConstructor = true;
  }
}

module.exports = {
  hasBigInt() { return hasBigInt; },

  hasNativeBigInt() { return hasNativeBigInt; },

  hasBigDecimal() { return hasBigDecimal; },

  hasFixedBigDecimal() { return hasFixedBigDecimal; },

  getBigIntType() { return hasBigInt ? 'bigint' : 'numeric'; },

  getBigDecimalType() { return hasBigDecimal ? 'bigdecimal' : 'numeric'; },

  getFixedBigDecimalType() { return hasFixedBigDecimal ? fixedBigDecimalTypeName || 'decimal128' : 'numeric'; },

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
    checkDecimalTypeComparison();
  },

  setFixedBigDecimal(fixedBigDecimalClass, typeName) {
    hasFixedBigDecimal = !!fixedBigDecimalClass;
    fixedBigDecimal = fixedBigDecimalClass;
    fixedBigDecimalTypeName = typeName || 'decimal128';
    checkDecimalTypeComparison();
  },

  toBigInt(s) {
    return platform.toBigInt(bigInt, s);
  },

  toBigDecimal(s) {
    return platform.toBigDecimal(bigDecimal, s);
  },

  toFixedBigDecimal(s) {
    return platform.toFixedBigDecimal(fixedBigDecimal, s);
  },

  isBigInt,

  isBigDecimal,

  isFixedBigDecimal,

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
    else if (isFixedBigDecimal(value)) {
      suffix = 'd';
      goBig = options.primitiveFixedBigDecimal;
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
