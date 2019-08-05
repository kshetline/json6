# JSON-Z – JSON for Everyone

[![NPM Stats](https://nodei.co/npm/json-z.png)](https://npmjs.org/package/json-z/)

[![Build Status](https://travis-ci.com/kshetline/json-z.svg?branch=master)][Build Status]
[![Coverage Status](https://coveralls.io/repos/github/kshetline/json-z/badge.svg?branch=master)](https://coveralls.io/github/kshetline/json-z?branch=master)
[![npm](https://img.shields.io/npm/v/json-z.svg)](https://npmjs.org/package/json-z/)
[![npm downloads](https://img.shields.io/npm/dm/json-z.svg)](https://npmjs.org/package/json-z/)
[![npm bundle size](https://img.shields.io/bundlephobia/min/json-z.svg)](https://npmjs.org/package/json-z/)

JSON-Z is a superset of [JSON] that aims to alleviate some of the limitations of JSON by expanding its syntax to include some productions from [ECMAScript 5.1], [ECMAScript 6.0], and later.

The goal of JSON-Z is to increase flexibility of parsing while, by default, maintaining maximum compatibility with standard JSON for stringification. JSON-Z output, like JSON, is also valid JavaScript (with two *optional* exceptions).

This JavaScript library is the official reference implementation for JSON-Z parsing and serialization libraries.

[Build Status]: https://travis-ci.org/kshetline/json-z

[Coverage Status]: https://coveralls.io/github/kshetline/json-z

[JSON]: https://tools.ietf.org/html/rfc7159

[ECMAScript 5.1]: https://www.ecma-international.org/ecma-262/5.1/

[ECMAScript 6.0]: https://www.ecma-international.org/ecma-262/6.0/index.html

_By the way, the original JSON might be pronounced like the name "Jason", but JSON-Z is pronounced jay-SANH-zee, kind of like "Jumanji"._

_At least that's what I'm going with._

## Summary of Features

The following features, which are not supported in standard JSON, have been added to JSON-Z:

### Objects

- Object keys may be unquoted ECMAScript 5.1 _[IdentifierName]_ s.
- Unquoted object keys may include character escapes.
- Character escapes with two hex digits (`\xXX`) are supported for parsing, as well as the standard four digit `\uXXXX` form.
- Object keys may be single quoted or backtick quoted.
- Object key/value pairs may have a single trailing comma.

### Arrays

- Array elements may have a single trailing comma.
- Arrays may be sparse, e.g. `[1, , 3, 4]`.
- If arrays have string keys with associated values (not recommended!), e.g. `[1, 2, 3, #frequency: "Kenneth"]`, such key/value pairs can be parsed and optionally stringified. This also applies to numeric keys which are negative or non-integer. (The `#` is not part of the key, it simply precedes any explicitly keyed value in an array.) Key/value pairs such as these are normally hidden, and do not affect the `length` property of an array.

### Strings

- Strings may be single quoted or backtick quoted (using backticks does not, however, invoke string interpolation).
- Strings may span multiple lines by escaping new line characters.
- Character escapes with two hex digits (`\xXX`) are supported for parsing, as well as the standard four digit `\uXXXX` form.

### Numbers

- Numbers may be hexadecimal, octal, or binary.
- Numbers may have a leading or trailing decimal point, and may contain underscores used as separators.
- Numbers may be [IEEE 754] positive infinity (`Infinity`), negative infinity (`-Infinity`), and `NaN`.
- Numbers may begin with an explicit plus sign.
- Negative zero (`-0`) is parsed and stringified as distinct from positive 0.
- Numbers may be `BigInt` values by appending a lowercase `n` to the end of an integer value, e.g. `9_223_372_036_854_775_807n`.
- When running a version of JavaScript that does not support native `BigInt` primitives, a third-party `BigInt`-like library can be used.
- `BigInt` values can be in decimal, hexadecimal, octal, or binary form. Exponential notation can also be used (e.g. `4.2E12n`) so long as the value including its exponent specifies an integer value.
- Numbers may be extended-precision decimal values by appending a lowercase `m`, e.g. `3.141592653589793238462643383279m`. (Using a third-party extended-precision library is necessary to take full advantage of this feature.)

### Comments

- Single and multi-line comments are allowed.

### White Space

- Additional white space characters are allowed.

### Undefined

- Handles `undefined` values.

### Replacer functions

- As part of handling `undefined` values, when a replacer function returns `undefined`, that will itself become the encoded value of the value which has been replaced.
- Replacer functions can return the special value `JSONZ.DELETE` to indicate that a key/value pair in an object be deleted, or that a slot in an array be left empty.
- A global replacer function can be specified.
- For the benefit of anonymous (arrow) functions, which do not have their own `this`, replacer functions are passed the holder of a key/value pair as a third argument to the function.

### Reviver functions

- A global reviver function can be specified.
- For the benefit of anonymous (arrow) functions, which do not have their own `this`, reviver functions are passed the holder of a key/value pair as a third argument to the function.

### Extended types

In standard JSON, all values are either strings, numbers, booleans, or `null`s, or values are objects or arrays composed of the latter as well as other objects and arrays. JSON-Z optionally allows special handling for other data types, so that values such a `Date` or `Set` objects can be specifically represented as such, parsed and stringified distinctly without having to rely on reviver and replacer functions.

- Built-in support for `Date`, `Map`, `Set`, and `Uint8Array` (using base64 representation). `Uint8ClampedArray` is also covered, treated as `Uint8Array`.
- There is also built-in support for `BigInt` and "Big Decimal" values as extended types, an alternative to using plain numbers with `n` or `m` suffixes.
- User-defined extended type handlers, which can both add new data types, or override the handling of built-in extended data types.

[IdentifierName]: https://www.ecma-international.org/ecma-262/5.1/#sec-7.6

[IEEE 754]: http://ieeexplore.ieee.org/servlet/opac?punumber=4610933

## Short Example

```
{
  // comments
  unquoted: 'and you can quote me on that',
  singleQuotes: 'I can use "double quotes" here',
  backtickQuotes: `I can use "double quotes"  and 'single quotes' here`,
  lineBreaks: "Look, Mom! \
No \\n's!",
  million: 1_000_000, // Underscore separators in numbers allowed
  hexadecimal: 0xdecaf,
  // Leading 0 indicates octal if no non-octal digits (8, 9) follow 
  octal: [0o7, 074],
  binary: 0b100101,
  leadingDecimalPoint: .8675309, andTrailing: 8675309.,
  negativeZero: -0,
  positiveSign: +1,
  notDefined: undefined,
  bigInt: -9223372036854775808n,
  bigDecimal: 3.141592653589793238462643383279m,
  trailingComma: 'in objects', andIn: ['arrays',],
  sparseArray: [1, 2, , , 5],
  // Function-like extended types. This is revived as a JavaScript `Date` object
  date: _Date('2019-07-28T08:49:58.202Z'),
  // Type container extended types. This is optionally revived as a JavaScript `Date` object
  date2: {"_$_": "Date", "_$_value": "2019-07-28T08:49:58.202Z"},
  // A relatively compact way to send and receive binary data
  buffer: _Uint8Array('T25lLiBUd28uIEZpdmUuLi4gSSBtZWFuIHRocmVlIQ=='),
  "backwardsCompatible": "with JSON",
}
```

## Specification

For a detailed explanation of the JSON-Z format, please read (_TODO: create specs_).

## Installation

### Node.js
```sh
npm install json-z
```

```
const JSONZ = require('json-z')
```

Or, as TypeScript:

```typescript
import * as JSONZ from 'json-z';
```

### Browsers
```
<script src="https://unpkg.com/TODO-update-link/dist/index.min.js"></script>
```

This will create a global `JSONZ` variable.

## API

The JSON-Z API is compatible with the [JSON API]. Type definitions to support TypeScript are included.

[JSON API]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON

### JSONZ.parse()

Parses a JSON-Z string, constructing the JavaScript value or object described by the string. An optional reviver function can be provided to perform a transformation on the resulting object before it is returned.

_Note: One important change from JSON5 is that the `JSONZ.parse()` function is re-entrant, so it is safe to call `JSONZ.parse()` from within reviver functions and extended type handlers._

#### Syntax

    JSONZ.parse(text[, reviver][, options])

This works very much like [`JSON.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse), with the addition of the `options` parameter, and that the `reviver` function is passed a third argument, `holder`, in addition to `key` and `value`, which lets the `reviver` know the array or object that contains the value being examined.

#### Parameters

- `text`: The string to parse as JSON-Z.
- `reviver`: If a function, this prescribes how the value originally produced by parsing is transformed, before being returned.
- `options`: An object with the following properties:
  - `reviveTypedContainers`: If `true` (the default is `false`), objects which take the form of an extended type container, e.g. `{"_$_": "Date", "_$_value": "2019-07-28T08:49:58.202Z"}`, can be revived as specific object classes, such as `Date`.
  - `reviver`: An alternate means of providing a reviver function.

#### Return value

The object corresponding to the given JSON-Z text.

### JSONZ.stringify()

Converts a JavaScript value to a JSON-Z string, optionally replacing values if a replacer function is specified, or optionally including only the specified properties if a replacer array is specified.

This works very much like [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify), with the addition of the `options` parameter, and that the `replacer` function is passed a third argument, `holder`, in addition to `key` and `value`, which lets the `replacer` know the array or object that contains the value being examined.

#### Syntax

    JSONZ.stringify(value[, replacer[, space]])
    JSONZ.stringify(value[, options])

#### Parameters

- `value`: The value to convert to a JSON-Z string.
- `replacer`: A function that alters the behavior of the stringification process, or an array of String and Number objects that serve as a whitelist for selecting/filtering the properties of the value object to be included in the JSON-Z string. If this value is null or not provided, all properties of the object are included in the resulting JSON-Z string.

  When using the standard `JSON.stringify()`, a replacer function is called with two arguments: `key` and `value`. JSON-Z adds a third argument, `holder`. This value is already available to standard `function`s as `this`, but `this` won't be bound to `holder` when using an anonymous (arrow) function as a replacer, so the third argument (which can be ignored if not needed) provides alternative access to the `holder` value.
- `space`: A string or number that is used to insert white space into the output JSON-Z string for readability purposes. If this is a number, it indicates the number of space characters to use as white space; this number is capped at 10. Values less than 1 indicate that no space should be used. If this is a string, the string (or the first 10 characters of the string, if it's longer than that) is used as white space. A single space adds white space without adding indentation. If this parameter is not provided (or is null), no white space is added. If indenting white space is used, trailing commas can optionally appear in objects and arrays.
- `options`: An object with the following properties:
  - `extendedPrimitives`: If `true` (the default is `false`) this enables direct stringification of `Infinity`, `-Infinity`, and `NaN`. Otherwise these values become `null`.
  - `extendedTypes`: If `JSONZ.ExtendedTypeMode.AS_FUNCTIONS` or `JSONZ.ExtendedTypeMode.AS_OBJECTS` (the default is `JSONZ.ExtendedTypeMode.OFF`), this enables special representation of additional data types, such as `_Date("2019-07-28T08:49:58.202Z")`, which can be parsed directly as a JavaScript `Date` object, or `{"_$_": "Date", "_$_value": "2019-07-28T08:49:58.202Z"}`, which can be automatically rendered as a `Date` object by a built-in replacer.
  - `primitiveBigDecimal`: If `true` (the default is `false`) this enables direct stringification of big decimals using the '`m`' suffix. Otherwise big decimals are provided as quoted strings or extended types. _(Note: The '`m`' suffix can't be parsed as current valid JavaScript, but it is potentially a future valid standard notation.)_
  - `primitiveBigInt`: If `true` (the default is `false`) this enables direct stringification of big integers using the '`n`' suffix. Otherwise big integers are provided as quoted strings or extended types.
  - `quote`: A string representing the quote character to use when serializing strings (single quote `'` or double quote `"`), or one of the following values:
    - `JSONZ.Quote.DOUBLE`: Always quote with double quotes (this is the default).
    - `JSONZ.Quote.SINGLE`: Always quote with single quotes.
    - `JSONZ.Quote.PREFER_DOUBLE`: Quote with double quotes, but switch to single quotes or backticks to reduce the number of characters which have to be backslash escaped.
    - `JSONZ.Quote.PREFER_SINGLE`: Quote with single quotes, but switch to single quotes or backticks to reduce the number of characters which have to be backslash escaped.
  - `quoteAllKeys`: By default (a `true` value), object keys are quoted, just as in standard JSON. If set to `false` quotes are omitted unless syntactically necessary.
  - `replacer`: Same as the `replacer` parameter.
  - `revealHiddenArrayProperties`: Consider this an experimental option. While normally arrays should only have data stored using non-negative integer indices, data _can_ be stored in arrays using string keys and other types of numeric keys. This option will reveal and stringify such additional key/value pairs if present, but this is at the expense of making the JSON-Z output something that must be parsed back using JSON-Z, and is no longer directly usable as valid JavaScript.
  - `space`: Same as the `space` parameter. The default is no spacing.
  - `sparseArrays`: If `true` (the default is `false`) empty slots in arrays are represented with consecutive commas, e.g. `[1,,3]`. This can't be parsed as valid standard JSON, so by default such an array will be stringified as `[1,null,3]`
  - `trailingComma`: If `true` (the default is `false`), the final item in an indented object or array has a terminating comma.
  - `typePrefix`: Normally a single underscore (`_`), this is a prefix used for extended type notation. It can be any string of valid identifier characters staring and ending in an underscore. It is used to help create unique function names when extended type restoration is done using functions named in the global namespace.

#### Return value

A JSON-Z string representing the value.

#### Using obj.toJSON() and obj.toJSONZ()

For use with the standard `JSON.stringify()`, any object being stringified can have an optional `toJSON()` method. This way an object can explicity tell `JSON.stringify()` how its value should be represented.

JSON-Z can also use an object's `toJSON()` method, but other factors might take priority as follows:

1. If an object has a `toJSONZ()` method, this takes highest priority. The value returned by `toJSONZ()` can be further modified by any replacer function in effect. Note that when `toJSONZ()` is called, two arguments are passed to this function: `key` (an array index or object property name) and `holder` (the parent array or parent object (if any) of the object).
1. If an object can be converted by an extended type handler, that has the next priority. When `ExtendedTypeMode.AS_FUNCTIONS` is in effect, a conversion handled by an extended type handler is final. Replacer functions can, however, further act upon extended type conversions when `ExtendedTypeMode.AS_OBJECTS` is in effect.
1. `toJSON()` is the next possible value conversion, but only if `toJSONZ()` has not already taken priority.
1. Any active replacer function is then applied.
1. Finally, special handling for `BigInt` and "big decimal" numbers takes place.

### JSONZ.hasBigInt()

Returns true if JSON-Z is currently providing full big integer support.

### JSONZ.hasNativeBigInt()

Returns true if the currently running version of JavaScript natively supports big integers via `BigInt` and constants such as `100n`.

### JSONZ.hasBigDecimal()

Returns true if JSON-Z is currently providing full big decimal support.

### JSONZ.setBigInt()

Sets a function or class for handling big integer values, or turns special handling of native JavaScript `BigInt` on or off.

#### Syntax

    JSONZ.setBigInt(bigIntClass)
    JSONZ.setBigInt(active)

#### Parameters

- `bigIntClass`: A function or class responsible for handling big integer values. `bigIntClass(valueAsString, radix)`, e.g. `bigIntClass('123', 10)` or `bigIntClass('D87E', 16)`, either with or without a preceding `new`, must return a big integer object that satisfies the test `bigIntValue instanceof bigIntClass`.
- `active`: If `true`, native `BigInt` support (if available) is activated. If `false`, `BigInt` support is deactivated.

#### Sample usage

```
npm install json-z
npm install big-integer
```
```
const JSONZ = require('json-z);
const bigInt = require('big-integer');

JSONZ.setBigInt(bigInt);
```

### JSONZ.setBigDouble()

Sets a function or class for handling extended-precision decimal floating point values.

#### Syntax

    JSONZ.setBigDouble(bigDoubleClass)

#### Parameters

- `bigDoubleClass`: A function or class responsible for handling big decimal values. `bigDoubleClass(valueAsString)`, e.g. `bigDoubleClass('14.7')`, either with or without a preceding `new`, must return a big decimal object that satisfies the test `bigDecimalValue instanceof bigDoubleClass`.

#### Sample usage

```
npm install json-z
npm install decimal.js
```
```
const JSONZ = require('json-z');
const Decimal = require('decimal.js');

JSONZ.setBigDecimal(Decimal);
```

### JSONZ.setOptions(options[, additionalOptions])

Sets global options which will be used for all calls to `JSONZ.stringify()`. The specific options passed to `JSONZ.stringify()` itself override the global options on a per-option basis.

#### Parameters

- `options`: This can be an object just as described for [`JSONZ.stringify()`](#jsonzstringify), or it can be one of the following constants:
  - `JSONZ.OptionSet.MAX_COMPATIBILITY`: These are the options which make the output of JSON-Z fully JSON-compliant.
  - `JSONZ.OptionSet.RELAXED`: These options produce output which is fully-valid (albeit cutting-edge) JavaScript, removing unnecessary quotes, favoring single quotes, permitting values like `undefined` and `NaN` and sparse arrays.
  - `JSONZ.OptionSet.THE_WORKS`: This set of options pulls out (nearly) all of the stops, creating output which generally will have to be parsed back using JSON-Z, including function-style extended types and big decimal numbers. `revealHiddenArrayProperties` remains false, however, and must be expressly activated.
- `additionalOptions`: If `options` is an `OptionSet` value, `additionalOptions` can be used to make further options modifications.

### JSONZ.resetOptions()

This restores the default global stringification options for JSON-Z. It is equivalent to `JSONZ.setOptions(JSONZ.OptionSet.MAX_COMPATIBILITY)`.

### JSONZ.setParseOptions(options)

Sets global options which will be used for all calls to `JSONZ.parse()`. The specific options passed to `JSONZ.parse()` itself override the global options on a per-option basis.

#### Parameters

- `options`: An object with the following properties:
  - `reviveTypedContainers`: Same as described for [`JSONZ.parse()`](#jsonzparse).
  - `reviver`: A global reviver function.

### JSONZ.resetParseOptions()

Resets the global parsing options, i.e. no automatic type container revival, no global revival function.

### JSONZ.addTypeHandler(handler)

This adds a global extended type handler. These handlers allow JSON-Z to parse and stringify special data types beyond the arrays, simple objects, and primitives supported by standard JSON. Here, as an example, is the built-in handler for `Date` objects:

```javascript
const dateHandler = {
  name: 'Date',
  test: obj => obj instanceof Date,
  creator: date => new Date(date),
  serializer: date => (isNaN(date.getTime()) ? NaN : date.toISOString()),
};
```

When adding multiple type handlers, the most recently added handlers have priority over previous type handlers, which is important if it's possible for the `test` function to recognize objects or values also recognized by other handlers.

The `extendedTypes` option for `JSONZ.stringify()` lets you choose between two formats for extended types:

`JSONZ.ExtendedTypeMode.AS_FUNCTIONS` format:

     _Date('2019-07-28T08:49:58.202Z')

The disadvantage of this format is that it can't be parsed as standard JSON. The advantage is that it _is valid JavaScript_, and it works better as JSON-P. 

As long as `_Date` is a global function (see [`JSONZ.globalizeTypeHandlers`](#jsonzglobalizetypehandlersprefix)), the date object can be revived. To help with possible global namespace conflicts, the option `typePrefix` can be changed to something like `'_jsonz_'`, which will result in output like this:

     _jsonz_Date("2019-07-28T08:49:58.202Z")

`JSONZ.ExtendedTypeMode.AS_OBJECTS` format:

     {"_$_": "Date", "_$_value": "2019-07-28T08:49:58.202Z"}

This has the advantage of being valid standard JSON, and even without using JSON-Z on the receiving end, the right reviver function can convert this to a `Date`. The disadvantage is that it's harder to use this format with JSON-P, as there's no natural place to intercept the data and convert it.

`JSONZ.ExtendedTypeMode.OFF` disables both of the above options.

### JSONZ.globalizeTypeHandlers([prefix])

This function registers your type handlers (and the built-in type handlers) as global functions, which facilitates the process of handling JSON-Z output as JSON-P. The optional `prefix` argument (which needs to be either a single underscore (the default), or a valid JavaScript identifier that both begins and ends in an underscore) lets you control how these functions use the global namespace. If you change the default prefix, that same prefix needs to be used as an option by the call to `JSONZ.stringify()` which creates the output that you're consuming.

### JSONZ.removeTypeHandler(typeName)

This function removes the type handler for the given `typeName`.

### JSONZ.resetStandardTypeHandlers()

This removes all user-added type handlers, and restores all built-in  type handlers.

### JSONZ.restoreStandardTypeHandlers()

This restores all built-in  type handlers, leaving any user-added type handlers.

### Node.js `require()` JSON-Z files

When using Node.js, you can `require()` JSON-Z files by adding the following
statement.

```javascript
require('json-z/lib/register')
```

Then you can load a JSON-Z file with a Node.js `require()` statement. For
example:

```javascript
const config = require('./config.jsonz')
```

## CLI

Since JSON is more widely used than JSON-Z, this package includes a CLI for
converting JSON-Z to JSON and for validating the syntax of JSON-Z documents.

### Installation

```sh
npm install --global json-z
```

### Usage

```sh
json-z [options] <file>
```

If `<file>` is not provided, then STDIN is used.

#### Options:

- `-s`, `--space`: The number of spaces to indent or `t` for tabs
- `-o`, `--out-file [file]`: Output to the specified file, otherwise STDOUT
- `-v`, `--validate`: Validate JSON-Z but do not output JSON
- `-V`, `--version`: Output the version number
- `-h`, `--help`: Output usage information

### Development

```sh
git clone https://github.com/kshetline/json-z
cd json-z
npm install
```

When contributing code, please write relevant tests and run `npm test` and `npm
run lint` before submitting pull requests. Please use an editor that supports
[EditorConfig](http://editorconfig.org/).

### Issues

To report bugs or request features regarding the JavaScript implementation of
JSON-Z, please submit an issue to this repository.

## License

MIT. See [LICENSE.md](./LICENSE.md) for details.

## Credits

[Assem Kishore](https://github.com/aseemk) founded this project as [JSON5](https://json5.org/).

[Michael Bolin](http://bolinfest.com/) independently arrived at and published
some of these same ideas with awesome explanations and detail. Recommended
reading: [Suggested Improvements to JSON](http://bolinfest.com/essays/json.html)

[Douglas Crockford](http://www.crockford.com/) of course designed and built
JSON, but his state machine diagrams on the [JSON website](http://json.org/), as
cheesy as it may sound, gave us motivation and confidence that building a new
parser to implement these ideas was within reach! The original
implementation of JSON5 was also modeled directly off of Doug’s open-source
[json_parse.js] parser. We’re grateful for that clean and well-documented
code.

[json_parse.js]: https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js

[Max Nanasy](https://github.com/MaxNanasy) has been an early and prolific
supporter, contributing multiple patches and ideas.

[Andrew Eisenberg](https://github.com/aeisenberg) contributed the original
`stringify` method.

[Jordan Tucker](https://github.com/jordanbtucker) has aligned JSON5 more closely
with ES5, wrote the official JSON5 specification, completely rewrote the
codebase from the ground up, and is actively maintaining this project.

[Kerry Shetline](https://github.com/kshetline) branched off from the JSON5 project to create [JSON-Z](https://json-z.org/).
