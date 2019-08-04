const assert = require('assert');
const JSONZ = require('../lib');

require('tap').mochaGlobals();

describe('JSONZ', () => {
  describe('#parse()', () => {
    describe('errors', () => {
      it('throws on empty documents', () => {
        assert.throws(() => {
          JSONZ.parse('');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid end of input/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 1
        ));
      });

      it('throws on documents with only comments', () => {
        assert.throws(() => {
          JSONZ.parse('//a');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid end of input/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 4
        ));
      });

      it('throws on incomplete single line comments', () => {
        assert.throws(() => {
          JSONZ.parse('/a');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character 'a'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 2
        ));
      });

      it('throws on unterminated multiline comments', () => {
        assert.throws(() => {
          JSONZ.parse('/*');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid end of input/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 3
        ));
      });

      it('throws on unterminated multiline comment closings', () => {
        assert.throws(() => {
          JSONZ.parse('/**');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid end of input/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 4
        ));
      });

      it('throws on invalid characters in values', () => {
        assert.throws(() => {
          JSONZ.parse('a');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character 'a'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 1
        ));
      });

      it('throws on invalid characters in identifier start escapes', () => {
        assert.throws(() => {
          JSONZ.parse('{\\a:1}');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character 'a'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 3
        ));
      });

      it('throws on invalid identifier start characters', () => {
        assert.throws(() => {
          JSONZ.parse('{\\u0021:1}');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid identifier character/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 2
        ));
      });

      it('throws on invalid characters in identifier continue escapes', () => {
        assert.throws(() => {
          JSONZ.parse('{a\\a:1}');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character 'a'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 4
        ));
      });

      it('throws on invalid identifier continue characters', () => {
        assert.throws(() => {
          JSONZ.parse('{a\\u0021:1}');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid identifier character/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 3
        ));
      });

      it('throws on invalid characters following a sign', () => {
        assert.throws(() => {
          JSONZ.parse('-a');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character 'a'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 2
        ));
      });

      it('throws on invalid characters following a leading decimal point', () => {
        assert.throws(() => {
          JSONZ.parse('.a');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character 'a'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 2
        ));
      });

      it('throws on invalid characters following an exponent indicator', () => {
        assert.throws(() => {
          JSONZ.parse('1ea');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character 'a'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 3
        ));
      });

      it('throws on invalid characters following an exponent sign', () => {
        assert.throws(() => {
          JSONZ.parse('1e-a');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character 'a'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 4
        ));
      });

      it('throws on invalid characters following a hexidecimal indicator', () => {
        assert.throws(() => {
          JSONZ.parse('0xg');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character 'g'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 3
        ));
      });

      it('throws on invalid characters following a binary indicator', () => {
        assert.throws(() => {
          JSONZ.parse('0b2');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character '2'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 3
        ));
      });

      it('throws on invalid characters following an octal indicator', () => {
        assert.throws(() => {
          JSONZ.parse('0o?');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character '?'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 3
        ));
      });

      it('throws on invalid use of underscore separators in numbers', () => {
        const badNumbers = [
          '_12', '1__2', '12_', '12_.3', '0._1', '._1', '.1_', '0.1__2', '12_E3', '1E_2', '1E2_', '1E2__3',
          '0x_12', '0x1__2', '0x12_',
          '0o_12', '0o1__2', '0o12_',
          '0b_11', '0b1__1', '0b11_',
        ];

        for (const badNumber of badNumbers) {
          assert.throws(() => {
            JSONZ.parse(badNumber);
          },
          err => (
            err instanceof SyntaxError &&
                          /^JSON-Z: invalid (character '_'|extended type)/.test(err.message)
          ));
        }
      });

      it('throws on invalid exponent for bigint', () => {
        assert.throws(() => {
          JSONZ.parse('1230e-2n');
        },
        err => {
          return err instanceof SyntaxError &&
                            /^JSON-Z: "1230e-2n" contains invalid exponent/.test(err.message) &&
                            err.lineNumber === 1 &&
                            err.columnNumber === 1;
        });

        assert.throws(() => {
          JSONZ.parse('123e-1n');
        },
        err => {
          return err instanceof SyntaxError &&
                            /^JSON-Z: "123e-1n" contains invalid exponent/.test(err.message) &&
                            err.lineNumber === 1 &&
                            err.columnNumber === 1;
        });
      });

      it('throws on invalid extended value types', () => {
        assert.throws(() => {
          JSONZ.parse('_("bar")');
        },
        err => {
          return err instanceof SyntaxError &&
                            /^JSON-Z: invalid extended type/.test(err.message) &&
                            err.lineNumber === 1;
        });
        assert.throws(() => {
          JSONZ.parse('_7oo("bar")');
        },
        err => {
          return err instanceof SyntaxError &&
                            /^JSON-Z: invalid extended type/.test(err.message) &&
                            err.lineNumber === 1;
        });
      });

      it('throws on invalid extended value syntax', () => {
        assert.throws(() => {
          JSONZ.parse('_Date["bar")');
        },
        err => {
          return err instanceof SyntaxError &&
                            /^JSON-Z: invalid character/.test(err.message) &&
                            err.lineNumber === 1;
        });

        assert.throws(() => {
          JSONZ.parse('_Date');
        },
        err => {
          return err instanceof SyntaxError &&
                            /^JSON-Z: invalid end of input/.test(err.message) &&
                            err.lineNumber === 1;
        });

        assert.throws(() => {
          JSONZ.parse('_Date(');
        },
        err => {
          return err instanceof SyntaxError &&
                            /^JSON-Z: invalid end of input/.test(err.message) &&
                            err.lineNumber === 1;
        });

        assert.throws(() => {
          JSONZ.parse('_Date("bar"{');
        },
        err => {
          return err instanceof SyntaxError &&
                            /^JSON-Z: invalid character/.test(err.message) &&
                            err.lineNumber === 1;
        });

        assert.throws(() => {
          JSONZ.parse('_Date("bar"');
        },
        err => {
          return err instanceof SyntaxError &&
                            /^JSON-Z: invalid end of input/.test(err.message) &&
                            err.lineNumber === 1;
        });
      });

      it('throws on invalid new lines in strings', () => {
        assert.throws(() => {
          JSONZ.parse('"\n"');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character '\\n'/.test(err.message) &&
                        err.lineNumber === 2 &&
                        err.columnNumber === 0
        ));
      });

      it('throws on unterminated strings', () => {
        assert.throws(() => {
          JSONZ.parse('"');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid end of input/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 2
        ));
      });

      it('throws on invalid identifier start characters in property names', () => {
        assert.throws(() => {
          JSONZ.parse('{!:1}');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character '!'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 2
        ));
      });

      it('throws on invalid characters following a property name', () => {
        assert.throws(() => {
          JSONZ.parse('{a!1}');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character '!'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 3
        ));
      });

      it('throws on invalid characters following a property value', () => {
        assert.throws(() => {
          JSONZ.parse('{a:1!}');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character '!'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 5
        ));
      });

      it('throws on invalid characters following an array value', () => {
        assert.throws(() => {
          JSONZ.parse('[1!]');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character '!'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 3
        ));
      });

      it('throws on invalid characters in literals', () => {
        assert.throws(() => {
          JSONZ.parse('tru!');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character '!'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 4
        ));
      });

      it('throws on unterminated escapes', () => {
        assert.throws(() => {
          JSONZ.parse('"\\');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid end of input/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 3
        ));
      });

      it('throws on invalid first digits in hexadecimal escapes', () => {
        assert.throws(() => {
          JSONZ.parse('"\\xg"');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character 'g'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 4
        ));
      });

      it('throws on invalid second digits in hexadecimal escapes', () => {
        assert.throws(() => {
          JSONZ.parse('"\\x0g"');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character 'g'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 5
        ));
      });

      it('throws on invalid unicode escapes', () => {
        assert.throws(() => {
          JSONZ.parse('"\\u000g"');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character 'g'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 7
        ));
      });

      it('throws on escaped digits other than 0', () => {
        for (let i = 1; i <= 9; i++) {
          assert.throws(() => {
            JSONZ.parse(`'\\${i}'`);
          },
          err => (
            err instanceof SyntaxError &&
                            /^JSON-Z: invalid character '\d'/.test(err.message) &&
                            err.lineNumber === 1 &&
                            err.columnNumber === 3
          ));
        }
      });

      it('throws on octal escapes', () => {
        assert.throws(() => {
          JSONZ.parse("'\\01'");
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character '1'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 4
        ));
      });

      it('throws on multiple values', () => {
        assert.throws(() => {
          JSONZ.parse('1 2');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character '2'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 3
        ));
      });

      it('throws with control characters escaped in the message', () => {
        assert.throws(() => {
          JSONZ.parse('\x01');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character '\\x01'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 1
        ));
      });

      it('throws on unclosed objects before property names', () => {
        assert.throws(() => {
          JSONZ.parse('{');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid end of input/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 2
        ));
      });

      it('throws on unclosed objects after property names', () => {
        assert.throws(() => {
          JSONZ.parse('{a');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid end of input/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 3
        ));
      });

      it('throws on unclosed objects before property values', () => {
        assert.throws(() => {
          JSONZ.parse('{a:');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid end of input/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 4
        ));
      });

      it('throws on unclosed objects after property values', () => {
        assert.throws(() => {
          JSONZ.parse('{a:1');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid end of input/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 5
        ));
      });

      it('throws on initial comma in object', () => {
        assert.throws(() => {
          JSONZ.parse('{,a:1,b:2}');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character ','/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 2
        ));
      });

      it('throws on consecutive commas in object', () => {
        assert.throws(() => {
          JSONZ.parse('{a:1,,b:2}');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character ','/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 6
        ));
      });

      it('throws on unclosed arrays before values', () => {
        assert.throws(() => {
          JSONZ.parse('[');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid end of input/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 2
        ));
      });

      it('throws on unclosed arrays after values', () => {
        assert.throws(() => {
          JSONZ.parse('[1');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid end of input/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 3
        ));
      });

      it('throws on trying to use array property syntax in non-array object', () => {
        assert.throws(() => {
          JSONZ.parse('{foo: #"bar"}');
        },
        err => (
          err instanceof SyntaxError &&
                        /^JSON-Z: invalid character '#'/.test(err.message) &&
                        err.lineNumber === 1 &&
                        err.columnNumber === 7
        ));
      });
    });
  });
});
