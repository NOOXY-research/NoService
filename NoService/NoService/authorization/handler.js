// NoService/NoService/authorization/handler.js
// Description:
// "handler.js" provide authorization actions.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

// Handling responses to authorization requests.
function AuthorizationHandler() {

  this.importImplementation = (Implementation)=> {
    this.AuthbyPassword = (...args)=> {Implementation.returnImplement('AuthbyPassword').apply(null, args)};
    this.AuthbyToken = (...args)=> {Implementation.returnImplement('AuthbyToken').apply(null, args)};
    this.AuthbyTokenFailed = (...args)=> {Implementation.returnImplement('AuthbyTokenFailed').apply(null, args)};
    this.Signin = (...args)=> {Implementation.returnImplement('signin').apply(null, args)};

  };

  this.close = () =>{

  }
};

module.exports = AuthorizationHandler;
