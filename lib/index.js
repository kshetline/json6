const parse = require('./parse');
const stringify = require('./stringify');
const big = require('./bignumber-util');
const util = require('./util');
const options = require('./options-manager');

const JSONZ = {
  parse,
  stringify,

  Quote: options.Quote,
  ExtendedTypeMode: options.ExtendedTypeMode,
  OptionSet: options.OptionSet,
  setOptions: options.setOptions,
  resetOptions: options.resetOptions,

  setParseOptions: options.setParseOptions,
  resetParseOptions: options.resetParseOptions,

  DELETE: util.DELETE,

  addTypeHandler: options.addTypeHandler,
  removeTypeHandler: options.removeTypeHandler,
  resetStandardTypeHandlers: options.resetStandardTypeHandlers,
  restoreStandardTypeHandlers: options.restoreStandardTypeHandlers,
  globalizeTypeHandlers: options.globalizeTypeHandlers,
  removeGlobalizedTypeHandlers: options.removeGlobalizedTypeHandlers,

  hasBigInt: big.hasBigInt,
  hasNativeBigInt: big.hasNativeBigInt,
  hasBigDecimal: big.hasBigDecimal,
  setBigInt: big.setBigInt,
  setBigDecimal: big.setBigDecimal,
  setFixedBigDecimal: big.setFixedBigDecimal,
};

module.exports = JSONZ;
