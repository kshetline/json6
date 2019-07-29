# JSONZ – JSON for Everyone

[![Build Status](https://travis-ci.com/kshetline/json-z.svg?branch=master)][Build Status]
[![Coverage Status](https://coveralls.io/repos/github/kshetline/json-z/badge.svg?branch=master)](https://coveralls.io/github/kshetline/json-z?branch=master)

JSON-Z is a superset of [JSON] that aims to alleviate some of the limitations of JSON by expanding its syntax to include some productions from [ECMAScript 5.1], [ECMAScript 6.0], and later.

The goal of JSON-Z is to increase flexibilty of parsing while, by default, maintaining maximum compatibility with standard JSON for stringification. JSON-Z output, like JSON, is also valid JavaScript (with one optional exception, matching a possible future JavaScript feature).

This JavaScript library is the official reference implementation for JSON-Z parsing and serialization libraries.

[Build Status]: https://travis-ci.org/kshetline/json-z

[Coverage Status]: https://coveralls.io/github/kshetline/json-z

[JSON]: https://tools.ietf.org/html/rfc7159

[ECMAScript 5.1]: https://www.ecma-international.org/ecma-262/5.1/

[ECMAScript 6.0]: https://www.ecma-international.org/ecma-262/6.0/index.html

## Summary of Features
The following features, which are not supported in standard JSON, have been added to JSON-Z:

### Objects
- Object keys may be an unquoted ECMAScript 5.1 _[IdentifierName]_.
- Unquoted object keys may still include character escapes.
- Object keys may be single quoted or backtick quoted.
- Objects may have a single trailing comma.

### Arrays
- Arrays may have a single trailing comma.
- Arrays may be sparse, e.g. `[1, , 3, 4]`.

### Strings
- Strings may be single quoted or backtick quoted (using backticks does not, however, invoke string interpolation).
- Strings may span multiple lines by escaping new line characters.

### Numbers
- Numbers may be hexadecimal, octal, or binary.
- Numbers may have a leading or trailing decimal point, and may contain underscores used as separators.
- Numbers may be [IEEE 754] positive infinity, negative infinity, and NaN.
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
- Replacer functions can return the special value `JSONZ.DELETE` to indicate the a key/value pair in an object be deleted, or that a slot in an array be left empty.

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
  // Leading 0 indicates octal if no non-octal (8, 9) digits follow 
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
  "backwardsCompatible": "with JSON",
}
```

## Specification
For a detailed explanation of the JSON-Z format, please read (TODO: create specs).

## Installation
### Node.js
```sh
npm install json-z
```

```
const JSONZ = require('json-z')
```

### Browsers
```
<script src="https://unpkg.com/TODO-update-link/dist/index.min.js"></script>
```

This will create a global `JSONZ` variable.

## API
The JSON-Z API is compatible with the [JSON API]. Type definitions to support TypeScript are included.

[JSON API]:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON

### JSONZ.parse()
Parses a JSON-Z string, constructing the JavaScript value or object described by the string. An optional reviver function can be provided to perform a transformation on the resulting object before it is returned.

#### Syntax
    JSONZ.parse(text[, reviver])

#### Parameters
- `text`: The string to parse as JSON-Z.
- `reviver`: If a function, this prescribes how the value originally produced by parsing is transformed, before being returned.

#### Return value
The object corresponding to the given JSON-Z text.

### JSONZ.stringify()
Converts a JavaScript value to a JSON-Z string, optionally replacing values if a replacer function is specified, or optionally including only the specified properties if a replacer array is specified.

#### Syntax
    JSONZ.stringify(value[, replacer[, space]])
    JSONZ.stringify(value[, options])

#### Parameters
- `value`: The value to convert to a JSON-Z string.
- `replacer`: A function that alters the behavior of the stringification process, or an array of String and Number objects that serve as a whitelist for selecting/filtering the properties of the value object to be included in the JSON-Z string. If this value is null or not provided, all properties of the object are included in the resulting JSON-Z string.

  When using the standard `JSON.stringify()`, a replacer function is called with two arguments: `key` and `value`. JSON-Z adds a third argument, `holder`. This value is already available to standard `function`s as `this`, but `this` won't be bound to `holder` when using an anonymous (arrow) function as a replacer, so the third argument (which can be ignored if not needed) provides alternative access to the `holder` value.
- `space`: A string or number that is used to insert white space into the output JSON-Z string for readability purposes. If this is a number, it indicates the number of space characters to use as white space; this number is capped at 10. Values less than 1 indicate that no space should be used. If this is a string, the string (or the first 10 characters of the string, if it's longer than that) is used as white space. A single space adds white space without adding indentation. If this parameter is not provided (or is null), no white space is used. If indenting white space is used, trailing commas can optionally appear in objects and arrays.
- `options`: An object with the following properties:
  - `expandedPrimitives`: If `true` (the default is `false`) this enables direct stringification of `Infinity`, `-Infinity`, `NaN`, big integers using the '`n`' suffix, and big decimals using the '`m`' suffix. Otherwise `Infinity`, `-Infinity`, and `NaN` become `null`, and big integers and big decimals are quoted. (Note: The '`m`' suffix can't be parsed as current valid JavaScript, but it is potentially a future valid standard notation.)
  - `quote`: A string representing the quote character to use when serializing strings (single quote `'` or double quote `"`), or one of the following values:
    - `JSONZ.Quote.DOUBLE`: Always quote with double quotes (this is the default).
    - `JSONZ.Quote.SINGLE`: Always quote with single quotes.
    - `JSONZ.Quote.PREFER_DOUBLE`: Quote with double quotes, but switch to single quotes or backticks to reduce the number of characters which have to be backslash escaped.
    - `JSONZ.Quote.PREFER_SINGLE`: Quote with single quotes, but switch to single quotes or backticks to reduce the number of characters which have to be backslash escaped.
  - `quoteAllKeys`: By default (a `true` value), object keys are quoted, just as in standard JSON. If set to `false` quotes are omitted unless syntactically necessary.
  - `replacer`: Same as the `replacer` parameter.
  - `space`: Same as the `space` parameter. The default is no spacing.
  - `sparseArrays`: If `true` (the default is `false`) empty slots in arrays are represented with consecutive commas, e.g. `[1,,3]`. This can't be parsed as valid standard JSON, so by default such an array will be stringified as `[1,null,3]`
  - trailingComma: If `true` (the default is `false`), the final item in an indented object or array has a terminating comma.

#### Return value

A JSON-Z string representing the value.

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
- `bigIntClass`: A function or class responsible for handling big integer values. `bigIntClass(valueAsString, radix)`, e.g. `bigIntClass('123', 10)` or `bigIntClass('D87E', 16)`, either with or without a preceding `new`, must return a big integer object that satifies the test `bigIntValue instanceof bigIntClass`.
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
- `bigDoubleClass`: A function or class responsible for handling big decimal values.`bigDoubleClass(valueAsString)`, e.g. `bigDoubleClass('14.7')`, either with or without a preceding `new`, must return a big decimal object that satifies the test `bigDecimalValue instanceof bigDoubleClass`.

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

### Node.js `require()` JSON-Z files

When using Node.js, you can `require()` JSON-Z files by adding the following
statement.

```
require('json-z/lib/register')
```

Then you can load a JSON-Z file with a Node.js `require()` statement. For
example:

```
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
jsonz [options] <file>
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
[Assem Kishore](https://github.com/aseemk) founded this project as JSON5.

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

[json_parse.js]:
https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js

[Max Nanasy](https://github.com/MaxNanasy) has been an early and prolific
supporter, contributing multiple patches and ideas.

[Andrew Eisenberg](https://github.com/aeisenberg) contributed the original
`stringify` method.

[Jordan Tucker](https://github.com/jordanbtucker) has aligned JSON5 more closely
with ES5, wrote the official JSON5 specification, completely rewrote the
codebase from the ground up, and is actively maintaining this project.

[Kerry Shetline](https://github.com/kshetline) branched off from the JSON5 project to create JSON-Z.
