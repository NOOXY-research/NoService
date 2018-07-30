// NSF/NSd/entity.js
// Description:
// "entity.js" provide identity system for Service, Activity..., the perspective is this daemon. Entity is part of service module.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

let Utils = require('./utilities');

function Entity() {
  let _seed = Utils.generateGUID();
  let _callbacks = {};
  let _entities = {};

  function EntityJson(entityID, Json, conn_profile) {
    let _conn_profile = conn_profile;

    let _meta = {
      id: entityID,
      mode: Json.mode, // normal or service
      daemonauthkey: Json.daemonauthkey, // for daemon activity call
      serverid: Json.serverid,
      service: Json.service,
      type: Json.type,
      spwandomain: Json.spwandomain,
      owner: Json.owner,
      ownerdomain: Json.ownerdomain,
      connectiontype: Json.connectiontype,
      description: Json.description
    };

    this.getConnProfile = (callback) => {callback(false, _conn_profile)};

    this.modify = (key, value) => {
      _json[key] = value;
    };

    this.returnVal = (key) => {
      return _meta[key];
    };

    // return a JSONfy data structure.
    this.returnMeta = () => {
      return _meta;
    };
  }

  this.on = (type, callback) => {
    if(_callbacks[type] == null) {
      _callbacks[type] = [];
    }
    _callbacks[type].push(callback);
  };

  this.registerEntity = (entityJson, conn_profile, callback) => {
    let err = false;
    let entityID = Utils.generateUniqueID();
    _entities[entityID] = new EntityJson(entityID, entityJson, conn_profile);
    callback(err, entityID);
    for(let i in _callbacks['EntityCreated']) {
      (_callbacks['EntityCreated'])[i](entityID);
    }
  };

  this.modifyEntityValue = (entityID, key, value) => {
    _entities[entityID].modify(key, value);
  };

  this.getEntityMetaData = (entityID, callback) => {
    callback(false, _entities[entityID].returnMeta());
  };

  this.returnEntityValue = (entityID, key) => {
    let entity = _entities[entityID];
    if(entity != null) {
       return entity.returnVal(key);
    }
     return null;
  };

  this.returnEntityOwner = (entityID) => {
    return this.returnEntityValue(entityID, 'owner');
  };

  this.getEntityConnProfile = (entityID, callback) => {
    _entities[entityID].getConnProfile(callback);
  };

  this.returnEntitycount = () =>{
    return Object.keys(_entities).length;
  };

  this.getEntitiesMetaData = (callback) => {
    let _e = {};
    for(let key in _entities) {
      _e[key] = _entities[key].returnMeta()
    }
    callback(false, _e);
  };

  this.returnEntityMetaData = (entityID) => {
    return _entities[entityID].returnMeta();
  };

  this.returnEntitiesID = () => {
    return Object.keys(_entities);
  }

  this.getfliteredEntitiesMetaData = (key, value, callback) => {
    let _e = {};
    for(let k in _entities) {
      let _meta = _entities[k].returnMeta();
      if(_meta[key] == value) {
        _e[k] = _meta;
      }
    }
    callback(false, _e);
  };

  this.getfliteredEntitiesList = (query, callback) => {
    let _e = [];
    let qs = query.split(',');
    for(let k in _entities) {
      let _meta = _entities[k].returnMeta();
      let pass = true;
      for(let i in qs) {
        let key = qs[i].split('=')[0];
        let value = qs[i].split('=')[1];
        if(_meta[key] != value) {
          pass = false;
        }
      };

      if(pass) {
        _e.push(_meta['id']);
      }
    }
    callback(false, _e);
  };

  this.deleteEntity = (entityID) => {
    delete _entities[entityID];
    for(let i in _callbacks['EntityDeleted']) {
      (_callbacks['EntityDeleted'])[i](entityID);
    }
  };

  this.close = () => {
    _callbacks = {};
    _entities = {};
  };
}

module.exports = Entity;
