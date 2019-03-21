// NoService/NoService/connection/connections/TCP.js
// Description:
// "TCP.js" provide connection interface.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const Net = require('net');
const Utils = require('../../library').Utilities;

function Server(ServerId, ConnectionProfile) {
  let _hostip = null;
  let _netserver = null;
  let _myclients = {};

  this.closeConnetion = (GUID) => {
    _myclients[GUID].destroy()
    delete _myclients[GUID];
  };

  this.onData = (connprofile, data) => {Utils.TagLog('*ERR*', 'onData not implemented');};

  this.onClose = (connprofile) => {Utils.TagLog('*ERR*', 'onClose not implemented');};

  this.send = (connprofile, data)=> {
    _myclients[connprofile.returnGUID()].write(('0000000000000000'+Buffer.from(data).length).slice(-16)+data);
  };

  this.broadcast = (data) => {
    for(let i in _myclients) {
      _myclients[i].write(('0000000000000000'+Buffer.from(data).length).slice(-16)+data);
    }
  };

  this.start = (ip, port, origin = false) => {
    // launch server
    _hostip = ip;
    _netserver = Net.createServer((socket)=>{
      let connprofile = new ConnectionProfile(ServerId, 'Client', 'TCP/IP', ip, port, socket.remoteAddress, this);
      _myclients[connprofile.returnGUID()] = socket;

      socket.on('data', (data) => {
        while(data.length) {
          let chunks_size = parseInt(data.slice(0, 16).toString());
          this.onData(connprofile, data.slice(16, 16+chunks_size).toString());
          data = data.slice(16+chunks_size)
        }
      });

      socket.on('error', (error) => {
        if(_debug) {
          Utils.TagLog('*WARN*', 'An error occured on connection module.');
          Utils.TagLog('*WARN*', error);
        }
        socket.destroy();
        this.onClose(connprofile);
      });

      socket.on('close', (message) => {
        delete _myclients[connprofile.returnGUID()];
        this.onClose(connprofile);
      });

    }).listen(port, ip);

  };

  this.close = () => {
    _netserver.close();
  };
};

function Client(ConnectionProfile) {
  let _netc = null

  this.closeConnetion = (GUID) => {_netc.destroy()};

  this.onData = (connprofile, data) => {Utils.TagLog('*ERR*', 'onData not implemented');};

  this.onClose = () => {Utils.TagLog('*ERR*', 'onClose not implemented');};

  this.send = (connprofile, data) => {
    _netc.write(('0000000000000000'+Buffer.from(data).length).slice(-16)+data);
  };

  this.connect = (ip, port, callback) => {
    _netc =  new Net.Socket();
    let connprofile = null;
    _netc.connect(port, ip, ()=>{
      connprofile = new ConnectionProfile(null, 'Server', 'TCP/IP', ip, port, 'localhost', this);
      callback(false, connprofile);
    })

    _netc.on('data', (data) => {
      while(data.length) {
        let chunks_size = parseInt(data.slice(0, 16).toString());
        this.onData(connprofile, data.slice(16, 16+chunks_size).toString());
        data = data.slice(16+chunks_size);
      }
    });

    _netc.on('error', (error) => {
      if(_debug) {
        Utils.TagLog('*WARN*', 'An error occured on connection module.');
        Utils.TagLog('*WARN*', message);
      }
      _netc.destroy();
      this.onClose(connprofile);
    });

    _netc.on('close', () => {
      this.onClose(connprofile);
    });


  }
};


module.exports = {
  Server: Server,
  Client: Client,
  ConnectMethod: 'TCP'
}
