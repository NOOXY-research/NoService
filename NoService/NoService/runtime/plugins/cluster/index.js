// NoService/NoService/rumtime/plugins/cluster/protocol.js
// Description:
// "protocol.js" nooxy service protocol implementation of "Cluster"
// Copyright 2018-2019 NOOXY. All Rights Reserved.

module.exports = function() {
  this.name = 'NoService Cluster';
  this.version = '0.0.0';
  this.noservice = "0.5.6";
  this.allow_older_noservice = false;

  this.plugin = (noservice_coregateway, noservice_isInitialized, deploy_settings, noservice_constants, verbose, next)=> {
    verbose('Cluster', 'Loading cluster plugin...');
    noservice_coregateway.Router.addProtocol(require('./protocol'));
    next(false);
  };
}
