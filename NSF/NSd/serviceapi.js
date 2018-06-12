// NSF/NSd/api.js
// Description:
// "api.js" provide interface of core interacting.
// Copyright 2018 NOOXY. All Rights Reserved.

function ServiceAPI() {
  let _coregateway = null;

  function _prototype() {
    this.Service = null;
    this.Authorization = null;
    this.Deamon = null;
    this.Notification = null;
  };

  this.importCore = (coregateway) => {
    _coregateway = coregateway;
    // console.log(_coregateway);
  };

  this.createServiceAPI = (service_socket, callback) => {
    let _api = new _prototype();
    _api.Service = {
      ServiceSocket: service_socket,
      ActivitySocket: {
        createSocket: (method, targetip, targetport, callback) => {
          _coregateway.Service.createActivitySocket(method, targetip, targetport, callback);
        }
      }
    };

    _api.Authorization = {
      Authby: {
        Token: (entityID, callback) => {
          _coregateway.Authoration.Authby.Token(entityID, callback);
        },
        Password : (entityID, callback) => {
          _coregateway.Authoration.Authby.Password(entityID, callback);
        }
      }
    };

    _api.Daemon = {
      Settings: _coregateway.Settings
    };
    callback(_api);
  };
}

module.exports = ServiceAPI;
