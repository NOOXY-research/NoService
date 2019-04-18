// NoService/NoService/service/socketpair.js
// Description:
// "socketpair.js" provide functions of socket.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

const Utils = require('../library').Utilities;

function ServiceSocket(service_name, prototype, blobprototype, emitter, debug, entity_module, authorization_module) {
  let _servicefunctions = !prototype?{}:prototype;
  let _blobservicefunctions = !blobprototype?{}:blobprototype;

  let _holding_entities = [];
  // as on data callback
  let _emitasdata = emitter.Data;

  let _emitasevent = emitter.Event;

  let _emitasblobevent = emitter.BlobEvent;

  let _emitasclose = emitter.Close;
  // JSON Function

  let _send_handler;
  let _mode;
  let _on_dict = {
    connect: (entityId, callback) => {
      if(debug)
        Utils.TagLog('*WARN*', 'onConnect of service "'+service_name+'" not implemented');
      callback(false);
    },

    data: (entityId, data) => {
      if(debug)
        Utils.TagLog('*WARN*', 'onData of service "'+service_name+'" not implemented');
    },

    close: (entityId, callback) => {
      if(debug)
        Utils.TagLog('*WARN*', 'onClose of service "'+service_name+'" not implemented');
      callback(false);
    }
  }

  let _to_group = (groups, callback)=> {
    // console.log('f');
    let query = 'service='+service_name+',type=Activity';
    entity_module.getFilteredEntitiesList(query, (err, entitiesId)=>{
      for(let i in entitiesId) {
        let j = groups.length-1;
        let op = ()=> {
          let sent = false;
          entity_module.isEntityInGroup(entitiesId[i], groups[j], (err, pass) => {
            // console.log(pass, !sent, !err);
            // console.log(err);
            if(pass&&!sent&&!err) {
              sent = true;
              entity_module.getEntityConnProfile(entitiesId[i], (err, connprofile) => {
                callback(connprofile, entitiesId[i]);
              });
            }
            else {
              if(j>0) {
                j--;
                op();
              }
            }
          });
        };
        op();
      };
    });
  };

  let _to_including_group = (groups, callback)=> {
    let query = 'service='+service_name+',type=Activity';
    entity_module.getFilteredEntitiesList(query, (err, entitiesId)=>{
      for(let i in entitiesId) {
        entity_module.isEntityIncludingGroups(entitiesId[i], groups, (err, pass) => {
          if(pass&&!err)
            entity_module.getEntityConnProfile(entitiesId[i], (err, connprofile) => {
              callback(connprofile, entitiesId[i]);
            });
        });
      };
    });
  };

  let _to_username = (username, callback)=> {
    let query = 'owner='+username+',service='+service_name+',type=Activity';
    entity_module.getFilteredEntitiesList(query, (err, entitiesId)=>{
      for(let i in entitiesId) {
        authorization_module.Authby.Token(entitiesId[i], (err, pass)=>{
          if(pass&&!err) {
            entity_module.getEntityConnProfile(entitiesId[i], (err, connprofile) => {
              callback(connprofile, entitiesId[i]);
            });
          }
        });
      }
    });
  };

  let _to_all = (callback)=> {
    let query = 'service='+service_name+',type=Activity';
    entity_module.getFilteredEntitiesList(query, (err, entitiesId)=>{
      for(let i in entitiesId) {
        entity_module.getEntityConnProfile(entitiesId[i], (err, connprofile) => {
          callback(connprofile, entitiesId[i]);
        });
      }
    });
  };


  this.returnServiceFunctionList = () => {
    return Object.keys(_servicefunctions);
  };

  this.returnServiceFunctionDict = () => {
    return _servicefunctions;
  };

  this.returnBlobServiceFunctionList = () => {
    return Object.keys(_blobservicefunctions);
  };

  this.returnBlobServiceFunctionDict = () => {
    return _blobservicefunctions;
  };

  this.def = (name, callback) => {
    _servicefunctions[name] = (!_servicefunctions[name])?{}:_servicefunctions[name];
    _servicefunctions[name].obj = callback;
  };

  // securly define
  this.sdef = (name, callback, fail) => {
    this.def(name, (json, entityId, returnJSON)=>{
      authorization_module.Authby.isSuperUserWithToken(entityId, (err, pass)=>{
        if(pass&&!err) {
          callback(json, entityId, returnJSON);
        }
        else {
          fail(json, entityId, returnJSON);
        }
      });
    });
  };

  this.defBlob = (name, callback) => {
    _blobservicefunctions[name] = (!_blobservicefunctions[name])?{}:_blobservicefunctions[name];
    _blobservicefunctions[name].obj = callback;
  };

  // securly define
  this.sdefBlob = (name, callback, fail) => {
    this.def(name, (data, meta, entityId, returnJSON)=>{
      authorization_module.Authby.isSuperUserWithToken(entityId, (err, pass)=>{
        if(pass&&!err) {
          callback(data, meta, entityId, returnJSON);
        }
        else {
          fail(data, meta, entityId, returnJSON);
        }
      });
    });
  };

  // emit event to entityId
  this.emit = (entityId, event, data)=> {
    entity_module.getEntityConnProfile(entityId, (err, connprofile)=>{
      _emitasevent(connprofile, entityId, event, data);
    });
  };

  // emit event to entityId
  this.emitBlob = (entityId, event, data, meta)=> {
    entity_module.getEntityConnProfile(entityId, (err, connprofile)=>{
      _emitasblobevent(connprofile, entityId, event, data, meta);
    });
  };

  // emit event to entityId securly
  this.semit = (entityId, event, data)=> {
    authorization_module.Authby.isSuperUserWithToken(entityId, (err, pass)=>{
      if(pass&&!err) {
        entity_module.getEntityConnProfile(entityId, (err, connprofile)=>{
          _emitasevent(connprofile, entityId, event, data);
        });
      };
    });
  };

  this.semitBlob = (entityId, event, data, meta)=> {
    authorization_module.Authby.isSuperUserWithToken(entityId, (err, pass)=>{
      if(pass&&!err) {
        entity_module.getEntityConnProfile(entityId, (err, connprofile)=>{
          _emitasblobevent(connprofile, entityId, event, data, meta);
        });
      };
    });
  };

  this.emitToUsername = (username, event, data)=> {
    _to_username(username, (connprofile, entityId)=>{
      _emitasevent(connprofile, entityId, event, data);
    });
  };

  this.emitToGroups = (groups, event, data)=> {
    _to_group(groups, (connprofile, entityId)=> {
      _emitasevent(connprofile, entityId, event, data);
    });
  };

  // broadcast to have all of this groups
  this.emitToIncludingGroups = (groups, event, data)=> {
    _to_including_group(groups, (connprofile, entityId)=> {
      _emitasevent(connprofile, entityId, event, data);
    });
  };

  this.emitAll = (event, data)=> {
    _to_all((connprofile, entityId)=> {
      _emitasevent(connprofile, entityId, event, data);
    });
  };

  this.sendData = (entityId, data) => {
    entity_module.getEntityConnProfile(entityId, (err, connprofile)=>{
      _emitasdata(connprofile, entityId, data);
    });
  };

  this.sendDataToUsername = (username, data) => {
    _to_username(username, (connprofile, entityId)=>{
      _emitasdata(connprofile, entityId, data);
    });
  };

  this.sendDataToGroups = (groups, data)=> {
    _to_group(groups, (connprofile, entityId)=> {
      _emitasdata(connprofile, entityId, data);
    });
  };

  // broadcast to have all of this groups
  this.sendDataToIncludingGroups = (groups, data)=> {
    _to_including_group(groups, (connprofile, entityId)=> {
      _emitasdata(connprofile, entityId, data);
    });
  };

  this.sendDataAll = (data) => {
    _to_all((connprofile, entityId)=> {
      _emitasdata(connprofile, entityId, data);
    });
  };

  this.closeAll = (callback)=>{
    // console.log('f');
    let query = 'service='+service_name+',type=Activity';
    entity_module.getFilteredEntitiesList(query, (err, entitiesId)=>{
      for(let i in entitiesId) {
        this._closeSocket(entitiesId[i]);
      }
      callback(false);
    });
  };

  this.close = (entityId)=> {
    this._closeSocket(entityId);
  };

  this.on = (type, callback)=> {
    _on_dict[type] = callback;
  };

  this._emitServiceFunctionCall = (entityId, SFname, data, callback) => {
    try {
      if(_servicefunctions[SFname]) {
        _servicefunctions[SFname].obj(data, entityId, (err, returnVal)=> {
          callback(err, returnVal);
        });
      }
      else {
        throw new Error('ServiceFunction '+SFname+' not exist');
      }
    }
    catch (err) {
      if(debug) {
        Utils.TagLog('*ERR*', 'An error occured on ServiceFunction call. ServiceFunction might not be exist.');
        console.log(err);
      }
      callback(err);
    }
  };

  this._emitBlobServiceFunctionCall = (entityId, BSFname, blob, meta, callback) => {
    try {
      if(_blobservicefunctions[BSFname]) {
        _blobservicefunctions[BSFname].obj(blob, meta, entityId, (err, returnVal, meta)=> {
          callback(err, returnVal, meta);
        });
      }
      else {
        throw new Error('BlobServiceFunction '+BSFname+' not exist');
      }
    }
    catch (err) {
      if(debug) {
        Utils.TagLog('*ERR*', 'An error occured on Blob ServiceFunction call. Blob ServiceFunction might not be exist.');
        console.log(err);
      }
      callback(err);
    }
  };

  this._closeSocket = (entityId, remoteClosed)=> {
    entity_module.getEntityConnProfile(entityId, (err, connprofile)=>{
      if(!err) {
        if(!remoteClosed)
          _emitasclose(connprofile, entityId);
        this._emitClose(entityId, (err)=>{
          entity_module.deleteEntity(entityId, (err)=> {
              if(err && debug) {
                Utils.TagLog('*ERR*', 'Error occured at ServiceSocket close.');
                console.log(err);
              }
          });
        });
      }
    });
  };

  this._emitConnect = (entityId, callback)=> {
    _on_dict['connect'](entityId, callback);
  }

  this._emitData = (entityId, data)=> {
    _on_dict['data'](entityId, data);
  }

  this._emitClose = (entityId, callback)=> {
    _on_dict['close'](entityId, callback);
  }

  this.returnServiceName = () => {
    return service_name;
  }

};

function ActivitySocket(service_name, conn_profile, emitter, unbindActivitySocketList, debug) {
  // Service Socket callback
  let _emitdata = emitter.Data;

  let _emit_sfunc = emitter.ServiceFunction;

  let _emit_blob_sfunc = emitter.BlobServiceFunction;

  let _emitclose = emitter.Close;

  let _entity_id;
  let _launched = false;

  let wait_ops = [];
  let wait_launch_ops = [];

  let _sfqueue = {};
  let _bsfqueue = {};

  let _on_dict = {
    data: ()=> {
      if(debug) Utils.TagLog('*WARN*', 'ActivitySocket of service "'+service_name+'" on "data" not implemented')
    },
    close: ()=> {
      if(debug) Utils.TagLog('*WARN*', 'ActivitySocket of service "'+service_name+'" on "close" not implemented')
    }
  };

  let _on_event = {

  };

  let _on_blob_event = {

  };

  // For waiting connection is absolutly established. We need to wrap operations and make it queued.
  let exec = (callback) => {
    if(_launched != false) {
      callback();
    }
    else {
      wait_ops.push(callback);
    }
  };

  this.launch = () => {
    _launched = true;
    for(let i in wait_ops) {
      wait_ops[i]();
    }
  };

  this.setEntityId = (id) => {
    _entity_id = id;
    let entities_prev = conn_profile.returnBundle('bundle_entities');
    if(entities_prev != null) {
      conn_profile.setBundle('bundle_entities', [_entity_id].concat(entities_prev));
    }
    else {
      conn_profile.setBundle('bundle_entities', [_entity_id]);
    }
  };

  // ServiceFunction call
  this.call = (name, data, callback) => {
    let op = ()=> {
      let tempid = Utils.generateUniqueId();
      _sfqueue[tempid] = (err, returnvalue) => {
        callback(err, returnvalue);
      };
      _emit_sfunc(conn_profile, _entity_id, name, data, tempid);
    };
    exec(op);
  }

  // BlobServiceFunction call
  this.callBlob = (name, blob, meta, callback) => {
    let op = ()=> {
      let tempid = Utils.generateUniqueId();
      _bsfqueue[tempid] = (err, returnblob, meta) => {
        callback(err, returnblob, meta);
      };
      _emit_blob_sfunc(conn_profile, _entity_id, name, blob, meta, tempid);
    };
    exec(op);
  }

  this.getEntityId = (callback) => {
    callback(false, _entity_id);
  };

  this.sendData = (data) => {
    let op = ()=> {
      _emitdata(conn_profile, _entity_id, data);
    };
    exec(op);
  };

  this.on = (type, callback)=> {
    _on_dict[type] = callback;
  };

  this.onEvent = (event, callback)=> {
    _on_event[event] = callback;
  };

  this.onBlobEvent = (event, callback)=> {
    _on_blob_event[event] = callback;
  };

  this._emitData = (data) => {
    _on_dict['data'](false, data);
  };

  this._emitBlobEvent = (event, blob, meta)=> {
    if(_on_blob_event[event])
      _on_blob_event[event](false, blob, meta);
  };

  this._emitSFReturn = (err, tempid, returnvalue) => {
    if(err) {
      _sfqueue[tempid](err);
    }
    else {
      _sfqueue[tempid](err, returnvalue);
    }
    delete _sfqueue[tempid];
  };

  this._emitBSFReturn = (err, tempid, returnblob, meta) => {
    if(err) {
      _bsfqueue[tempid](err);
    }
    else {
      _bsfqueue[tempid](err, returnblob, meta);
    }
    delete _bsfqueue[tempid];
  };

  this._emitEvent = (event, data)=> {
    if(_on_event[event])
      _on_event[event](false, data);
  };

  this._emitClose = () => {
    _on_dict['close'](false);
  };

  this.remoteClosed = false;

  this.unbindActivitySocketList = ()=> {
    Utils.TagLog('*ERR*', '_aftercloseLaunched not implemented');
  };

  this.close = () => {
    let op = ()=> {
      if(!this.remoteClosed)
        _emitclose(conn_profile, _entity_id);
      this._emitClose();
      let bundle = conn_profile.returnBundle('bundle_entities');
      for (let i=bundle.length-1; i>=0; i--) {
        if (bundle[i] === _entity_id) {
          unbindActivitySocketList(_entity_id);
          bundle.splice(i, 1);
        }
      }
      conn_profile.setBundle('bundle_entities', bundle);
      if(bundle.length === 0) {
        conn_profile.closeConnetion();
      }
    }
    exec(op);
  };
};

module.exports = {
  ServiceSocket: ServiceSocket,
  ActivitySocket: ActivitySocket
};
