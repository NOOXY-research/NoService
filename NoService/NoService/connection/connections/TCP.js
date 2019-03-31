// NoService/NoService/connection/connections/TCP.js
// Description:
// "TCP.js" provide connection interface.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const Net = require('net');
const Utils = require('../../library').Utilities;

function Server(ServerId, ConnectionProfile) {
  let _hostip;
  let _netserver;
  let _myclients = {};
  let _debug;

  this.setDebug = (d)=> {
    _debug = d;
  };

  this.closeConnetion = (GUID) => {
    _myclients[GUID].destroy()
    delete _myclients[GUID];
  };

  this.onData = (connprofile, data) => {Utils.TagLog('*ERR*', 'onData not implemented');};

  this.onClose = (connprofile) => {Utils.TagLog('*ERR*', 'onClose not implemented');};

  this.send = (connprofile, blob)=> {
    _myclients[connprofile.returnGUID()].write(Buffer.concat([Buffer.from(('0000000000000000'+blob.length).slice(-16)), blob]));
  };

  this.broadcast = (blob) => {
    for(let i in _myclients) {
      _myclients[i].write(Buffer.concat([Buffer.from(('0000000000000000'+blob.length).slice(-16)), blob]));
    }
  };

  this.start = (ip, port, origin = false) => {
    // launch server
    _hostip = ip;
    _netserver = Net.createServer((socket)=>{
      let connprofile = new ConnectionProfile(ServerId, 'Client', 'TCP/IP', ip, port, socket.remoteAddress, this);
      _myclients[connprofile.returnGUID()] = socket;

      let chunks_size;
      let message;
      let resume_data;

      let _onMessege = (message)=> {
        this.onData(connprofile, message);
      };

      socket.on('data', (data) => {
        if(resume_data) {
          data = Buffer.concat([resume_data, data]);
          // console.log('resume');
        };

        while(data.length) {
          // console.log('>', !message, data.length, chunks_size);
          if(!message) {
            chunks_size = parseInt(data.slice(0, 16).toString());
            message = data.slice(16, 16+chunks_size);
            data = data.slice(16+chunks_size);
            if(message.length === chunks_size) {
              _onMessege(message);
              chunks_size = null;
              message = null;
            }
            // in case chunks_size data is not complete
            if(data.length < 16) {
              resume_data = data;
              break;
            }
          }
          else if(data.length > chunks_size - message.length) {
            let left_size = chunks_size - message.length;
            // console.log('>', !message, data.length, chunks_size, message.length);
            message = Buffer.concat([message, data.slice(0, left_size)]);
            data = data.slice(left_size);
            // console.log('>', !message, data.length, chunks_size, message.length);
            if(message.length === chunks_size) {
              _onMessege(message);
              chunks_size = null;
              message = null;
            }
            // in case chunks_size data is not complete
            if(data.length < 16) {
              resume_data = data;
              break;
            }
          }
          else {
            message = Buffer.concat([message, data]);
            data = [];
            if(message.length === chunks_size) {
              _onMessege(message);
              chunks_size = null;
              message = null;
              resume_data = null;
            }
          }
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
  let _debug;

  this.setDebug = (d)=> {
    _debug = d;
  };

  this.closeConnetion = (GUID) => {_netc.destroy()};

  this.onData = (connprofile, data) => {Utils.TagLog('*ERR*', 'onData not implemented');};

  this.onClose = () => {Utils.TagLog('*ERR*', 'onClose not implemented');};

  this.send = (connprofile, blob) => {
    _netc.write(Buffer.concat([Buffer.from(('0000000000000000'+blob.length).slice(-16)), blob]));
  };

  this.connect = (ip, port, callback) => {
    _netc =  new Net.Socket();
    let connprofile;
    _netc.connect(port, ip, ()=>{
      connprofile = new ConnectionProfile(null, 'Server', 'TCP/IP', ip, port, 'localhost', this);
      callback(false, connprofile);
    });

    let chunks_size;
    let message;
    let resume_data;

    let _onMessege = (message)=> {
      this.onData(connprofile, message);
    };

    _netc.on('data', (data) => {
      if(resume_data) {
        data = Buffer.concat([resume_data, data]);
        // console.log('resume');
      };

      while(data.length) {
        // console.log('>', !message, data.length, chunks_size);
        if(!message) {
          chunks_size = parseInt(data.slice(0, 16).toString());
          message = data.slice(16, 16+chunks_size);
          data = data.slice(16+chunks_size);
          if(message.length === chunks_size) {
            _onMessege(message);
            chunks_size = null;
            message = null;
          }
          // in case chunks_size data is not complete
          if(data.length < 16) {
            resume_data = data;
            break;
          }
        }
        else if(data.length > chunks_size - message.length) {
          let left_size = chunks_size - message.length;
          // console.log('>', !message, data.length, chunks_size, message.length);
          message = Buffer.concat([message, data.slice(0, left_size)]);
          data = data.slice(left_size);
          // console.log('>', !message, data.length, chunks_size, message.length);
          if(message.length === chunks_size) {
            _onMessege(message);
            chunks_size = null;
            message = null;
          }
          // in case chunks_size data is not complete
          if(data.length < 16) {
            resume_data = data;
            break;
          }
        }
        else {
          message = Buffer.concat([message, data]);
          data = [];
          if(message.length === chunks_size) {
            _onMessege(message);
            chunks_size = null;
            message = null;
            resume_data = null;
          }
        }
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
