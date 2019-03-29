// NoService/NoService/service/service/worker/api_daemon/unix_socket.js
// Description:
// "unix_socket.js" is a service worker daemon for NOOXY service framework. With workers the
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

const Net = require('net');
const {fork, spawn} = require('child_process');
const fs = require('fs');


function UnixSocketAPI() {
  let _unix_sock_server;
  let _const_path;
  let _unix_socket_path;
  let _close_worker_timeout = 3000;
  let _clear_obj_garbage_timeout = 1000*60*10;
  let _worker_clients = {};


  function APISocket(sock) {
    let _on_callbacks = {};

    this._onClose = ()=> {
      if(_on_callbacks['close'])
        _on_callbacks['close'](message);
    };

    this._onMessege = (message)=> {
      if(_on_callbacks['message'])
        _on_callbacks['message'](message);
    };

    this.send = (data, callback)=> {
      if(typeof(data) != 'string') {
        data = JSON.stringify(data);
      }
      sock.write(('0000000000000000'+Buffer.from(data).length).slice(-16)+data);
    }

    this.on = (eventname, callback)=> {
      _on_callbacks[eventname] = callback;
    };

    this.close = ()=> {
      sock.destroy();
    };
  }

  function PythonWorkerClient(_service_name, path) {
    let _serviceapi;
    let _child;
    let _api_sock;
    let _InfoRq = {};
    let _init_callback;
    let _launch_callback;
    let _close_callback;
    let _child_alive = false;
    let _init = false;

    this.getCBOCount = (callback)=> {
      if(_child_alive&&_child) {
        let _rqid = Utils.generateUniqueId();
        _InfoRq[_rqid] = callback;
        _api_sock.send({t: 4, i: _rqid});
      }
      else {
        callback(new Error("Child is not alive."));
      }
    };

    this.getMemoryUsage = (callback)=> {
      if(_child_alive&&_child) {
        let _rqid = Utils.generateUniqueId();
        _InfoRq[_rqid] = callback;
        _api_sock.send({t: 5, i: _rqid});
      }
      else {
        callback(new Error("Child is not alive."));
      }
    }

    this.emitChildClose = ()=> {
      if(_child_alive&&_child&&_api_sock)
        _api_sock.send({t:99});
    }

    this.emitRemoteUnbind = (id)=> {
       if(_child_alive&&_child&&_api_sock)
         _api_sock.send({t:3, i: id}, (err)=> {
           if (err) {
             Utils.TagLog('*ERR*' , 'Occured error on sending data to child "'+_service_name+'".');
             console.log(err);
           }
        });
    }

    this.emitChildCallback = ([obj_id, path], args, argsobj) => {
      let _data = {
        t: 2,
        p: [obj_id, path],
        a: args,
        o: argsobj
      }

      try {
        if(_child_alive&&_child&&_api_sock)
           _api_sock.send(_data, (err)=> {
             if (err) {
               Utils.TagLog('*ERR*' , 'Occured error on sending data to child "'+_service_name+'".');
               console.log(err);
             }
          });
      }
      catch(err) {
        Utils.TagLog('*ERR*' , 'Occured error on "'+_service_name+'".');
        console.log(err);
      }
    }

    this.onMessage = (message)=>{
      if(message.t === 0) {
        _api_sock.send({t:0, p: path, a: _serviceapi.returnAPITree(), c: _close_worker_timeout, g: _clear_obj_garbage_timeout, cpath: _const_path});
      }
      else if(message.t === 1) {
        _init_callback(false);
      }
      else if(message.t === 2) {
        _launch_callback(false);
      }
      else if(message.t === 3) {
        _close_callback(false);
        _child.kill();
        _child = null;
        _api_sock.close();
        _api_sock = null;
        _child_alive = false;
      }
      else if(message.t === 4) {
        // python version needs to check is it a database api!
        try {
          _serviceapi.emitAPIRq(message.p, message.a, message.o);
        }
        catch (e) {
           _api_sock.send({
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
      else if(message.t === 5) {
        try {
          _serviceapi.emitCallbackRq(message.p, message.a, message.o);
        }
        catch (e) {
           _api_sock.send({
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
      else if(message.t === 6) {
        _InfoRq[message.i](false, {daemon: _serviceapi.returnLCBOCount(), client: message.c})
        delete _InfoRq[message.i];
      }
      else if(message.t === 7) {
        _InfoRq[message.i](false, message.c)
        delete _InfoRq[message.i];
      }
      else if(message.t === 96){
        _close_callback(new Error('Worker closing error:\n'+message.e));
        _child.kill();
        _child = null;
        _api_sock.close();
        _api_sock = null;
        _child_alive = false;
      }
      else if(message.t === 97){
        // _launch_callback(new Error('Worker runtime error:\n'+message.e));
      }
      else if(message.t === 98){
        _launch_callback(new Error('"'+_service_name+'" worker launching error:\n'+message.e));
      }
      else if(message.t === 99){
        _init_callback(new Error('"'+_service_name+'" worker initializing error:\n'+message.e));
      }
    };

    this.pairSocket = (APIsock)=> {
      _api_sock = APIsock;
      APIsock.on('message', (message)=> {
        this.onMessage(message);
      });
      this.onMessage({t: 0});
    };

    this.launch = (launch_callback)=> {
      _launch_callback = launch_callback;
      _api_sock.send({t:1});
    };

    this.init = (init_callback)=> {
      _init_callback = init_callback;
      _child = spawn('python3', [require.resolve('../api_client/python/worker.py'), _unix_socket_path, _service_name], {stdio: [process.stdin, process.stdout, process.stderr, 'ipc']});
      _child.on('close', (code)=> {
        if(code)
          _init_callback(new Error('PythonWorkerClient of "'+_service_name+'" occured error.'));
      });
      _child_alive = true;
    };

    this.relaunch = (relaunch_callback)=> {
      Utils.TagLog('Workerd', 'Relaunching service "'+_service_name+'"');
      this.close((err)=> {
        if(err) {
          relaunch_callback(err);
        }
        else {
          setTimeout(()=>{
            this.init((err)=> {
              if(err) {
                relaunch_callback(err);
              }
              else {
                this.launch(relaunch_callback);
              }
            });
          }, _close_worker_timeout+10);
        }
      });
    };

    this.importAPI = (api) => {
      _serviceapi = api;
      _serviceapi.setRemoteCallbackEmitter(this.emitChildCallback);
      _serviceapi.setRemoteUnbindEmitter(this.emitRemoteUnbind);
    };

    this.close = (callback)=> {
      _close_callback = callback;
      _serviceapi.reset();
      this.emitChildClose();
    };
  };

  this.generateWorker = (servicename, path, lang)=> {
    if(lang === 'python') {
      _worker_clients[servicename] = new PythonWorkerClient(servicename, path);
      return _worker_clients[servicename];
    }
    else {
      return null;
    }
  };

  this.start = ()=> {
    try {
      fs.unlinkSync(_unix_socket_path);
    } catch(e) {}

    _unix_sock_server = Net.createServer((socket)=>{
      let _api_sock = new APISocket(socket);
      socket.on('data', (data)=> {
        while(data.length) {
          let chunks_size = parseInt(data.slice(0, 16).toString());
          let msg = JSON.parse(data.slice(16, 16+chunks_size).toString());
          if(msg.t === 0) {
            _worker_clients[msg.s].pairSocket(_api_sock);
          }
          else {
            _api_sock._onMessege(msg);
          }
          data = data.slice(16+chunks_size);
        }
      });

      socket.on('error', (error) => {
        Utils.TagLog('*ERR*', 'An error occured on worker daemon module.');
        Utils.TagLog('*ERR*', error);
        socket.destroy();
        _api_sock._onClose();
      });

      socket.on('close', ()=> {
        _api_sock._onClose();
      });

    }).listen(_unix_socket_path);
  };

  this.setClearGarbageTimeout = (timeout)=> {
    if(timeout)
      _clear_obj_garbage_timeout = timeout;
  }

  this.setCloseTimeout = (timeout)=> {
    _close_worker_timeout = timeout;
  }

  this.setConstantsPath = (path)=> {_const_path = path};

  this.setUnixSocketPath = (path)=> {_unix_socket_path = path};

  this.close = ()=> {
    _unix_sock_server.close();
    try {
      fs.unlinkSync(_unix_socket_path);
    } catch(e) {}
  };
}

module.exports = UnixSocketAPI;
