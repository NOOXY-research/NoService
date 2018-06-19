// NSF/NSd/api.js
// Description:
// "api.js" provide interface of core interacting.
// Copyright 2018 NOOXY. All Rights Reserved.

let Utils = require('./utilities');

function ServiceAPI() {
  let _coregateway = null;

  let _safe_callback = (callback) => {
    return (a, b, c, d, e, f, g, h, i, j, k, l, m, n ,o) => {
      try {
        callback(a, b, c, d, e, f, g, h, i, j, k, l, m, n ,o);
      }
      catch (err) {
        Utils.tagLog('*ERR*', 'Service API occured error.');
        console.log(err);
      }
    }
  };
  function _prototype() {
    this.Service = null;
    this.Authorization = null;
    this.Deamon = null;
    this.Notification = null;
  };

  this.importCore = (coregateway) => {
    _coregateway = coregateway;
  };

  let _get_normal_api = (callback)=> {
    let _api = new _prototype();
    _api.Utils = require('./utilities');
    _api.SafeCallback = _safe_callback;
    _api.Service = {
      ActivitySocket: {
        createSocket: (method, targetip, targetport, service, callback) => {
          _coregateway.Service.createActivitySocket(method, targetip, targetport, service, _safe_callback(callback));
        },
        createDeamonSocket: (method, targetip, targetport, service, owner, callback) => {
          _coregateway.Service.createDaemonActivitySocket(method, targetip, targetport, service, owner, _safe_callback(callback));
        }
      },

      Entity: {
        returnEntityMetaData: (entityID) => {
          return _coregateway.Entity.returnEntityMetaData(entityID);
        },
        returnCount: () => {
          return _coregateway.Entity.returnEntitycount();
        },
        getEntities: (callback) => {
          _coregateway.Entity.getEntitiesMeta(_safe_callback(callback));
        },
        returnEntitiesID: () => {
          return _coregateway.Entity.returnEntitiesID();
        }
      },

      returnList: () => {
        return _coregateway.Service.returnList();
      }
    };

    _api.Authorization = {
      Authby: {
        Token: (entityID, callback) => {
          _coregateway.Authorization.Authby.Token(entityID, _safe_callback(callback));
        },
        Password : (entityID, callback) => {
          _coregateway.Authorization.Authby.Password(entityID, _safe_callback(callback));
        }
      }
    };

    _api.Daemon = {
      Settings: _coregateway.Settings
    };

    _api.Connection = {
      getServers: (callback) => {
        _coregateway.Connection.getServers(_safe_callback(callback));
      },
      getClients: (callback) => {
        _coregateway.Connection.getClients(_safe_callback(callback));
      }
    };

    // for sniffing data
    _api.Sniffer = {
      onRouterJSON: _coregateway.Router.addJSONSniffer,
      onRouterRawData: _coregateway.Router.addRAWSniffer,
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
