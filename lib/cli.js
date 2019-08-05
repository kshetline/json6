#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const pkg = require('../package.json');
const JSONZ = require('./');

JSONZ.setOptions(JSONZ.OptionSet.MAX_COMPATIBILITY);
JSONZ.setBigInt(false);

const argv = minimist(process.argv.slice(2), {
  alias: {
    'convert': 'c',
    'space': 's',
    'validate': 'v',
    'out-file': 'o',
    'version': 'V',
    'help': 'h',
  },
  boolean: [
    'convert',
    'validate',
    'version',
    'help',
  ],
  string: [
    'space',
    'out-file',
  ],
});

if (argv.version) {
  version();
}
else if (argv.help) {
  usage();
}
else {
  const inFilename = argv._[0];

  let readStream;
  if (inFilename) {
    readStream = fs.createReadStream(inFilename);
  }
  else {
    readStream = process.stdin;
  }

  let jsonz = '';
  readStream.on('data', data => {
    jsonz += data;
  });

  readStream.on('end', () => {
    let space;
    if (argv.space === 't' || argv.space === 'tab') {
      space = '\t';
    }
    else {
      space = Number(argv.space);
    }

    let value;
    try {
      value = JSONZ.parse(jsonz);
      if (!argv.validate) {
        const json = JSONZ.stringify(value, null, space);

        let writeStream;

        // --convert is for backward compatibility with v0.5.1. If
        // specified with <file> and not --out-file, then a file with
        // the same name but with a .json extension will be written.
        if (argv.convert && inFilename && !argv.o) {
          const parsedFilename = path.parse(inFilename);
          const outFilename = path.format(
            Object.assign(
              parsedFilename, {
                base: path.basename(parsedFilename.base, parsedFilename.ext) + '.json',
              }
            )
          );

          writeStream = fs.createWriteStream(outFilename);
        }
        else if (argv.o) {
          writeStream = fs.createWriteStream(argv.o);
        }
        else {
          writeStream = process.stdout;
        }

        writeStream.write(json);
      }
    }
    catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  });
}

function version() {
  console.log(pkg.version);
}

function usage() {
  console.log(
    `
  Usage: jsonz [options] <file>

  If <file> is not provided, then STDIN is used.

  Options:

    -s, --space              The number of spaces to indent or 't' for tabs
    -o, --out-file [file]    Output to the specified file, otherwise STDOUT
    -v, --validate           Validate JSON-Z but do not output JSON
    -V, --version            Output the version number
    -h, --help               Output usage information`
  );
}
