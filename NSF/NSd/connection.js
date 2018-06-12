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
    this.returnPosition = () => {return _pos;}
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

    // define an virtual socket
    function VirtualSocket(type) {
      this.type = type;
      this.send = ()=>{console.log('[ERR] VirtualSocket send not implemented. Of '+this.type)};
      let _types = {
        open : ()=>{console.log('[ERR] VirtualSocket opopen not implemented. Of '+this.type)},
        message : ()=>{console.log('[ERR] VirtualSocket onmessage not implemented. Of '+this.type)},
        error : ()=>{console.log('[ERR] VirtualSocket onerror not implemented. Of '+this.type)},
        close : ()=>{console.log('[ERR] VirtualSocket onclose not implemented. Of '+this.type)}
      };
      this.on = (type, callback)=>{_types[type] = callback;};
      this.emit = (type, callback) =>{callback(_types[type]);};
    };

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
        _clients[clientvirtip] = vs;
        type_callback['connection'] (vs);
        callback();
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
      let vss = new VirtualSocket('Server');
      let vcs = new VirtualSocket('Client');

      this.connect = (rvirtip, rvirtport, callback) => {
        // trigger server and return server socket
        _virt_servers[rvirtip+':'+rvirtport].ClientConnect(_virtip, _virtport, vss, () => {
          // bind connection funcitons
          vss.send = (msg) => {
            vcs.emit('message', (callback)=>{callback(msg)});
          };

          vcs.send = (msg) => {
            vss.emit('message', (callback)=>{callback(msg)});
          };

          // return virtual client socket to callback
          callback(vcs);
        });
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

          vs.onerror = (error) => {
              console.log('[ERR] %s', error);
              vs.close();
          };

          vs.onclose =  () => {
              delete _clients[connprofile.returnGUID()];
              this.onClose(connprofile);
          };

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
      _vs.send(json);
    };

    this.connect = (virtip, virtport, callback) => {
      _vnetc = virtnet.createClient(Utils.generateGUID(), Utils.generateGUID());
      _vnetc.connect(virtip, virtport, (vs) => {
        _vs = vs;
        let connprofile = new ConnectionProfile(null, 'Server', 'Local', virtip, virtport, _vnetc.getIP(), this);
        callback(connprofile);
        vs.onmessage = (message) => {
          this.onJSON(connprofile, JSON.phrase(message));
        };

        vs.onerror = (error) => {
            console.log('[ERR] %s', error);
            vs.close();
        };

      });
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
        locc.connect('LOCALIP', 'LOCALPORT', callback);
        locc.onJSON = this.onJSON;
        locc.onClose = this.onClose;
      }
    }

    else {
      console.log('[ERR]');
    }
  }

  this.sendJSON = (connprofile, json) => {
    // console.log(connprofile.returnHostIP());
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
