// NoService/NoService/router/protocols/CS.js
// Description:
// "CS.js" nooxy service protocol implementation of "call service"
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';


module.exports = function Protocol(coregateway, emitRouter) {
  this.Protocol = "CS";

  this.Positions = {
    rq: "Client",
    rs: "Server"
  };

  this.RequestHandler = coregateway.Service.ServiceRqRouter;

  this.ResponseHandler = coregateway.Service.ServiceRsRouter;

}
