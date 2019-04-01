// NoService/NoService/connection/connections/WebSocket.js
// Description:
// "WebSocket.js" provide connection interface.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const WebSocket = require('ws');
const Utils = require('../../library').Utilities;

// a wrapped WebSocket server for nooxy service framework
function Server(ServerId, ConnectionProfile) {
  let _hostip;
  let _wss;
  let _myclients = {};
  let _debug;

  this.setDebug = (d)=> {
    _debug = d;
  };

  this.closeConnetion = (GUID) => {
    _myclients[GUID].close()
    delete _myclients[GUID];
  };

  this.onData = (connprofile, data) => {Utils.TagLog('*ERR*', 'onData not implemented');};

  this.onClose = (connprofile) => {Utils.TagLog('*ERR*', 'onClose not implemented');};

  this.send = function(connprofile, data) {
    _myclients[connprofile.returnGUID()].send(data);
  };

  this.broadcast = (data) => {
    for(let i in _myclients) {
      _myclients[i].send(data);
    }
  };

  this.start = (ip, port, origin = false) => {
    // launch server
    _wss = new WebSocket.Server({port: port, host: ip});
    _hostip = ip;

    _wss.on('connection', (ws, req) => {

      let connprofile = new ConnectionProfile(ServerId, 'Client', 'WebSocket', ip, port, req.connection.remoteAddress, this);
      _myclients[connprofile.returnGUID()] = ws;

      ws.on('message', (message) => {
        this.onData(connprofile, message);
      });

      ws.on('error', (message) => {
        if(_debug) {
          Utils.TagLog('*WARN*', 'An error occured on connection module.');
          Utils.TagLog('*WARN*', message);
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
  let _debug;
  let _ops = [];

  this.setDebug = (d)=> {
    _debug = d;
  };

  this.closeConnetion = () => {
    _ws.close();
  };

  this.onData = (connprofile, data) => {Utils.TagLog('*ERR*', 'onData not implemented');};

  this.onClose = () => {Utils.TagLog('*ERR*', 'onClose not implemented');};

  this.send = (connprofile, data)=> {
    if (_ws.readyState === WebSocket.CONNECTING) {
      _ops.push(()=>{_ws.send(data)});
    }
    else {
      _ws.send(data);
    }
  };

  this.connect = (ip, port, callback) => {
    let connprofile;
    _ws = new WebSocket('ws://'+ip+':'+port);
    connprofile = new ConnectionProfile(null, 'Server', 'WebSocket', ip, port, 'localhost', this);
    _ws.on('open', ()=> {
      for(let i in _ops) {
        _ops[i]();
      }
      callback(false, connprofile);
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
  ConnectMethod: 'WebSocket'
}
