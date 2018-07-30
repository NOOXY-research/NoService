// NSF/NSd/implementation.js
// Description:
// "implementation.js" provides manager to manage implemented functions which need to be
// implemented by service owner itself.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

let Utils = require('./utilities');

function Implementation() {
  let _support_secure = false;
  let _connection_module = null;

  // NOOXY service protocol secure list
  let _nsps_list = ['generateAESCBC256KeyByHash', 'encryptString', 'decryptString'];

  let _implts = {

    // NOOXY service protocol sercure

      // hashing two string (host and client pub key)by SHA256 to get AES-CBC 256 key 32 char
      generateAESCBC256KeyByHash: (string1, string2, callback) => {
        Utils.tagLog('*ERR*', 'generateAESCBC256KeyByHash not implemented');
        callback(true, 'hash 32 char');
      },

      encryptString: (key, toEncrypt, callback) => {
        Utils.tagLog('*ERR*', 'generateAESCBC256KeyByHash not implemented');
        callback(true, 'encrypted');
      },

      decryptString: (key, toEncrypt, callback) => {
        Utils.tagLog('*ERR*', 'generateAESCBC256KeyByHash not implemented');
        callback(true, 'decrypted');
      },

      saveRSA2048KeyPair: (priv, pub) => {
        Utils.tagLog('*ERR*', 'saveRSA2048KeyPair not implemented');
      },

      loadRSA2048KeyPair: (callback) => {
        Utils.tagLog('*ERR*', 'loadRSA2048KeyPair not implemented');
        callback(true, 'priv', 'pub');
      },

    // NOOXY service protocol sercure end

    // return for Server
    AuthbyToken: (callback) => {
      Utils.tagLog('*ERR*', 'AuthbyToken not implemented');
      callback(true, 'token');
    },

    AuthbyTokenFailed: () => {
      Utils.tagLog('*ERR*', 'AuthbyTokenFailed not implemented');
    },

    // return for Server
    AuthbyPassword: (callback) => {
      Utils.tagLog('*ERR*', 'AuthbyPassword not implemented');
      callback(true, 'password');
    },

    AuthbyPasswordFailed: () => {
      Utils.tagLog('*ERR*', 'AuthbyPasswordFailed not implemented');
    },

    // return for Client
    signin: (conn_method, remoteip, port, username, password, callback) => {
      Utils.tagLog('*ERR*', 'signin not implemented');
      callback(true, 'token');
    },

    // return for Client
    signup: (conn_method, remoteip, port, username, password, callback) => {
      Utils.tagLog('*ERR*', 'signup not implemented');
      callback(true, 'token');
    },

    onToken: (err, token) => {
      Utils.tagLog('*ERR*', 'onToken not implemented');
    },

    // for Server
    noti: () => {

    },

    AuthbyPassword: null,

    AuthbyAction: null
  };

  // Nooxy service protocol sercure request
  this.NSPSRqRouter = (connprofile, data, data_sender) => {

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

  this.sendRouterData = () => {Utils.tagLog('*ERR*', 'sendRouterData not implemented');};
  // get a temporary ConnectionProfile
  this.getClientConnProfile = (conn_method, remoteip, port, callback) => {
    _connection_module.createClient(conn_method, remoteip, port, callback);
  }

  this.importConnectionModule = (connection_module) => {
    _connection_module = connection_module;
  };

  this.setSecure = (boolean)=>{

  };

  this.isSecure = (boolean)=>{

  };

  this.setImplement = (name, callback) => {
    _implts[name] = callback;
  };

  this.returnImplement = (name) => {
    return _implts[name];
  };

  this.returnImplementBundle = () => {
    return _implts;
  };

  this.returnNSPSModule = () =>{

  };

  this.close = () => {};
}

module.exports = Implementation;
