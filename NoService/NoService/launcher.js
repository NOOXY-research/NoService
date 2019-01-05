// NoService/NoService/launcher.js
// Description:
// "launcher.js" launch NOOXY Service deamon.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

'use strict';
const fork = require('child_process').fork;

process.title = 'NoServiceMaster';

module.exports.launch = (settings)=> {
  let _child;
  let relaunch = true;
  let retry = 0;

  let launchCore = ()=> {
    _child  = fork(require.resolve('./core'), {stdio: [process.stdin, process.stdout, process.stderr, 'ipc']});
    _child.send({t:0, settings: settings});
    _child.on('exit', (code)=> {

      if(code !=0 ) {
        if(retry=3) {
          console.log('Server has retried launching '+retry+' times. Aborted.');

          process.exit();
        }
        retry +=1;
      }
      if(relaunch) {
        console.log('NoServiceMaster is relauching NoService.');
        launchCore();
      }
      else {
        process.exit();
      }
    });

    _child.on('message', (msg)=> {
      // do not relaunch code
      if(msg.t==0) {
        relaunch = false;
      }
    });
  }

  launchCore();

};
