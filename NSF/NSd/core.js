// NSF/NSd/core.js
// Description:
// "core.js" control main behavior of deamon.
// Copyright 2018 NOOXY. All Rights Reserved.

var fs = require('fs');

var Path = require("path");
let Conn = require('./connection');
let Auth = require('./authoration');
let Db = require('./database');
let Methods = require('./methods');
let Service = require('./service');
let Entity = require('./entity');
let Utils = require('./utilities');

let _runtime_id = Utils.generateGUID();
let _path = path.resolve("./");
var _setting = JSON.parse(fs.readFileSync('setting.json', 'utf8'));


function launch(config) {
  // initialize environment
  console.log('Checking environment...')
  if (isinitialized() == false) {
    initialize();
  };
  console.log('done.')

  // initialize variables
  console.log('Initializing variables...')
  console.log('done.')

  // setup variables
  console.log('Settinup server...')
  console.log('done.')

  // create gateway
  console.log('Creating coregateway...')
  let coregateway = {
    Authoration: _Authoration,
    Service : _Service,
    Connection: _Connection
  };
  console.log('done.')

  // launch daemon
  console.log('Launching daemon...')
  console.log('done.')

}

function isinitialized() {
  if (fs.existsSync('./eula.txt')) {
    return true;
  }
  else {
    return false;
  }
}

function initialize() {
  console.log('Initializing NSd...')
  console.log('Creating eula...')
  fs.writeFile('./eula.txt', '', function(err) {
    if(err) {
        return console.log(err);
    }
  });
  console.log('NSd initilalized.');
}

exports.launch = launch;
