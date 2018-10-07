// NSF/NSd/workerd.js
// Description:
// "workerd.js" is a service worker daemon for NOOXY service framework. With workers the
// services is multithreaded.
// Copyright 2018 NOOXY. All Rights Reserved.

// Client message protocol
// message.t
// 0 worker established {t}
// 1 api call {t, p, a: arguments, c:{arg_index, callback_id}}
// 2 accessobj {t, p, a: arguments, c:{arg_index, callback_id}}

'use strict';

const {fork} = require('child_process');

function WorkerDaemon() {
  let _worker_clients = [];
  let _local_obj_callbacks = {};
  let _close_worker_timeout = 3000;

  const generateAPITree = (api_raw) => {
    let deeper = (subapi)=> {
      let api_tree = {};
      if(typeof(subapi) == 'object') {
        for(let key in subapi) {
          api_tree[key] = deeper(subapi[key]);
        }
      }
      else {
        api_tree = null;
      }
      return api_tree;
    }

    return deeper(api_raw)
  }

  function WorkerClient(path) {
    let _serviceapi = null;
    let child = null;

    this.callChildCallback = (callback_id, args) => {
      console.log(callback_id);
      let _data = {
        t: 1
        o: {}
      }

      let createLocalCallback = (callback)=> {
        let _Id = Utils.generateUniqueID();
        _local_callbacks[_Id] = callback;
        return _Id;
      };

      for(let i in args) {
        if(typeof(args[i])=='function') {
          _data.o[i] = createLocalCallback(args[i]);
        }
      }
      child.send({t:1, p: args, i: callback_id});
    }

    this.callAPI = (APIpath, args, callbacks)=> {
      let getTargetAPI = (path, subapi)=> {
        if(path.length) {
          return getTargetAPI(path.slice(1), subapi[path[0]]);
        }
        else {
          return subapi;
        }
      }

      for(let i in callbacks) {
        args[i] = (...args2)=> {
          this.callChildCallback(callbacks[i], args2);
        }
      }
      let f = getTargetAPI(APIpath, _serviceapi);
      f.apply(null, args);
    }

    this.onMessage = (message)=>{
      if(message.t == 0) {
        child.send({t:0, p: path, a: generateAPITree(_serviceapi)});
      }
      else if(message.t == 1) {
        this.callAPI(message.p, message.a, message.c);
      }
    };

    this.launch = ()=> {
      child = fork(require.resolve('./worker.js'));
      child.on('message', message => {
        this.onMessage(message);
      });
    };

    this.relaunch = ()=> {

    };

    this.importAPI = (api) => {
      _serviceapi = api;
    };

    this.close = ()=> {

    };
  };

  this.returnWorker = (path) => {
    return new WorkerClient(path);
  }
}

module.exports = WorkerDaemon;
