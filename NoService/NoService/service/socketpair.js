// NoService/NoService/service/socketpair.js
// Description:
// "socketpair.js" provide functions of socket.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';
const Utils = require('../library').Utilities;

function ServiceSocket(service_name, prototype, emitRouter, debug, entity_module, authorization_module) {
  let _socketfunctions = prototype==null?{}:prototype;
  let _holding_entities = [];
  // as on data callback
  let _emitasdata = (conn_profile, i, d) => {
    let _data = {
      "m": "AS",
      "d": {
        "i": i,
        "d": d,
      }
    };
    emitRouter(conn_profile, 'CA', _data);
  }

  let _emitasevent = (conn_profile, i, n, d) => {
    let _data = {
      "m": "EV",
      "d": {
        "i": i,
        "n": n,
        "d": d,
      }
    };
    emitRouter(conn_profile, 'CA', _data);
  }

  let _emitasclose = (conn_profile, i) => {
    let _data = {
      "m": "CS",
      "d": {
        "i": i
      }
    };
    emitRouter(conn_profile, 'CA', _data);
  }
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

  this.returnServiceFunctionList = () => {
    return Object.keys(_socketfunctions);
  };

  this.returnServiceFunctionDict = () => {
    return _socketfunctions;
  };

  this.def = (name, callback) => {
    _socketfunctions[name] = (!_socketfunctions[name])?{}:_socketfunctions[name];
    _socketfunctions[name].obj = callback;
  };

  // securly define
  this.sdef = (name, callback, fail) => {
    this.def(name, (json, entityId, returnJSON)=>{
      authorization_module.Authby.isSuperUserwithToken(entityId, (err, pass)=>{
        if(pass&&!err) {
          callback(json, entityId, returnJSON);
        }
        else {
          fail(json, entityId, returnJSON);
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

  // emit event to entityId securly
  this.semit = (entityId, event, data)=> {
    authorization_module.Authby.isSuperUserwithToken(entityId, (err, pass)=>{
      if(pass&&!err) {
        entity_module.getEntityConnProfile(entityId, (err, connprofile)=>{
          _emitasevent(connprofile, entityId, event, data);
        });
      };
    });
  };

  this.emitToUsername = (username, event, data)=> {
    let query = 'owner='+username+',service='+service_name+',type=Activity';
    entity_module.getFilteredEntitiesList(query, (err, entitiesId)=>{
      for(let i in entitiesId) {
        authorization_module.Authby.Token(entitiesId[i], (err, pass)=>{
          if(pass&&!err) {
            entity_module.getEntityConnProfile(entitiesId[i], (err, connprofile) => {
              _emitasevent(connprofile, entitiesId[i], event, data);
            });
          }
        });
      }
    });
  };

  this.emitToGroups = (groups, event, data)=> {
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
                _emitasevent(connprofile, entitiesId[i], event, data);

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

  // broadcast to have all of this groups
  this.emitToIncludingGroups = (groups, event, data)=> {
    // console.log('f');
    let query = 'service='+service_name+',type=Activity';
    entity_module.getFilteredEntitiesList(query, (err, entitiesId)=>{
      for(let i in entitiesId) {
        entity_module.isEntityIncludingGroups(entitiesId[i], groups, (err, pass) => {
          if(pass&&!err)
            entity_module.getEntityConnProfile(entitiesId[i], (err, connprofile) => {
              _emitasevent(connprofile, entitiesId[i], event, data);
            });
        });
      };
    });
  };

  this.broadcastEvent = (event, data)=> {
    let query = 'service='+service_name+',type=Activity';
    entity_module.getFilteredEntitiesList(query, (err, entitiesId)=>{
      for(let i in entitiesId) {
        entity_module.getEntityConnProfile(entitiesId[i], (err, connprofile) => {
          _emitasevent(connprofile, entitiesId[i], event, data);
        });
      }
    });
  };

  this.sendData = (entityId, data) => {
    entity_module.getEntityConnProfile(entityId, (err, connprofile)=>{
      _emitasdata(connprofile, entityId, data);
    });
  };

  this.sendDataToUsername = (username, data) => {
    // console.log('f');
    let query = 'owner='+username+',service='+service_name+',type=Activity';
    entity_module.getFilteredEntitiesList(query, (err, entitiesId)=>{
      for(let i in entitiesId) {
        authorization_module.Authby.Token(entitiesId[i], (err, pass)=>{
          if(pass&&!err) {
            entity_module.getEntityConnProfile(entitiesId[i], (err, connprofile) => {
              _emitasdata(connprofile, entitiesId[i], data);
            });
          }
        });
      }
    });
  };

  this.sendDataToGroups = (groups, data)=> {
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
                _emitasdata(connprofile, entitiesId[i], data);
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

  // broadcast to have all of this groups
  this.sendDataToIncludingGroups = (groups, data)=> {
    // console.log('f');
    let query = 'service='+service_name+',type=Activity';
    entity_module.getFilteredEntitiesList(query, (err, entitiesId)=>{
      for(let i in entitiesId) {
        entity_module.isEntityIncludingGroups(entitiesId[i], groups, (err, pass) => {
          if(pass&&!err)
            entity_module.getEntityConnProfile(entitiesId[i], (err, connprofile) => {
              _emitasdata(connprofile, entitiesId[i], data);
            });
        });
      };
    });
  };

  this.broadcastData = (data) => {
    // console.log('f');
    let query = 'service='+service_name+',type=Activity';
    entity_module.getFilteredEntitiesList(query, (err, entitiesId)=>{
      for(let i in entitiesId) {
        entity_module.getEntityConnProfile(entitiesId[i], (err, connprofile) => {
          _emitasdata(connprofile, entitiesId[i], data);
        });
      }
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

  this._emitFunctionCall = (entityId, SFname, jsons, callback) => {
    try {
      if(_socketfunctions[SFname]) {
        _socketfunctions[SFname].obj(JSON.parse(jsons==null?'{}':jsons), entityId, (err, returnVal)=> {
          callback(err, returnVal);
        });
      }
      else {
        throw new Error('ServiceFunction '+SFname+' not exist');
      }
    }
    catch (err) {
      if(debug) {
        Utils.TagLog('*ERR*', 'An error occured on JSON function call. Jfunc might not be exist.');
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

function ActivitySocket(conn_profile, emitRouter, unbindActivitySocketList, debug) {
  // Service Socket callback
  let _emitdata = (i, d) => {
    let _data = {
      "m": "SS",
      "d": {
        "i": i,
        "d": d,
      }
    };
    emitRouter(conn_profile, 'CS', _data);
  }

  // Service Socket callback
  let _emitclose = (i) => {
    let _data = {
      "m": "CS",
      "d": {
        "i": i
      }
    };
    emitRouter(conn_profile, 'CS', _data);
  }

  let _emit_sfunc = (entity_id, name, tempid, Json)=> {
    let _data = {
      "m": "JF",
      "d": {
        "i": entity_id,
        "n": name,
        "j": JSON.stringify(Json),
        "t": tempid
      }
    };
    emitRouter(conn_profile, 'CS', _data);
  }

  let _entity_id;
  let _launched = false;

  let wait_ops = [];
  let wait_launch_ops = [];
  let _jfqueue = {};
  let _on_dict = {
    data: ()=> {
      if(debug) Utils.TagLog('*WARN*', 'ActivitySocket on "data" not implemented')
    },
    close: ()=> {
      if(debug) Utils.TagLog('*WARN*', 'ActivitySocket on "close" not implemented')
    }
  };

  let _on_event = {

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

  this.emitSFReturn = (err, tempid, returnvalue) => {
    if(err) {
      _jfqueue[tempid](err);
    }
    else {
      _jfqueue[tempid](err, JSON.parse(returnvalue));
    }
  };

  // ServiceFunction call
  this.call = (name, Json, callback) => {
    let op = ()=> {
      let tempid = Utils.generateUniqueId();
      _jfqueue[tempid] = (err, returnvalue) => {
        callback(err, returnvalue);
      };
      _emit_sfunc(_entity_id, name, tempid, Json);
    };
    exec(op);
  }

  this.getEntityId = (callback) => {
    callback(false, _entity_id);
  };

  this.sendData = (data) => {
    let op = ()=> {
      _emitdata(_entity_id, data);
    };
    exec(op);
  };

  this.on = (type, callback)=> {
    _on_dict[type] = callback;
  };

  this.onEvent = (event, callback)=> {
    _on_event[event] = callback;
  };

  this._emitData = (data) => {
    _on_dict['data'](false, data);
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
        _emitclose(_entity_id);
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
