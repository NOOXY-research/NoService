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

  this.RequestHandler = coregateway.Activity.ActivityRqRouter;

  // Serverside
  this.ResponseHandler = (connprofile, data) => {

    let methods = {
      // nooxy service protocol implementation of "Call Activity: ActivitySocket"
      AS: (connprofile, data) => {
        // no need to implement anything
      },

      EV: (connprofile, data) => {
        // no need to implement anything
      }
    }

    methods[data.m](connprofile, data.d);
  };

}
