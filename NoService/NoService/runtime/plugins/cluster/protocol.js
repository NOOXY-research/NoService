// NoService/NoService/rumtime/plugins/cluster/protocols.js
// Description:
// "CR.js" nooxy service protocol implementation of "Cluster"
// Copyright 2018-2019 NOOXY. All Rights Reserved.

'use strict';

module.exports = function Protocol(coregateway, emitRequest) {

  this.Protocol = "CR";

  this.Positions = {
    rq: "Server",
    rs: "Client"
  };


  this.RequestHandler = (connprofile, data, data_sender) => {
    let _handlers = {
      // cross host callback
      'CC': {

      },

      // redirect
      'RD': {

      }
    };
  };

  this.ResponseHandler = (connprofile, data) => {
  };
}
