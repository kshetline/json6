const unicode = require('../lib/unicode');

module.exports = {
  isSpaceSeparator(c) {
    return unicode.Space_Separator.test(c);
  },

  isIdStartChar(c) {
    return (
      (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c === '$') || (c === '_') ||
        unicode.ID_Start.test(c)
    );
  },

  isIdContinueChar(c) {
    return (
      (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c >= '0' && c <= '9') ||
        (c === '$') || (c === '_') ||
        (c === '\u200C') || (c === '\u200D') ||
        unicode.ID_Continue.test(c)
    );
  },

  isDigit(c) {
    return !!c && /[0-9]/.test(c);
  },

  isHexDigit(c) {
    return !!c && /[0-9A-Fa-f]/.test(c);
  },

  isBinaryDigit(c) {
    return !!c && /[01]/.test(c);
  },

  isOctalDigit(c) {
    return !!c && /[0-7]/.test(c);
  },

  createTypeContainer(type, value) {
    return {_$_: type, _$_value: value};
  },

  isTypeContainer(obj) {
    return typeof obj === 'object' && obj.hasOwnProperty('_$_') && obj.hasOwnProperty('_$_value') && Object.keys(obj).length === 2;
  },

  DELETE: Symbol('DELETE'),
};
