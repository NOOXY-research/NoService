// NoService/plugins/dummy.js
// Description:
// "dummy.js" create an example of plugin.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

module.exports = function() {
  this.name = 'Dummy Plugin';
  this.version = '0.0.0';
  this.noservice = "0.5.6";
  this.allow_older_noservice = false;
  this.dependencies = ['ws'];

  this.plugin = (noservice_coregateway, noservice_isInitialized, deploy_settings, noservice_constants, verbose, next)=> {
    verbose('Dummy', 'Dummy plugin being executed. NoService version "'+noservice_constants.version+'"');
    next(false);
  };
}
