// NSF/NSd/core.js
// Description:
// "core.js" control main behavior of deamon.
// Copyright 2018 NOOXY. All Rights Reserved.


var fs = require('fs');


let conn = require('./connection');
let auth = require('./authoration');
let db = require('./database');
let methods = require('./methods');


function launch() {
  // initialize
  console.log('launching server...')
  if (isinitialized() == false) {
    initialize();
  };

  

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
  console.log('initializing NSd...')
  console.log('creating eula...')
  fs.writeFile('./eula.txt', '', function(err) {
    if(err) {
        return console.log(err);
    }
  });
  console.log('NSd initilalized.');
}

exports.launch = launch;
