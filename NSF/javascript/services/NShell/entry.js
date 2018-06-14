const readlineSync = require('readline-sync');
const cluster = require('cluster');

function start(api) {

  console.log(`Worker ${process.pid} started`);
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
    _username = readlineSync.question('username: ');
    _password = readlineSync.question('password: ', {hideEchoBack: true });
    api.Implementation.getClientConnProfile(conn_method, remoteip, port, (err, connprofile) => {
      let _data = {
        u: _username,
        p: _password
      }
      api.Implementation.emitRouter(connprofile, 'GT', _data);
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
  //
  // setTimeout(()=> {
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
      api.Service.ActivitySocket.createSocket(DAEMONTYPE, DAEMONIP, DAEMONPORT, 'NShell', (err, as) => {
          while(1) {
            cmd = readlineSync.question('>>> ');
          }
      });
    });

  //
  // }, api.Daemon.Settings.shell_client_service_delay);

}

module.exports = {
  start: start
}
