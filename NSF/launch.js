// NSF/launch.js
// Description:
// "launch.js" launch NOOXY Service deamon.
// Copyright 2018 NOOXY. All Rights Reserved.


// configuration
let config = {
  port: 1234,
  origin: false,
  databasepath: 'none',
};

let core = require('./NSd/core');
core.launch(config);
