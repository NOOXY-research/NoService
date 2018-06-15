// NSF/NSd/entity.js
// Description:
// "entity.js" provide identity system for Service, Activity..., the perspective is this daemon. Entity is part of service module.
// Copyright 2018 NOOXY. All Rights Reserved.

let utils = require('./utilities');

function Entity() {
  let _seed = utils.generateGUID();
  let _entities = {};

  function EntityJson(entityID, Json, conn_profile) {
    let _conn_profile = conn_profile;

    let _meta = {
      id: entityID,
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

  this.registerEntity = (entityJson, conn_profile, callback) => {
    let err = false;
    let entityID = utils.generateUniqueID();
    _entities[entityID] = new EntityJson(entityID, entityJson, conn_profile);
    callback(err, entityID);
  };

  this.modifyEntityValue = (entityID, key, value) => {
    _entities[entityID].modify(key, value);
  };

  this.getEntityMetaData = (entityID, callback) => {
    callback(false, _entities[entityID].returnMeta());
  };

  this.returnEntityValue = (entityID, key) => {

    return _entities[entityID].returnVal(key);
  };

  this.getEntityConnProfile = (entityID, callback) => {
    _entities[entityID].getConnProfile(callback);
  };

  this.returnEntitycount = () =>{
    return Object.keys(_entities).length;
  };

  this.getEntitiesMeta = (callback) => {
    let _e = {};
    for(let key in _entities) {
      _e[key] = _entities[key].returnMeta()
    }
    callback(false, _e);
  };

  this.returnEntityMetaData = (entityID) => {
    return _entities[entityID].returnMeta();
  };

  this.getfliteredEntity= (key, value) => {

  };

  this.deleteEntity = (entityID) => {
    delete _entities[entityID];
  };
}

module.exports = Entity;
