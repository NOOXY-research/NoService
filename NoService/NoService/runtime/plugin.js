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
const Constants = require('./constants');

function startPlugins(plugins, coregateway, isInitialized, settings, callback) {
  let verbose = (tag, log) => {
    if(settings.verbose||settings.debug) {
      Utils.TagLog(tag, log);
    };
  };

  let Plugins = require("fs").readdirSync(require("path").join(__dirname, "./plugins")).map((file)=> {
    return require('./plugins/'+ file);});
    
  Plugins = Plugins.concat(plugins);

  let index = 0;
  let load_next = ()=> {
    let p = new Plugins[index]();
    verbose('Plugin', 'Loading plugin "'+p.name+'"...');
    if(p.noservice) {
      let biggerthanruntime = Utils.compareVersion(p.noservice, Constants.version);
      if(biggerthanruntime>0&&!p.allow_older_noservice) {
        verbose('Plugin', '***** Plugin "'+p.name+'" is not compatible with your NoService('+Constants.version+'). Require ('+p.noservice+'). Skipped.');
        index++;
        if(index<Plugins.length) {
          load_next();
        }
        else {
          callback(false);
        }
      }
      else {
        let proceed = true;
        // Checking dependencies
        for(let i in p.dependencies) {
          try {
            require.resolve(p.dependencies[i]);
          } catch (e) {
            verbose('Plugin', '***** Plugin "'+p.name+'" needs package "'+p.dependencies[i]+'".');
            callback(true);
            proceed = false;
            break;
          }
        }
        if(proceed) {
          p.plugin(coregateway, isInitialized, settings, Constants, verbose, (err)=> {
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
        }
      }
    }
  };
  load_next();
};

module.exports = {
  startPlugins: startPlugins
};
