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

const Utils = require('../../../../library').Utilities;
const API = require('./api');
const Buf = require('../../../../buffer');


function UnixSocketAPI() {
  let _unix_sock_server;
  let _const_path;
  let _unix_socket_path;
  let _close_worker_timeout = 3000;
  let _clear_obj_garbage_timeout = 1000*60*10;
  let _worker_clients = {};

  let API;


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

    this._onError = (err)=> {
      if(_on_callbacks['error'])
        _on_callbacks['error'](err);
    };

    this.send = (blob, callback)=> {
      sock.write(Buf.concat([Buf.encode(('0000000000000000'+blob.length).slice(-16)), blob]));
    }

    this.on = (eventname, callback)=> {
      _on_callbacks[eventname] = callback;
    };

    this.close = ()=> {
      sock.destroy();
    };
  }

  function PythonWorkerClient(_manifest, path) {
    let _serviceapi;
    let _child;
    let _api_sock;
    let _InfoRq = {};
    let _init_callback;
    let _launch_callback;
    let _close_callback;
    let _child_alive = false;
    let _init = false;
    let _service_name = _manifest.name;

    let _emitChildMessage = (type, blob)=> {
      if(blob) {
        let t = Buf.alloc(1, type);
        _api_sock.send(Buf.concat([t, blob]));
      }
      else {
        let t = Buf.alloc(1, type);
        _api_sock.send(t);
      }
    };

    this.getCBOCount = (callback)=> {
      if(_child_alive&&_child) {
        let _rqid = Utils.generateUniqueId();
        _InfoRq[_rqid] = callback;
        _emitChildMessage(4, Buf.encode(JSON.stringify({i: _rqid})));
      }
      else {
        callback(new Error("Child is not alive."));
      }
    };

    this.getMemoryUsage = (callback)=> {
      if(_child_alive&&_child) {
        let _rqid = Utils.generateUniqueId();
        _InfoRq[_rqid] = callback;
        _emitChildMessage(5, Buf.encode(JSON.stringify({i: _rqid})));
      }
      else {
        callback(new Error("Child is not alive."));
      }
    }

    this.emitChildClose = ()=> {
      if(_child_alive&&_child&&_api_sock)
        _emitChildMessage(99);
    }

    this.destroyChildCallback = (id)=> {
       if(_child_alive&&_child&&_api_sock)
         _emitChildMessage(3, Buf.encode(JSON.stringify({i: id})));
    }

    this.emitChildCallback = ([obj_id, path], argsblob) => {
      let _data = JSON.stringify([obj_id, path]);
      try {
        if(_child_alive&&_child&&_api_sock)
           _emitChildMessage(2, Buf.concat([Buf.alloc(1, _data.length), Buf.encode(_data), argsblob]));
      }
      catch(err) {
        Utils.TagLog('*ERR*' , 'Occured error on "'+_service_name+'".');
        console.log(err);
      }
    }

    this.onMessage = (type, blob)=>{
      if(type === 0) {
        _emitChildMessage(0, Buf.encode(JSON.stringify({p: path, a: _serviceapi.returnAPITree(), c: _close_worker_timeout, g: _clear_obj_garbage_timeout, cpath: _const_path})));
      }
      else if(type === 1) {
        _init_callback(false);
      }
      else if(type === 2) {
        _launch_callback(false);
      }
      else if(type === 3) {
        _close_callback(false);
        _child.kill();
        _child = null;
        _api_sock.close();
        _api_sock = null;
        _child_alive = false;
      }
      else if(type === 4) {
        // python version needs to check is it a database api!
        try {
          let APIpath = JSON.parse(Buf.decode(blob.slice(1, 1+blob[0])));
          _serviceapi.emitAPIRq(APIpath, blob.slice(1+blob[0]));
        }
        catch (e) {
          console.log(blob[0]);
          console.log(Buf.decode(blob.slice(1, 1+blob[0])));
          let APIpath = JSON.parse(Buf.decode(blob.slice(1, 1+blob[0])));
          let _data = {
            d:{
              api_path: APIpath,
              args_string: blob.slice(1+blob[0]).toString()
            },
            e: e.stack
          };
          _emitChildMessage(98, Buf.encode(JSON.stringify(_data)));
        }
      }
      else if(type === 5) {
        try {
          let cbtree = JSON.parse(Buf.decode(blob.slice(1, 1+blob[0])));
          _serviceapi.emitCallbackRq(cbtree, blob.slice(1+blob[0]));
        }
        catch (e) {
          let message = JSON.parse(Buf.decode(blob));
          let _data = {
            d:{
              obj_path: message.p,
              call_args: message.a,
              args_obj_tree: message.o
            },
            e: e.stack
          };
          _emitChildMessage(98, Buf.encode(JSON.stringify(_data)));
        }
      }
      else if(type === 6) {
        _InfoRq[message.i](false, {daemon: _serviceapi.returnLCBOCount(), client: message.c})
        delete _InfoRq[message.i];
      }
      else if(type === 7) {
        let message = JSON.parse(Buf.decode(blob));
        _InfoRq[message.i](false, message.c)
        delete _InfoRq[message.i];
      }
      else if(type === 96){
        let message = JSON.parse(Buf.decode(blob));
        _close_callback(new Error('Worker closing error:\n'+message.e));
        _child.kill();
        _child = null;
        _api_sock.close();
        _api_sock = null;
        _child_alive = false;
      }
      else if(type === 97){
        // _launch_callback(new Error('Worker runtime error:\n'+message.e));
      }
      else if(type === 98){
        let message = JSON.parse(Buf.decode(blob));
        _launch_callback(new Error('"'+_service_name+'" worker launching error:\n'+message.e));
      }
      else if(type === 99){
        let message = JSON.parse(Buf.decode(blob));
        _init_callback(new Error('"'+_service_name+'" worker initializing error:\n'+message.e));
      }
    };

    this.pairSocket = (APIsock)=> {
      _api_sock = APIsock;
      APIsock.on('message', (message)=> {
        let type = message[0];
        this.onMessage(type, message.slice(1));
      });
      APIsock.on('error', ()=> {
        _child.kill();
        _child = null;
        _child_alive = false;
        if(_close_callback) {
          _close_callback();
        }
      });
      this.onMessage(0);
    };

    this.launch = (launch_callback)=> {
      _launch_callback = launch_callback;
      _emitChildMessage(1);
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

    this.createServiceAPI = (_service_socket, callback)=> {
      API.createServiceAPI(_service_socket, _manifest, (err, api)=> {
        _serviceapi = api;
        _serviceapi.setRemoteCallbackEmitter(this.emitChildCallback);
        _serviceapi.setRemoteCallbakcDestroyer(this.destroyChildCallback);
        callback(false);
      })
    };

    this.close = (callback)=> {
      if(!_child_alive) {
        callback();
      }
      else {
        _close_callback = callback;
        _serviceapi.reset();
        this.emitChildClose();
      }
    };
  };

  function NodeWorkerClient(_manifest, path) {
    let _serviceapi;
    let _child;
    let _InfoRq = {};
    let _init_callback;
    let _launch_callback;
    let _close_callback;
    let _child_alive = false;
    let _init = false;
    let _service_name = _manifest.name;
    let _api_sock;

    let _emitChildMessage = (type, blob)=> {
      if(blob) {
        let t = Buf.alloc(1, type);
        _api_sock.send(Buf.concat([t, blob]));
      }
      else {
        let t = Buf.alloc(1, type);
        _api_sock.send(t);
      }
    };

    this.getCBOCount = (callback)=> {
      if(_child_alive&&_child) {
        let _rqid = Utils.generateUniqueId();
        _InfoRq[_rqid] = callback;
        _emitChildMessage(4, Buf.encode(JSON.stringify({i: _rqid})));
      }
      else {
        callback(new Error("Child is not alive."));
      }
    };

    this.getMemoryUsage = (callback)=> {
      if(_child_alive&&_child) {
        let _rqid = Utils.generateUniqueId();
        _InfoRq[_rqid] = callback;
        _emitChildMessage(5, Buf.encode(JSON.stringify({i: _rqid})));
      }
      else {
        callback(new Error("Child is not alive."));
      }
    }

    this.emitChildClose = ()=> {
      if(_child_alive&&_child)
        _emitChildMessage(99);
    }

    this.destroyChildCallback = (id)=> {
      if(_child_alive&&_child)
        _emitChildMessage(3, Buf.encode(JSON.stringify({i: id})));
    }

    this.emitChildCallback = ([obj_id, path], argsblob) => {
      let _data = JSON.stringify([obj_id, path]);
      try {
        if(_child_alive&&_api_sock)
          _emitChildMessage(2, Buf.concat([Buf.alloc(1, _data.length), Buf.encode(_data), argsblob]));
      }
      catch(err) {
        Utils.TagLog('*ERR*' , 'Occured error on "'+_service_name+'".');
        console.log(err);
      }
    }

    this.onMessage = (type, blob)=> {
      if(type === 0) {
        _emitChildMessage(0, Buf.encode(JSON.stringify({p: path, a: _serviceapi.returnAPITree(), c: _close_worker_timeout, g: _clear_obj_garbage_timeout, cpath: _const_path})));
      }
      else if(type === 1) {
        _init_callback(false);
      }
      else if(type === 2) {
        _launch_callback(false);
      }
      else if(type === 3) {
        _close_callback(false);
        _child.kill();
        _child = null;
        _api_sock.close();
        _api_sock = null;
        _child_alive = false;
      }
      else if(type === 4) {
        try {
          let APIpath = JSON.parse(Buf.decode(blob.slice(1, 1+blob[0])));
          _serviceapi.emitAPIRq(APIpath, blob.slice(1+blob[0]));
        }
        catch (e) {
          console.log(blob[0]);
          console.log(Buf.decode(blob.slice(1, 1+blob[0])));
          let APIpath = JSON.parse(Buf.decode(blob.slice(1, 1+blob[0])));
          let _data = {
            d:{
              api_path: APIpath,
              args_string: blob.slice(1+blob[0]).toString()
            },
            e: e.stack
          };
          _emitChildMessage(98, Buf.encode(JSON.stringify(_data)));
        }
      }
      else if(type === 5) {
        try {
          let cbtree = JSON.parse(Buf.decode(blob.slice(1, 1+blob[0])));
          _serviceapi.emitCallbackRq(cbtree, blob.slice(1+blob[0]));
        }
        catch (e) {
          let message = JSON.parse(Buf.decode(blob));
          let _data = {
            d:{
              obj_path: message.p,
              call_args: message.a,
              args_obj_tree: message.o
            },
            e: e.stack
          };
          _emitChildMessage(98, Buf.encode(JSON.stringify(_data)));
        }
      }
      else if(type === 6) {
        let message = JSON.parse(Buf.decode(blob));
        _InfoRq[message.i](false, {daemon: _serviceapi.returnLCBOCount(), client: message.c})
        delete _InfoRq[message.i];
      }
      else if(type === 7) {
        let message = JSON.parse(Buf.decode(blob));
        _InfoRq[message.i](false, message.c)
        delete _InfoRq[message.i];
      }
      else if(type === 96){
        let message = JSON.parse(Buf.decode(blob));
        _close_callback(new Error('Worker closing error:\n'+message.e));
        _child.kill();
        _child = null;
        _child_alive = false;
      }

      else if(type === 97){
        // _launch_callback(new Error('Worker runtime error:\n'+message.e));
      }

      else if(type === 98){
        let message = JSON.parse(Buf.decode(blob));
        _launch_callback(new Error('"'+_service_name+'" worker launching error:\n'+message.e));
      }
      else if(type === 99){
        let message = JSON.parse(Buf.decode(blob));
        _init_callback(new Error('"'+_service_name+'" worker initializing error:\n'+message.e));
      }
    };

    this.launch = (launch_callback)=> {
      _launch_callback = launch_callback;
      _emitChildMessage(1);
    };

    this.init = (init_callback)=> {
      _init_callback = init_callback;
      _child = spawn('node', [require.resolve('../api_client/node/worker'), _unix_socket_path, _service_name], {encoding: 'binary', stdio: [process.stdin, process.stdout, process.stderr, 'ipc']});
      _child.on('close', (code)=> {
        if(code)
          _init_callback(new Error('NodeWorkerClient of "'+_service_name+'" occured error.'));
      });
      _child_alive = true;
    };

    this.pairSocket = (APIsock)=> {
      _api_sock = APIsock;
      APIsock.on('message', (message)=> {
        let type = message[0];
        this.onMessage(type, message.slice(1));
      });
      APIsock.on('error', ()=> {
        _child.kill();
        _child = null;
        _child_alive = false;
        if(_close_callback) {
          _close_callback();
        }
      });
      this.onMessage(0);
    };

    this.createServiceAPI = (_service_socket, callback)=> {
      API.createServiceAPI(_service_socket, _manifest, (err, api)=> {
        _serviceapi = api;
        _serviceapi.setRemoteCallbackEmitter(this.emitChildCallback);
        _serviceapi.setRemoteCallbakcDestroyer(this.destroyChildCallback);
        _serviceapi.setRemoteCallbakcDestroyer(this.destroyChildCallback);
        callback(false);
      })
    };

    this.close = (callback)=> {
      if(!_child_alive) {
        callback();
      }
      else {
        _close_callback = callback;
        _serviceapi.reset();
        this.emitChildClose();
      }
    };
  };

  this.generateWorker = (manifest, path, lang)=> {
    if(lang === 'python') {
      _worker_clients[manifest.name] = new PythonWorkerClient(manifest, path);
      return _worker_clients[manifest.name];
    }
    else if(!lang || lang === 'js' || lang === 'javascript') {
      _worker_clients[manifest.name] = new NodeWorkerClient(manifest, path);
      return _worker_clients[manifest.name];
    }
    else {
      return null;
    }
  };

  this.start = (callback)=> {
    try {
      fs.unlinkSync(_unix_socket_path);
    } catch(e) {}

    _unix_sock_server = Net.createServer((socket)=>{
      let _api_sock = new APISocket(socket);
      let _onMessege = (message)=> {
        let type = message[0];
        if(type === 0) {
          let msg = JSON.parse(message.slice(1).toString());
          _worker_clients[msg.s].pairSocket(_api_sock);
        }
        else {
          _api_sock._onMessege(message);
        }
      };

      let chunks_size;
      let message;
      let resume_data;

      socket.on('data', (data)=> {
        if(resume_data) {
          data = Buf.concat([resume_data, data]);
          // console.log('resume');
        };

        while(data.length) {
          // console.log('>', !message, data.length, chunks_size);
          if(!message) {
            chunks_size = parseInt(data.slice(0, 16).toString());
            message = data.slice(16, 16+chunks_size);
            data = data.slice(16+chunks_size);
            if(message.length === chunks_size) {
              _onMessege(message);
              chunks_size = null;
              message = null;
            }
            // in case chunks_size data is not complete
            if(data.length < 16) {
              resume_data = data;
              break;
            }
          }
          else if(data.length > chunks_size - message.length) {
            let left_size = chunks_size - message.length;
            // console.log('>', !message, data.length, chunks_size, message.length);
            message = Buf.concat([message, data.slice(0, left_size)]);
            data = data.slice(left_size);
            // console.log('>', !message, data.length, chunks_size, message.length);
            if(message.length === chunks_size) {
              _onMessege(message);
              chunks_size = null;
              message = null;
            }
            // in case chunks_size data is not complete
            if(data.length < 16) {
              resume_data = data;
              break;
            }
          }
          else {
            message = Buf.concat([message, data]);
            data = [];
            if(message.length === chunks_size) {
              _onMessege(message);
              chunks_size = null;
              message = null;
              resume_data = null;
            }
          }
        }
      });

      socket.on('error', (error) => {
        console.log(error);
        socket.destroy();
        _api_sock._onError();
      });

      socket.on('close', ()=> {
        _api_sock._onClose();
      });

    }).listen(_unix_socket_path, callback);
  };

  this.importAPI = (api)=> {
    API = api;
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
