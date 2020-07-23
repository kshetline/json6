const big = require('./bignumber-util');
const util = require('./util');
const platform = require('./platform-specifics');

let globalOptions = {};
let globalParseOptions = {};
let typeHandlers = [];
const handlerMap = new Map();

const Quote = {
  DOUBLE: 0,
  SINGLE: 1,
  PREFER_DOUBLE: 2,
  PREFER_SINGLE: 3,
};

const OptionSet = {
  MAX_COMPATIBILITY: 0,
  RELAXED: 1,
  THE_WORKS: 2,
};

const ExtendedTypeMode = {
  OFF: 0,
  AS_FUNCTIONS: 1,
  AS_OBJECTS: 2,
};

const compatibleOptions = {
  extendedPrimitives: false,
  extendedTypes: ExtendedTypeMode.OFF,
  primitiveBigDecimal: false,
  primitiveBigInt: false,
  primitiveFixedBigDecimal: false,
  quote: Quote.DOUBLE,
  quoteAllKeys: true,
  // replacer
  revealHiddenArrayProperties: false,
  space: 0,
  sparseArrays: false,
  trailingComma: false,
  typePrefix: '_',
};

const relaxedOptions = {
  extendedPrimitives: true,
  extendedTypes: ExtendedTypeMode.OFF,
  primitiveBigDecimal: false,
  primitiveBigInt: true,
  primitiveFixedBigDecimal: false,
  quote: Quote.PREFER_SINGLE,
  quoteAllKeys: false,
  // replacer
  revealHiddenArrayProperties: false,
  space: 0,
  sparseArrays: true,
  trailingComma: true,
  typePrefix: '_',
};

const theWorks = {
  extendedPrimitives: true,
  extendedTypes: ExtendedTypeMode.AS_FUNCTIONS,
  primitiveBigDecimal: true,
  primitiveBigInt: true,
  primitiveFixedBigDecimal: true,
  quote: Quote.PREFER_SINGLE,
  quoteAllKeys: false,
  // replacer
  revealHiddenArrayProperties: true,
  space: 0,
  sparseArrays: true,
  trailingComma: true,
  typePrefix: '_',
};

const optionSets = {
  [OptionSet.MAX_COMPATIBILITY]: compatibleOptions,
  [OptionSet.RELAXED]: relaxedOptions,
  [OptionSet.THE_WORKS]: theWorks,
};

const dateHandler = {
  name: 'Date',
  test: obj => obj instanceof Date,
  creator: date => new Date(date),
  serializer: date => (isNaN(date.getTime()) ? NaN : date.toISOString()),
};

const bigIntHandler = {
  name: 'BigInt',
  test: (obj, options) => !options.primitiveBigInt && big.isBigInt(obj),
  creator: big.toBigInt,
  serializer: n => big.stringify(n, {primitiveBigInt: true}, '', true),
};

const bigDecimalHandler = {
  name: 'BigDecimal',
  test: (obj, options) => !options.primitiveBigDecimal && big.isBigDecimal(obj),
  creator: big.toBigDecimal,
  serializer: n => big.stringify(n, {primitiveBigDecimal: true}, '', true),
};

const fixedBigDecimalHandler = {
  name: 'FixedBigDecimal',
  test: (obj, options) => !options.primitiveFixedBigDecimal && big.isFixedBigDecimal(obj),
  creator: big.toFixedBigDecimal,
  serializer: n => big.stringify(n, {primitiveFixedBigDecimal: true}, '', true),
};

const mapHandler = {
  name: 'Map',
  test: obj => obj instanceof Map,
  creator: entries => new Map(entries),
  serializer: map => Array.from(map.entries()),
};

const setHandler = {
  name: 'Set',
  test: obj => obj instanceof Set,
  creator: elements => new Set(elements),
  serializer: s => Array.from(s.values()),
};

const regExpHandler = {
  name: 'RegExp',
  test: obj => obj instanceof RegExp,
  creator: regex => {
    const $ = /^\/(.+)\/([A-Za-z]+)?/.exec(regex);

    if ($) {
      return new RegExp($[1], $[2] || '');
    }

    throw new Error('invalid regular expression');
  },
  serializer: s => s.toString(),
};

module.exports = {
  getOptionSet(set) {
    return optionSets[set] || {};
  },

  setOptions(options, extraOptions) {
    if (typeof options === 'number') {
      options = optionSets[options];

      if (options) {
        globalOptions = {};
      }
    }
    else {
      extraOptions = undefined;
    }

    Object.assign(globalOptions, options || {});

    if (extraOptions) {
      Object.assign(globalOptions, extraOptions);
    }
  },

  resetOptions() {
    globalOptions = {};
    Object.assign(globalOptions, module.exports.defaultOptions);
  },

  getOptions() {
    return globalOptions;
  },

  Quote,

  OptionSet,

  ExtendedTypeMode,

  defaultOptions: compatibleOptions,

  setParseOptions(options) {
    Object.assign(globalParseOptions, options || {});
  },

  resetParseOptions() {
    globalParseOptions = {};
    Object.assign(globalParseOptions, module.exports.defaultParseOptions);
  },

  getParseOptions() {
    return globalParseOptions;
  },

  defaultParseOptions: {
    reviveTypedContainers: false,
  },

  addTypeHandler(handler) {
    // Remove any samed-named handler. The new handler will go on the end, gaining priority.
    module.exports.removeTypeHandler(handler.name);
    handlerMap.set(handler.name, handler);
    typeHandlers.push(handler);
  },

  removeTypeHandler(name) {
    if (handlerMap.has(name)) {
      const handlerIndex = typeHandlers.findIndex(h => h.name === name);

      typeHandlers.splice(handlerIndex, 1);
      handlerMap.delete(name);
    }
  },

  resetStandardTypeHandlers() {
    typeHandlers = [];
    handlerMap.clear();
    module.exports.restoreStandardTypeHandlers();
  },

  restoreStandardTypeHandlers() {
    module.exports.addTypeHandler(dateHandler);
    module.exports.addTypeHandler(bigIntHandler);
    module.exports.addTypeHandler(bigDecimalHandler);
    module.exports.addTypeHandler(fixedBigDecimalHandler);
    module.exports.addTypeHandler(mapHandler);
    module.exports.addTypeHandler(setHandler);
    module.exports.addTypeHandler(regExpHandler);
    module.exports.addTypeHandler(platform.uint8ArrayHandler);
  },

  serializeExtendedType(value, options, stringify) {
    // Scan handlers in reverse order so that the most recently added have priority.
    for (let i = typeHandlers.length - 1; i >= 0; --i) {
      const handler = typeHandlers[i];

      if (handler.test(value, options)) {
        let argValue = handler.serializer(value, options);

        if (options.extendedTypes === ExtendedTypeMode.AS_FUNCTIONS) {
          argValue = stringify(argValue, options);

          return `${options.typePrefix}${handler.name}(${argValue})`;
        }
        else {
          return util.createTypeContainer(handler.name, argValue);
        }
      }
    }

    return undefined;
  },

  reviveTypeValue(typeNameOrContainer, value) {
    let typeName;
    let container = false;

    if (util.isTypeContainer(typeNameOrContainer)) {
      container = true;
      typeName = typeNameOrContainer._$_;
      value = typeNameOrContainer._$_value;
    }
    else {
      typeName = typeNameOrContainer;
    }

    const handler = handlerMap.get(typeName);

    if (handler) {
      return handler.creator(value);
    }

    return container ? typeNameOrContainer : undefined;
  },

  globalizeTypeHandlers(prefix) {
    platform.globalizeTypeHandlers(typeHandlers, prefix);
  },

  removeGlobalizedTypeHandlers() {
    platform.removeGlobalizedTypeHandlers();
  },
};

Object.freeze(compatibleOptions);
Object.freeze(relaxedOptions);
Object.freeze(theWorks);
module.exports.resetOptions();

Object.freeze(module.exports.defaultParseOptions);
module.exports.resetParseOptions();

module.exports.resetStandardTypeHandlers();
