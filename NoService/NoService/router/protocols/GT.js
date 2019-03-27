// NoService/NoService/router/protocols/GT.js
// Description:
// "GT.js" nooxy service protocol implementation of "get token"
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';


module.exports = function Protocol(coregateway, emitRequest, debug) {
  this.Protocol = "GT";

  this.Positions = {
    rq: "Client",
    rs: "Server"
  };

  this.RequestHandler = (connprofile, blob, _senddata) => {
    let data = JSON.parse(blob.toString('utf8'));
    let responsedata = {};
    coregateway.Authenticity.getUserTokenByUsername(data.u, data.p, (err, token)=>{
      responsedata['t'] = token;
      responsedata['u'] = data.u;
      if(err) {
        responsedata['s'] = 'Fail';
      }
      else {
        responsedata['s'] = 'OK';
      }
      _senddata(connprofile, responsedata);
    });
  };

  this.ResponseHandler = (connprofile, blob) => {
    let data = JSON.parse(blob.toString('utf8'));
    coregateway.Implementation.onToken(connprofile, data.s, data.t);
  };

}
