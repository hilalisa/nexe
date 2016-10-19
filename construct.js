/**
 * nexe API "wrapper"
 *
 * @name nexe
 * @author Jared Allard <jaredallard@outlook.com>
 * @version 2.0.0
 * @license MIT
 **/

'use strict';

const path = require('path'),
      fs   = require('fs');

const LIB_DIR = path.join(__dirname, 'lib');

/**
 * Nexe
 * @class
 **/
class Nexe {

  /**
   * Nexe constructor
   *
   * @param {Object} config - nexe configuration object.
   *
   * @constructor
   **/
  constructor(config) {
    let self = this;

    this.libs = {};
    this.config = config;

    // Load our libraries, use sync because bad to use async in constructors
    let libs = fs.readdirSync(LIB_DIR);
    libs.forEach(function(lib) {
      let LIB_PATH = path.join(LIB_DIR, lib);
      let LIB_NAME = path.parse(lib).name;

      // Require and the instance the lib.
      let LIB_CLASS    = require(LIB_PATH);

      let DOWNLOAD_DIR = config.temp;

      // If not absolute, use from CWD.
      if(!path.isAbsolute(config.temp)) {
        DOWNLOAD_DIR = path.join(process.cwd(), config.temp);
      }

      // link it unto the nexe class.
      self.libs[LIB_NAME] = new LIB_CLASS(self.libs, self.config, DOWNLOAD_DIR);
    });


    let console = this.libs.log;
    console.log('nexe initialized.');
  }

  /**
   * Create a executable.
   *
   * @param {Object} badOpts - Detect if instanced incorrectly.
   * @returns {boolean} success status
   **/
  compile(badOpts) {
    if(typeof badOpts === 'object') {
      throw 'Detected nexe v1 style of usage. Please use v2.'
    }
  }
}


let nexe = new Nexe({
  input: './something.js',
  output: 'out.nexe',
  temp: './temp'
});


nexe.libs.download.downloadNode('latest', (err, location) => {
  if(err) {
    return console.error(err);
  }

  console.log('Node.JS Download to:', location);

  nexe.libs.download.extractNode('latest', (err, location) => {
    console.log('Node.JS Extracted.');

    let compfile = path.join(location, 'lib', 'nexe.js');
    nexe.libs.package.bundle('./test.js', compfile, 'browserify', err => {
      if(err) {
        return console.error(err);
      }

      console.log('successfully bundled the file.');

      // patch node.js to use nexe.
      nexe.libs.patch.node('6.0.0', err => {
        if(err) {
          return console.error(err);
        }

        nexe.libs.embed.files('6.0.0', [], '', {}, err => {
          if(err) {
            return console.error(err);
          }

          nexe.libs.compile.node('6.0.0', err => {
            if(err) {
              return console.error(err);
            }

            console.log('Node.JS Compiled.');
          })
        })
      });
    });
  })
});