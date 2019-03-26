// NoService/NoService/router/protocols/AU.js
// Description:
// "AU.js" nooxy service protocol implementation of "authorization"
// Copyright 2018-2019 NOOXY. All Rights Reserved.

'use strict';

module.exports = function Protocol(coregateway, emitRequest) {

  this.Protocol = "AU";

  this.Positions = {
    rq: "Server",
    rs: "Client"
  };

  let Implementation = coregateway.Implementation;
  let Entity = coregateway.Entity;
  let Utils = coregateway.Utilities;
  let Authorization = coregateway.Authorization;
  let AuthorizationHandler = coregateway.AuthorizationHandler;


  let _queue_operation = {};
  let _auth_timeout = 180;

  // ServerSide
  Authorization.on('AuthPasswordRq', (entityId, callback)=> {
    Entity.getEntityConnProfile(entityId, (err, connprofile) => {
      let data = {
        m: "PW",
        d: {t: Utils.generateGUID()}
      }
      let op = (connprofile, data) => {
        callback(err, data.d.v);
      }
      _queue_operation[data.d.t] = op;
      // set the timeout of this operation
      setTimeout(() => {if(_queue_operation[data.d.t]) {delete _queue_operation[data.d.t]}}, _auth_timeout*1000);
      this.emitRequest(connprofile, 'AU', data);
    });
  });

  Authorization.on('AuthbyPasswordFailed', (entityId, callback)=> {
    Entity.getEntityConnProfile(entityId, (err, connprofile) => {
      this.emitRequest(connprofile, 'AU', {m: 'PF'});
    });
  });

  Authorization.on('AuthTokenRq', (entityId, callback)=> {
    Entity.getEntityConnProfile(entityId, (err, connprofile) => {
      let data = {
        m: "TK",
        d: {t: Utils.generateGUID()}
      }
      let op = (connprofile, data) => {
        callback(err, data.d.v);
      }
      _queue_operation[data.d.t] = op;
      // set the timeout of this operation
      setTimeout(() => {if(_queue_operation[data.d.t]) {delete _queue_operation[data.d.t]}}, _auth_timeout*1000);
      emitRequest(connprofile, 'AU', data);
    });
  });

  Authorization.on('AuthbyTokenFailed', (entityId, callback)=> {
    Entity.getEntityConnProfile(entityId, (err, connprofile) => {
      emitRequest(connprofile, 'AU', {m: 'TF'});
    });
  });

  Authorization.on('SigninRq', (entityId)=> {
    Entity.getEntityConnProfile(entityId, (err, connprofile) => {
      emitRequest(connprofile, 'AU', {m: 'SI'});
    });
  });
  // ServerSide end

  // ClientSide

  let _handler = {
    // Authby password
    'PW': (connprofile, data, emitResponse) => {
      AuthorizationHandler.AuthbyPassword(connprofile, data, emitResponse);
    },

    // Authby password failed
    'PF': (connprofile, data, emitResponse) => {
      AuthorizationHandler.AuthbyPasswordFailed(connprofile, data, emitResponse);
    },

    // Authby token
    'TK': (connprofile, data, emitResponse) => {
      AuthorizationHandler.AuthbyToken(connprofile, data, emitResponse);
    },

    // Authby token failed
    'TF': (connprofile, data, emitResponse) => {
      AuthorizationHandler.AuthbyTokenFailed(connprofile, data, emitResponse);
    },

    // Sign in
    'SI': (connprofile, data, emitResponse) => {
      AuthorizationHandler.Signin(connprofile, data, emitResponse);
    },

    'AF': ()=>{

    }
  };


  this.RequestHandler = (connprofile, data, emitResponse) => {
    _handler[data.m](connprofile, data, emitResponse);
  };

  this.ResponseHandler = (connprofile, data) => {
    try {
      let op = _queue_operation[data.d.t];
      if(op) {
        op(connprofile, data);
        delete _queue_operation[data.d.t];
      }
    }
    catch (e) {
      console.log(e);
    }
  };
}
