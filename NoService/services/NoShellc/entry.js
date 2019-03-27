// NoService/services/NoShellc/entry.js
// Description:
// "NoShellc/entry.js" is a NoService Shell Client.
// Copyright 2018 NOOXY. All Rights Reserved.
//
// beware that this client's crypto uses daemon's implementation so it can only be used as local client instead of remote one.

const readline = require('readline');
var Writable = require('stream').Writable;
function Service(Me, NoService) {
  // Your service entry point
  // Get the service socket of your service
  let ss = NoService.Service.ServiceSocket;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not API provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by NoService.SafeCallback.
  // E.g. setTimeout(NoService.SafeCallback(callback), timeout)
  let safec = NoService.SafeCallback;
  // Your settings in manifest file.
  let settings = Me.Settings;

  this.start = ()=> {
    let utils = NoService.Utils;

    let _token = null;
    let _mutex = true;
    let commandread;
    let _as;
    let _username;
    let _password;

    NoService.Daemon.getSettings((err, daemon_setting)=>{
      // setup up remote shell service by daemon default connciton
      let DEFAULT_SERVER = daemon_setting.default_server;
      let DAEMONTYPE = daemon_setting.connection_servers[DEFAULT_SERVER].type;
      let DAEMONIP = daemon_setting.connection_servers[DEFAULT_SERVER].ip;
      let DAEMONPORT =daemon_setting.connection_servers[DEFAULT_SERVER].port;

      // overwrite settings
      if(settings.remote_daemon) {
        DAEMONTYPE = settings.daemon_connection_type;
        DAEMONIP = settings.daemon_ip;
        DAEMONPORT = settings.daemon_port;
      }

      let _manifest = Me.Manifest;
      let _daemon_display_name = daemon_setting.daemon_display_name;
      console.log(_manifest.displayname+' started.');
      console.log(_manifest.description);
      console.log('connecting to default server of daemon(nsp('+DAEMONTYPE+')://'+DAEMONIP+':'+DAEMONPORT+')...');

      let _new_session = ()=> {
        NoService.Commandline.question('Login as: ', (uname)=> {
          console.log('You are now "'+uname+'". Type "exit" to end this session.');
          _username = uname;
          NoService.Service.ActivitySocket.createSocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, 'NoShell', _username, (err, as) => {
            as.onEvent('welcome', (err, msg) => {
              console.log(msg);
              commandread();
            });
            _as = as;
            commandread = () => {
              NoService.Commandline.question('>>> ', (cmd)=> {
                if (cmd == 'exit') {
                  _username = null;
                  _token = null;
                  _as = null;
                  _new_session();
                  return 0; //closing RL and returning from function.
                }
                as.call('sendC', {c: cmd}, (err, json)=>{
                  console.log(json.r);
                  commandread();
                });
              });
            };
            console.log('connected.');
            as.on('data', (data) => {
              if(data.t == 'stream') {
                console.log(data.d);
              }
            });
          });
        });
      };

      _new_session();
    }
  };

  this.close = ()=> {

  };
}


module.exports = Service;
