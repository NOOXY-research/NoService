// NoService/NoService/implementation.js
// Description:
// "implementation.js" provides manager to manage implemented functions which need to be
// implemented by service owner itself.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const Utils = require('../library').Utilities;

function Implementation() {

  let _implts = {
    // NOOXY service protocol sercure end
    // return for Server
    AuthbyToken: (callback) => {
      Utils.TagLog('*ERR*', 'AuthbyToken not implemented');
      callback(true, 'token');
    },

    AuthbyTokenFailed: () => {
      Utils.TagLog('*ERR*', 'AuthbyTokenFailed not implemented');
    },

    // return for Server
    AuthbyPassword: (callback) => {
      Utils.TagLog('*ERR*', 'AuthbyPassword not implemented');
      callback(true, 'password');
    },

    AuthbyPasswordFailed: () => {
      Utils.TagLog('*ERR*', 'AuthbyPasswordFailed not implemented');
    },

    // return for Client
    signin: (conn_method, remoteip, port, username, password, callback) => {
      Utils.TagLog('*ERR*', 'signin not implemented');
      callback(true, 'token');
    },

    // return for Client
    signup: (conn_method, remoteip, port, username, password, callback) => {
      Utils.TagLog('*ERR*', 'signup not implemented');
      callback(true, 'token');
    },

    onToken: (err, token) => {
      Utils.TagLog('*ERR*', 'onToken not implemented');
    }
  };


  this.onToken = (connprofile, status, token)=> {
    if(status === 'OK') {
      _implts['onToken'](false, token);
    }
    else {
      _implts['onToken'](true);
    }
  };

  this.setImplement = (name, callback) => {
    _implts[name] = callback;
  };

  this.returnImplement = (name) => {
    return _implts[name];
  };

  this.getImplement = (name, callback) => {
    callback(false, _implts[name]);
  };

  this.returnImplementBundle = () => {
    return _implts;
  };

  this.close = () => {};
}

module.exports = Implementation;
