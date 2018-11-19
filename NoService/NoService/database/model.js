// NoService/NoService/database/model.js
// Description:
// "model.js" provides ORM to manage objects and database. Then you will no need
// to keep retyping sql for table.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';

const Utils = require('../library').Utilities;
const Constants = require('../constants');
const MODEL_TABLE_NAME = Constants.MODEL_TABLE_NAME;
const MODEL_TABLE_PREFIX = Constants.MODEL_TABLE_PREFIX;
const MODEL_INDEXKEY = Constants.MODEL_INDEXKEY;

function Model() {
  let _db;

  // For something like different and huge amount of groups of messages or logs need ordered index.
  function GroupIndexedListModel(table_name, model_key, structure, do_timestamp) {
    this.modeltype = 'GroupIndexedList';

    this.appendRows = (group_name, rows, callback)=> {

    };

    this.replaceRows = (group_name, rows, begin, end, callback)=> {

    };

    this.deleteRows = (group_name, begin, end, callback)=> {
    };
  };

  // For something like messages or logs need ordered index.
  function IndexedListModel(table_name, structure, do_timestamp) {
    this.modeltype = 'IndexedList';
    let model_key = 'Index';

    this.search = (keyword, callback)=> {
      let sql = '';
      sql = Objects.keys(structure).join(' LIKE '+keyword+' OR ');
      sql = sql + ' LIKE ' + keyword;
      _db.getRows(MODEL_TABLE_PREFIX+table_name, [sql, null], callback);
    };

    this.replaceRows = (rows, callback)=> {

    };

    this.updateRows = (rows, callback)=> {

    };

    this.deleteRows = (begin, end, callback)=> {

    };

    this.appendRows = (rows, callback)=> {
      let list = [];
      let data = Utils.DatetoSQL(new Date());

      for(let i in rows) {
        if(do_timestamp) {

        }
        if(Array.isArray(rows[0])) {

        }
        else {

        }
      }

      _db.appendRows(MODEL_TABLE_PREFIX+table_name, [properties_dict], null, callback);
    };

    this.getLatestNRows = (n, callback)=> {
      _db.getRows(MODEL_TABLE_PREFIX+table_name, MODEL_INDEXKEY+' >= ((SELECT max('+MODEL_INDEXKEY+') FROM '+MODEL_TABLE_PREFIX+table_name+') - ?)', [n], callback);
    };

    this.getRowsFromTo = (begin, end, callback)=> {
      _db.getRows(MODEL_TABLE_PREFIX+table_name, MODEL_INDEXKEY+' >= ? AND '+ MODEL_INDEXKEY+' <= ?', [begin, end], callback);
    };

    this.getAllRows = (callback)=> {
      _db.getAllRows(MODEL_TABLE_PREFIX+table_name, callback);
    };

    this.getLatestIndex = (callback)=> {
      _db.getRows(MODEL_TABLE_PREFIX+table_name, MODEL_INDEXKEY+' = (SELECT max('+MODEL_INDEXKEY+') FROM '+MODEL_TABLE_PREFIX+table_name+')', (err, results)=> {
        if(err) {
          callback(err);
        }
        else if(results.length) {
          callback(err, (results[0])[MODEL_INDEXKEY]);
        }
        else {
          callback(err);
        }
      });
    };

    this.addFields = (fields_dict, callback)=> {
      for(let field in fields_dict) {
        fields_dict[field] = {type: fields_dict[field]};
      }
      _db.addFields(MODEL_TABLE_PREFIX+table_name, fields_dict, callback);
    };

    this.existField = (field_name, callback)=> {
      _db.existField(MODEL_TABLE_PREFIX+table_name, field_name, callback);
    };

    this.removeFields = (fields_dict, callback)=> {
      _db.removeFields(MODEL_TABLE_PREFIX+table_name, fields_dict, callback);
    };
  };

  // For storing objects that appear often
  function ObjModel(table_name, model_key, structure, do_timestamp) {

    this.modeltype = 'Object';
    // get an instense
    this.get = (key_value, callback)=> {
      _db.getRows(MODEL_TABLE_PREFIX+table_name, model_key+'= ?', [key_value], (err, results)=> {
        if(results) {
          callback(err, results[0]);
        }
        else {
          callback(err);
        }
      });
    };

    this.search = (keyword, callback)=> {
      let sql = '';
      sql = Objects.keys(structure).join(' LIKE '+keyword+' OR ');
      sql = sql + ' LIKE ' + keyword;
      _db.getRows(MODEL_TABLE_PREFIX+table_name, [sql, null], callback);
    };

    this.create = (properties_dict, callback)=> {
      if(do_timestamp) {
        properties_dict['createdate'] = Utils.DatetoSQL(new Date());
        properties_dict['modifydate'] = Utils.DatetoSQL(new Date());
      }
      _db.appendRows(MODEL_TABLE_PREFIX+table_name, [properties_dict], null, callback);
    };

    this.replace = (properties_dict, callback)=> {
      if(do_timestamp) {
        properties_dict['modifydate'] = Utils.DatetoSQL(new Date());
      }
      _db.replaceRows(MODEL_TABLE_PREFIX+table_name,  [properties_dict], callback);
    };

    this.update = (properties_dict, callback)=> {
      this.get(properties_dict[model_key], (err, meta)=> {
        if(err) {
          callback(err);
        }
        else if(meta) {
          if(do_timestamp) {
            properties_dict['modifydate'] = Utils.DatetoSQL(new Date());
          }
          if(properties_dict[model_key]) {
            _db.updateRows(MODEL_TABLE_PREFIX+table_name, model_key+'=?', [properties_dict[model_key]], properties_dict, callback);
          }
          else {
            callback(new Error('Key "'+model_key+'" is required.'));
          }
        }
        else {
          this.create(properties_dict, callback);
        }
      });
    };

    // {property: data_type}
    this.addProperties = (properties_dict, callback)=> {
      for(let field in properties_dict) {
        properties_dict[field] = {type: properties_dict[field]};
      }
      _db.addFields(MODEL_TABLE_PREFIX+table_name, properties_dict, callback);
    };

    this.existProperty = (property_name, callback)=> {
      _db.existField(MODEL_TABLE_PREFIX+table_name, property_name, callback);
    };

    this.removeProperties = (properties_list, callback)=> {
      db.removeFields(MODEL_TABLE_PREFIX+table_name, properties_list, callback);
    };

    this.remove = (key, callback)=> {
      _db.deleteRows(MODEL_TABLE_PREFIX+table_name, model_key+'= ?', [key], callback);
    };
  };

  // For something like relation or two keys objects.
  function PairModel(table_name, model_key, structure, do_timestamp) {

    this.modeltype = 'Pair';

    this.create = (properties_dict, callback)=> {
      if(do_timestamp) {
        properties_dict['createdate'] = Utils.DatetoSQL(new Date());
        properties_dict['modifydate'] = Utils.DatetoSQL(new Date());
      }
      _db.appendRows(MODEL_TABLE_PREFIX+table_name, [properties_dict], null, callback);
    };

    this.search = (phrase, callback)=> {
      let sql = '';
      sql = Objects.keys(structure).join(' LIKE '+keyword+' OR ');
      sql = sql + ' LIKE ' + keyword;
      _db.getRows(MODEL_TABLE_PREFIX+table_name, [sql, null], callback);
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
      if(do_timestamp) {
        properties_dict['modifydate'] = Utils.DatetoSQL(new Date());
      }
      if(properties_dict[model_key[0]]||properties_dict[model_key[1]]) {
        _db.replaceRows(MODEL_TABLE_PREFIX+table_name, [properties_dict], callback);
      }
      else {
        callback(new Error('Either property "'+model_key[0]+'" or "'+model_key[1]+'" should be specified.'));
      };
    };

    //
    this.update = (properties_dict, callback)=> {
      if(do_timestamp) {
        properties_dict['modifydate'] = Utils.DatetoSQL(new Date());
      }
      if(properties_dict[model_key[0]]&&properties_dict[model_key[1]]) {
        _db.updateRows(MODEL_TABLE_PREFIX+table_name, model_key[0]+'=? AND '+model_key[1]+'=?', [properties_dict[model_key[0]], properties_dict[model_key[1]]], properties_dict, callback);
      }
      else if(properties_dict[model_key[0]]){
        _db.updateRows(MODEL_TABLE_PREFIX+table_name, model_key[0]+'=?', [properties_dict[model_key[0]]], properties_dict, callback);
      }
      else if(properties_dict[model_key[1]]) {
        _db.updateRows(MODEL_TABLE_PREFIX+table_name, model_key[1]+'=?', [properties_dict[model_key[1]]], properties_dict, callback);
      }
      else {
        callback(new Error('Either property "'+model_key[0]+'" or "'+model_key[1]+'" should be specified.'));
      }
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

    this.addProperties = (properties_dict, callback)=> {
      for(let field in properties_dict) {
        properties_dict[field] = {type: properties_dict[field]};
      }
      _db.addFields(MODEL_TABLE_PREFIX+table_name, properties_dict, callback);
    };

    this.existProperty = (property_name, callback)=> {
      _db.existField(MODEL_TABLE_PREFIX+table_name, property_name, callback);
    };

    this.removeProperty = (properties_list, callback)=> {
      _db.removeFields(MODEL_TABLE_PREFIX+table_name, properties_list, callback);
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

          field_structure[model_key].iskey = true;
          field_structure[model_key].notnull = true;

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
                  callback(err, new ObjModel(model_name, model_key, structure, do_timestamp));
                }
              });
            }
          });
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
      if(results.length) {
        let model_structure = JSON.parse(results[0].structure);
        let model_type = model_structure.model_type;
        let do_timestamp = model_structure.do_timestamp;
        let model_key = model_structure.model_key;
        let structure = model_structure.structure;
        if(model_type == 'Object') {
          callback(err, new ObjModel(model_name, model_key, structure, do_timestamp));
        }
        else if (model_type == 'IndexedList') {
          callback(err, new IndexedListModel(model_name, model_key, structure, do_timestamp));
        }
        else if (model_type == 'Pair') {
          callback(err, new PairModel(model_name, model_key, structure, do_timestamp));
        }
      }
      else {
        callback(new Error('Model note exist!'));
      }
    });
  };

  this.exist = (model_name, callback)=> {
    _db.existTable(MODEL_TABLE_PREFIX+model_name, callback);
  };

  this.importDatabase = (db, callback)=> {
    _db = db;
    _db.existTable(MODEL_TABLE_NAME, (err, exist)=> {
      if(err) {
        callback(err);
      }
      else if(!exist) {
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

  this.close = ()=> {
    _db = null;
  };
}

module.exports = Model;
