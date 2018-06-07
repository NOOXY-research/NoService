// NSF/NSd/entity.js
// Description:
// "entity.js" provide identity system for Service, Activity...
// Copyright 2018 NOOXY. All Rights Reserved.


function Entity() {
  _entities = {};

  function EntityJson() {
    this.id = null;
    this.name = null;
    this.type = null;
    this.spwandomain = null;
    this.owner = null;
    this.ownerdomain = null;
    this.ownertoken = null;
    this.description = null;
  }

  this.registerEntity = () => {
    
  };

  this.modifyEntityValue = () => {

  };

  this.getEntityValue = () => {

  };

  this.deleteEntity = () => {

  };
}

module.exports = Entity;
