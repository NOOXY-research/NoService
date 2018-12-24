// NoService/NoService/entity.js
// Description:
// "entity.js" provide identity system for Service, Activity..., the perspective is this daemon. Entity is part of service module.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

const Utils = require('./library').Utilities;

function Entity() {
  let _seed = Utils.generateGUID();
  let _on_callbacks = {};
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
      description: Json.description,
      groups: new Set()
    };

    this.getConnProfile = (callback) => {callback(false, _conn_profile)};

    this.modify = (key, value) => {
      _json[key] = value;
    };

    this.addGroups = (grouplist, callback)=> {
      for(let i in grouplist) {
        _meta.groups.add(grouplist[i]);
      }
      callback(false);
    };

    this.deleteGroups = (grouplist, callback)=> {
      for(let i in grouplist) {
        _meta.groups.delete(grouplist[i]);
      }
      callback(false);
    };

    this.clearGroups = (grouplist, callback)=> {
      _meta.groups.clear();
      callback(false);
    };

    this.includeGroups = (grouplist, callback)=> {
      let result = true;
      for(let i in grouplist) {
        // console.log(group, !_meta.groups.has(group));
        if(!_meta.groups.has(grouplist[i])) {
          result = false;
          break;
        };
      }
      callback(false, result);
    };

    this.inGroup = (group, callback)=> {
      callback(false, _meta.groups.has(group));
    };

    this.getGroups = (callback)=> {
      callback(false, _meta.groups.keys());
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
    if(_on_callbacks[type] == null) {
      _on_callbacks[type] = [];
    }
    _on_callbacks[type].push(callback);
  };

  this.registerEntity = (entityJson, conn_profile, callback) => {
    let err = false;
    let entityID = Utils.generateUniqueID();
    _entities[entityID] = new EntityJson(entityID, entityJson, conn_profile);
    for(let i in _on_callbacks['EntityCreated']) {
      (_on_callbacks['EntityCreated'])[i](entityID, entityJson);
    }
    callback(err, entityID);
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

  this.returnIsEntityExist = (entityID)=> {
    return _entities[entityID]?true:false;
  };

  this.getEntityConnProfile = (entityID, callback) => {
    try {
      _entities[entityID].getConnProfile(callback);
    }
    catch {
      callback(new Error('Entity not existed with this ID('+entityID+').'));
    }
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

  this.deleteEntity = (entityID, callback) => {
    let et = _entities[entityID];
    if(et) {
      for(let i in _on_callbacks['EntityDeleted']) {
        (_on_callbacks['EntityDeleted'])[i](entityID, et.returnMeta());
      }
      delete _entities[entityID];
      if(callback)
        callback(false);
    }
    else {
      if(callback)
        callback(new Error('Entity "'+entityID+'" doesn\'t exist.'));
    }
  };


  this.addEntityToGroups = (entityID, grouplist, callback)=> {
    let et =_entities[entityID];
    if(et) {
      et.addGroups(grouplist, callback);
    }
    else {
      if(callback)
        callback(new Error('Entity "'+entityID+'" doesn\'t exist.'));
    }
  };

  this.deleteEntityFromGroups = (entityID, grouplist, callback)=> {
    let et =_entities[entityID];
    if(et) {
      et.deleteGroups(grouplist, callback);
    }
    else {
      if(callback)
        callback(new Error('Entity "'+entityID+'" doesn\'t exist.'));
    }
  };

  this.clearAllGroupsOfEntity = (entityID, callback)=> {
    let et =_entities[entityID];
    if(et) {
      et.clearGroups(callback);
    }
    else {
      if(callback)
        callback(new Error('Entity "'+entityID+'" doesn\'t exist.'));
    }
  };

  this.isEntityIncludingGroups = (entityID, grouplist, callback)=> {
    let et =_entities[entityID];
    if(et) {
      et.includeGroups(grouplist, callback);
    }
    else {
      if(callback)
        callback(new Error('Entity "'+entityID+'" doesn\'t exist.'));
    }
  };

  this.isEntityInGroup = (entityID, group, callback)=> {
    let et =_entities[entityID];
    if(et) {
      et.inGroup(group, callback);
    }
    else {
      if(callback)
        callback(new Error('Entity "'+entityID+'" doesn\'t exist.'));
    }
  };

  this.getGroupsofEntity = (entityID, callback)=> {
    let et =_entities[entityID];
    if(et) {
      et.getGroups(callback);
    }
    else {
      if(callback)
        callback(new Error('Entity "'+entityID+'" doesn\'t exist.'));
    }
  };

  this.close = () => {
    _on_callbacks = {};
    _entities = {};
  };
}

module.exports = Entity;
