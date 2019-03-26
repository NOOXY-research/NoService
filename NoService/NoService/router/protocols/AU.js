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

  let _queue_operation = {};
  let _auth_timeout = 180;

  // ServerSide
  coregateway.Authorization.on('AuthPasswordRq', (entityId, callback)=> {
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

  coregateway.Authorization.on('AuthbyPasswordFailed', (entityId, callback)=> {
    Entity.getEntityConnProfile(entityId, (err, connprofile) => {
      this.emitRequest(connprofile, 'AU', {m: 'PF'});
    });
  });

  coregateway.Authorization.on('AuthTokenRq', (entityId, callback)=> {
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

  coregateway.Authorization.on('AuthbyTokenFailed', (entityId, callback)=> {
    Entity.getEntityConnProfile(entityId, (err, connprofile) => {
      this.emitRequest(connprofile, 'AU', {m: 'TF'});
    });
  });

  coregateway.Authorization.on('SigninRq', (entityId)=> {
    Entity.getEntityConnProfile(entityId, (err, connprofile) => {
      emitRequest(connprofile, 'AU', {m: 'SI'});
    });
  });
  // ServerSide end


  this.RequestHandler = (connprofile, data, emitResponse) => {
    coregateway.AuthorizationHandler.handle(data.m, connprofile, data, emitResponse);
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
