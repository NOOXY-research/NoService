// NSF/services/NoShellc/entry.js
// Description:
// "NoShellc/entry.js" is a NSF Shell Client.
// Copyright 2018 NOOXY. All Rights Reserved.
//
// beware that this client's crypto uses daemon's implementation so it can only be used as local client instead of remote one.

const readline = require('readline');
var Writable = require('stream').Writable;

// async stdio
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl._writeToOutput = function _writeToOutput(stringToWrite) {
  if (rl.stdoutMuted){
    rl.output.write("\x1B[2K\x1B[200D"+rl.query+"["+((rl.line.length%2==1)?"*.":".*")+"]");
  }
  else
    rl.output.write(stringToWrite);
};


function start(api) {
  let utils = api.Utils;
  let _username = null;
  let _password = null;
  let _token = null;
  let _mutex = true;

  // setup up remote shell service by daemon default connciton
  let DEFAULT_SERVER = api.Daemon.Settings.default_server;
  let DAEMONTYPE = api.Daemon.Settings.connection_servers[DEFAULT_SERVER].type;
  let DAEMONIP = api.Daemon.Settings.connection_servers[DEFAULT_SERVER].ip;
  let DAEMONPORT =api.Daemon.Settings.connection_servers[DEFAULT_SERVER].port;

  // get username and password from terminal input
  let _get_username_and_password = (callback) => {
    let u = null;
    let p = null;
    rl.stdoutMuted = false;
    rl.query = 'username: ';
    rl.question(rl.query, (username) => {

      u = username;
      _get_password((err, p)=>{
        callback(false, u, p);
      });
    });

  };

  let _get_password = (callback)=> {
    rl.stdoutMuted = true;
    rl.query = 'password: ';
    rl.question(rl.query, (password) => {
      rl.stdoutMuted = false;
      console.log('');
      rl.history.shift();
      p = password;
      callback(false, p);
    });
  }

  // setup NSF Auth implementation
  api.Implementation.setImplement('signin', (conn_method, remoteip, port, callback)=>{
    api.Implementation.setImplement('onToken', callback);
    console.log('Please signin your account.');
    _get_username_and_password((err, u, p)=>{
      api.Implementation.getClientConnProfile(conn_method, remoteip, port, (err, connprofile) => {
        let _data = {
          u: u,
          p: p
        }
        api.Implementation.emitRouter(connprofile, 'GT', _data);
      });
    });
  });

  // setup NSF Auth implementation
  api.Implementation.setImplement('AuthbyToken', (callback) => {
    let pass = true;
    if(_token == null) {
      api.Implementation.returnImplement('signin')(DAEMONTYPE, DAEMONIP, DAEMONPORT, (err, token)=>{
        _token = token;
        if(_token != null) {
          callback(false, _token);
        }
      });
    }
    else {
      callback(false, _token);
    }

  });

  // setup NSF Auth implementation
  api.Implementation.setImplement('AuthbyPassword', (callback) => {
    _get_password((err, p) => {
      callback(err, p);
    });
  });

  setTimeout(()=> {
    let _manifest = api.Me.Manifest;
    let _daemon_display_name = api.Daemon.Settings.daemon_display_name;
    console.log(_manifest.displayname+' started.');
    console.log(_manifest.description);
    console.log('connecting to default server of daemon(nsp('+DAEMONTYPE+')://'+DAEMONIP+':'+DAEMONPORT+')...');
    // console.log('To access '+_daemon_display_name+'. You need to auth yourself.');
    // api.Implementation.returnImplement('signin')(DAEMONTYPE, DAEMONIP, DAEMONPORT, (err, token)=>{
    //   if(err) {
    //     console.log('Auth failed.');
    //   }
    //   _token = token;
      let cmd = null;
      api.Service.ActivitySocket.createSocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, 'NoShell', (err, as) => {
        console.log('connected.');
        as.onData = (data) => {
          if(data.t == 'stream') {
            console.log(data.d);
          }
        }
        as.call('welcome', null, (err, msg) => {
          console.log(msg);
          var recursiveAsyncReadLine = () => {
            rl.question('>>> ', function (cmd) {
              if (cmd == 'exit') //we need some base case, for recursion
                return rl.close(); //closing RL and returning from function.
              as.call('sendC', {c: cmd}, (err, json)=>{
                console.log(json.r);
                recursiveAsyncReadLine(); //Calling this function again to ask new question
              });
            });
          };
          recursiveAsyncReadLine();
        });
      });
    // });


  }, api.Daemon.Settings.shell_client_service_delay);

}

module.exports = {
  start: start
}
