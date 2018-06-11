// NSF/NSd/connection.js
// Description:
// "connection.js" provide connection interface.
// Copyright 2018 NOOXY. All Rights Reserved.

let Utils = require('./utilities');

function Connection() {
  let _default_local_ip_and_port = '';
  let _servers = {};
  let _clients = {};
  let _have_local_server = false;
  let _virtnet = null;

  let WebSocketServer = require('ws').Server;

  // define an profile of an connection
  function ConnectionProfile(pos, connMethod, hostip, hostport, clientip, conn) {
    // let _serverID = id;
    let _pos = pos;
    let _connMethod = connMethod;
    let _bundle = {};
    let _GUID = null;
    let _hostip = ip;
    let _hostport = hostport;
    let _clientip = clientip;
    let _conn = conn;

    if(!(_GUID === null)) {
      _GUID = utils.generateGUID();
    }

    this.getGUID = (callback) => {
      callback(_GUID);
    }

    this.getHostIP() = (callback) => {callback(_remoteip);}
    this.getHostPort() = (callback) => {callback(_hostport);}
    this.getClientIP() = (callback) => {callback(_clientip);}
    this.getConnMethod() = (callback) => {callback(_connMethod);}
    this.getPosition() = (key, callback) => {callback(_pos);}
    this.setBundle() = (key, value) => {_bundle[key] = value;}
    this.getBundle() = (key, callback) => {callback(_bundle[key]);}
    this.getConn() = (callback) => {callback(_conn)};

    // this.onConnectionDropout = () => {
    //   console.log('[ERR] onConnectionDropout not implemented');
    // }

  }

  // a wrapped WebSocket server for nooxy service framework
  function WSServer(id) {
    let _serverID = id;
    let _wss = null;
    let _clients = {};

    this.onJSON = (connprofile, json) => {console.log('[ERR] onJSON not implemented');};

    this.onClose = (connprofile) => {console.log('[ERR] onClose not implemented');};

    this.sendJSON = function(connprofile, json) {
      _clients[connprofile.getGUID()].send(JSON.stringify(json));
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
      _wss = new WebSocketServer({port: port, host : ip});

      _wss.on('connection', function(ws, req) {

          let originDomain = URL.parse(ws.upgradeReq.headers.origin).hostname;
          let connprofile = new ConnectionProfile(id, 'Client',req.connection.remoteAddress, ws);
          clients[connprofile.getGUID()] = ws;

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
              delete _clients[connprofile.getGUID()];
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
    function VirtualSocket() {
      this.send = null;
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;
      this.onclose = null;
    };

    function Server(virtip, virtport) {
      // add this server to list of virtual servers
      _virt_servers[virtip+':'+virtport] = this;
      let _clients = {};
      let _virtip = virtip;
      let _virtport = virtport;

      // let _virt_sockets = {};

      type_callback = {
        'connection': null;
      }

      this.ClientConnect = (clientvirtip, vs)=>{
        _clients[clientvirtip] = vs;
        type_callback['connection'] (vs);
      };

      this.ClientDisconnect = (clientvirtip)=>{
        delete _clients[clientvirtip];
      };

      this.on => (type, callback) {type_callback[type] = callback};
    };

    // parameters local ip, port to remote ones.
    function Client(lvirtip, lvirtport) {
      let _virtip = lvirtip;
      let _virtport = lvirtport;
      // create sockets for both server and client
      let vss = new VirtualSocket();
      let vcs = new VirtualSocket();

      this.connect = (rvirtip, rvirtport, callback) => {
        // bind connection funcitons
        vss.send = (msg) => {
          vcs.onmessage(msg);
        };

        vcs.send = (msg) => {
          vss.onmessage(msg);
        };

        // trigger server and return server socket
        _virt_servers[rvirtip+':'+rvirtport].ClientConnect(_virtip, _virtport, vss);

        // return virtual client socket to callback
        callback(vcs);
      };

      this.getIP() = () => {
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
      let vs = new Client(utils.generateGUID() , utils.generateGUID(), virtip, virtport);
      return vs;
    };
  }

  _virtnet = new Virtualnet();

  function LocalServer(id, virtnet) {
    let _serverID = id;
    let _vnets = null;
    let _clients = {};

    this.onJSON = (connprofile, json) => {console.log('[ERR] onJSON not implemented');};

    this.onClose = (connprofile) => {console.log('[ERR] onClose not implemented');};

    this.sendJSON = (connprofile, json) => {
      _clients[connprofile.getGUID()].send(JSON.stringify(json));
    };

    this.broadcast = (json) => {
      _clients.forEach((key, client) => {
        client.send(JSON.stringify(json));
      });
    }

    this.start = function(virtip, virtport) {
      _vnets = virtnet.createServer(virtip, virtport);
      _vnets.on('connection', function(vs) {
          let connprofile = new ConnectionProfile('Client', 'Local', 'Virtualnet Remote Adress', vs);
          _clients[connprofile.getGUID()] = vs;

          vs.onmessage = (message) => {
            this.onJSON(connprofile, JSON.phrase(message));
          });

          vs.onerror = (error) => {
              console.log('[ERR] %s', error);
              vs.close();
          });

          vs.onclose =  () => {
              delete _clients[connprofile.getGUID()];
              this.onClose(connprofile);
          });

      });
    }
    }

  };

  function LocalClient(virtnet) {
    let _virtnet = virtnet;
    // virtnet client
    let _vnetc = null;

    this.onJSON = (connprofile, json) => {console.log('[ERR] onJSON not implemented');};

    this.onClose = () => {console.log('[ERR] onClose not implemented');};

    this.sendJSON = function(json) {
      _vnetc.send(json);
    };

    this.connect = (virtip, virtport) => {
      _vnetc = virtnet.createClient(utils.generateGUID(), utils.generateGUID());
      _vnetc.connect(virtip, virtport, (vs) => {
        vs.onmessage = (message) => {
          let connprofile = new ConnectionProfile('Server', 'Local', virtip, virtport, _vnetc.getIP(), vs);
          this.onJSON(connprofile, JSON.phrase(message));
        });

        vs.onerror = (error) => {
            console.log('[ERR] %s', error);
            vs.close();
        });

      });
    }
  };

  this.addServer = (conn_method, ip, port) => {
    if(conn_method == 'ws'||'WebSocket') {
      let serverID = utils.generateGUID();
      let wws = new WSServer(_serverID);
      _servers[_serverID] = wws;
      wws.start(port, ip);
      wws.onJSON = this.onJSON;
      wws.onClose = this.onClose;
    }

    else if(conn_method == 'local'||'Local') {
      if(_have_local_server == false) {
        let serverID = "LOCAL";
        let locs = new LocalServer(serverID, _virtnet);
        _servers[_serverID] = locs;
        locs.start('LOCALIP', 'LOCALPORT');
        locs.onJSON = this.onJSON;
        locs.onClose = this.onClose;
      }
      else {
        console.log('[ERR] Can only exist one local server.');
      }
    }

    else {
      console.log('[ERR]');
    }
  }

  this.addClient = (conn_method, remoteip, port) => {
    if(conn_method == 'ws'||'WebSocket') {

    }

    else if(conn_method == 'loc'||'Local') {
      if(_have_local_server == false) {
        console.log('[ERR] Local server not started.');
      }
      else {
        let serverID = "LOCAL";
        let locc = new LocalClient(_virtnet);
        _servers[_serverID] = locs;
        locc.connect('LOCALIP', 'LOCALPORT');
        locc.onJSON = this.onJSON;
        locc.onClose = this.onClose;
      }
    }

    else {
      console.log('[ERR]');
    }
  }

  this.sendJSON(conn_profile, json) => {
    conn_profile.getConn((conn) => {
      conn.sendJSON(conn_profile, json);
    });
  }

  this.broadcast(json) => {
    _servers.forEach((key, server) => {
      server.broadcast(json);
    });
  }

  this.onJSON(conn_profile, json) => {
    console.log('[ERR] onJSON not implement');
  }

  this.onClose(conn_profile) => {
    console.log('[ERR] onClose not implement');
  }

}



module.exports = Connection;
