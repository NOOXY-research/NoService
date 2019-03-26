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
    'PW': (connprofile, data, emitResponse) => {
      let AuthbyPassword = Implementation.returnImplement('AuthbyPassword');
      AuthbyPassword(connprofile, data, emitResponse);
    },

    // Authby password failed
    'PF': (connprofile, data, emitResponse) => {
      let AuthbyPasswordFailed = Implementation.returnImplement('AuthbyPasswordFailed');
      AuthbyPasswordFailed(connprofile, data, emitResponse);
    },

    // Authby token
    'TK': (connprofile, data, emitResponse) => {
      let AuthbyToken = Implementation.returnImplement('AuthbyToken');
      AuthbyToken(connprofile, data, emitResponse);
    },

    // Authby token failed
    'TF': (connprofile, data, emitResponse) => {
      let AuthbyTokenFailed = Implementation.returnImplement('AuthbyTokenFailed');
      AuthbyTokenFailed(connprofile, data, emitResponse);
    },

    // Sign in
    'SI': (connprofile, data, emitResponse) => {
      let Signin = Implementation.returnImplement('signin');
      Signin(connprofile, data, emitResponse);
    },

    'AF': ()=>{

    }
  };

  this.importImplementation = (module)=> {
    Implementation = module;
  };

  this.handle = (method, connprofile, data, emitResponse)=> {
    _handler[method](connprofile, data, emitResponse);
  };

  this.close = () =>{

  }
};

module.exports = AuthorizationHandler;
