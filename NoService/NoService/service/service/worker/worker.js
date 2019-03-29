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

const {fork, spawn} = require('child_process');
const Utils = require('../../library').Utilities;
const APIDaemon = require('./api_daemon');
const Net = require('net');
const fs = require('fs');

function WorkerDaemon() {
  let _worker_clients = {};
  let _close_worker_timeout = 3000;
  let _clear_obj_garbage_timeout = 1000*60*10;
  let _unix_socket_path;
  let _const_path;
  let _unix_sock_server;
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

  this.importCloseTimeout = (timeout)=> {
    _close_worker_timeout = timeout;
  }

  this.importClearGarbageTimeout = (timeout)=> {
    if(timeout)
      _clear_obj_garbage_timeout = timeout;
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

  this.setConstantsPath = (path)=> {_const_path = path};

  this.setUnixSocketPath = (path)=> {_unix_socket_path = path};

  this.start = ()=> {
    _node_daemon.start();
    _unix_daemon.start();
  };

  this.close = ()=> {
    _unix_sock_server.close();
    try {
      fs.unlinkSync(_unix_socket_path);
    } catch(e) {}
  }
}

module.exports = WorkerDaemon;
