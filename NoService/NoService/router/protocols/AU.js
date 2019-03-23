// NoService/NoService/router/protocols/AU.js
// Description:
// "AU.js" nooxy service protocol implementation of "authorization"
// Copyright 2018-2019 NOOXY. All Rights Reserved.


module.exports = function Protocol(coregateway, emitRouter) {

  coregateway.Authorization.emitRouter = emitRouter;

  this.Protocol = "AU";

  this.Positions = {
    rq: "Server",
    rs: "Client"
  };

  this.Request = coregateway.AuthorizationHandler.RqRouter;

  this.Response = coregateway.Authorization.RsRouter;
}
