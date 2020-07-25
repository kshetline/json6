const assert = require('assert');
const child = require('child_process');
const fs = require('fs');
const path = require('path');
const tap = require('tap');
const pkg = require('../package.json');

const cliPath = path.resolve(__dirname, '../lib/cli.js');

tap.test('CLI', t => {
  t.test('converts JSON-Z to JSON from stdin to stdout', t => {
    const proc = child.spawn(process.execPath, [cliPath]);
    let output = '';
    proc.stdout.on('data', data => {
      output += data;
    });

    proc.stdout.on('end', () => {
      assert.strictEqual(output, '{"$":100,"a":1,"b":2}');
      t.end();
    });

    fs.createReadStream(path.resolve(__dirname, 'test.jsonz')).pipe(proc.stdin);
  });

  t.test('reads from the specified file', t => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        path.resolve(__dirname, 'test.jsonz'),
      ]
    );

    let output = '';
    proc.stdout.on('data', data => {
      output += data;
    });

    proc.stdout.on('end', () => {
      assert.strictEqual(output, '{"$":100,"a":1,"b":2}');
      t.end();
    });
  });

  t.test('indents output with the number of spaces specified', t => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        path.resolve(__dirname, 'test.jsonz'),
        '-s',
        '4',
      ]
    );

    let output = '';
    proc.stdout.on('data', data => {
      output += data;
    });

    proc.stdout.on('end', () => {
      assert.strictEqual(output, '{\n    "$": 100,\n    "a": 1,\n    "b": 2\n}');
      t.end();
    });
  });

  t.test('indents output with tabs when specified', t => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        path.resolve(__dirname, 'test.jsonz'),
        '-s',
        't',
      ]
    );

    let output = '';
    proc.stdout.on('data', data => {
      output += data;
    });

    proc.stdout.on('end', () => {
      assert.strictEqual(output, '{\n\t"$": 100,\n\t"a": 1,\n\t"b": 2\n}');
      t.end();
    });
  });

  t.test('outputs to the specified file', t => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        path.resolve(__dirname, 'test.jsonz'),
        '-o',
        path.resolve(__dirname, 'output.json'),
      ]
    );

    proc.on('exit', () => {
      assert.strictEqual(
        fs.readFileSync(
          path.resolve(__dirname, 'output.json'),
          'utf8'
        ),
        '{"$":100,"a":1,"b":2}'
      );
      t.end();
    });

    t.tearDown(() => {
      try {
        fs.unlinkSync(path.resolve(__dirname, 'output.json'));
      }
      catch (err) {}
    });
  });

  t.test('validates valid JSON-Z files', t => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        path.resolve(__dirname, 'test.jsonz'),
        '-v',
      ]
    );

    proc.on('exit', code => {
      assert.strictEqual(code, 0);
      t.end();
    });
  });

  t.test('validates invalid JSON-Z files', t => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        path.resolve(__dirname, 'invalid.jsonz'),
        '-v',
      ]
    );

    let error = '';
    proc.stderr.on('data', data => {
      error += data;
    });

    proc.stderr.on('end', () => {
      if (error.includes('JSON-Z')) { // Strip away debug content, if any
        error = (/(JSON-Z.*?\n)/.exec(error) || [])[1];
      }

      assert.strictEqual(error, "JSON-Z: invalid character 'a' at 1:1\n");
    });

    proc.on('exit', code => {
      assert.strictEqual(code, 1);
      t.end();
    });
  });

  t.test('outputs the version number when specified', t => {
    const proc = child.spawn(process.execPath, [cliPath, '-V']);

    let output = '';
    proc.stdout.on('data', data => {
      output += data;
    });

    proc.stdout.on('end', () => {
      assert.strictEqual(output, pkg.version + '\n');
      t.end();
    });
  });

  t.test('outputs usage information when specified', t => {
    const proc = child.spawn(process.execPath, [cliPath, '-h']);

    let output = '';
    proc.stdout.on('data', data => {
      output += data;
    });

    proc.stdout.on('end', () => {
      assert(/Usage/.test(output));
      t.end();
    });
  });

  t.test('is backward compatible with v0.5.1', t => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        '-c',
        path.resolve(__dirname, 'test.jsonz'),
      ]
    );

    proc.on('exit', () => {
      assert.strictEqual(
        fs.readFileSync(
          path.resolve(__dirname, 'test.json'),
          'utf8'
        ),
        '{"$":100,"a":1,"b":2}'
      );
      t.end();
    });

    t.tearDown(() => {
      try {
        fs.unlinkSync(path.resolve(__dirname, 'test.json'));
      }
      catch (err) {}
    });
  });

  t.end();
});
