// NoService/NSd/model.js
// Description:
// "model.js" provides ORM to manage objects and database.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';

function Model() {
  let _db;
  let _model_dict = {};

  function ListModel() {

    this.updateRow = ()=> {

    };

    this.updateRows = ()=> {

    };

    this.deleteRows = ()=> {

    };

    this.getRows = ()=> {

    };

  };

  function ObjModel() {
    this.create = (key, dict)=> {

    }

    this.update = (key, dict)=> {

    };
  };

  function PairModel() {
    this.create = (keypair, dict)=> {

    }

    this.update = (keypair, dict)=> {

    };
  };

  // example:
  // {
  //    modeltype: "",
  //    structure: {
  //      username: 'text',
  //      height: 'int'
  //    }
  // }
  //

  this.define = (model_name, obj_structure, callback)=> {
    let type = obj_structure.modeltype;
  };

  this.get = (model_name, callback) => {

  };

  this.delete = (model_name)=> {

  };

  this.importDatabase = (db, callback)=> {
    let _db = db;
    _db.isTableExist('NSModels', (err, exist)=> {
      if(exist) {
        callback(false);
      }
      else {
        _db.createTable('NSModels', {
          name: {
            type: 'text',
            iskey: true
          },

          content: {
            type: 'text'
          }
        }, ()=> {

        });
      }
    });
  };


}

module.exports = Model;
