// NoService/NoService/router/protocols/AU.js
// Description:
// "AU.js" nooxy service protocol implementation of "authorization"
// Copyright 2018-2019 NOOXY. All Rights Reserved.

'use strict';

module.exports = function Protocol(coregateway, emitRouter) {
  let _queue_operation = {};
  let Entity = coregateway.Entity;
  let Utils = coregateway.Utilities;
  let _auth_timeout = 180;

  this.Protocol = "AU";

  this.Positions = {
    rq: "Server",
    rs: "Client"
  };

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
      this.emitRouter(connprofile, 'AU', data);
    });
  });

  coregateway.Authorization.on('AuthbyPasswordFailed', (entityId, callback)=> {
    Entity.getEntityConnProfile(entityId, (err, connprofile) => {
      this.emitRouter(connprofile, 'AU', {m: 'PF'});
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
      emitRouter(connprofile, 'AU', data);
    });
  });

  coregateway.Authorization.on('AuthbyTokenFailed', (entityId, callback)=> {
    Entity.getEntityConnProfile(entityId, (err, connprofile) => {
      this.emitRouter(connprofile, 'AU', {m: 'TF'});
    });
  });

  coregateway.Authorization.on('SigninRq', (entityId)=> {
    Entity.getEntityConnProfile(entityId, (err, connprofile) => {
      emitRouter(connprofile, 'AU', {m: 'SI'});
    });
  });


  this.RequestHandler = coregateway.AuthorizationHandler.RqRouter;

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
