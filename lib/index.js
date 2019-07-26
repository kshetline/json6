const parse = require('./parse');
const stringify = require('./stringify');
const big = require('./bignumber-util');
const DELETE = require('./util').DELETE;

const JSONZ = {
  parse,
  stringify,
  DELETE,
  hasBigInt: big.hasBigInt,
  hasNativeBigInt: big.hasNativeBigInt,
  hasBigDecimal: big.hasBigDecimal,
  setBigInt: big.setBigInt,
  setBigDecimal: big.setBigDecimal,
};

module.exports = JSONZ;
