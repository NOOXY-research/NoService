// NoService/NoService/router/protocols/CA.js
// Description:
// "CA.js" nooxy service protocol implementation of "call activity"
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';


module.exports = function Protocol(coregateway, emitRouter) {
  this.Protocol = "CA";

  this.Positions = {
    rq: "Both",
    rs: "Both"
  };

  this.RequestHandler = coregateway.Service.ActivityRqRouter;

  this.ResponseHandler = coregateway.Service.ActivityRsRouter;

}
