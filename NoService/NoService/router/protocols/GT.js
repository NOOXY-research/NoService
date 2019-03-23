// NoService/NoService/router/protocols/GT.js
// Description:
// "GT.js" nooxy service protocol implementation of "get token"
// Copyright 2018-2019 NOOXY. All Rights Reserved.


module.exports = function Protocol(coregateway, emitRouter) {
  this.Protocol = "GT";

  this.Positions = {
    rq: "Client",
    rs: "Server"
  };

  this.Request = (connprofile, data, _senddata) => {
    let responsedata = {};
    coregateway.Authenticity.getUserTokenByUsername(data.u, data.p, (err, token)=>{
      responsedata['t'] = token;
      if(err) {
        responsedata['s'] = 'Fail';
      }
      else {
        responsedata['s'] = 'OK';
      }
      _senddata(connprofile, 'GT', 'rs', responsedata);
    });
  };

  this.Response = (connprofile, data) => {
    coregateway.Implementation.onToken(connprofile, data.s, data.t);
  };

}
