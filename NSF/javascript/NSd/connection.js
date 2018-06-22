// NSF/NSd/connection.js
// Description:
// "connection.js" provide connection interface.
// Copyright 2018 NOOXY. All Rights Reserved.

let Utils = require('./utilities');
const WebSocket = require('ws');
const Net = require('net');

function Connection() {
  let _default_local_ip_and_port = '';
  let _servers = {};
  let _clients = {};
  let _have_local_server = false;
  let _virtnet = null;
  let _blocked_ip = [];
  let _tcp_ip_chunk_token = '}{"""}<>';


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
    let _conn = conn; // conn is wrapped!


    this.closeConnetion = () => {
      // Utils.tagLog('*ERR*', 'closeConnetion not implemented. Of '+this.type);
      _conn.close(_GUID);
    };

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
    function SocketPair(hip, cip) {
      let selfdestruct = ()=> {
        delete this;
      }
      // define an virtual socket
      function VirtualSocket(type, lIP, rIP, selfdestruct) {
        this.type = type;
        this.send = (d)=>{Utils.tagLog('*ERR*', 'VirtualSocket send not implemented. Of '+this.type+'. d=>'+d)};
        let _types = {
          open : ()=>{Utils.tagLog('*ERR*', 'VirtualSocket opopen not implemented. Of '+this.type)},
          message : ()=>{Utils.tagLog('*ERR*', 'VirtualSocket onmessage not implemented. Of '+this.type)},
          error : ()=>{Utils.tagLog('*ERR*', 'VirtualSocket onerror not implemented. Of '+this.type)},
          close : ()=>{Utils.tagLog('*ERR*', 'VirtualSocket onclose not implemented. Of '+this.type)}
        };

        this.returnLocalIP = () => {
          return lIP;
        }

        this.returnRemoteIP = () => {
          return rIP;
        }

        let _returntype = (type) => {
          return _types[type];
        }
        this.close = () => {Utils.tagLog('*ERR*', 'VirtualSocket onClose not implemented. Of '+this.type)};
        this.on = (type, callback)=>{_types[type] = callback;};
        this.emit = (type, d) =>{
          let _exe = _returntype(type);
          _exe(d.msg);
        };

      };

      // cip clientip hostip
      let _vcs = new VirtualSocket('Client', cip, hip);
      let _vss = new VirtualSocket('Server', hip, cip);

      _vcs.send = (msg) => {
        let _d = {msg: msg}
        _vss.emit('message', _d);
      };

      _vss.send = (msg) => {
        let _d = {msg: msg}
        _vcs.emit('message', _d);
      };

      _vcs.close = (msg) => {
        let _d = {msg: msg}
        _vss.emit('close', _d);
        selfdestruct();
      };

      _vss.close = (msg) => {
        let _d = {msg: msg}
        _vcs.emit('close', _d);
        selfdestruct();
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

      this.connect = (rvirtip, rvirtport, callback) => {
        let sp = new SocketPair(rvirtip, lvirtip);
        let vss = sp.ServerSocket;
        let vcs = sp.ClientSocket;
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

    this.createClient = (cip, cp, hip, hp) => {
      let vs = new Client(cip, cp, hip, hp);
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

    this.close = (GUID) => {_clients[GUID].close()};

    this.onData = (connprofile, data) => {Utils.tagLog('*ERR*', 'onData not implemented');};

    this.onClose = (connprofile) => {Utils.tagLog('*ERR*', 'onClose not implemented');};

    this.send = function(connprofile, data) {
      _clients[connprofile.returnGUID()].send(data);
    };

    this.broadcast = (data) => {
      this._wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
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
          this.onData(connprofile, message);
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

    this.close = () => {
      _ws.close();
    };

    this.onData = (connprofile, data) => {Utils.tagLog('*ERR*', 'onData not implemented');};

    this.onClose = () => {Utils.tagLog('*ERR*', 'onClose not implemented');};

    this.send = function(connprofile, data) {
      _ws.send(data);
    };

    this.connect = (ip, port, callback) => {
      let connprofile = null;
      _ws = new WebSocket('ws://'+ip+':'+port);
      connprofile = new ConnectionProfile(null, 'Server', 'WebSocket', ip, port, 'localhost', this);
      _ws.on('open', function open() {
        callback(false, connprofile);
        // ws.send('something');
      });
      _ws.on('message', (message) => {
        this.onData(connprofile, message);
      });

      _ws.on('error', (error) => {
          Utils.tagLog('*ERR*', error);
          vs.close();
      });

      _ws.on('close', (error) => {
          this.onClose(connprofile);
      });

    }
  };

  function TCPIPServer(id) {
    let _hostip = null;
    let _serverID = id;
    let _netserver = null;
    let _clients = {};

    this.close = (GUID) => {_clients[GUID].destroy()};

    this.closeConnetion = ()=> {};

    this.onData = (connprofile, data) => {Utils.tagLog('*ERR*', 'onData not implemented');};

    this.onClose = (connprofile) => {Utils.tagLog('*ERR*', 'onClose not implemented');};

    this.send = function(connprofile, data) {
      _clients[connprofile.returnGUID()].write(_tcp_ip_chunk_token+data);
    };

    this.broadcast = (data) => {
      for(let i in _clients) {
        client.write(data);
      };
    };

    this.start = (ip, port, origin = false) => {
      // launch server
      _hostip = ip;
      Net.createServer((socket)=>{
        let connprofile = new ConnectionProfile(_serverID, 'Client', 'TCP/IP', ip, port, socket.remoteAddress, this);
        _clients[connprofile.returnGUID()] = socket;

        socket.on('data', (data) => {
          data = data.toString('utf8');
          let chunks = data.split(_tcp_ip_chunk_token);
          for(let i =1; i<chunks.length; i++) {
            this.onData(connprofile, chunks[i]);
          }
        });

        socket.on('error', (message) => {
          Utils.tagLog('*ERR*', message);
          socket.close();
        });

        socket.on('close', (message) => {
          delete _clients[connprofile.returnGUID()];
          this.onClose(connprofile);
        });

      }).listen(port, ip);

    }
  };

  function TCPIPClient() {
    let _netc = null

    this.close = (GUID) => {_netc.destroy()};

    this.onData = (connprofile, data) => {Utils.tagLog('*ERR*', 'onData not implemented');};

    this.onClose = () => {Utils.tagLog('*ERR*', 'onClose not implemented');};

    this.send = (connprofile, data) => {
      _netc.write(_tcp_ip_chunk_token+data);
    };

    this.connect = (ip, port, callback) => {
      _netc =  new Net.Socket();
      let connprofile = null;
      _netc.connect(port, ip, ()=>{
        connprofile = new ConnectionProfile(null, 'Server', 'TCP/IP', ip, port, 'localhost', this);
        callback(false, connprofile);
      })

      _netc.on('data', (data) => {
        data = data.toString('utf8');
        let chunks = data.split(_tcp_ip_chunk_token);
        for(let i =1; i<chunks.length; i++) {
          this.onData(connprofile, chunks[i]);
        }
      });

      _netc.on('close', () => {
          this.onClose(connprofile);
      });


    }
  };

  function LocalServer(id, virtnet) {
    let _serverID = id;
    let _vnets = null;
    let _clients = {};

    this.close = (GUID) => {_clients[GUID].close()};

    this.onData = (connprofile, data) => {Utils.tagLog('*ERR*', 'LocalServer onData not implemented.');};

    this.onClose = (connprofile) => {Utils.tagLog('*ERR*', 'LocalServer onClose not implemented');};

    this.send = (connprofile, data) => {
      _clients[connprofile.returnGUID()].send(data);
    };

    this.broadcast = (data) => {
      _clients.forEach((key, client) => {
        client.send(data);
      });
    }

    this.start = function(virtip, virtport) {
      _vnets = virtnet.createServer(virtip, virtport);
      _vnets.on('connection', (vs) => {
          let connprofile = new ConnectionProfile(_serverID, 'Client', 'Local', virtip, virtport, vs.returnRemoteIP(), this);
          _clients[connprofile.returnGUID()] = vs;

          vs.on('message', (message) => {
            this.onData(connprofile, message);
          });

          vs.on('error', (err) => {
            Utils.tagLog('*ERR*', err);
            delete _clients[connprofile.returnGUID()];
            this.onClose(connprofile);
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

    this.close = (GUID) => {_vs.close()};

    this.onData = (connprofile, data) => {Utils.tagLog('*ERR*', 'onData not implemented');};

    this.onClose = () => {Utils.tagLog('*ERR*', 'onClose not implemented');};

    this.send = function(connprofile, data) {
      _vs.send(data);
    };

    this.connect = (virtip, virtport, callback) => {
      let connprofile = null;
      _vnetc = virtnet.createClient('LOCALIP', Utils.generateGUID(), virtip, virtport);
      _vnetc.connect(virtip, virtport, (err, vs) => {
        _vs = vs;
        connprofile = new ConnectionProfile(null, 'Server', 'Local', virtip, virtport, _vnetc.getIP(), this);

        vs.on('message', (message) => {
          this.onData(connprofile, message);
        });

        vs.on('error', (error) => {
            Utils.tagLog('*ERR*', error);
            vs.close();
        });

        vs.on('close', (error) => {
            Utils.tagLog('*ERR*', error);
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
      wws.onData = this.onData;
      wws.onClose = this.onClose;
    }

    else if(conn_method == 'local'||conn_method =='Local') {
      if(_have_local_server == false) {
        let _serverID = "LOCAL";
        let locs = new LocalServer(_serverID, _virtnet);
        _servers[_serverID] = locs;
        locs.start('LOCALIP', 'LOCALPORT');
        locs.onData = this.onData;
        locs.onClose = this.onClose;
        _have_local_server = true;
      }
      else {
        Utils.tagLog('*ERR*', 'Can only exist one local server.');
      }
    }

    else if(conn_method == 'TCP/IP' || conn_method =='TCP') {
      let _serverID = Utils.generateGUID();
      let nets = new TCPIPServer(_serverID);
      _servers[_serverID] = nets;
      nets.start(ip, port);
      nets.onData = this.onData;
      nets.onClose = this.onClose;
    }

    else {
      Utils.tagLog('*ERR*', ''+conn_method+' not implemented. Skipped.');
    }
  }

  this.createClient = (conn_method, remoteip, port, callback) => {
    if(conn_method == 'ws'||conn_method =='WebSocket') {
      let serverID = "WebSocket";
      let wsc = new WSClient(_virtnet);
      wsc.onData = this.onData;
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
        locc.onData = this.onData;
        locc.onClose = this.onClose;
        locc.connect('LOCALIP', 'LOCALPORT', callback);
      }
    }

    else if(conn_method == 'TCP/IP'||conn_method =='TCP') {
      let serverID = "TCP/IP";
      let netc = new TCPIPClient(_virtnet);
      netc.onData = this.onData;
      netc.onClose = this.onClose;
      netc.connect(remoteip, port, callback);
    }

    else {
      Utils.tagLog('*ERR*', ''+conn_method+' not implemented. Skipped.');
    }
  };

  this.send = (connprofile, data) => {
    connprofile.getConn((err, conn) => {
      conn.send(connprofile, data);
    });
  };

  this.broadcast = (data) => {
    _servers.forEach((key, server) => {
      server.broadcast(data);
    });
  };

  this.onData = (conn_profile, data) => {
    Utils.tagLog('*ERR*', 'Connection module onData not implement');
  };

  this.onClose = (connprofile) => {
    Utils.tagLog('*ERR*', 'Connection module onData not implement');
  }

  this.getServers = (callback) => {
    callback(false, _servers);
  };

  this.getClients = (callback) => {
    callback(false, _clients);
  };

  this.killClient = (conn_profile) => {

  };

}



module.exports = Connection;
