// NSF/NSd/connection.js
// Description:
// "connection.js" provide connection interface.
// Copyright 2018 NOOXY. All Rights Reserved.

let Utils = require('./utilities');

function connection() {
  let _servers = {};

  let WebSocketServer = require('ws').Server;

  function ConnectionProfile(id, pos, connMethod, remoteip, hostport, conn) {
    let _serverID = id;
    let _pos = pos;
    let _connMethod = connMethod;
    let _bundle = {};
    let _GUID = null;
    let _remoteip = ip;
    let _hostport = hostport;
    let _conn = conn;

    if(!(_GUID === null)) {
      _GUID = utils.generateGUID();
    }

    this.getServerID = (callback) => {callback(_serverID);}

    this.getGUID = (callback) => {callback(_GUID);}

    this.getRemoteIPaddress() = (callback) => {callback(_remoteip);}

    this.getConnMethod() = () => {callback(_connMethod);}

    this.getPosition() = (key, callback) => {callback(_pos);}

    this.setBundle() = (key, value) => {_bundle[key] = value;}

    this.getBundle() = (key, callback) => {callback(_bundle[key]);}

    // this.onConnectionDropout = () => {
    //   console.log('[ERR] onConnectionDropout not implemented');
    // }

  }

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

    this.start = function(port, ip, origin = false) {
      // launch
      _wss = new WebSocketServer({port: port, host : ip});

      _wss.on('connection', function(ws, req) {

          let originDomain = URL.parse(ws.upgradeReq.headers.origin).hostname;
          let connprofile = new ConnectionProfile(req.connection.remoteAddress, ws);
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
              var index = Utils.searchObject(clients, client);
              delete clients[index];
              this.onClose(connprofile);
          });

      });
    }
  }

  this.addServer = (conn_method, ip, port) => {
    if(conn_method == 'ws'||'WebSocket') {
      let serverID = utils.generateGUID();
      let wws = new WSServer(_serverID);
      _servers[_serverID] = wws;
      wws.start(port, ip);
      wws.onJSON = this.onJSON;
      wws.onClose = this.onClose;
    }
    else {
      console.log('[ERR]');
    }
  }

  this.sendJSON(conn_profile, json) => {
    _servers[conn_profile.serverID].sendJSON(conn_profile, json);
  }

  this.broadcast(json) => {
    for(let i = 0; i < _servers.length; i++) {
      _servers[i].broadcast(json);
    }
  }

  this.onJSON(conn_profile, json) => {
    console.log('[ERR] onJSON not implement');
  }

  this.onClose(conn_profile) => {
    console.log('[ERR] onClose not implement');
  }

}



module.exports = connection;
