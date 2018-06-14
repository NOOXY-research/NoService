// NSF/NSd/connection.js
// Description:
// "connection.js" provide connection interface.
// Copyright 2018 NOOXY. All Rights Reserved.

let Utils = require('./utilities');
let WebSocket = require('ws');

function Connection() {
  let _default_local_ip_and_port = '';
  let _servers = {};
  let _clients = {};
  let _have_local_server = false;
  let _virtnet = null;
  let _blocked_ip = [];


  // define an profile of an connection
  function ConnectionProfile(serverID, Rpos, connMethod, hostip, hostport, clientip, conn) {
    let _serverID = serverID;
    let _pos = Rpos;
    let _connMethod = connMethod;
    let _bundle = {};
    let _GUID = Utils.generateGUID();
    let _hostip = hostip;
    let _hostport = hostport;
    let _clientip = clientip;
    let _conn = conn;


    this.getServerID = (callback) => {callback(false, _serverID);}
    this.getHostIP = (callback) => {callback(false, _hostip);}
    this.getHostPort = (callback) => {callback(false, _hostport);}
    this.getClientIP = (callback) => {callback(false, _clientip);}
    this.getConnMethod = (callback) => {callback(false, _connMethod);}
    this.getRemotePosition = (callback) => {callback(false, _pos);}
    this.setBundle = (key, value) => {_bundle[key] = value;}
    this.getBundle = (key, callback) => {callback(false, _bundle[key]);}
    this.getConn = (callback) => {callback(false, _conn)};
    this.getGUID = (callback) => {callback(false, _GUID)};

    this.returnServerID = () => {return _serverID;}
    this.returnHostIP = () => {return _hostip;}
    this.returnHostPort = () => {return _hostport;}
    this.returnClientIP = () => {return _clientip;}
    this.returnConnMethod = () => {return _connMethod;}
    this.returnRemotePosition = () => {return _pos;}
    this.returnBundle = (key) => {return _bundle[key];}
    this.returnConn = () => {return _conn;};
    this.returnGUID = () => {return _GUID};

    // this.onConnectionDropout = () => {
    //   Utils.tagLog('*ERR*', 'onConnectionDropout not implemented');
    // }

  }

  function Virtualnet() {
    let _virt_servers = {};
    // define a socket pair
    function SocketPair() {
      // define an virtual socket
      function VirtualSocket(type) {
        this.type = type;
        this.send = (d)=>{Utils.tagLog('*ERR*', 'VirtualSocket send not implemented. Of '+this.type+'. d=>'+d)};
        let _types = {
          open : ()=>{Utils.tagLog('*ERR*', 'VirtualSocket opopen not implemented. Of '+this.type)},
          message : ()=>{Utils.tagLog('*ERR*', 'VirtualSocket onmessage not implemented. Of '+this.type)},
          error : ()=>{Utils.tagLog('*ERR*', 'VirtualSocket onerror not implemented. Of '+this.type)},
          close : ()=>{Utils.tagLog('*ERR*', 'VirtualSocket onclose not implemented. Of '+this.type)}
        };

        let _returntype = (type) => {
          return _types[type];
        }

        this.on = (type, callback)=>{_types[type] = callback;};
        this.emit = (type, d) =>{
          let _exe = _returntype(type);
          _exe(d.msg);
        };

      };
      let _vcs = new VirtualSocket('Client');
      let _vss = new VirtualSocket('Server');

      _vcs.send = (msg) => {
        let _d = {msg: msg}
        _vss.emit('message', _d);
      };
      _vss.send = (msg) => {
        let _d = {msg: msg}
        _vcs.emit('message', _d);
      };

      this.ClientSocket = _vcs;
      this.ServerSocket = _vss;

    }



    function Server(virtip, virtport) {
      // add this server to list of virtual servers
      _virt_servers[virtip+':'+virtport] = this;
      let _clients = {};
      let _virtip = virtip;
      let _virtport = virtport;

      // let _virt_sockets = {};

      type_callback = {
        'connection': null
      }

      this.ClientConnect = (clientvirtip, _virtport, vs, callback)=>{
        type_callback['connection'] (vs);
        _clients[clientvirtip] = vs;
      };


      this.ClientDisconnect = (clientvirtip)=>{
        delete _clients[clientvirtip];
      };

      this.on = (type, callback) => {type_callback[type] = callback};
    };

    // parameters local ip, port to remote ones.
    function Client(lvirtip, lvirtport) {
      let _virtip = lvirtip;
      let _virtport = lvirtport;
      // create sockets for both server and client
      let sp = new SocketPair();
      let vss = sp.ServerSocket;
      let vcs = sp.ClientSocket;

      this.connect = (rvirtip, rvirtport, callback) => {
        // return virtual client socket to callback
        callback(false, vcs);

        // trigger server and return server socket
        _virt_servers[rvirtip+':'+rvirtport].ClientConnect(_virtip, _virtport, vss);
      };

      this.getIP = () => {
        return _virtip;
      };

      this.close = () => {
        vss.onclose();
        _virt_servers[rvirtip].ClientDisconnect(lvirtip);
      };

    };

    this.createServer = (virtip, virtport) => {
      let vs = new Server(virtip, virtport);
      _virt_servers[virtip] = vs;
      return vs;
    };

    this.createClient = (virtip, virtport) => {
      let vs = new Client(Utils.generateGUID() , Utils.generateGUID(), virtip, virtport);
      return vs;
    };
  }

  _virtnet = new Virtualnet();

  // a wrapped WebSocket server for nooxy service framework
  function WSServer(id) {
    let _hostip = null;
    let _serverID = id;
    let _wss = null;
    let _clients = {};

    this.onJSON = (connprofile, json) => {Utils.tagLog('*ERR*', 'onJSON not implemented');};

    this.onClose = (connprofile) => {Utils.tagLog('*ERR*', 'onClose not implemented');};

    this.sendJSON = function(connprofile, json) {
      _clients[connprofile.returnGUID()].send(JSON.stringify(json));
    };

    this.broadcast = function(json) {
      this._wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(json));
        }
      });
    };

    this.start = (ip, port, origin = false) => {
      // launch server
      _wss = new WebSocket.Server({port: port, host: ip});
      _hostip = ip;

      _wss.on('connection', (ws, req) => {

        let connprofile = new ConnectionProfile(_serverID, 'Client', 'WebSocket', ip, port, req.connection.remoteAddress, this);
        _clients[connprofile.returnGUID()] = ws;

        ws.on('message', (message) => {
          this.onJSON(connprofile, JSON.parse(message));
        });

        ws.on('error', (message) => {
          Utils.tagLog('*ERR*', message);
          ws.close();
        });

        ws.on('close', (message) => {
          delete _clients[connprofile.returnGUID()];
          this.onClose(connprofile);
        });

      });
    }
  }

  function WSClient() {
    let _ws = null

    this.onJSON = (connprofile, json) => {Utils.tagLog('*ERR*', 'onJSON not implemented');};

    this.onClose = () => {Utils.tagLog('*ERR*', 'onClose not implemented');};

    this.sendJSON = function(connprofile, json) {
      _ws.send(JSON.stringify(json));
    };

    this.connect = (ip, port, callback) => {
      let connprofile = null;
      _ws = new WebSocket('ws://'+ip+':'+port);
      connprofile = new ConnectionProfile(null, 'Server', 'Local', ip, port, 'localhost', this);
      _ws.on('open', function open() {
        callback(false, connprofile);
        // ws.send('something');
      });
      _ws.on('message', (message) => {
        this.onJSON(connprofile, JSON.parse(message));
      });

      _ws.on('error', (error) => {
          Utils.tagLog('*ERR*', '%s', error);
          vs.close();
      });


    }
  };

  function TCPIPServer() {};

  function TCPIPClient() {};

  function LocalServer(id, virtnet) {
    let _serverID = id;
    let _vnets = null;
    let _clients = {};

    this.onJSON = (connprofile, json) => {Utils.tagLog('*ERR*', 'LocalServer onJSON not implemented.');};

    this.onClose = (connprofile) => {Utils.tagLog('*ERR*', 'LocalServer onClose not implemented');};

    this.sendJSON = (connprofile, json) => {
      _clients[connprofile.returnGUID()].send(JSON.stringify(json));
    };

    this.broadcast = (json) => {
      _clients.forEach((key, client) => {
        client.send(JSON.stringify(json));
      });
    }

    this.start = function(virtip, virtport) {
      _vnets = virtnet.createServer(virtip, virtport);
      _vnets.on('connection', (vs) => {
          let connprofile = new ConnectionProfile(_serverID, 'Client', 'Local', virtip, virtport, 'Virtualnet Remote Adress', this);
          _clients[connprofile.returnGUID()] = vs;

          vs.on('message', (message) => {
            this.onJSON(connprofile, JSON.parse(message));
          });

          vs.on('error', (message) => {
            Utils.tagLog('*ERR*', '%s', error);
            vs.close();
          });

          vs.on('close', (message) => {
            delete _clients[connprofile.returnGUID()];
            this.onClose(connprofile);
          });

      });
    }
  };

  function LocalClient(virtnet) {
    let _virtnet = virtnet;
    // virtnet client
    let _vnetc = null;
    let _vs = null

    this.onJSON = (connprofile, json) => {Utils.tagLog('*ERR*', 'onJSON not implemented');};

    this.onClose = () => {Utils.tagLog('*ERR*', 'onClose not implemented');};

    this.sendJSON = function(connprofile, json) {
      _vs.send(JSON.stringify(json));
    };

    this.connect = (virtip, virtport, callback) => {
      let connprofile = null;
      _vnetc = virtnet.createClient(Utils.generateGUID(), Utils.generateGUID());
      _vnetc.connect(virtip, virtport, (err, vs) => {
        _vs = vs;
        connprofile = new ConnectionProfile(null, 'Server', 'Local', virtip, virtport, _vnetc.getIP(), this);

        vs.on('message', (message) => {
          this.onJSON(connprofile, JSON.parse(message));
        });

        vs.on('error', (error) => {
            Utils.tagLog('*ERR*', '%s', error);
            vs.close();
        });

      });

      callback(false, connprofile);
    }
  };

  this.addServer = (conn_method, ip, port) => {
    if(conn_method == 'ws' || conn_method =='WebSocket') {
      let _serverID = Utils.generateGUID();
      let wws = new WSServer(_serverID);
      _servers[_serverID] = wws;
      wws.start(ip, port);
      wws.onJSON = this.onJSON;
      wws.onClose = this.onClose;
    }

    else if(conn_method == 'local'||conn_method =='Local') {
      if(_have_local_server == false) {
        let _serverID = "LOCAL";
        let locs = new LocalServer(_serverID, _virtnet);
        _servers[_serverID] = locs;
        locs.start('LOCALIP', 'LOCALPORT');
        locs.onJSON = this.onJSON;
        locs.onClose = this.onClose;
        _have_local_server = true;
      }
      else {
        Utils.tagLog('*ERR*', 'Can only exist one local server.');
      }
    }

    else {
      Utils.tagLog('*ERR*', ''+conn_method+' not implemented. Skipped.');
    }
  }

  this.createClient = (conn_method, remoteip, port, callback) => {
    if(conn_method == 'ws'||conn_method =='WebSocket') {
      let serverID = "WebSocket";
      let wsc = new WSClient(_virtnet);
      wsc.onJSON = this.onJSON;
      wsc.onClose = this.onClose;
      wsc.connect(remoteip, port, callback);
    }

    else if(conn_method == 'loc'||conn_method =='Local') {
      if(_have_local_server == false) {
        Utils.tagLog('*ERR*', 'Local server not started.');
      }
      else {
        let serverID = "LOCAL";
        let locc = new LocalClient(_virtnet);
        locc.onJSON = this.onJSON;
        locc.onClose = this.onClose;
        locc.connect('LOCALIP', 'LOCALPORT', callback);
      }
    }

    else {
      Utils.tagLog('*ERR*', ''+conn_method+' not implemented. Skipped.');
    }
  }

  this.sendJSON = (connprofile, json) => {
    connprofile.getConn((err, conn) => {
      conn.sendJSON(connprofile, json);
    });
  }

  this.broadcast = (json) => {
    _servers.forEach((key, server) => {
      server.broadcast(json);
    });
  }

  this.onJSON = (conn_profile, json) => {
    Utils.tagLog('*ERR*', 'Connection module onJSON not implement');
  }

  this.onClose = (conn_profile) => {
    Utils.tagLog('*ERR*', 'Connection module onClose not implement');
  }

  this.getServers = (callback) => {
    callback(false, _servers);
  }

  this.getClients = (callback) => {
    callback(false, _clients);
  }

  this.killClient = (conn_profile) => {

  }

}



module.exports = Connection;
