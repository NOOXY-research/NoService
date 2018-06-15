// NSF/NSd/implementation.js
// Description:
// "implementation.js" provides manager to manage implemented functions which need to be
// implemented by service owner itself.
// Copyright 2018 NOOXY. All Rights Reserved.
let Utils = require('./utilities');

function Implementation() {
  let _connection_module = null;

  let _implts = {
    // return for Server
    AuthbyToken: (callback) => {
      Utils.tagLog('*ERR*', 'AuthbyToken not implement');
      callback(true, 'token');
    },

    // return for Server
    AuthbyPassword: (callback) => {
      Utils.tagLog('*ERR*', 'AuthbyPassword not implement');
      callback(true, 'password');
    },

    // return for Client
    signin: (conn_method, remoteip, port, username, password, callback) => {
      Utils.tagLog('*ERR*', 'signin not implement');
      callback(true, 'token');
    },

    // return for Client
    signup: (conn_method, remoteip, port, username, password, callback) => {
      Utils.tagLog('*ERR*', 'signup not implement');
      callback(true, 'token');
    },

    onToken: (err, token) => {
      Utils.tagLog('*ERR*', 'onToken not implement');
    },

    // for Server
    noti: () => {

    },

    AuthbyPassword: null,

    AuthbyAction: null
  };

  this.onToken = (connprofile, status, token)=> {
    if(status == 'OK') {
      _implts['onToken'](false, token);
    }
    else {
      _implts['onToken'](true);
    }
  };

  this.emitRouter = () => {Utils.tagLog('*ERR*', 'emitRouter not implemented');};

  // get a temporary ConnectionProfile
  this.getClientConnProfile = (conn_method, remoteip, port, callback) => {
    _connection_module.createClient(conn_method, remoteip, port, callback);
  }

  this.importConnectionModule = (connection_module) => {
    _connection_module = connection_module;
  };



  this.setImplement = (name, callback) => {
    _implts[name] = callback;
  };

  this.returnImplement = (name) => {
    return _implts[name];
  };

  this.returnImplementBundle = () => {
    return _implts;
  }
}

module.exports = Implementation;
