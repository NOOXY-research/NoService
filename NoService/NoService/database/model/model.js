// NoService/NoService/database/model.js
// Description:
// "model.js" provides ORM to manage objects and database. Then you will no need
// to keep retyping sql for table.
// Copyright 2018-2019 NOOXY. All Rights Reserved.

// TODO:
// 1. plugin support for adding model module
//

'use strict';

const ObjModel = require('./models/Object');
const PairModel = require('./models/Pair');
const IndexedListModel = require('./models/IndexedList');
const GroupIndexedListModel = require('./models/GroupIndexedList');

function Model() {
  let _db;
  let _TableName;
  let _TablePrefix;
  let _Indexkey;
  let _Groupkey;

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
    try {
      let model_type = model_structure.model_type;
      let do_timestamp = model_structure.do_timestamp;
      let model_key = model_structure.model_key;
      let structure = model_structure.structure;
      _db.existTable(_TablePrefix+model_name, (err, exist)=> {
        if(exist) {
          callback(new Error('Model "'+model_name+'" exist.'));
        }
        else {
          if(model_type === 'Object') {
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

            _db.createTable(_TablePrefix+model_name, false, field_structure, (err)=> {
              if(err) {
                callback(err);
              }
              else {
                _db.replaceRows(_TableName, [{
                  name: model_name,
                  structure: JSON.stringify(model_structure)
                }], (err)=> {
                  if(err) {
                    callback(err);
                  }
                  else {
                    callback(err, new ObjModel(_db, _TablePrefix+model_name, model_key, structure, do_timestamp));
                  }
                });
              }
            });
          }
          else if (model_type === 'IndexedList') {
            let field_structure = {};
            let a = {};
            a[_Indexkey] = 'INTEGER';

            structure = Object.assign({}, a, structure);
            if(do_timestamp) {
              structure['createdate'] = 'DATETIME';
              structure['modifydate'] = 'DATETIME';
            }

            for(let field in structure) {
              field_structure[field] = {
                type: structure[field]
              };
            }

            field_structure[_Indexkey].iskey = true;
            field_structure[_Indexkey].notnull = true;
            field_structure[_Indexkey].autoincrease = true;

            _db.createTable(_TablePrefix+model_name, true, field_structure, (err)=> {
              if(err) {
                callback(err);
              }
              else {
                _db.replaceRows(_TableName, [{
                  name: model_name,
                  structure: JSON.stringify(model_structure)
                }], (err)=> {
                  if(err) {
                    callback(err);
                  }
                  else {
                    callback(err, new IndexedListModel(_db, _TablePrefix+model_name, _Indexkey, structure, do_timestamp));
                  }
                });
              }
            });
          }
          else if (model_type === 'GroupIndexedList') {
            let field_structure = {};
            let a = {};
            a[_Groupkey] = 'VARCHAR(128)';
            a[_Indexkey] = 'INTEGER';

            structure = Object.assign({}, a, structure);
            if(do_timestamp) {
              structure['createdate'] = 'DATETIME';
              structure['modifydate'] = 'DATETIME';
            }

            for(let field in structure) {
              field_structure[field] = {
                type: structure[field]
              };
            }

            field_structure[_Groupkey].iskey = true;
            field_structure[_Groupkey].notnull = true;

            field_structure[_Indexkey].iskey = true;
            field_structure[_Indexkey].notnull = true;
            field_structure[_Indexkey].autoincrease = true;

            _db.createTable(_TablePrefix+model_name, true, field_structure, (err)=> {
              if(err) {
                callback(err);
              }
              else {
                _db.replaceRows(_TableName, [{
                  name: model_name,
                  structure: JSON.stringify(model_structure)
                }], (err)=> {
                  if(err) {
                    callback(err);
                  }
                  else {
                    callback(err, new GroupIndexedListModel(_db, _TablePrefix+model_name, _Indexkey, _Groupkey, structure, do_timestamp));
                  }
                });
              }
            });
          }
          else if (model_type === 'Pair') {
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

            _db.createTable(_TablePrefix+model_name, false, field_structure, (err)=> {
              if(err) {
                callback(err);
              }
              else {
                _db.replaceRows(_TableName, [{
                  name: model_name,
                  structure: JSON.stringify(model_structure)
                }], (err)=> {
                  if(err) {
                    callback(err);
                  }
                  else {
                    callback(err, new PairModel(_db, _TablePrefix+model_name, model_key, structure, do_timestamp));
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
    }
    catch(e) {
      callback(e);
    }
  };

  this.remove = (model_name, callback)=> {
    _db.dropTable(_TablePrefix+model_name, (err)=> {
      if(err) {
        callback(err);
      }
      else {
        _db.deleteRows(_TableName, 'name LIKE ?', [model_name], (err)=> {
          callback(err);
        });
      }
    });
  };

  this.get = (model_name, callback) => {
    _db.getRows(_TableName, 'name = ?', [model_name], (err, results)=> {
      if(results.length) {
        let model_structure = JSON.parse(results[0].structure);
        let model_type = model_structure.model_type;
        let do_timestamp = model_structure.do_timestamp;
        let model_key = model_structure.model_key;
        let structure = model_structure.structure;
        if(model_type === 'Object') {
          callback(err, new ObjModel(_db, _TablePrefix+model_name, model_key, structure, do_timestamp));
        }
        else if (model_type === 'IndexedList') {
          callback(err, new IndexedListModel(_db, _TablePrefix+model_name, _Indexkey, structure, do_timestamp));
        }
        else if (model_type === 'GroupIndexedList') {
          callback(err, new GroupIndexedListModel(_db, _TablePrefix+model_name, _Indexkey, _Groupkey, structure, do_timestamp));
        }
        else if (model_type === 'Pair') {
          callback(err, new PairModel(_db, _TablePrefix+model_name, model_key, structure, do_timestamp));
        }
      }
      else {
        callback(new Error('Model note exist!'));
      }
    });
  };

  this.exist = (model_name, callback)=> {
    _db.existTable(_TablePrefix+model_name, callback);
  };

  this.getModelsDict = (callback)=> {
    _db.getAllRows(_TableName, (err, results)=> {
      if(err) {
        callback(err);
      }
      else {
        let dict = {};
        for(let i in results) {
          dict[results[i].name] = JSON.parse(results[i].structure);
        }
        callback(err, dict);
      }
    });
  };

  this.doBatchSetup = (models_dict, callback) => {
    let models_list = Object.keys(models_dict);
    let result = {};
    let index = 0;
    let op = ()=> {

      this.exist(models_list[index], (err, has_model)=> {
        if(err) {
          callback(err);
        }
        else if(!has_model) {
          this.define(models_list[index], models_dict[models_list[index]], (err, model)=> {
            result[models_list[index]] = model;
            index++;
            if(index<models_list.length) {
              op();
            }
            else {
              callback(false, result);
            }
          });
        }
        else {
          this.get(models_list[index], (err, model)=> {
            result[models_list[index]] = model;
            index++;
            if(index<models_list.length) {
              op();
            }
            else {
              callback(false, result);
            }
          });
        }
      });
    }
    op();
  }

  this.importDatabase = (db, callback)=> {
    _db = db;
    _db.existTable(_TableName, (err, exist)=> {
      if(err) {
        callback(err);
      }
      else if(!exist) {
        _db.createTable(_TableName, false,{
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


  this.setTableName = (value)=> {_TableName = value};
  this.setTablePrefix = (value)=> {_TablePrefix = value};
  this.setIndexkey = (value)=> {_Indexkey = value};
  this.setGroupkey = (value)=> {_Groupkey = value};

  this.close = ()=> {
    _db = null;
  };

}

module.exports = Model;
