\\// NSF/NSd/core.js
// Description:
// "core.js" control main behavior of deamon.
// Copyright 2018 NOOXY. All Rights Reserved.


var fs = require('fs');


let Conn = require('./connection');
let Auth = require('./authoration');
let Db = require('./database');
let Methods = require('./methods');
let ServiceManager = require('./service').manager;


function launch(config) {
  // initialize environmaent
  console.log('launching server...')
  if (isinitialized() == false) {
    initialize();
  };

  // initialize variables
  let wsconn = new Conn.WSServer();
  let methods = new Methods();
  let auth = new Auth();
  let servicemgr = new ServiceManager();

  // setup variables
  auth.importDatabase(config.databasepath);

  // create gateway
  let coregateway = {
    auth: auth,
    servicemgr : servicemgr,
    conn: wsconn
  };

  // start connection
  wsconn.setup(port, origin);
  methods.setup(coregateway);

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
