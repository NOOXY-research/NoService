// NoService/NoService/connection/connections/WebSocketSecure.js
// Description:
// "WebSocketSecure.js" provide connection interface.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const Https = require('https');
const WebSocket = require('ws');
const Utils = require('../../library').Utilities;

// a wrapped WebSocket server for nooxy service framework
function Server(ServerId, ConnectionProfile, ssl_priv_key=null, ssl_cert=null) {
  let _hostip = null;
  let _wss = null;
  let _myclients = {};

  this.closeConnetion = (GUID) => {
    _myclients[GUID].close()
    delete _myclients[GUID];
  };

  this.onData = (connprofile, data) => {Utils.TagLog('*ERR*', 'onData not implemented');};

  this.onClose = (connprofile) => {Utils.TagLog('*ERR*', 'onClose not implemented');};

  this.send = function(connprofile, data) {
    let c = _myclients[connprofile.returnGUID()];
    c.send(data);
  };

  this.broadcast = (data) => {
    for(let i in _myclients) {
      _myclients[i].send(data);
    }
  };

  this.start = (ip, port, origin = false) => {
    // launch server
    let credentials = { key: ssl_priv_key, cert: ssl_cert };
    let httpsServer = Https.createServer(credentials);
    httpsServer.listen(port, ip);
    _wss = new WebSocket.Server({server: httpsServer});
    _hostip = ip;

    _wss.on('connection', (ws, req) => {

      let connprofile = new ConnectionProfile(ServerId, 'Client', 'WebSocketSecure', ip, port, req.connection.remoteAddress, this);
      _myclients[connprofile.returnGUID()] = ws;

      ws.on('message', (message) => {
        this.onData(connprofile, message);
      });

      ws.on('error', (error) => {
        if(_debug) {
          Utils.TagLog('*WARN*', 'An error occured on connection module.');
          Utils.TagLog('*WARN*', error);
        }
        ws.close();
        this.onClose(connprofile);
      });

      ws.on('close', (message) => {
        delete _myclients[connprofile.returnGUID()];
        this.onClose(connprofile);
      });

    });
  };

  this.close = () => {
    _wss.close();
  };
}

function Client(ConnectionProfile) {
  let _ws = null

  this.closeConnetion = () => {
    _ws.close();
  };

  this.onData = (connprofile, data) => {Utils.TagLog('*ERR*', 'onData not implemented');};

  this.onClose = () => {Utils.TagLog('*ERR*', 'onClose not implemented');};

  this.send = function(connprofile, data) {
    _ws.send(data);
  };

  this.connect = (ip, port, callback) => {
    let connprofile = null;
    _ws = new WebSocket('wss://'+ip+':'+port);
    connprofile = new ConnectionProfile(null, 'Server', 'WebSocketSecure', ip, port, 'localhost', this);
    _ws.on('open', function open() {
      callback(false, connprofile);
      // ws.send('something');
    });
    _ws.on('message', (message) => {
      this.onData(connprofile, message);
    });

    _ws.on('error', (error) => {
      if(_debug) {
        Utils.TagLog('*WARN*', 'An error occured on connection module.');
        Utils.TagLog('*WARN*', error);
      }
      _ws.close();
      this.onClose(connprofile);
    });

    _ws.on('close', (error) => {
        this.onClose(connprofile);
    });

  }
};

module.exports = {
  Server: Server,
  Client: Client,
  ConnectMethod: 'WebSocketSecure'
}
