const assert = require('assert');
const sinon = require('sinon');

require('tap').mochaGlobals();

describe('require(*.json6)', () => {
  it('parses a JSON6 document', () => {
    require('../lib/register');
    assert.deepStrictEqual({a: 1, b: 2}, require('./test.json6'));
  });

  it('is backward compatible with v0.5.1, but gives a deprecation warning', () => {
    const mock = sinon.mock(console);
    mock.expects('warn').once().withExactArgs("'json6/require' is deprecated. Please use 'json6/register' instead.");
    require('../lib/require');
    assert.deepStrictEqual({a: 1, b: 2}, require('./test.json6'));
    mock.verify();
  });

  it('throws on invalid JSON6', () => {
    require('../lib/register');
    assert.throws(() => { require('./invalid.json6'); }, SyntaxError);
  });
});
