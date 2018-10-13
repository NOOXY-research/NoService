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


function start(Me, api) {
  let utils = api.Utils;
  let _username = null;
  let _password = null;
  let _token = null;
  let _mutex = true;
  let commandread;
  api.Daemon.getSettings((err, daemon_setting)=>{
    // setup up remote shell service by daemon default connciton
    let DEFAULT_SERVER = daemon_setting.default_server;
    let DAEMONTYPE = daemon_setting.connection_servers[DEFAULT_SERVER].type;
    let DAEMONIP = daemon_setting.connection_servers[DEFAULT_SERVER].ip;
    let DAEMONPORT =daemon_setting.connection_servers[DEFAULT_SERVER].port;

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
    api.getImplementation((err, Implementation)=>{
      // setup NSF Auth implementation
      Implementation.setImplement('signin', (connprofile, data, data_sender)=>{
        console.log('Please signin your account.');
        _get_password((err, p)=>{
          let _data = {
            u: _username,
            p: p
          }
          _username = _data.u;
          Implementation.emitRouter(connprofile, 'GT', _data);
          commandread();
        });

      });

      // setup NSF Auth implementation
      Implementation.setImplement('AuthbyToken', (connprofile, data, data_sender) => {
        let callback = (err, token)=>{
          let _data = {
            m:'TK',
            d:{
              t: data.d.t,
              v: token
            }
          }
          data_sender(connprofile, 'AU', 'rs', _data);
        };
        if(_token == null) {
          Implementation.getImplement('signin', (err, im)=> {
            im(connprofile, data, data_sender);
          });
        }
        else {
          callback(false, _token);
        }

      });

      Implementation.setImplement('onToken', (err, token)=>{
        _token = token;
      });

      Implementation.setImplement('AuthbyTokenFailed', (connprofile, data, data_sender) => {
        Implementation.returnImplement('signin')(connprofile, data, data_sender);
      });

      // setup NSF Auth implementation
      Implementation.setImplement('AuthbyPassword', (connprofile, data, data_sender) => {
        let callback = (err, password)=>{
          let _data = {
            m:'PW',
            d:{
              t: data.d.t,
              v: password
            }
          }
          data_sender(connprofile, 'AU', 'rs', _data);
        };
        _get_password((err, p) => {
          callback(err, p);
        });
      });

      setTimeout(()=> {
        let _manifest = Me.Manifest;
        let _daemon_display_name = daemon_setting.daemon_display_name;
        console.log(_manifest.displayname+' started.');
        console.log(_manifest.description);
        console.log('connecting to default server of daemon(nsp('+DAEMONTYPE+')://'+DAEMONIP+':'+DAEMONPORT+')...');
        // console.log('To access '+_daemon_display_name+'. You need to auth yourself.');
        // Implementation.returnImplement('signin')(DAEMONTYPE, DAEMONIP, DAEMONPORT, (err, token)=>{
        //   if(err) {
        //     console.log('Auth failed.');
        //   }
        //   _token = token;
        rl.question('Login as: ', (uname)=> {
          console.log('');
          _username = uname;
          let cmd = null;
          api.Service.ActivitySocket.createSocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, 'NoShell', _username, (err, as) => {
            commandread = () => {
              rl.question('>>> ', (cmd)=> {
                if (cmd == 'exit') //we need some base case, for recursion
                  return rl.close(); //closing RL and returning from function.
                as.call('sendC', {c: cmd}, (err, json)=>{
                  console.log(json.r);
                  commandread(); //Calling this function again to ask new question
                });
              });
            };

            console.log('connected.');
            as.onData = (data) => {
              if(data.t == 'stream') {
                console.log(data.d);
              }
            }
            as.call('welcome', null, (err, msg) => {
              console.log(msg);

              commandread();
            });
          });
        });
    });


      // });


    }, daemon_setting.shell_client_service_delay);
  });
}

module.exports = {
  start: start
}
