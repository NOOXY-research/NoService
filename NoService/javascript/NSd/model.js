// NoService/NSd/model.js
// Description:
// "model.js" provides ORM to manage objects and database.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';

function Model() {
  let _db;

  function ListModel() {

    this.update = ()=> {

    };
  };

  function ObjModel() {
    this.create = ()=> {

    }

    this.update = ()=> {

    };
  };

  function TextField() {
    this.MAXLEN = 50;
  };

  function IntField() {

  };

  function FloatField() {

  };

  // example:
  // {
  //    modeltype: "",
  //    structure: {
  //      username: Model.TEXT,
  //      height: Model.INT
  //    }
  // }
  //

  this.define = (obj_name, obj_structure, callback)=> {
    let type = obj_structure.modeltype;
  };

  this.get = (obj_name, callback) => {

  };

  this.delete = (obj_name)=> {

  };

  this.importDatabase = ()=> {

  };

}

module.exports = Model;
