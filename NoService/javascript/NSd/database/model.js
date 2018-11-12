// NoService/NSd/model.js
// Description:
// "model.js" provides ORM to manage objects and database.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';
const MODEL_TABLE_NAME = 'NSModels';
const MODEL_TABLE_PREFIX = 'NSModel_';

function Model() {
  let _db;
  let _model_dict = {};

  let _load_models_dict = ()=> {

  };

  function IndexedListModel() {
    let table_name;
    this.shrinkIndex = ()=> {

    };

    this.search = ()=> {

    };

    this.replaceRow = ()=> {

    };

    this.replaceRows = (rows, begin, end)=> {

    };

    this.deleteRows = (begin, end)=> {

    };

    this.appendRows = ()=> {

    };

    this.getLatestNRows = (n)=> {

    };

    this.getMaxIndex = ()=> {

    };

    this.getRows = (begin, end,)=> {

    };

    this.getLatestIndex = (begin, end,)=> {

    };

  };

  function ObjModel() {
    let table_name;

    this.get = (key, dict)=> {

    };

    this.search = ()=> {

    };

    this.create = (key, dict)=> {

    };

    this.replace = (key, dict)=> {

    };
  };

  function PairModel() {
    let table_name;

    this.search = ()=> {

    };

    this.get = (keypair, dict)=> {

    };

    this.getbyBoth = ()=> {

    };

    this.getbyFirst = (keypair, dict)=> {

    };

    this.getbySecond = (keypair, dict)=> {

    };

    this.create = (keypair, dict)=> {

    };

    this.replace = (keypair, dict)=> {

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
    if(_model_dict[model_name.toLowerCase()]) {
      callback(new Error('Model exist.'));
    }
    else {
      let model_type = obj_structure.model_type;
      let do_times_tamp = obj_structure.do_times_tamp;
      _db.createTable();
    }
  };

  this.get = (model_name, callback) => {

  };

  this.delete = (model_name)=> {

  };

  this.importDatabase = (db, callback)=> {
    _db = db;
    _db.isTableExist(MODEL_TABLE_NAME, (err, exist)=> {
      if(exist) {
        _db.getRows(MODEL_TABLE_NAME', '' , (error, rows)=> {
          for(let index in rows) {
            _model_dict[rows[index].name] = JSON.parse(rows[index].structure);
          };
          callback(false);
        });
      }
      else {
        _db.createTable(MODEL_TABLE_NAME, {
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
