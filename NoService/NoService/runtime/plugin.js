// NoService/NoService/runtime/plugins.js
// Description:
// "plugins.js" injects plugins to NOOXY Service deamon.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

// note that NoService do not solve plugins' dependencies.
// plugins are injected and be called before native module started.
// plugins are loaded without order
// plugins are supposed to test the experimental abilities to be integrated into NoService core.

'use strict';

const Utils = require('../library').Utilities;

function startPlugins(plugins_path, coregateway, isInitialized, settings, callback) {
  if(plugins_path) {
    const Plugins =  require("fs").readdirSync(plugins_path).map((file)=> {
      return require(plugins_path+"/" + file);});

    let index = 0;
    let load_next = ()=> {
      Plugins[index](coregateway, isInitialized, settings, (err)=> {
        if(err) {
          callback(err);
        }
        else {
          index++;
          if(index<Plugins.length) {
            load_next();
          }
          else {
            callback(false);
          }
        }
      });
    };
    load_next();
  }
  else {
    next(false);
  }
};

module.exports = {
  startPlugins: startPlugins
};
