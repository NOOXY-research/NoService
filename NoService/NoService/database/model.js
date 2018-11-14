// NoService/NSd/model.js
// Description:
// "model.js" provides ORM to manage objects and database. Then you will no need
// to keep retyping sql for table.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';
const MODEL_TABLE_NAME = 'NoService_Models';
const MODEL_TABLE_PREFIX = 'NoService_Model_';
const Utils = require('../utilities');

function Model() {
  let _db;

  // For something like messages or logs.
  function IndexedListModel(table_name, model_key, structure, do_timestamp) {

    this.search = (keyword, callback)=> {
      _db.getRows(table_name, 'category LIKE '+keyword+'OR location LIKE '+keyword+'', );
    };

    this.replaceRows = (rows, begin, end, callback)=> {

    };

    this.deleteRows = (begin, end, callback)=> {

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

    this.getAllRows = (callback)=> {

    };

    this.getLatestIndex = (begin, end,)=> {

    };

    this.addField = ()=> {

    };

    this.existField = ()=> {

    };

    this.removeField = ()=> {

    };

  };

  // For storing objects that appear often
  function ObjModel(table_name, model_key, structure, do_timestamp) {
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

    this.addProperties = (properties_dict, callback)=> {
      for(let field in properties_dict) {
        properties_dict[field] = {type: properties_dict[field]};
      }
      _db.addFields(table_name, properties_dict, callback);
    };

    this.existProperty = (property_name, callback)=> {
      _db.hadField(table_name, property_name, callback);
    };

    this.removeProperties = (properties_list)=> {
      _db.removeFields(table_name);
    };

    this.remove = ()=> {

    };
  };

  // For something like relation or two keys objects.
  function PairModel(table_name, model_key, structure, do_timestamp) {

    this.create = (properties_dict, callback)=> {
      properties_dict['createdate'] = Utils.DatetoSQL(new Date());
      properties_dict['modifydate'] = Utils.DatetoSQL(new Date());
      _db.appendRows(MODEL_TABLE_PREFIX+table_name, [properties_dict], null, callback);
    };

    this.search = (phrase, callback)=> {

    };

    // return list
    this.getbyPair = (pair, callback)=> {
      _db.getRows(MODEL_TABLE_PREFIX+table_name, model_key[0]+'= ? AND '+model_key[1]+'= ?', pair, (err, results)=> {
        callback(err, results);
      });
    };

    // return list
    this.getbyBoth = (both, callback)=> {
      _db.getRows(MODEL_TABLE_PREFIX+table_name, model_key[0]+'= ? OR '+model_key[1]+'= ?', [both, both], (err, results)=> {
        callback(err, results);
      });
    };

    // return list
    this.getbyFirst = (first, callback)=> {
      _db.getRows(MODEL_TABLE_PREFIX+table_name, model_key[0]+'= ?', [first], (err, results)=> {
        callback(err, results);
      });
    };

    // return list
    this.getbySecond = (second, callback)=> {
      _db.getRows(MODEL_TABLE_PREFIX+table_name, model_key[1]+'= ?', [second], (err, results)=> {
        callback(err, results);
      });
    };

    // return list
    this.replace = (properties_dict, callback)=> {
      properties_dict['modifydate'] = Utils.DatetoSQL(new Date());
      if(properties_dict[model_key[0]]||properties_dict[model_key[1]]) {
        _db.replaceRows(MODEL_TABLE_PREFIX+table_name, [properties_dict], callback);
      }
      else {
        callback(new Error('Either property "'+model_key[0]+'" or "'+model_key[1]+'" should be specified.'));
      }
    };

    //
    this.update = ()=> {
      properties_dict['modifydate'] = Utils.DatetoSQL(new Date());
    };

    this.removebyPair = (pair, callback)=> {
      _db.deleteRows(MODEL_TABLE_PREFIX+table_name, model_key[0]+'= ? AND '+model_key[1]+'= ?', pair, callback);
    };

    this.removebyBoth = (both, callback)=> {
      _db.deleteRows(MODEL_TABLE_PREFIX+table_name, model_key[0]+'= ? OR '+model_key[1]+'= ?', [both, both], callback);
    };

    this.removebyFirst = (first, callback)=> {
      _db.deleteRows(MODEL_TABLE_PREFIX+table_name, model_key[0]+'= ?', [first], callback);
    };

    this.removebySecond = (second, callback)=> {
      _db.deleteRows(MODEL_TABLE_PREFIX+table_name, model_key[1]+'= ?', [second], callback);
    };

    this.addProperty = (name, type, callback)=> {
      let structure = {};
      structure[name] = type;
      _db.createFields(MODEL_TABLE_PREFIX+table_name, structure, callback);
    };

    this.existProperty = (name, callback)=> {
      _db.existField(MODEL_TABLE_PREFIX+table_name, name, callback);
    };

    this.removeProperty = (name, callback)=> {
      _db.createFields(MODEL_TABLE_PREFIX+table_name, [name], callback);
    };
  };


  this.remove = (model_name, callback)=> {
    _db.dropTable(MODEL_TABLE_PREFIX+model_name, (err)=> {
      if(err) {
        callback(err);
      }
      else {
        _db.deleteRows(MODEL_TABLE_NAME, 'name=?', [model_name], (err)=> {
          callback(err);
        });
      }
    });
  };

  // example:
  // {
  //    model_type: "Object",
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
  //    model_type: "Pair",
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
    let model_type = model_structure.model_type;
    let do_timestamp = model_structure.do_timestamp;
    let model_key = model_structure.model_key;
    let structure = model_structure.structure;
    _db.existTable(MODEL_TABLE_PREFIX+model_name, (err, exist)=> {
      if(exist) {
        callback(new Error('Model exist.'));
      }
      else {
        if(model_type == 'Object') {

        }
        else if (model_type == 'IndexedList') {
        }
        else if (model_type == 'Pair') {
          let field_structure = {};
          if(do_timestamp) {
            structure['createdate'] = 'DATETIME';
            structure['modifydate'] = 'DATETIME';
          }
          for(let field in structure) {
            field_structure[field] = {
              type: structure[field]
            };
          }
          field_structure[model_key[0]].iskey = true;
          field_structure[model_key[0]].notnull = true;
          field_structure[model_key[1]].iskey = true;
          field_structure[model_key[1]].notnull = true;

          _db.createTable(MODEL_TABLE_PREFIX+model_name, field_structure, (err)=> {
            if(err) {
              callback(err);
            }
            else {
              _db.replaceRows(MODEL_TABLE_NAME, [{
                name: model_name,
                structure: JSON.stringify(model_structure)
              }], (err)=> {
                if(err) {
                  callback(err);
                }
                else {
                  callback(err, new PairModel(model_name, model_key, structure, do_timestamp));
                }
              });
            }
          });
        }
        else {
          callback(new Error('Model type "'+modeltype+'" not supposed.'));
        };
      }
    });
  };

  this.get = (model_name, callback) => {
    _db.getRows(MODEL_TABLE_NAME, 'name = ?', [model_name], (err, results)=> {
      let model_structure = JSON.parse(results[0].structure);
      let model_type = model_structure.model_type;
      let do_timestamp = model_structure.do_timestamp;
      let model_key = model_structure.model_key;
      let structure = model_structure.structure;
      if(model_type == 'Object') {

      }
      else if (model_type == 'IndexedList') {
      }
      else if (model_type == 'Pair') {
        callback(err, new PairModel(model_name, model_key, structure, do_timestamp));
      }
    });
  };

  this.exist = (model_name, callback)=> {
    _db.existTable(MODEL_TABLE_PREFIX+model_name, callback);
  };

  this.importDatabase = (db, callback)=> {
    _db = db;
    _db.existTable(MODEL_TABLE_NAME, (err, exist)=> {
      if(!exist) {
        _db.createTable(MODEL_TABLE_NAME, {
          name: {
            type: 'VARCHAR(255)',
            iskey: true,
            notnull: true
          },

          structure: {
            type: 'TEXT'
          }
        }, (error)=> {
          callback(error);
        });
      }
      else {
        callback(err);
      }
    });
  };

}

module.exports = Model;
