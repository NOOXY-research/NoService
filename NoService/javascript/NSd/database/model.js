// NoService/NSd/model.js
// Description:
// "model.js" provides ORM to manage objects and database.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';
const MODEL_TABLE_NAME = 'NSModels';
const MODEL_TABLE_PREFIX = 'NSModel_';

function Model() {
  let _db;
  let _models_dict = {};

  let _load_models_dict = ()=> {

  };

  function IndexedListModel() {
    let table_name;
    let structure;

    this.search = (callback)=> {

    };

    this.replaceRows = (rows, begin, end, callback)=> {

    };

    this.removeRows = (begin, end, callback)=> {

    };

    this.appendRows = (rows, callback)=> {
      if(Array.isArray(rows[0])) {

      }
      else {

      }
    };

    this.getLatestNRows = (n, callback)=> {

    };

    this.getMaxIndex = (callback)=> {

    };

    this.getRows = (begin, end,)=> {

    };

    this.getLatestIndex = (begin, end,)=> {

    };

    this.addField = ()=> {

    };

    this.hasField = ()=> {

    };

    this.removeField = ()=> {

    };

  };

  function ObjModel() {
    let table_name;

    // get an instense
    this.get = (key, callback)=> {

    };

    this.search = ()=> {

    };

    this.create = (key, dict)=> {

    };

    this.replace = (key, dict)=> {

    };

    this.addProperty = ()=> {

    };

    this.hasProperty = ()=> {

    };

    this.removeProperty = ()=> {

    };
  };

  function PairModel() {
    let table_name;

    this.search = (phrase, callback)=> {

    };

    this.getbyPair = (pair, callback)=> {

    };

    this.getbyFirst = (first, callback)=> {

    };

    this.getbySecond = (second, callback)=> {

    };

    this.create = (keypair, dict, callback)=> {

    };

    this.replace = (keypair, dict, callback)=> {

    };

    this.addProperty = (name, type, callback)=> {

    };

    this.hasProperty = (name, callback)=> {

    };

    this.removeProperty = ()=> {

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

  this.remove = (model_name, callback)=> {

  };

  this.define = (model_name, obj_structure, callback)=> {
    if(_models_dict[model_name.toLowerCase()]) {
      callback(new Error('Model exist.'));
    }
    else {
      let model_type = obj_structure.model_type;
      let do_times_tamp = obj_structure.do_times_tamp;
      _db.createTable(, ()=> {
        _models_dict[model_name] = 'bla';
      });
    }
  };

  this.get = (model_name, callback) => {

  };

  this.importDatabase = (db, callback)=> {
    _db = db;
    _db.isTableExist(MODEL_TABLE_NAME, (err, exist)=> {
      if(exist) {
        _db.getRows(MODEL_TABLE_NAME', '' , (error, rows)=> {
          for(let index in rows) {
            _models_dict[rows[index].name] = JSON.parse(rows[index].structure);
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
