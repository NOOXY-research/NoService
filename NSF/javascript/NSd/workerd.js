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
// 3 returnLCBOcount
// 4 returnMemoryUsage

// memory leak on ActivitySocket!!!

'use strict';

const {fork} = require('child_process');
const Utils = require('./utilities');

function WorkerDaemon() {
  let _worker_clients = {};
  let _close_worker_timeout = 3000;
  let _clear_obj_garbage_timeout = 1000*60*10;
  // let _services_relaunch_cycle = 1000*60*60*24;
  let _serviceapi_module;

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

  function WorkerClient(path) {
    let _serviceapi = null;
    let _child = null;
    let _service_name =  /.*\/([^\/]*)\/entry/g.exec(path)[1];
    let _InfoRq = {};
    _worker_clients[_service_name] = this;

    process.on('exit', ()=> {
      this.emitChildClose();
    });

    this.getCBOCount = (callback)=> {
      let _rqid = Utils.generateUniqueID();
      _InfoRq[_rqid] = callback;
      _child.send({t: 3, i: _rqid});
    };

    this.getMemoryUsage = (callback)=> {
      let _rqid = Utils.generateUniqueID();
      _InfoRq[_rqid] = callback;
      _child.send({t: 4, i: _rqid});
    }

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
        _child.send({t:0, p: path, a: _serviceapi.returnAPITree(), c: _close_worker_timeout, g: _clear_obj_garbage_timeout});
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
      else if(message.t == 3) {
        _InfoRq[message.i](false, {daemon: _serviceapi.returnLCBOCount(), client: message.c})
        delete _InfoRq[message.i];
      }
      else if(message.t == 4) {
        _InfoRq[message.i](false, message.c)
        delete _InfoRq[message.i];
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
      Utils.tagLog('Workerd', 'Relaunching service "'+_service_name+'"');
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
      _serviceapi.reset();
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
