// NoService/NoService/runtime/launcher.js
// Description:
// "launcher.js" launch NOOXY Service deamon.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

'use strict';
const fork = require('child_process').fork;
const fs = require('fs');

process.title = 'NoServiceLauncher';

module.exports.launch = (path, settingspath)=> {
  let _child;
  let relaunch = true;
  let retried = 0;
  let settings = JSON.parse(fs.readFileSync(settingspath, 'utf8'));
  settings["path"] = path+'/';

  let launchCore = ()=> {
    settings = JSON.parse(fs.readFileSync(settingspath, 'utf8'));
    settings["path"] = path+'/';
    _child  = fork(require.resolve('./create_core_instance'), {stdio: [process.stdin, process.stdout, process.stderr, 'ipc']});
    _child.send({t:0, settings: settings});
    _child.on('exit', (code)=> {

      if(code !=0 ) {
        if(relaunch===false) {
         console.log('Launcher has recieve close signal from core.');
         process.exit();
        }
        if(retried===3) {
          console.log('Launcher has retried launching '+retried+' times. Aborted.');
          process.exit();
        }
        retried +=1;
      }
      else {
        retried = 0;
      }

      if(relaunch) {
        console.log(process.title+' is relauching NoService.');
        setTimeout(launchCore, 1000);
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

    process.on('SIGTERM', () => {
      _child.send({t:99});
      process.exit();
    });

    process.on('SIGINT', () => {
      _child.send({t:99});
      process.exit();
    });
  }
  launchCore();
};
