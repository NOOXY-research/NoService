// NoService/NoService/service/serviceservices.js
// Description:
// "services.js" provide functions of services stuff.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const SocketPair = require('./socketpair');

function Activity() {
  let ActivitySocketDestroyTimeout = 1000;
  let _ASockets = {};
  let _admin_name = 'admin';
  let _daemon_auth_key;
  let _debug = false;
  let _on_handler = {};

  let _emmiter;



  let _unbindActivitySocketList = (_entity_id)=> {
    setTimeout(()=>{
      // tell worker abort referance
      if(_ASockets[_entity_id])
        _ASockets[_entity_id].worker_cancel_refer = true;
      delete _ASockets[_entity_id];
    }, ActivitySocketDestroyTimeout);
  };

  // Service module create activity socket
  this.createActivitySocket = (method, targetip, targetport, service, owner, callback) => {
    _emmiter = {
      Data: _on_handler['EmitSSDataRq'],
      ServiceFunction: _on_handler['EmitSSServiceFunctionRq'],
      Close: _on_handler['EmitASCloseRq'],
    }
    _on_handler['createActivitySocketRq'](method, targetport, owner, 'normal', service, targetip, false, (err, connprofile, entityId)=> {
      if(entityId) {
        let _as = new SocketPair.ActivitySocket(service, connprofile, _emmiter, _unbindActivitySocketList, _debug);
        _as.setEntityId(entityId);
        let prev = connprofile.returnBundle();
        if(!prev) {
          prev = [];
        }
        connprofile.setBundle('bundle_entities', prev.concat(entityId));
        _ASockets[entityId] = _as;
        callback(false, _ASockets[entityId]);
      }
      else{
        callback(new Error('Could not create this entity for some reason.'));
      }
    });
  };

  this.createAdminDaemonActivitySocket = (method, targetip, targetport, service, callback) => {
    this.createDaemonActivitySocket(method, targetip, targetport, service, _admin_name, callback);
  };

  this.createDaemonActivitySocket = (method, targetip, targetport, service, owner, callback) => {
    _emmiter = {
      Data: _on_handler['EmitSSDataRq'],
      ServiceFunction: _on_handler['EmitSSServiceFunctionRq'],
      BlobServiceFunction: _on_handler['EmitSSBlobServiceFunctionRq'],
      Close: _on_handler['EmitASCloseRq'],
    }
    _on_handler['createActivitySocketRq'](method, targetport, owner, 'daemon', service, targetip, _daemon_auth_key, (err, connprofile, entityId)=> {
      if(entityId) {
        let _as = new SocketPair.ActivitySocket(service, connprofile, _emmiter, _unbindActivitySocketList, _debug);
        _as.setEntityId(entityId);
        let prev = connprofile.returnBundle();
        if(!prev) {
          prev = [];
        }
        connprofile.setBundle('bundle_entities', prev.concat(entityId));
        _ASockets[entityId] = _as;
        callback(false, _ASockets[entityId]);
      }
      else{
        callback(new Error('Could not create this entity for some reason.'));
      }
    });
  };

  this.emitASClose = (entityId)=> {
    _ASockets[entityId].remoteClosed = true;
    _ASockets[entityId]._emitClose();
  };

  this.emitASData = (entityId, data)=> {
    _ASockets[entityId]._emitData(data);
  };

  this.emitBSFReturn = (entityId, err, tempid, returnvalue, meta)=> {
    _ASockets[entityId]._emitBSFReturn(err, tempid, returnvalue, meta);
  };

  this.emitSFReturn = (entityId, err, tempid, returnvalue)=> {
    _ASockets[entityId]._emitSFReturn(err, tempid, returnvalue);
  };

  this.emitASData = (entityId, data)=> {
    _ASockets[entityId]._emitData(data);
  };

  this.emitASEvent = (entityId, event, data)=> {
    _ASockets[entityId]._emitEvent(event, data);
  };

  this.emitASBlobEvent = (entityId, event, blob, meta)=> {
    _ASockets[entityId]._emitBlobEvent(event, blob, meta);
  };

  this.launchActivitySocketByEntityId = (entityId)=> {
    _ASockets[entityId].launch();
  };

  this.emitConnectionClose = (connprofile, callback) => {
    let _entitiesId = connprofile.returnBundle('bundle_entities');
    for(let i in _entitiesId) {
      _ASockets[_entitiesId[i]]._emitClose();
      setTimeout(()=>{
        // for worker abort referance
        if(_ASockets[_entitiesId[i]]) {
          _ASockets[_entitiesId[i]].worker_cancel_refer = true;
          delete _ASockets[_entitiesId[i]];
        }
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

  this.on = (event, callback)=> {
    _on_handler[event] = callback;
  };

  this.close = ()=> {
    ActivitySocketDestroyTimeout = 1000;
    for(let i in _ASockets) {
      _ASockets[i].worker_cancel_refer = true;
      delete _ASockets[i];
    }
    _ASockets = {};
    _emmiter = null;
    _admin_name = 'admin';
    _daemon_auth_key = null;
    _debug = false;
     _on_handler = {};
  };
}

module.exports = Activity;
