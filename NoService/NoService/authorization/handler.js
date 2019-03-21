// NoService/NoService/authorization/handler.js
// Description:
// "handler.js" provide authorization actions.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

// Handling responses to authorization requests.
function AuthorizationHandler() {
  let _implementation_module = null;
  let _daemon_auth_key = null;
  let _trusted_domains = [];

  let _implts_callback = {
    // Authby password
    'PW': (connprofile, data, data_sender) => {
      let AuthbyPassword = _implementation_module.returnImplement('AuthbyPassword');
      AuthbyPassword(connprofile, data, data_sender);
    },

    // Authby password failed
    'PF': (connprofile, data, data_sender) => {
      let AuthbyPasswordFailed = _implementation_module.returnImplement('AuthbyPasswordFailed');
      AuthbyPasswordFailed(connprofile, data, data_sender);
    },

    // Authby token
    'TK': (connprofile, data, data_sender) => {
      let AuthbyToken = _implementation_module.returnImplement('AuthbyToken');
      AuthbyToken(connprofile, data, data_sender);
    },

    // Authby token failed
    'TF': (connprofile, data, data_sender) => {
      let AuthbyTokenFailed = _implementation_module.returnImplement('AuthbyTokenFailed');
      AuthbyTokenFailed(connprofile, data, data_sender);
    },

    // Sign in
    'SI': (connprofile, data, data_sender) => {
      let Signin = _implementation_module.returnImplement('signin');
      Signin(connprofile, data, data_sender);
    },

    'AF': ()=>{

    }
  };

  this.RqRouter = (connprofile, data, data_sender) => {
    _implts_callback[data.m](connprofile, data, data_sender);
  };

  this.importImplementationModule = (implementation_module) => {
    _implementation_module = implementation_module;
  };

  this.close = () =>{

  }
};

module.exports = AuthorizationHandler;
