// NoService/NoService/router/protocols/CA.js
// Description:
// "CA.js" nooxy service protocol implementation of "call activity"
// Copyright 2018-2019 NOOXY. All Rights Reserved.


module.exports = function Protocol(coregateway, emitRouter) {
  this.Protocol = "CA";

  this.Positions = {
    rq: "Both",
    rs: "Both"
  };

  this.Request = coregateway.Service.ActivityRqRouter;

  this.Response = coregateway.Service.ActivityRsRouter;

}
