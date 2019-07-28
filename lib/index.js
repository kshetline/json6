const parse = require('./parse');
const stringify = require('./stringify');
const big = require('./bignumber-util');
const util = require('./util');
const options = require('./options-manager');

const JSONZ = {
  parse,
  stringify,
  setOptions: options.setOptions,
  resetOptions: options.resetOptions,
  setParseOptions: options.setParseOptions,
  resetParseOptions: options.resetOptions,
  DELETE: util.DELETE,
  Quote: options.Quote,
  hasBigInt: big.hasBigInt,
  hasNativeBigInt: big.hasNativeBigInt,
  hasBigDecimal: big.hasBigDecimal,
  setBigInt: big.setBigInt,
  setBigDecimal: big.setBigDecimal,
};

module.exports = JSONZ;
