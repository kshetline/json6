const util = require('./util');
const big = require('./bignumber-util');
const optionsMgr = require('./options-manager');

const QUOTE_NONE = 0;
const QUOTE_SINGLE = 1;
const QUOTE_DOUBLE = 2;
const QUOTE_BACKTICK = 3;
const QUOTES = ' \'"`';

const EMPTY = Symbol('EMPTY');

function ExtendedType(typeName, parent) {
  this.name = typeName;
  this.parent = parent;
  this.key = undefined;
  this.atRoot = false;
  this.arg = undefined;
}

function KeyedArrayValue() {
  this.parent = undefined;
  this.key = undefined;
}

function getFixedBigDecimalType() {
  return big.getFixedBigDecimalType() === 'numeric' ? 'numeric' : 'fixedbd';
}

module.exports = function parse(text, reviver, newOptions) {
  const source = String(text);
  let parseState;
  const stack = [];
  let pos;
  let line;
  let column;
  let token;
  let key;
  let root;
  let underscoreAllowed;
  const options = {};

  let lexState;
  let buffer;
  let quoteType;
  let sign;
  let signChar;
  let c;
  let $;
  let mantissa;
  let exponent;
  let decimalPos;
  let legacyOctal;

  // noinspection JSUnusedGlobalSymbols (many functions here are accessed by string content, not direct in-code references)
  const lexStates = {
    default() {
      switch (c) {
        case '\t':
        case '\v':
        case '\f':
        case ' ':
        case '\u00A0':
        case '\uFEFF':
        case '\n':
        case '\r':
        case '\u2028':
        case '\u2029':
          read();
          return;

        case '/':
          read();
          lexState = 'comment';
          return;

        case undefined:
          read();
          return newToken('eof');
      }

      if (util.isSpaceSeparator(c)) {
        read();
        return;
      }

      // Assume valid parseState, lexStates[parseState]
      return lexStates[parseState]();
    },

    comment() {
      switch (c) {
        case '*':
          read();
          lexState = 'multiLineComment';
          return;

        case '/':
          read();
          lexState = 'singleLineComment';
          return;
      }

      throw invalidChar(read());
    },

    multiLineComment() {
      switch (c) {
        case '*':
          read();
          lexState = 'multiLineCommentAsterisk';
          return;

        case undefined:
          throw invalidChar(read());
      }

      read();
    },

    multiLineCommentAsterisk() {
      switch (c) {
        case '*':
          read();
          return;

        case '/':
          read();
          lexState = 'default';
          return;

        case undefined:
          throw invalidChar(read());
      }

      read();
      lexState = 'multiLineComment';
    },

    singleLineComment() {
      switch (c) {
        case '\n':
        case '\r':
        case '\u2028':
        case '\u2029':
          read();
          lexState = 'default';
          return;

        case undefined:
          read();
          return newToken('eof');
      }

      read();
    },

    value() {
      let trailingUnderscore = false;

      switch (c) {
        case '{':
        case '[':
        case ',':
        case '#':
          return newToken('punctuator', read());

        case 'n':
          read();
          literal('ull');
          return newToken('null', null);

        case 'u':
          read();
          literal('ndefined');
          return newToken('undefined', undefined);

        case 't':
          read();
          literal('rue');
          return newToken('boolean', true);

        case 'f':
          read();
          literal('alse');
          return newToken('boolean', false);

        case '-':
        case '+':
          if (read() === '-') {
            sign = -1;
            signChar = '-';
          }

          lexState = 'sign';
          return;

        case '.':
          buffer = read();
          lexState = 'decimalPointLeading';
          return;

        case '0':
          buffer = read();
          lexState = 'zero';
          underscoreAllowed = true;
          legacyOctal = true;
          return;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          buffer = read();
          lexState = 'decimalInteger';
          underscoreAllowed = true;
          legacyOctal = false;
          return;

        case 'I':
          read();
          literal('nfinity');

          if (peek() === '_') {
            read();
            trailingUnderscore = true;
          }

          if (peek() === 'm') {
            read();
            return newToken(big.getBigDecimalType(), big.toBigDecimal(Infinity));
          }

          if (peek() === 'd') {
            read();
            return newToken(getFixedBigDecimalType(), big.toFixedBigDecimal(Infinity));
          }

          if (trailingUnderscore) {
            throw invalidChar('_');
          }

          return newToken('numeric', Infinity);

        case 'N':
          read();
          literal('aN');

          if (peek() === '_') {
            read();
            trailingUnderscore = true;
          }

          if (peek() === 'm') {
            read();
            return newToken(big.getBigDecimalType(), big.toBigDecimal(NaN));
          }

          if (peek() === 'd') {
            read();
            return newToken(getFixedBigDecimalType(), big.toFixedBigDecimal(NaN));
          }

          if (trailingUnderscore) {
            throw invalidChar('_');
          }

          return newToken('numeric', NaN);

        case "'":
        case '"':
        case '`':
          read();
          quoteType = QUOTES.indexOf(c);
          buffer = '';
          lexState = 'string';
          return;

        case '_':
          buffer = read();
          lexState = 'typeName';
          return;
      }

      throw invalidChar(read());
    },

    identifierNameStartEscape() {
      if (c !== 'u') {
        throw invalidChar(read());
      }

      read();
      const u = unicodeEscape();
      switch (u) {
        case '$':
        case '_':
          break;

        default:
          if (!util.isIdStartChar(u)) {
            throw invalidIdentifier();
          }

          break;
      }

      buffer += u;
      lexState = 'identifierName';
    },

    identifierName() {
      if (c === '\\') {
        read();
        lexState = 'identifierNameEscape';
        return;
      }

      if (util.isIdContinueChar(c)) {
        buffer += read();
        return;
      }

      return newToken('identifier', buffer);
    },

    identifierNameEscape() {
      if (c !== 'u') {
        throw invalidChar(read());
      }

      read();
      const u = unicodeEscape();
      switch (u) {
        case '$':
        case '_':
        case '\u200C':
        case '\u200D':
          break;

        default:
          if (!util.isIdContinueChar(u)) {
            throw invalidIdentifier();
          }

          break;
      }

      buffer += u;
      lexState = 'identifierName';
    },

    sign() {
      let trailingUnderscore = false;

      switch (c) {
        case '.':
          buffer = read();
          lexState = 'decimalPointLeading';
          underscoreAllowed = false;
          return;

        case '0':
          buffer = read();
          lexState = 'zero';
          underscoreAllowed = true;
          legacyOctal = true;
          return;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          buffer = read();
          lexState = 'decimalInteger';
          underscoreAllowed = true;
          legacyOctal = false;
          return;

        case 'I':
          read();
          literal('nfinity');

          if (peek() === '_') {
            read();
            trailingUnderscore = true;
          }

          if (peek() === 'm') {
            read();
            return newToken(big.getBigDecimalType(), big.toBigDecimal(sign * Infinity));
          }

          if (peek() === 'd') {
            read();
            return newToken(getFixedBigDecimalType(), big.toFixedBigDecimal(sign * Infinity));
          }

          if (trailingUnderscore) {
            throw invalidChar('_');
          }

          return newToken('numeric', sign * Infinity);

        case 'N':
          read();
          literal('aN');

          if (peek() === '_') {
            read();
            trailingUnderscore = true;
          }

          if (peek() === 'm') {
            read();
            return newToken(big.getBigDecimalType(), big.toBigDecimal(NaN));
          }

          if (peek() === 'd') {
            read();
            return newToken(getFixedBigDecimalType(), big.toFixedBigDecimal(NaN));
          }

          if (trailingUnderscore) {
            throw invalidChar('_');
          }

          return newToken('numeric', NaN);
      }

      throw invalidChar(read());
    },

    zero() {
      switch (c) {
        case '.':
          buffer += read();
          lexState = 'decimalPoint';
          underscoreAllowed = false;
          legacyOctal = false;
          return;

        case 'e':
        case 'E':
          buffer += read();
          lexState = 'decimalExponent';
          underscoreAllowed = false;
          legacyOctal = false;
          return;

        case 'x':
        case 'X':
          buffer += read();
          lexState = 'hexadecimal';
          underscoreAllowed = false;
          legacyOctal = false;
          return;

        case 'b':
        case 'B':
          buffer += read();
          lexState = 'binary';
          underscoreAllowed = false;
          legacyOctal = false;
          return;

        case 'o':
        case 'O':
          buffer += read();
          lexState = 'octal';
          underscoreAllowed = false;
          legacyOctal = false;
          return;

        case '_':
          read();
          underscoreAllowed = false;
          lexState = 'decimalInteger';
      }

      lexState = 'decimalInteger';
    },

    decimalInteger() {
      switch (c) {
        case '.':
          if (!underscoreAllowed) {
            throw invalidChar('_');
          }

          buffer += read();
          lexState = 'decimalPoint';
          underscoreAllowed = false;
          legacyOctal = false;
          return;

        case 'e':
        case 'E':
          if (!underscoreAllowed) {
            throw invalidChar('_');
          }

          buffer += read();
          lexState = 'decimalExponent';
          underscoreAllowed = false;
          legacyOctal = false;
          return;

        case '_':
          read();
          if (underscoreAllowed) {
            underscoreAllowed = false;
            return;
          }
          else {
            throw invalidChar('_');
          }
      }

      if (util.isDigit(c)) {
        buffer += read();
        underscoreAllowed = true;
        legacyOctal = legacyOctal && c < '8';
        return;
      }
      else if (!underscoreAllowed) {
        throw invalidChar('_');
      }

      if (legacyOctal && buffer !== '0') {
        buffer = '0o' + buffer;
      }

      if (c === 'n') {
        read();
        return newToken(big.getBigIntType(), big.toBigInt(signChar + buffer));
      }
      else if (c === 'm') {
        read();
        return newToken(big.getBigDecimalType(), big.toBigDecimal(signChar + buffer));
      }
      else if (c === 'd') {
        read();
        return newToken(getFixedBigDecimalType(), big.toFixedBigDecimal(signChar + buffer));
      }

      return newToken('numeric', sign * Number(buffer));
    },

    decimalPointLeading() {
      if (util.isDigit(c)) {
        buffer += read();
        lexState = 'decimalFraction';
        underscoreAllowed = true;
        legacyOctal = false;
        return;
      }

      throw invalidChar(read());
    },

    decimalPoint() {
      switch (c) {
        case 'e':
        case 'E':
          buffer += read();
          lexState = 'decimalExponent';
          underscoreAllowed = false;
          return;
      }

      if (util.isDigit(c)) {
        buffer += read();
        lexState = 'decimalFraction';
        underscoreAllowed = true;
        return;
      }
      else if (c === 'm') {
        read();
        return newToken(big.getBigDecimalType(), big.toBigDecimal(signChar + buffer));
      }
      else if (c === 'd') {
        read();
        return newToken(getFixedBigDecimalType(), big.toFixedBigDecimal(signChar + buffer));
      }

      return newToken('numeric', sign * Number(buffer));
    },

    decimalFraction() {
      switch (c) {
        case 'e':
        case 'E':
          buffer += read();
          lexState = 'decimalExponent';
          underscoreAllowed = false;
          return;
      }

      if (util.isDigit(c)) {
        buffer += read();
        underscoreAllowed = true;
        return;
      }
      else if (c === '_') {
        read();
        if (underscoreAllowed) {
          underscoreAllowed = false;
          return;
        }
        else {
          throw invalidChar('_');
        }
      }
      else if (c === 'm') {
        read();
        return newToken(big.getBigDecimalType(), big.toBigDecimal(signChar + buffer));
      }
      else if (c === 'd') {
        read();
        return newToken(getFixedBigDecimalType(), big.toFixedBigDecimal(signChar + buffer));
      }
      else if (!underscoreAllowed) {
        throw invalidChar('_');
      }

      return newToken('numeric', sign * Number(buffer));
    },

    decimalExponent() {
      switch (c) {
        case '+':
        case '-':
          buffer += read();
          lexState = 'decimalExponentSign';
          underscoreAllowed = false;
          return;
      }

      if (util.isDigit(c)) {
        buffer += read();
        lexState = 'decimalExponentInteger';
        underscoreAllowed = true;
        return;
      }

      throw invalidChar(read());
    },

    decimalExponentSign() {
      if (util.isDigit(c)) {
        buffer += read();
        lexState = 'decimalExponentInteger';
        underscoreAllowed = true;
        return;
      }

      throw invalidChar(read());
    },

    decimalExponentInteger() {
      if (util.isDigit(c)) {
        buffer += read();
        underscoreAllowed = true;
        return;
      }
      else if (c === '_') {
        read();
        if (underscoreAllowed) {
          underscoreAllowed = false;
          return;
        }
        else {
          throw invalidChar('_');
        }
      }
      else if (!underscoreAllowed) {
        throw invalidChar('_');
      }

      if (c === 'n') {
        read();
        $ = /^(.*)E(.*)$/i.exec(buffer);
        mantissa = $[1];
        exponent = Number($[2]);
        decimalPos = mantissa.indexOf('.');

        if (decimalPos >= 0) {
          exponent -= mantissa.length - decimalPos - 1;
        }

        if (exponent < 0) {
          $ = /^(.*?)(0+)$/.exec(mantissa);

          if ($) {
            mantissa = $[1];
            exponent += $[2].length;
          }

          if (exponent < 0) {
            throw invalidExponentForBigInt(buffer);
          }
        }

        mantissa = mantissa.replace('.', '');
        buffer = mantissa + '0'.repeat(exponent);

        return newToken(big.getBigIntType(), big.toBigInt(signChar + buffer));
      }
      else if (c === 'm') {
        read();
        return newToken(big.getBigDecimalType(), big.toBigDecimal(signChar + buffer));
      }
      else if (c === 'd') {
        read();
        return newToken(getFixedBigDecimalType(), big.toFixedBigDecimal(signChar + buffer));
      }

      return newToken('numeric', sign * Number(buffer));
    },

    hexadecimal() {
      if (util.isHexDigit(c)) {
        buffer += read();
        lexState = 'hexadecimalInteger';
        underscoreAllowed = true;
        return;
      }

      throw invalidChar(read());
    },

    hexadecimalInteger() {
      if (util.isHexDigit(c)) {
        buffer += read();
        underscoreAllowed = true;
        return;
      }
      else if (c === '_') {
        read();
        if (underscoreAllowed) {
          underscoreAllowed = false;
          return;
        }
        else {
          throw invalidChar('_');
        }
      }
      else if (!underscoreAllowed) {
        throw invalidChar('_');
      }

      if (c === 'n') {
        read();
        return newToken(big.getBigIntType(), big.toBigInt(signChar + buffer));
      }

      return newToken('numeric', sign * Number(buffer));
    },

    binary() {
      if (util.isBinaryDigit(c)) {
        buffer += read();
        lexState = 'binaryInteger';
        underscoreAllowed = true;
        return;
      }

      throw invalidChar(read());
    },

    binaryInteger() {
      if (util.isBinaryDigit(c)) {
        buffer += read();
        underscoreAllowed = true;
        return;
      }
      else if (c === '_') {
        read();
        if (underscoreAllowed) {
          underscoreAllowed = false;
          return;
        }
        else {
          throw invalidChar('_');
        }
      }
      else if (!underscoreAllowed) {
        throw invalidChar('_');
      }

      if (c === 'n') {
        read();
        return newToken(big.getBigIntType(), big.toBigInt(signChar + buffer));
      }

      return newToken('numeric', sign * Number(buffer));
    },

    octal() {
      if (util.isOctalDigit(c)) {
        buffer += read();
        lexState = 'octalInteger';
        underscoreAllowed = true;
        return;
      }

      throw invalidChar(read());
    },

    octalInteger() {
      if (util.isOctalDigit(c)) {
        buffer += read();
        underscoreAllowed = true;
        return;
      }
      else if (c === '_') {
        read();
        if (underscoreAllowed) {
          underscoreAllowed = false;
          return;
        }
        else {
          throw invalidChar('_');
        }
      }
      else if (!underscoreAllowed) {
        throw invalidChar('_');
      }

      if (c === 'n') {
        read();
        return newToken(big.getBigIntType(), big.toBigInt(signChar + buffer));
      }

      return newToken('numeric', sign * Number(buffer));
    },

    string() {
      switch (c) {
        case '\\':
          read();
          buffer += escape();
          return;

        case "'":
          if (quoteType === QUOTE_SINGLE) {
            read();
            return newToken('string', buffer);
          }

          buffer += read();
          return;

        case '"':
          if (quoteType === QUOTE_DOUBLE) {
            read();
            return newToken('string', buffer);
          }

          buffer += read();
          return;

        case '`':
          if (quoteType === QUOTE_BACKTICK) {
            read();
            return newToken('string', buffer);
          }

          buffer += read();
          return;

        case '\n':
        case '\r':
          throw invalidChar(read());

        case '\u2028':
        case '\u2029':
          separatorChar(c);
          break;

        case undefined:
          throw invalidChar(read());
      }

      buffer += read();
    },

    typeName() {
      if (util.isIdContinueChar(c)) {
        buffer += read();
        return;
      }

      const $ = /.*_(.+)/.exec(buffer);

      if ($) {
        buffer = $[1];

        if (util.isIdStartChar(buffer.charAt(0))) {
          return newToken('typeName', $[1]);
        }
      }

      throw invalidExtendedType(buffer);
    },

    start() {
      switch (c) {
        case '{':
        case '[':
          return newToken('punctuator', read());
      // Shouldn't reach here with c being undefined, no need to return eof token.
      }

      lexState = 'value';
    },

    beforePropertyName() {
      switch (c) {
        case '$':
        case '_':
          buffer = read();
          lexState = 'identifierName';
          return;

        case '\\':
          read();
          lexState = 'identifierNameStartEscape';
          return;

        case '}':
          return newToken('punctuator', read());

        case "'":
        case '"':
        case '`':
          read();
          quoteType = QUOTES.indexOf(c);
          lexState = 'string';
          return;
      }

      if (util.isIdStartChar(c)) {
        buffer += read();
        lexState = 'identifierName';
        return;
      }

      throw invalidChar(read());
    },

    afterPropertyName() {
      if (c === ':') {
        return newToken('punctuator', read());
      }

      throw invalidChar(read());
    },

    beforePropertyValue() {
      lexState = 'value';
    },

    afterPropertyValue() {
      switch (c) {
        case ',':
        case '}':
          return newToken('punctuator', read());
      }

      throw invalidChar(read());
    },

    beforeArrayValue() {
      if (c === ']') {
        return newToken('punctuator', read());
      }

      lexState = 'value';
    },

    afterArrayValue() {
      switch (c) {
        case ',':
        case ']':
          return newToken('punctuator', read());
      }

      throw invalidChar(read());
    },

    afterTypeName() {
      if (c === '(') {
        return newToken('punctuator', read());
      }

      throw invalidChar(read());
    },

    typeArgument() {
      if (c === ')') {
        return newToken('undefined');
      }

      lexState = 'value';
    },

    afterTypeArgument() {
      if (c === ')') {
        return newToken('punctuator', read());
      }

      throw invalidChar(read());
    },

    end() {
      // Shouldn't reach here with c being undefined, no need to return eof token.
      throw invalidChar(read());
    },
  };

  const parseStates = {
    start() {
      if (token.type === 'eof') {
        throw invalidEOF();
      }

      push();
    },

    beforePropertyName() {
      switch (token.type) {
        case 'identifier':
        case 'string':
          key = token.value;
          parseState = 'afterPropertyName';
          return;

        case 'punctuator':
        // Shouldn't be able to reach here token values other than '}'.
          pop();
          return;

        case 'eof':
          throw invalidEOF();
      }

      // Shouldn't be able to reach here with other tokens.
    },

    afterPropertyName() {
      // Shouldn't be able to reach here with tokens other than type 'punctuator', value ':'.
      if (token.type === 'eof') {
        throw invalidEOF();
      }

      const parent = stack[stack.length - 1];

      if (parent instanceof KeyedArrayValue) {
        parent.key = key;
      }

      parseState = 'beforePropertyValue';
    },

    beforePropertyValue() {
      if (token.type === 'eof') {
        throw invalidEOF();
      }

      push();
    },

    beforeArrayValue() {
      if (token.type === 'eof') {
        throw invalidEOF();
      }

      if (token.type === 'punctuator' && token.value === ']') {
        pop();
        return;
      }

      push();
    },

    afterPropertyValue() {
      // Shouldn't be able to reach here with tokens other than type 'punctuator'.
      if (token.type === 'eof') {
        throw invalidEOF();
      }

      switch (token.value) {
        case ',':
          parseState = 'beforePropertyName';
          return;

        case '}':
          pop();
      }

      // Shouldn't be able to reach here with other tokens.
    },

    afterArrayValue() {
      // Shouldn't be able to reach here with tokens other than type 'punctuator'.
      if (token.type === 'eof') {
        throw invalidEOF();
      }

      switch (token.value) {
        case ',':
          parseState = 'beforeArrayValue';
          return;

        case ']':
          pop();
      }

      // Shouldn't be able to reach here with other tokens.
    },

    end() {
      // Shouldn't be able to reach here with tokens other than type 'eof'.
    },

    afterTypeName() {
      // Shouldn't be able to reach here with tokens other than type 'punctuator'.
      if (token.type === 'eof') {
        throw invalidEOF();
      }

      parseState = 'typeArgument';
    },

    typeArgument() {
      if (token.type === 'eof') {
        throw invalidEOF();
      }

      push();
    },

    afterTypeArgument() {
      if (token.type === 'eof') {
        throw invalidEOF();
      }

      pop();
    },
  };

  Object.assign(options, optionsMgr.getParseOptions());

  if (typeof reviver === 'object') {
    newOptions = reviver;
    reviver = undefined;
  }

  Object.assign(options, newOptions || {});

  reviver = reviver || options.reviver;
  parseState = 'start';
  pos = 0;
  line = 1;
  column = 0;
  token = undefined;
  key = undefined;
  root = undefined;

  const reviveTypedContainers = !!options.reviveTypedContainers;

  do {
    token = lex();
    // Assume parseStates[parseState] exists
    parseStates[parseState]();
  } while (token.type !== 'eof');

  if (typeof reviver === 'function') {
    const result = internalize({'': root}, '', reviver);

    return result === util.DELETE ? undefined : result;
  }

  if (reviveTypedContainers && util.isTypeContainer(root)) {
    try {
      root = optionsMgr.reviveTypeValue(root, true);
    }
    catch (err) {
      throw syntaxError(err.message, true);
    }
  }

  return root;

  function internalize(holder, name, reviver) {
    const value = holder[name];

    if (typeof value === 'object') {
      const keys = Object.keys(value);

      for (const key of keys) {
        const replacement = internalize(value, key, reviver);

        if (replacement === util.DELETE) {
          delete value[key];
        }
        else {
          value[key] = replacement;
        }
      }
    }

    return reviver.call(holder, name, value, holder);
  }

  function lex() {
    lexState = 'default';
    buffer = '';
    quoteType = QUOTE_NONE;
    sign = 1;
    signChar = '';

    for (;;) {
      c = peek();

      // Assume valid lexState, lexStates[lexState]
      const token = lexStates[lexState]();

      if (token) {
        return token;
      }
    }
  }

  function peek() {
    if (source[pos]) {
      return String.fromCodePoint(source.codePointAt(pos));
    }
  }

  function read() {
    const c = peek();

    if (c === '\n') {
      line++;
      column = 0;
    }
    else if (c) {
      column += c.length;
    }
    else {
      column++;
    }

    if (c) {
      pos += c.length;
    }

    return c;
  }

  function newToken(type, value) {
    return {
      type,
      value,
      line,
      column,
    };
  }

  function literal(s) {
    for (const c of s) {
      const p = peek();

      if (p !== c) {
        throw invalidChar(read());
      }

      read();
    }
  }

  function escape() {
    const c = peek();
    switch (c) {
      case 'b':
        read();
        return '\b';

      case 'f':
        read();
        return '\f';

      case 'n':
        read();
        return '\n';

      case 'r':
        read();
        return '\r';

      case 't':
        read();
        return '\t';

      case 'v':
        read();
        return '\v';

      case '0':
        read();
        if (util.isDigit(peek())) {
          throw invalidChar(read());
        }

        return '\0';

      case 'x':
        read();
        return hexEscape();

      case 'u':
        read();
        return unicodeEscape();

      case '\n':
      case '\u2028':
      case '\u2029':
        read();
        return '';

      case '\r':
        read();
        if (peek() === '\n') {
          read();
        }

        return '';

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        throw invalidChar(read());

      case undefined:
        throw invalidChar(read());
    }

    return read();
  }

  function hexEscape() {
    let buffer = '';
    let c = peek();

    if (!util.isHexDigit(c)) {
      throw invalidChar(read());
    }

    buffer += read();

    c = peek();
    if (!util.isHexDigit(c)) {
      throw invalidChar(read());
    }

    buffer += read();

    return String.fromCodePoint(parseInt(buffer, 16));
  }

  function unicodeEscape() {
    let buffer = '';
    let count = 4;

    while (count-- > 0) {
      const c = peek();
      if (!util.isHexDigit(c)) {
        throw invalidChar(read());
      }

      buffer += read();
    }

    return String.fromCodePoint(parseInt(buffer, 16));
  }

  function push() {
    const parent = stack[stack.length - 1];
    let arrayParent = Array.isArray(parent);
    let value;
    let extendedType = false;

    switch (token.type) {
      case 'punctuator':
        switch (token.value) {
          case '{':
            value = {};
            break;

          case '[':
            value = [];
            break;

          case ',':
            value = EMPTY;
            break;

          case '#':
            value = new KeyedArrayValue();
            break;
        }

        break;

      case 'null':
      case 'undefined':
      case 'boolean':
      case 'numeric':
      case 'bigint':
      case 'bigdecimal':
      case 'fixedbd':
      case 'string':
        value = token.value;
        break;

      case 'typeName':
        value = new ExtendedType(token.value, parent);
        extendedType = true;

    // Shouldn't be able to reach here with other tokens.
    }

    if (root === undefined) {
      root = value;

      if (extendedType) {
        value.atRoot = true;
      }
    }
    else {
      if (parent instanceof ExtendedType) {
        parent.arg = value;
      }
      else if (parent instanceof KeyedArrayValue) {
        --parent.parent.length;
        parent.parent[parent.key] = value;
        stack.pop();
        arrayParent = true;
        value = null;
      }
      else if (arrayParent) {
        if (value === EMPTY) {
          ++parent.length;
          parseState = 'beforeArrayValue';
          return;
        }
        else {
          if (extendedType) {
            value.key = parent.length;
          }

          parent.push(value);
        }
      }
      else {
        if (extendedType) {
          value.key = key;
        }

        parent[key] = value;
      }
    }

    if (value !== null && (typeof value === 'object' && !big.isBigNumber(value))) {
      stack.push(value);

      if (extendedType) {
        parseState = 'afterTypeName';
      }
      else if (value instanceof KeyedArrayValue) {
        if (!arrayParent) {
          throw invalidChar('#');
        }

        value.parent = parent;
        parseState = 'beforePropertyName';
      }
      else if (Array.isArray(value)) {
        parseState = 'beforeArrayValue';
      }
      else {
        parseState = 'beforePropertyName';
      }
    }
    else {
      if (!parent) {
        parseState = 'end';
      }
      else if (parent instanceof ExtendedType) {
        parseState = 'afterTypeArgument';
      }
      else if (arrayParent) {
        parseState = 'afterArrayValue';
      }
      else {
        parseState = 'afterPropertyValue';
      }
    }
  }

  function pop() {
    let current = stack[stack.length - 1];

    if (current instanceof ExtendedType) {
      let revived;

      try {
        revived = optionsMgr.reviveTypeValue(current.name, current.arg);
      }
      catch (err) {
        throw syntaxError(err.message, true);
      }

      if (!revived) {
        revived = util.createTypeContainer(current.name, current.arg);
      }

      if (current.atRoot) {
        root = revived;
      }
      else {
        current.parent[current.key] = revived;
      }
    }
    else if (reviveTypedContainers) {
      Object.keys(current).forEach(key => {
        const value = current[key];

        if (util.isTypeContainer(value)) {
          try {
            current[key] = optionsMgr.reviveTypeValue(value);
          }
          catch (err) {
            throw syntaxError(err.message, true);
          }
        }
      });
    }

    stack.pop();

    current = stack[stack.length - 1];

    if (!current) {
      parseState = 'end';
    }
    else if (current instanceof ExtendedType) {
      parseState = 'afterTypeArgument';
    }
    else if (Array.isArray(current)) {
      parseState = 'afterArrayValue';
    }
    else {
      parseState = 'afterPropertyValue';
    }
  }

  function invalidChar(c) {
    if (c === undefined) {
      return syntaxError(`JSON-Z: invalid end of input at ${line}:${column}`);
    }

    return syntaxError(`JSON-Z: invalid character '${formatChar(c)}' at ${line}:${column}`);
  }

  function invalidEOF() {
    return syntaxError(`JSON-Z: invalid end of input at ${line}:${column}`);
  }

  function invalidIdentifier() {
    column -= 5;
    return syntaxError(`JSON-Z: invalid identifier character at ${line}:${column}`);
  }

  function invalidExponentForBigInt(value) {
    column -= value.length;
    return syntaxError(`JSON-Z: "${value}n" contains invalid exponent for BigInt at ${line}:${column}`);
  }

  function invalidExtendedType(name) {
    column -= name.length;
    return syntaxError(`JSON-Z: invalid extended type "${name}" at ${line}:${column}`);
  }

  function separatorChar(c) {
    console.warn(`JSON-Z: '${formatChar(c)}' in strings is not valid ECMAScript; consider escaping`);
  }

  function formatChar(c) {
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

    if (replacements[c]) {
      return replacements[c];
    }

    if (c < ' ') {
      const hexString = c.charCodeAt(0).toString(16);
      return '\\x' + ('00' + hexString).substring(hexString.length);
    }

    return c;
  }

  function syntaxError(message, addJSONZ) {
    const err = new SyntaxError((addJSONZ ? 'JSON-Z: ' : '') + message);
    err.lineNumber = line;
    err.columnNumber = column;
    return err;
  }
};
