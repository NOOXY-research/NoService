// NoService/NoService/runtime/create_core_instance.js
// Description:
// "create_core_instance.js" create a core instance.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const Constants = require('./constants');
const Core = require('./core');

let _core;

let terminateNoService = ()=> {
  process.send({t:0});
  process.exit();
};

// Checking dependencies
for(let pkg in Constants.dependencies) {
  try {
    require.resolve(Constants.dependencies[pkg]);
  } catch (e) {
    console.log('Please install package "'+Constants.dependencies[pkg]+'".');
    terminateNoService();
  }
}

process.on('message', (msg)=> {
  if(msg.t == 0) {
    _core = new Core(msg.settings);
    _core.onTerminated = terminateNoService;
    _core.checkandlaunch();
  }
  else if(msg.t == 99) {
    _core.close();
  }
});

process.on('SIGTERM', () => {
  _core.close();
});

process.on('SIGINT', () => {
  _core.close();
});
