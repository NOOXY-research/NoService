// NoService/NoService/authorization/handler.js
// Description:
// "handler.js" provide authorization actions.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

// Handling responses to authorization requests.
function AuthorizationHandler() {
  let Implementation;

  // Handling responses to authorization requests.
  let _handler = {
    // Authby password
    'PW': (connprofile, data, data_sender) => {
      let AuthbyPassword = Implementation.returnImplement('AuthbyPassword');
      AuthbyPassword(connprofile, data, data_sender);
    },

    // Authby password failed
    'PF': (connprofile, data, data_sender) => {
      let AuthbyPasswordFailed = Implementation.returnImplement('AuthbyPasswordFailed');
      AuthbyPasswordFailed(connprofile, data, data_sender);
    },

    // Authby token
    'TK': (connprofile, data, data_sender) => {
      let AuthbyToken = Implementation.returnImplement('AuthbyToken');
      AuthbyToken(connprofile, data, data_sender);
    },

    // Authby token failed
    'TF': (connprofile, data, data_sender) => {
      let AuthbyTokenFailed = Implementation.returnImplement('AuthbyTokenFailed');
      AuthbyTokenFailed(connprofile, data, data_sender);
    },

    // Sign in
    'SI': (connprofile, data, data_sender) => {
      let Signin = Implementation.returnImplement('signin');
      Signin(connprofile, data, data_sender);
    },

    'AF': ()=>{

    }
  };

  this.importImplementation = (module)=> {
    Implementation = module;
  };

  this.handle = (method, connprofile, data, data_sender)=> {
    _handler[method](connprofile, data, data_sender);
  };

  this.close = () =>{

  }
};

module.exports = AuthorizationHandler;
