// NSF/NSd/workerd.js
// Description:
// "workerd.js" is a service worker daemon for NOOXY service framework. With workers the
// services is multithreaded.
// Copyright 2018 NOOXY. All Rights Reserved.

// NOOXY Service WorkerClient protocol
// message.t
// 0 worker established {t}
// 1 api call {t, p, a: arguments, o:{arg_index, [obj_id, callback_tree]}}
// 2 accessobj {t, p, a: arguments, o:{arg_index, [obj_id, callback_tree]}}


// memory leak on ActivitySocket!!!

'use strict';

const {fork} = require('child_process');
const Utils = require('./utilities');

function WorkerDaemon() {
  let _worker_clients = {};
  let _close_worker_timeout = 3000;
  // let _services_relaunch_cycle = 1000*60*60*24;
  let _serviceapi_module;

  this.getCBOCount = (callback)=> {

  };

  this.importCloseTimeout = (timeout)=> {
    _close_worker_timeout = timeout;
  }

  function WorkerClient(path) {
    let _serviceapi = null;
    let _child = null;
    let _service_name =  /.*\/([^\/]*)\/entry/g.exec(path)[1];
    _worker_clients[path] = this;

    process.on('exit', ()=> {
      this.emitChildClose();
    });

    this.emitChildClose = ()=> {
      _child.send({t:99});
    }

    this.emitRemoteUnbind = (id)=> {
      _child.send({t:2, i: id});
    }

    this.emitChildCallback = ([obj_id, path], args, argsobj) => {
      let _data = {
        t: 1,
        p: [obj_id, path],
        a: args,
        o: argsobj
      }
      _child.send(_data);
    }

    this.onMessage = (message)=>{
      if(message.t == 0) {
        _child.send({t:0, p: path, a: _serviceapi.returnAPITree(), c: _close_worker_timeout});
      }
      else if(message.t == 1) {
        try {
          _serviceapi.emitAPIRq(message.p, message.a, message.o);
        }
        catch (e) {
          _child.send({
            t:98,
            d:{
              api_path: message.p,
              call_args: message.a,
              args_obj_tree: message.o
            },
            e: e.stack
          });
        }
      }
      else if(message.t == 2) {
        try {
          _serviceapi.emitCallbackRq(message.p, message.a, message.o);
        }
        catch (e) {
          _child.send({
            t:98,
            d:{
              obj_path: message.p,
              call_args: message.a,
              args_obj_tree: message.o
            },
            e: e.stack
          });
        }
      }
    };

    this.launch = ()=> {
      _child = fork(require.resolve('./worker.js'), {stdio: [process.stdin, process.stdout, process.stderr, 'ipc']});
      _child.on('message', message => {
        this.onMessage(message);
      });
    };

    this.relaunch = ()=> {
      this.close()
      Utils.tagLog('Daemon', 'Relaunching service "'+_service_name+'"');
      setTimeout(()=>{
        this.launch();
      }, _close_worker_timeout+10);
    };

    this.importAPI = (api) => {
      _serviceapi = api;
      _serviceapi.setRemoteCallbackEmitter(this.emitChildCallback);
      _serviceapi.setRemoteUnbindEmitter(this.emitRemoteUnbind);
    };

    this.close = ()=> {
      this.emitChildClose();
    };
  };

  this.returnWorker = (path) => {
    return new WorkerClient(path);
  }

  this.importAPI = (serviceapi_module) => {
    _serviceapi_module = serviceapi_module;
  };

  this.close = ()=> {

  }
}

module.exports = WorkerDaemon;
