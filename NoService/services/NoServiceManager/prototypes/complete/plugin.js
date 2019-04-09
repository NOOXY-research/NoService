// NoService/services/{{ servicename }}/plugin.js
// Description:
// "{{ servicename }}/plugin.js" description.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

// Plugins are executed in the NoService Runtime Core. Which means if occured
// failure will empact the whole system.

module.exports = function() {
  this.name = 'Dummy Plugin';
  this.version = '0.0.0';
  this.noservice = "0.5.6";
  this.allow_older_noservice = false;
  this.dependencies = ['ws'];

  this.plugin = (noservice_coregateway, noservice_isInitialized, deploy_settings, noservice_constants, verbose, next)=> {
    next(false);
  };
}
