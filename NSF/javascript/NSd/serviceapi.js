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

  let _get_normal_api = (callback)=> {
    let _api = new _prototype();
    _api.Utils = require('./utilities'),

    _api.Service = {
      ActivitySocket: {
        createSocket: (method, targetip, targetport, service, callback) => {
          _coregateway.Service.createActivitySocket(method, targetip, targetport, service, callback);
        }
      },

      Entity: {
        getEntityMetaData: (entityID, callback) => {
          _coregateway.Entity.getEntityMetaData(entityID, callback);
        },
        returnCount: () => {
          return _coregateway.Entity.returnEntitycount();
        },
        getEntities: (callback) => {
          _coregateway.Entity.getEntitiesMeta(callback);
        }
      }
    };

    _api.Authorization = {
      Authby: {
        Token: (entityID, callback) => {
          _coregateway.Authorization.Authby.Token(entityID, callback);
        },
        Password : (entityID, callback) => {
          _coregateway.Authorization.Authby.Password(entityID, callback);
        }
      }
    };

    _api.Daemon = {
      Settings: _coregateway.Settings
    };

    _api.Connection = {
      getServers: (callback) => {
        _coregateway.Connection.getServers(callback);
      },
      getClients: (callback) => {
        _coregateway.Connection.getClients(callback);
      }
    };

    // for sniffing data
    _api.Sniffer = {
      onRouterJSON: _coregateway.Router.addSniffer,
    }

    callback(false, _api);
  };

  this.createServiceAPI = (service_socket, manifest, callback) => {
    _get_normal_api((err, api) => {
      api.Service.ServiceSocket = service_socket;
      api.Me = {
        Manifest: manifest
      }
      callback(false, api);
    });
  };

  this.createServiceAPIwithImplementaion = (service_socket, manifest, callback) => {
    _get_normal_api((err, api) => {
      api.Service.ServiceSocket = service_socket;
      api.Implementation = _coregateway.Implementation;
      api.Me = {
        Manifest: manifest
      }
      callback(false, api);
    });
  }

  this.createActivityAPI = (callback) => {
    
  };
}

module.exports = ServiceAPI;