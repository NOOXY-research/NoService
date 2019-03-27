// NoService/NoService/router/protocols/CA.js
// Description:
// "CA.js" nooxy service protocol implementation of "call activity"
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';


module.exports = function Protocol(coregateway, emitRequest, debug) {
  this.Protocol = "CA";

  this.Positions = {
    rq: "Server",
    rs: "Client"
  };

  let Activity = coregateway.Activity;

  coregateway.Service.on('EmitASDataRq', (conn_profile, i, d) => {
    let _data = {
      "m": "AS",
      "d": {
        "i": i,
        "d": d,
      }
    };
    emitRequest(conn_profile, 'CA', _data);
  });

  coregateway.Service.on('EmitASEventRq', (conn_profile, i, n, d) => {
    let _data = {
      "m": "EV",
      "d": {
        "i": i,
        "n": n,
        "d": d,
      }
    };
    emitRequest(conn_profile, 'CA', _data);
  });

  coregateway.Service.on('EmitASCloseRq', (conn_profile, i) => {
    let _data = {
      "m": "CS",
      "d": {
        "i": i
      }
    };
    emitRequest(conn_profile, 'CA', _data);
  });


  this.RequestHandler = (connprofile, blob, emitResponse) => {
    let data = JSON.parse(blob.toString('utf8'));

    let methods = {
      // nooxy service protocol implementation of "Call Activity: ActivitySocket"
      AS: () => {
        Activity.emitASData(data.d.i, data.d.d);
        let _data = {
          "m": "AS",
          "d": {
            // status
            "i": data.d.i,
            "s": "OK"
          }
        };
        emitResponse(connprofile, _data);
      },
      // nooxy service protocol implementation of "Call Activity: Event"
      EV: () => {
        Activity.emitASEvent(data.d.i, data.d.n, data.d.d);
        let _data = {
          "m": "EV",
          "d": {
            // status
            "i": data.d.i,
            "s": "OK"
          }
        };
        emitResponse(connprofile, _data);
      },
      // nooxy service protocol implementation of "Call Activity: Close ActivitySocket"
      CS: () => {
        Activity.emitASClose(data.d.i);
      }
    }
    // call the callback.
    methods[data.m](connprofile, data.d, emitResponse);
  };

  // Serverside
  this.ResponseHandler = (connprofile, blob) => {
    let data = JSON.parse(blob.toString('utf8'));

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
