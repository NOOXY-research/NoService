// NoService/NoService/service/service/worker.js
// Description:
// "worker.js" is a service worker daemon for NOOXY service framework. With workers the
// services is multithreaded.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

// NOOXY Service WorkerClient protocol
// message.t
// 0 worker established {t}
// 1 successfully inited
// 2 successfully launched
// 3 successfully closed
// 4 api call {t, p, a: arguments, o:{arg_index, [obj_id, callback_tree]}}
// 5 accessobj {t, p, a: arguments, o:{arg_index, [obj_id, callback_tree]}}
// 6 returnLCBOcount
// 7 returnMemoryUsage

// 96 close error
// 97 runtime error
// 98 launch error
// 99 init error

'use strict';

const Utils = require('../../../library').Utilities;
const APIDaemon = require('./api_daemon');

function WorkerDaemon() {
  let _worker_clients = {};
  // let _services_relaunch_cycle = 1000*60*60*24;
  let _serviceapi_module;

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

  this.generateWorker = (servicename, path, lang) => {
    if(!lang || lang === 'js' || lang === 'javascript') {
      _worker_clients[servicename] = _node_daemon.generateWorker(servicename, path);
      return _worker_clients[servicename];
    }
    else {
      _worker_clients[servicename] =  _unix_daemon.generateWorker(servicename, path, lang);
      return _worker_clients[servicename];
    }
  }

  this.importAPI = (serviceapi_module) => {
    _serviceapi_module = serviceapi_module;
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
