// NoService/NoService/router/protocols/CA.js
// Description:
// "CA.js" nooxy service protocol implementation of "call activity"
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';
const Buf = require('../../buffer');

module.exports = function Protocol(coregateway, emitRequest, debug) {
  this.Protocol = "CA";

  this.Positions = {
    rq: "Server",
    rs: "Client"
  };

  let Activity = coregateway.Activity;

  let _to_blob = (data)=> {
    if(Buf.isBuffer(data.d.d)) {
      let blob_back = Buf.concat([data.d.d]);
      data.d.d = null;
      let blob_front = Buf.encode(JSON.stringify(data));
      return Buf.concat([Buf.encode(('0000000000000000'+blob_front.length).slice(-16)), blob_front, Buf.encode(('0000000000000000'+blob_back.length).slice(-16)), blob_back]);
    }
    else {
      let blob = Buf.encode(JSON.stringify(data));
      return Buf.concat([Buf.encode(('0000000000000000'+blob.length).slice(-16)), blob]);
    }
  };

  let _parse_blob = (blob)=> {
    let length = parseInt(blob.slice(0, 16));
    let json_data = JSON.parse(blob.slice(16, 16+length).toString());
    blob = blob.slice(16+length);
    if(blob.length) {
      let blob_data;
      length = parseInt(blob.slice(0, 16));
      blob_data = blob.slice(16, 16+length);
      json_data.d.d = blob_data;
      return json_data;
    }
    else {
      return json_data;
    }
  };

  coregateway.Service.on('EmitASDataRq', (conn_profile, i, d) => {
    let _data = {
      "m": "AS",
      "d": {
        "i": i,
        "d": d,
      }
    };
    emitRequest(conn_profile, 'CA', _to_blob(_data));
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
    emitRequest(conn_profile, 'CA', _to_blob(_data));
  });

  coregateway.Service.on('EmitASBlobEventRq', (conn_profile, i, n, d, m) => {
    let _data = {
      "m": "BE",
      "d": {
        "i": i,
        "n": n,
        "d": d,
        "m": m
      }
    };
    emitRequest(conn_profile, 'CA', _to_blob(_data));
  });

  coregateway.Service.on('EmitASCloseRq', (conn_profile, i) => {
    let _data = {
      "m": "CS",
      "d": {
        "i": i
      }
    };
    emitRequest(conn_profile, 'CA', _to_blob(_data));
  });


  this.RequestHandler = (connprofile, blob, emitResponse) => {
    let data = _parse_blob(blob);

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
        emitResponse(connprofile, Buf.encode(JSON.stringify(_data)));
      },
      // nooxy service protocol implementation of "Call Activity: Blob Event(with metadata)"
      BE: () => {
        Activity.emitASBlobEvent(data.d.i, data.d.n, data.d.d, data.d.m);
        let _data = {
          "m": "BE",
          "d": {
            // status
            "i": data.d.i,
            "s": "OK"
          }
        };
        emitResponse(connprofile, Buf.encode(JSON.stringify(_data)));
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
        emitResponse(connprofile, Buf.encode(JSON.stringify(_data)));
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
      },

      BE: (connprofile, data) => {
        // no need to implement anything
      },
    }

    methods[data.m](connprofile, data.d);
  };

}
