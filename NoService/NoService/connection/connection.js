// NoService/NoService/connection/connection.js
// Description:
// "connection.js" provide connection interface.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const Utils = require('../library').Utilities;
const ConnectionsPath = require("path").join(__dirname, "./connections");
let Connections = {};
const Buf = require('../buffer');

require("fs").readdirSync(ConnectionsPath).forEach((file)=> {
  let conn = require(ConnectionsPath+"/" + file);
  Connections[conn.ConnectMethod] = conn;
});

function Connection(options) {
  if(options.allow_ssl_self_signed)
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  let _default_local_ip_and_port = '';
  let _servers = {};
  let _clients = {};
  let _have_local_server = false;
  let _blocked_ip = [];
  let ssl_priv_key;
  let ssl_cert;
  let uint16_heartbeat_phrase = Buf.encode('HB');
  let heartbeat_cycle_millisecond = 60000;
  let _debug = false;
  let _conn_meth_name_map;


  // define an profile of an connection
  function ConnectionProfile(serverId, Rpos, connMethod, hostip, hostport, clientip, conn) {
    let _serverId = serverId;
    let _pos = Rpos;
    let _connMethod = connMethod;
    let _bundle = {};
    let _GUID = Utils.generateGUID();
    let _hostip = hostip;
    let _hostport = hostport;
    let _clientip = clientip;
    let _conn = conn; // conn is wrapped!

    if(Rpos === 'Server') {
      _clients[connMethod+hostip+hostport] = this;
    }

    this.closeConnetion = () => {
      if(Rpos === 'Server') {
        delete _clients[connMethod+hostip+hostport];
      }
      // Utils.TagLog('*ERR*', 'closeConnetion not implemented. Of '+this.type);
      _conn.closeConnetion(_GUID);
    };

    this.getServerId = (callback) => {callback(false, _serverId);}
    this.getHostIP = (callback) => {callback(false, _hostip);}
    this.getHostPort = (callback) => {callback(false, _hostport);}
    this.getClientIP = (callback) => {callback(false, _clientip);}
    this.getConnMethod = (callback) => {callback(false, _connMethod);}
    this.getRemotePosition = (callback) => {callback(false, _pos);}
    this.setBundle = (key, value) => {_bundle[key] = value;}
    this.getBundle = (key, callback) => {callback(false, _bundle[key]);}
    this.getConn = (callback) => {callback(false, _conn)};
    this.getGUID = (callback) => {callback(false, _GUID)};

    this.returnServerId = () => {return _serverId;}
    this.returnHostIP = () => {return _hostip;}
    this.returnHostPort = () => {return _hostport;}
    this.returnClientIP = () => {return _clientip;}
    this.returnConnMethod = () => {return _connMethod;}
    this.returnRemotePosition = () => {return _pos;}
    this.returnBundle = (key) => {return _bundle[key];}
    this.returnConn = () => {return _conn;};
    this.returnGUID = () => {return _GUID};

    this.destroy= () => {
      // for worker deletetion
      this.worker_cancel_refer = true;
      delete _clients[_GUID];
    };
    // this.onConnectionDropout = () => {
    //   Utils.TagLog('*ERR*', 'onConnectionDropout not implemented');
    // }

  }

  this.addServer = (conn_method, ip, port) => {

    if(conn_method === 'local'||conn_method =='Local') {
      if(_have_local_server === false) {
        let _serverId = "LOCAL";
        let server = new Connections.Local.Server(_serverId, ConnectionProfile);
        _servers[_serverId] = server;
        server.setDebug(_debug);
        server.start('LOCALIP', 'LOCALPORT');
        server.onData = this.onData;
        server.onClose = this.onClose;
        _have_local_server = true;
      }
      else {
        Utils.TagLog('*ERR*', 'Can only exist one local server.');
      }
    }
    else if(_conn_meth_name_map[conn_method]) {
      let _serverId = Utils.generateUniqueId();
      let server = new Connections[_conn_meth_name_map[conn_method]].Server(_serverId, ConnectionProfile, ssl_priv_key, ssl_cert);
      _servers[_serverId] = server;
      server.setDebug(_debug);
      server.start(ip, port);
      server.onData = this.onData;
      server.onClose = this.onClose;
    }
    else {
      Utils.TagLog('*ERR*', 'ConnMethod '+conn_method+' not implemented. Skipped.');
    }

    // Heartbeat
    if(Object.keys(_servers).length==1) {
      setInterval(()=>{
        for(let i in _servers) {
          try{
            _servers[i].broadcast(uint16_heartbeat_phrase);
          }
          catch(e) {
            if(_debug) {
              Utils.TagLog('*WARN*', 'Server '+i+' occured error on heartbeat. Skipped.');
            }
          }
        };
      }, heartbeat_cycle_millisecond);
    };
  }

  this.createClient = (conn_method, remoteip, port, callback) => {
    // Heartbeat
    let onData_wrapped = (connprofile, data)=> {
      if(data.length!=uint16_heartbeat_phrase.length||data[0]!=uint16_heartbeat_phrase[0]||data[1]!=uint16_heartbeat_phrase[1]) {
        this.onData(connprofile, data);
      }
      else {
      }
    };

    let _prev_client = _clients[conn_method+remoteip+port];
    if(_prev_client) {
      callback(false, _prev_client);
    }
    else if(conn_method === 'local'||conn_method =='Local') {
      if(_have_local_server === false) {
        Utils.TagLog('*ERR*', 'Local server not started.');
      }
      else {
        let locc = new Connections.Local.Client(ConnectionProfile);
        locc.setDebug(_debug);
        locc.onData = onData_wrapped;
        locc.onClose = this.onClose;
        locc.connect('LOCALIP', 'LOCALPORT', callback);
      }
    }

    else if(_conn_meth_name_map[conn_method]) {
      let netc = new Connections[_conn_meth_name_map[conn_method]].Client(ConnectionProfile);
      netc.setDebug(_debug);
      netc.onData = onData_wrapped;
      netc.onClose = this.onClose;
      netc.connect(remoteip, port, callback);
    }

    else {
      Utils.TagLog('*ERR*', 'ConnMethod '+conn_method+' not implemented. Skipped.');
    }
  };

  this.addConnetionModule = (constructor)=> {
    Connections[constructor.ConnectMethod] = constructor;
  };

  this.send = (connprofile, data) => {
    try {
      connprofile.getConn((err, conn) => {
        conn.send(connprofile, data);
      });
    }
    catch (e) {
      if(_debug) {
        Utils.TagLog('*WARN*', 'Error occured while sending Data.');
        console.log(e);
      }
    }
  };

  this.broadcast = (data) => {
    try {
      _servers.forEach((key, server) => {
        server.broadcast(data);
      });
    }
    catch (e) {
      if(_debug) {
        Utils.TagLog('*WARN*', 'Error occured while broadcasting Data.');
        console.log(e);
      }
    }
  };

  this.onData = (conn_profile, data) => {
    Utils.TagLog('*ERR*', 'Connection module onData not implement');
  };

  this.onClose = (connprofile) => {
    Utils.TagLog('*ERR*', 'Connection module onClose not implement');
  }

  this.getServers = (callback) => {
    callback(false, _servers);
  };

  this.getClients = (callback) => {
    callback(false, _clients);
  };

  this.killClient = (conn_profile) => {

  };

  this.setDebug = (bool) => {
    _debug = bool;
  };

  this.importSSLCert = (ssl_cert_in) => {
    ssl_cert = ssl_cert_in;
  };

  this.importSSLPrivateKey = (ssl_priv_key_in) => {
    ssl_priv_key = ssl_priv_key_in;
  }

  this.importHeartBeatCycle = (cycle) => {
    heartbeat_cycle_millisecond = cycle;
  };

  this.importConnectionMethodNameMap = (dict)=> {
    _conn_meth_name_map = dict;
  };

  this.close = () =>{
    this.onClose = (connprofile) => {
      Utils.TagLog('*ERR*', 'Connection module onClose not implement');
    };
    this.onData = (conn_profile, data) => {
      Utils.TagLog('*ERR*', 'Connection module onData not implement');
    };
    for(let i in _clients) {
      _clients[i].closeConnetion();
    }
    for(let i in _servers) {
      _servers[i].close();
    }
  }
}



module.exports = Connection;
