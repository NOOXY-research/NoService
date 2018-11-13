// NoService/NSd/model.js
// Description:
// "model.js" provides ORM to manage objects and database. Then you will no need
// to keep retyping sql for table.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';
const MODEL_TABLE_NAME = 'NSModels';
const MODEL_TABLE_PREFIX = 'NSModel_';

function Model() {
  let _db;
  let _models_dict = {};

  let _load_models_dict = ()=> {

  };

  let _update_models_dict = (new_structure)=> {

  }

  function IndexedListModel(table_name, structure) {

    this.search = (keyword, callback)=> {
      _db.getRows(table_name, 'category LIKE '+keyword+'OR location LIKE '+keyword+'', );
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

  function ObjModel(table_name, structure, do_timestamp) {
    let key = ;
    // get an instense
    this.get = (key_value, callback)=> {
      _db.getRows(table_name, 'KEY = ?', [key_value], (err, results)=> {
        callback(err, results[0]);
      });
    };

    this.search = (keyword, callback)=> {
      let sql = '';
      sql = Objects.keys(structure).join(' LIKE '+keyword+' OR ');
      sql = sql + ' LIKE ' + keyword;
      _db.getRows(table_name, [sql, null], callback);
    };

    this.create = (dict, callback)=> {
      _db.addUniqueRow(table_name, dict, callback);
    };

    this.replace = (dict, callback)=> {
      _db.replaceRow(table_name, dict, 'KEY =', callback);
    };

    this.addProperties = ()=> {
      _db.addFields();
    };

    this.hasProperty = ()=> {
      _db.hadField();
    };

    this.removeProperties = ()=> {
      _db.removeFields();
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

  this.remove = (model_name, callback)=> {

  };

  // example:
  // {
  //    modeltype: "Object",
  //    do_timestamp: true,
  //    model_key: 'username',
  //    structure: {
  //      username: 'text',
  //      height: 'int'
  //    }
  // }
  //

  // example:
  // {
  //    modeltype: "Pair",
  //    do_timestamp: false,
  //    model_key: ['u1', 'u2'],
  //    structure: {
  //      u1: 'text',
  //      u2: 'text',
  //      content: 'text'
  //    }
  // }
  //

  this.define = (model_name, model_structure, callback)=> {
    if(_models_dict[model_name.toLowerCase()]) {
      callback(new Error('Model exist.'));
    }
    else {
      let model_type = model_structure.model_type;
      let do_times_tamp = model_structure.do_timestamp;
      let structure = model_structure.structure;

      if(model_type == 'Object') {

        _db.createTable(MODEL_TABLE_PREFIX+model_name, ()=> {
          _models_dict[model_name] = 'bla';
        });
      }
      else if (model_type == 'IndexedList') {

      }
      else if (model_type == 'Pair') {

      }
      else {
        callback(new Error('Model type "'+modeltype+'" not supposed.'));
      };

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
