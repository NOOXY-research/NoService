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
    AuthbyToken: () => {
      Utils.TagLog('*ERR*', 'AuthbyToken not implemented');
    },

    AuthbyTokenFailed: () => {
      Utils.TagLog('*ERR*', 'AuthbyTokenFailed not implemented');
    },

    // return for Server
    AuthbyPassword: () => {
      Utils.TagLog('*ERR*', 'AuthbyPassword not implemented');
    },

    AuthbyPasswordFailed: () => {
      Utils.TagLog('*ERR*', 'AuthbyPasswordFailed not implemented');
    },

    // return for Client
    signin: () => {
      Utils.TagLog('*ERR*', 'signin not implemented');
    },

    // return for Client
    signup: () => {
      Utils.TagLog('*ERR*', 'signup not implemented');
    },

    onToken: () => {
      Utils.TagLog('*ERR*', 'onToken not implemented');
    }
  };


  this.onToken = (connprofile, status, username, token)=> {
    _implts['onToken'](status, username, token);
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

  this.getClientConnProfile = ()=> {

  };

  this.close = () => {};
}

module.exports = Implementation;
