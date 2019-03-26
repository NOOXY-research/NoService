// NoService/NoService/authorization/handler.js
// Description:
// "handler.js" provide authorization actions.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

// Handling responses to authorization requests.
function AuthorizationHandler() {

  this.importImplementation = (Implementation)=> {
    this.AuthbyPassword = Implementation.returnImplement('AuthbyPassword');
    this.AuthbyPasswordFailed = Implementation.returnImplement('AuthbyPasswordFailed');
    this.AuthbyToken = Implementation.returnImplement('AuthbyToken');
    this.AuthbyTokenFailed = Implementation.returnImplement('AuthbyTokenFailed');
    this.Signin = Implementation.returnImplement('signin');
  };

  this.close = () =>{

  }
};

module.exports = AuthorizationHandler;
