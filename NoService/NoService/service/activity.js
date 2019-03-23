// NoService/NoService/service/serviceservices.js
// Description:
// "services.js" provide functions of services stuff.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const SocketPair = require('./socketpair');
const Utils = require('../library').Utilities;

function Activity() {
  let ActivitySocketDestroyTimeout = 1000;
  let _ASockets = {};
  let _emitRouter;
  let _admin_name = 'admin';
  let _daemon_auth_key;
  let _debug = false;
  let _ActivityRsCEcallbacks = {};

  let _unbindActivitySocketList = (_entity_id)=> {
    setTimeout(()=>{
      // tell worker abort referance
      if(_ASockets[_entity_id])
        _ASockets[_entity_id].worker_cancel_refer = true;
      delete _ASockets[_entity_id];
    }, ActivitySocketDestroyTimeout);
  };

  // ClientSide
  this.ServiceRsRouter =  (connprofile, data) => {

    let methods = {
      // nooxy service protocol implementation of "Call Service: Vertify Connection"
      VE: (connprofile, data) => {
        if(data.d.s === 'OK') {
          _ASockets[data.d.i].launch();
        }
        else {
          _ASockets[data.d.i]._emitClose();
        }
      },
      // nooxy service protocol implementation of "Call Service: ServiceSocket"
      SS: (connprofile, data) => {

      },
      // nooxy service protocol implementation of "Call Service: JSONfunction"
      JF: (connprofile, data) => {
        if(data.d.s === 'OK') {
          _ASockets[data.d.i].sendJFReturn(false, data.d.t, data.d.r);
        }
        else {
          _ASockets[data.d.i].sendJFReturn(true, data.d.t, data.d.r);
        }
      },
      // nooxy service protocol implementation of "Call Activity: createEntity"
      CE: (connprofile, data) => {
        // tell server finish create
        if(data.d.i != null) {
          // create a description of this service entity.
          _ActivityRsCEcallbacks[data.d.t](connprofile, data);
          let _data = {
            "m": "VE",
            "d": {
              "i": data.d.i,
            }
          };

          _emitRouter(connprofile, 'CS', _data);
        }
        else {
          _ActivityRsCEcallbacks[data.d.t](connprofile, data);
          delete  _ActivityRsCEcallbacks[data.d.t];
          connprofile.closeConnetion();
        }
      }
    }

    // call the callback.
    methods[data.m](connprofile, data);
  };

  this.ActivityRqRouter = (connprofile, data, response_emit) => {

    let methods = {
      // nooxy service protocol implementation of "Call Activity: ActivitySocket"
      AS: () => {
        _ASockets[data.d.i]._emitData(data.d.d);
        let _data = {
          "m": "AS",
          "d": {
            // status
            "i": data.d.i,
            "s": "OK"
          }
        };
        response_emit(connprofile, 'CA', 'rs', _data);
      },
      // nooxy service protocol implementation of "Call Activity: Event"
      EV: () => {
        _ASockets[data.d.i]._emitEvent(data.d.n, data.d.d);
        let _data = {
          "m": "EV",
          "d": {
            // status
            "i": data.d.i,
            "s": "OK"
          }
        };
        response_emit(connprofile, 'CA', 'rs', _data);
      },
      // nooxy service protocol implementation of "Call Activity: Close ActivitySocket"
      CS: () => {
        _ASockets[data.d.i].remoteClosed = true;
        _ASockets[data.d.i].close();
      }
    }
    // call the callback.
    methods[data.m](connprofile, data.d, response_emit);
  }

  this.setEmitRouter = (emitRouter) => {_emitRouter = emitRouter};

  // Service module create activity socket
  this.createActivitySocket = (method, targetip, targetport, service, owner, callback) => {
    let err = false;
    let _data = {
      "m": "CE",
      "d": {
        t: Utils.generateGUID(),
        o: owner,
        m: 'normal',
        s: service,
        od: targetip,
      }
    };

    this.spawnClient(method, targetip, targetport, (err, connprofile) => {
      let _as = new SocketPair.ActivitySocket(connprofile, _emitRouter, _unbindActivitySocketList, _debug);
      _ActivityRsCEcallbacks[_data.d.t] = (connprofile, data) => {
        if(data.d.i) {
          _as.setEntityId(data.d.i);
          connprofile.setBundle('entityId', data.d.i);
          _ASockets[data.d.i] = _as;
          callback(false, _ASockets[data.d.i]);
        }
        else{
          delete  _ASockets[data.d.i];
          callback(new Error('Could not create this entity for some reason.'));
        }

      }
      _emitRouter(connprofile, 'CS', _data);
    });
  };

  this.createAdminDaemonActivitySocket = (method, targetip, targetport, service, callback) => {
    this.createDaemonActivitySocket(method, targetip, targetport, service, _admin_name, callback);
  };

  this.createDaemonActivitySocket = (method, targetip, targetport, service, owner, callback) => {
    let err = false;
    let _data = {
      "m": "CE",
      "d": {
        t: Utils.generateGUID(),
        m: 'daemon',
        k: _daemon_auth_key,
        o: owner,
        s: service,
        od: targetip,
      }
    };


    this.spawnClient(method, targetip, targetport, (err, connprofile) => {
      let _as = new SocketPair.ActivitySocket(connprofile, _emitRouter, _unbindActivitySocketList, _debug);
      _ActivityRsCEcallbacks[_data.d.t] = (connprofile, data) => {
        if(data.d.i) {
          _as.setEntityId(data.d.i);
          connprofile.setBundle('entityId', data.d.i);
          _ASockets[data.d.i] = _as;
          callback(false, _as);
        }
        else{
          delete  _ASockets[data.d.i];
          callback(true);
        }

      }
      _emitRouter(connprofile, 'CS', _data);
    });

  };

  this.spawnClient = () => {throw new Error('spawnClient not implemented')};

  this.emitConnectionClose = (connprofile, callback) => {
    let _entitiesId = connprofile.returnBundle('bundle_entities');
    for(let i in _entitiesId) {
      _ASockets[_entitiesId[i]]._emitClose();
      setTimeout(()=>{
        // for worker abort referance
        _ASockets[_entitiesId[i]].worker_cancel_refer = true;
        delete _ASockets[_entitiesId[i]];
      }, ActivitySocketDestroyTimeout);
    }
    callback(false);
  };

  this.setDefaultUsername = (username)=> {
    _admin_name = username;
  };

  this.setDebug = (debug)=> {
    _debug = debug;
  };

  this.importDaemonAuthKey = (key) => {
    _daemon_auth_key = key;
  };

  this.close = ()=> {

  };
}

module.exports = Activity;
