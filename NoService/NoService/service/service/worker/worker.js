// NoService/NoService/service/service/worker.js
// Description:
// "worker.js" is a service worker daemon for NOOXY service framework. With workers the
// services is multithreaded.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

'use strict';

const Utils = require('../../../library').Utilities;
const APIDaemon = require('./api_daemon');

function WorkerDaemon() {
  let _worker_clients = {};
  // let _services_relaunch_cycle = 1000*60*60*24;

  let _node_daemon = new (APIDaemon.Node)();
  let _unix_daemon = new (APIDaemon.UnixSocket)();

  this.getCBOCount = (callback)=> {
    let _left = Object.keys(_worker_clients).length;
    let _dict = {};
    for(let key in _worker_clients) {
      _worker_clients[key].getCBOCount((err, count)=> {
        _dict[key] = count;
        _left = _left-1;
        if(!_left) {
          callback(false, _dict);
        }
      });
    }
  };

  this.getMemoryUsage = (callback)=> {
    let _left = Object.keys(_worker_clients).length;
    let _dict = {};
    for(let key in _worker_clients) {
      _worker_clients[key].getMemoryUsage((err, usage)=> {
        _dict[key] = usage;
        _left = _left-1;
        if(!_left) {
          callback(false, _dict);
        }
      });
    }
  }

  this.generateWorker = (manifest, path, lang) => {
    if(!lang || lang === 'js' || lang === 'javascript') {
      _worker_clients[manifest.name] = _node_daemon.generateWorker(manifest, path);
      return _worker_clients[manifest.name];
    }
    else {
      _worker_clients[manifest.name] =  _unix_daemon.generateWorker(manifest, path, lang);
      return _worker_clients[manifest.name];
    }
  }

  this.importAPI = (serviceapi_module) => {
    _node_daemon.importAPI(serviceapi_module);
    _unix_daemon.importAPI(serviceapi_module);
  };

  this.setClearGarbageTimeout = (timeout)=> {
    _node_daemon.setClearGarbageTimeout(timeout);
    _unix_daemon.setClearGarbageTimeout(timeout);
  }

  this.setCloseTimeout = (timeout)=> {
    _node_daemon.setCloseTimeout(timeout);
    _unix_daemon.setCloseTimeout(timeout);
  }

  this.setConstantsPath = (path)=> {
    _node_daemon.setConstantsPath(path);
    _unix_daemon.setConstantsPath(path);
  };

  this.setUnixSocketPath = (path)=> {
    _unix_daemon.setUnixSocketPath(path);
  };

  this.start = ()=> {
    _node_daemon.start();
    _unix_daemon.start();
  };

  this.close = ()=> {
    _node_daemon.close();
    _unix_daemon.close();
  }
}

module.exports = WorkerDaemon;
