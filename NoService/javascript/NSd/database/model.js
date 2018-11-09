// NoService/NSd/model.js
// Description:
// "model.js" provides ORM to manage objects and database.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';

function Model() {
  let _db;
  let _model_dict = {};

  let _load_models_dict = ()=> {

  };

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

  this.delete = (model_name, callback)=> {

  };

  this.define = (model_name, obj_structure, callback)=> {
    let type = obj_structure.modeltype;
  };

  this.get = (model_name, callback) => {

  };

  this.delete = (model_name)=> {

  };

  this.importDatabase = (db, callback)=> {
    _db = db;
    _db.isTableExist('NSModels', (err, exist)=> {
      if(exist) {
        _db.getRows('' , (error, rows)=> {
          for(let index in rows) {
            _model_dict[rows[index].name] = JSON.parse(rows[index].structure);
          };
          callback(false);
        });
      }
      else {
        _db.createTable('NSModels', {
          name: {
            type: 'TEXT',
            iskey: true,
            notnull: true
          },

          structure: {
            type: 'TEXT'
          }
        }, (error)=> {

        });
      }
    });
  };


}

module.exports = Model;
