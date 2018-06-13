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
    let _GUID = null;
    let _hostip = hostip;
    let _hostport = hostport;
    let _clientip = clientip;
    let _conn = conn;

    if(!(_GUID === null)) {
      _GUID = utils.generateGUID();
    }

    this.returnGUID = (callback) => {
      return _GUID;
    }

    this.getServerID = (callback) => {callback(_serverID);}
    this.getHostIP = (callback) => {callback(_hostip);}
    this.getHostPort = (callback) => {callback(_hostport);}
    this.getClientIP = (callback) => {callback(_clientip);}
    this.getConnMethod = (callback) => {callback(_connMethod);}
    this.getRemotePosition = (callback) => {callback(_pos);}
    this.setBundle = (key, value) => {_bundle[key] = value;}
    this.getBundle = (key, callback) => {callback(_bundle[key]);}
    this.getConn = (callback) => {callback(_conn)};

    this.returnServerID = () => {return _serverID;}
    this.returnHostIP = () => {return _hostip;}
    this.returnHostPort = () => {return _hostport;}
    this.returnClientIP = () => {return _clientip;}
    this.returnConnMethod = () => {return _connMethod;}
    this.returnRemotePosition = () => {return _pos;}
    this.returnBundle = (key) => {return _bundle[key];}
    this.returnConn = () => {return _conn;};

    // this.onConnectionDropout = () => {
    //   console.log('[ERR] onConnectionDropout not implemented');
    // }

  }

  // a wrapped WebSocket server for nooxy service framework
  function WSServer(id) {
    let _hostip = null;
    let _serverID = id;
    let _wss = null;
    let _clients = {};

    this.onJSON = (connprofile, json) => {console.log('[ERR] onJSON not implemented');};

    this.onClose = (connprofile) => {console.log('[ERR] onClose not implemented');};

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

    this.start = function(ip, port, origin = false) {
      // launch server
      _wss = new WebSocket.Server({port: port, host: ip});
      _hostip = ip;

      _wss.on('connection', function(ws, req) {

          let originDomain = URL.parse(ws.upgradeReq.headers.origin).hostname;
          new ConnectionProfile(id, 'Client', req.connection.remoteAddress, ws); new ConnectionProfile(id, 'Client',req.connection.remoteAddress, ws);
          clients[connprofile.returnGUID()] = ws;

          // if (configuration.origins.indexOf(originDomain) < 0) {
          //     ws.send(JSON.stringify({
          //         method : 'notify',
          //         session : 'req',
          //         data : 'Connection from unknown source refused.'
          //     }));
          //
          //     ws.close();
          //     return;
          // }

          ws.on('message', function(message) {
            this.onJSON(connprofile, JSON.phrase(message));
          });

          ws.on('error', function(error) {
              console.log('[ERR] %s', error);
              ws.close();
          });

          ws.on('close', function() {
              delete _clients[connprofile.returnGUID()];
              this.onClose(connprofile);
          });

      });
    }
  }

  function WSClient() {

  };

  function TCPIPServer() {};

  function TCPIPClient() {};

  function Virtualnet() {
    let _virt_servers = {};
    // define a socket pair
    function SocketPair() {
      // define an virtual socket
      function VirtualSocket(type) {
        this.type = type;
        this.send = (d)=>{console.log('[ERR] VirtualSocket send not implemented. Of '+this.type+'. d=>'+d)};
        let _types = {
          open : ()=>{console.log('[ERR] VirtualSocket opopen not implemented. Of '+this.type)},
          message : ()=>{console.log('[ERR] VirtualSocket onmessage not implemented. Of '+this.type)},
          error : ()=>{console.log('[ERR] VirtualSocket onerror not implemented. Of '+this.type)},
          close : ()=>{console.log('[ERR] VirtualSocket onclose not implemented. Of '+this.type)}
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
        callback(vcs);

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

  function LocalServer(id, virtnet) {
    let _serverID = id;
    let _vnets = null;
    let _clients = {};

    this.onJSON = (connprofile, json) => {console.log('[ERR] LocalServer onJSON not implemented.');};

    this.onClose = (connprofile) => {console.log('[ERR] LocalServer onClose not implemented');};

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
            console.log('[ERR] %s', error);
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

    this.onJSON = (connprofile, json) => {console.log('[ERR] onJSON not implemented');};

    this.onClose = () => {console.log('[ERR] onClose not implemented');};

    this.sendJSON = function(connprofile, json) {
      _vs.send(JSON.stringify(json));
    };

    this.connect = (virtip, virtport, callback) => {
      let connprofile = null;
      _vnetc = virtnet.createClient(Utils.generateGUID(), Utils.generateGUID());
      _vnetc.connect(virtip, virtport, (vs) => {
        _vs = vs;
        connprofile = new ConnectionProfile(null, 'Server', 'Local', virtip, virtport, _vnetc.getIP(), this);

        vs.on('message', (message) => {
          this.onJSON(connprofile, JSON.parse(message));
        });

        vs.on('error', (error) => {
            console.log('[ERR] %s', error);
            vs.close();
        });

      });

      callback(connprofile);
    }
  };

  this.addServer = (conn_method, ip, port) => {
    if(conn_method == 'ws'||conn_method =='WebSocket') {
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
        console.log('[ERR] Can only exist one local server.');
      }
    }

    else {
      console.log('[ERR]'+conn_method+' not implemented.');
    }
  }

  this.createClient = (conn_method, remoteip, port, callback) => {
    if(conn_method == 'ws'||conn_method =='WebSocket') {

    }

    else if(conn_method == 'loc'||conn_method =='Local') {
      if(_have_local_server == false) {
        console.log('[ERR] Local server not started.');
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
      console.log('[ERR]');
    }
  }

  this.sendJSON = (connprofile, json) => {
    connprofile.getConn((conn) => {
      conn.sendJSON(connprofile, json);
    });
  }

  this.broadcast = (json) => {
    _servers.forEach((key, server) => {
      server.broadcast(json);
    });
  }

  this.onJSON = (conn_profile, json) => {
    console.log('[ERR] Connection module onJSON not implement');
  }

  this.onClose = (conn_profile) => {
    console.log('[ERR] Connection module onClose not implement');
  }

}



module.exports = Connection;
