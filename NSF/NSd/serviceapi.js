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
  };

  this.createServiceAPI = (callback(api)) => {

  };
}
