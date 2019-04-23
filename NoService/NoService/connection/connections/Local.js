// NoService/NoService/connection/connections/Local.js
// Description:
// "Local.js" provide connection interface.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const Utils = require('../../library').Utilities;
const VirtualNet = new (require('../library/virtualnet'))();


function Server(ServerId, ConnectionProfile) {
  let _vnets;
  let _myclients = {};
  let _debug;

  this.setDebug = (d)=> {
    _debug = d;
  };

  this.closeConnetion = (GUID) => {
    _myclients[GUID].close();
    delete _myclients[GUID];
  };

  this.onData = (connprofile, data) => {Utils.TagLog('*ERR*', 'LocalServer onData not implemented.');};

  this.onClose = (connprofile) => {Utils.TagLog('*ERR*', 'LocalServer onClose not implemented');};

  this.send = (connprofile, data) => {
    _myclients[connprofile.returnGUID()].send(data);
  };

  this.broadcast = (data) => {
    for(let i in _myclients) {
      _myclients[i].send(data);
    };
  }

  this.start = (virtip, virtport)=> {
    _vnets = VirtualNet.createServer(virtip, virtport);
    _vnets.on('connection', (vs) => {
        let connprofile = new ConnectionProfile(ServerId, 'Client', 'Local', virtip, virtport, vs.returnRemoteIP(), this);
        _myclients[connprofile.returnGUID()] = vs;

        vs.on('message', (message) => {
          this.onData(connprofile, message);
        });

        vs.on('error', (err) => {
          Utils.TagLog('*ERR*', err);
          delete _myclients[connprofile.returnGUID()];
          this.onClose(connprofile);
          vs.close();
        });

        vs.on('close', (message) => {
          delete _myclients[connprofile.returnGUID()];
          this.onClose(connprofile);
        });

    });
  };

  this.close = () => {
  };
};

function Client(ConnectionProfile) {
  // VirtualNet client
  let _vnetc;
  let _vs = null;
  let _debug;

  this.setDebug = (d)=> {
    _debug = d;
  };

  this.closeConnetion = (GUID) => {_vs.close()};

  this.onData = (connprofile, data) => {Utils.TagLog('*ERR*', 'onData not implemented');};

  this.onClose = () => {Utils.TagLog('*ERR*', 'onClose not implemented');};

  this.send = function(connprofile, data) {
    _vs.send(data);
  };

  this.connect = (virtip, virtport, callback) => {
    let connprofile;
    _vnetc = VirtualNet.createClient('LOCALIP', Utils.generateGUID(), virtip, virtport);
    _vnetc.connect(virtip, virtport, (err, vs) => {
      _vs = vs;
      connprofile = new ConnectionProfile(null, 'Server', 'Local', virtip, virtport, _vnetc.getIP(), this);

      vs.on('message', (message) => {
        this.onData(connprofile, message);
      });

      vs.on('error', (error) => {
          Utils.TagLog('*ERR*', error);
          vs.close();
      });

      vs.on('close', () => {
        this.onClose(connprofile);
      });

    });

    callback(false, connprofile);
  }
};


module.exports = {
  Server: Server,
  Client: Client,
  ConnectMethod: 'Local'
}
