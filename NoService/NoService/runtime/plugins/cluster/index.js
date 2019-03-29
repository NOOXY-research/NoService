// NoService/NoService/rumtime/plugins/cluster/protocol.js
// Description:
// "protocol.js" nooxy service protocol implementation of "Cluster"
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const ALLOWED_TIME_OFFSET = 500; // ms

const SNTP_OPTIONS = {
  host: 'pool.ntp.org',  // Defaults to pool.ntp.org
  port: 123,                      // Defaults to 123 (NTP)
  resolveReference: true,         // Default to false (not resolving)
  timeout: 1000                   // Defaults to zero (no timeout)
};

module.exports = function() {
  this.name = 'NoService Cluster';
  this.version = '0.0.0';
  this.noservice = "0.5.6";
  this.allow_older_noservice = false;
  this.dependencies = ['sntp'];

  this.plugin = (noservice_coregateway, noservice_isInitialized, deploy_settings, noservice_constants, verbose, next)=> {
    verbose('Cluster', 'Loading cluster plugin...');

    const Sntp = require('sntp');

    let exec = async ()=> {
      try {
        const time = await Sntp.time(SNTP_OPTIONS);
        verbose('Cluster', 'Local clock is off by: ' + time.t + ' milliseconds');
        if(time.t>ALLOWED_TIME_OFFSET) {
          next(true);
        }
        else {
          noservice_coregateway.Router.addProtocol(require('./protocol'));
          next(false);
        }
      }
      catch (err) {
        verbose('Cluster', 'Failed: ' + err.message);
        next(true);
      }
    };
    exec();
  };
}
