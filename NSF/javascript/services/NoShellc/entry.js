const readline = require('readline');
var Writable = require('stream').Writable;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl._writeToOutput = function _writeToOutput(stringToWrite) {
  if (rl.stdoutMuted)
    rl.output.write("\x1B[2K\x1B[200D"+rl.query+"["+((rl.line.length%2==1)?"*.":".*")+"]");
  else
    rl.output.write(stringToWrite);
};


function start(api) {
  let _username = null;
  let _password = null;
  let _token = null;
  let _mutex = true;

  let DEFAULT_SERVER = api.Daemon.Settings.default_server;
  let DAEMONTYPE = api.Daemon.Settings.connection_servers[DEFAULT_SERVER].type;
  let DAEMONIP = api.Daemon.Settings.connection_servers[DEFAULT_SERVER].ip;
  let DAEMONPORT =api.Daemon.Settings.connection_servers[DEFAULT_SERVER].port;

  api.Implementation.setImplement('signin', (conn_method, remoteip, port, callback)=>{
    api.Implementation.setImplement('onToken', callback);
    console.log('Please signin your account.');
    rl.stdoutMuted = false;
    rl.query = 'username: ';
    rl.question(rl.query, (username) => {

      _username = username;
      rl.stdoutMuted = true;
      rl.query = 'password: ';
      rl.question(rl.query, (password) => {
        rl.stdoutMuted = false;
        console.log('');
        _password = password;
        api.Implementation.getClientConnProfile(conn_method, remoteip, port, (err, connprofile) => {
          let _data = {
            u: _username,
            p: _password
          }
          api.Implementation.emitRouter(connprofile, 'GT', _data);
        });
      });
    });

  });

  api.Implementation.setImplement('AuthbyToken', (callback) => {
    if(_token == null) {
      api.Implementation.returnImplement('signin')(DAEMONTYPE, DAEMONIP, DAEMONPORT, (err, token)=>{
        _token = token;
      });
    }
    callback(false, _username, _token);
  });

  setTimeout(()=> {
    let _manifest = api.Me.Manifest;
    let _daemon_display_name = api.Daemon.Settings.daemon_display_name;
    console.log('');
    console.log(_manifest.displayname);
    console.log(_manifest.description);
    console.log('');
    console.log('To access '+_daemon_display_name+'. You need to auth yourself.');
    api.Implementation.returnImplement('signin')(DAEMONTYPE, DAEMONIP, DAEMONPORT, (err, token)=>{
      if(err) {
        console.log('Auth failed.');
      }
      _token = token;
      let cmd = null;
      api.Service.ActivitySocket.createSocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, 'NoShell', (err, as) => {
        as.call('welcome', null, (err, msg) => {
          console.log(msg);
          var recursiveAsyncReadLine = function () {

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
    });


  }, api.Daemon.Settings.shell_client_service_delay);

}

module.exports = {
  start: start
}
