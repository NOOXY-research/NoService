// NSF/NSd/entity.js
// Description:
// "entity.js" provide identity system for Service, Activity...
// Copyright 2018 NOOXY. All Rights Reserved.

let utils = require('./utilities');

function Entity() {
  let _seed = utils.generateGUID();
  let _entities = {};

  function EntityJson(id, Json, conn_profile) {
    let _conn_profile = conn_profile;

    let _meta = {
      id: id,
      serverid: Json.serverid,
      service: Json.service,
      type: Json.type,
      spwandomain: Json.spwandomain,
      owner: Json.owner,
      ownerdomain: Json.ownerdomain,
      ownertoken: Json.ownertoken,
      description: Json.description
    };

    this.getConnProfile = (callback) => {callback(_conn_profile)};

    this.modify = (key, value) => {
      _json[key] = value;
    };

    this.returnVal = (key) => {
      return _json[key];
    };

    // return a JSONfy data structure.
    this.returnJSON = () => {
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

  this.returnEntityValue = (entityID, key) => {
    return _entities[entityID].gey(key);
  };

  this.getEntityConnProfile = (entityID, callback) => {
    _entities[entityID].getConnProfile(callback);
  };

  this.deleteEntity = (entityID) => {
    delete _entities[entityID];
  };
}

module.exports = Entity;
