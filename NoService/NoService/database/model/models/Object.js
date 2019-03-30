// NoService/NoService/database/models/Object.js
// Description:
// "Object.js" For storing objects
// Copyright 2018-2019 NOOXY. All Rights Reserved.

Utils = require('../../../library').Utilities;

function ObjModel(db, table_name, model_key, structure, do_timestamp) {

  this.modeltype = 'Object';
  this.ModelType = this.modeltype;
  // get an instense
  this.get = (key_value, callback)=> {
    db.getRows(table_name, model_key+' LIKE ?', [key_value], (err, results)=> {
      if(results) {
        callback(err, results[0]);
      }
      else {
        callback(err);
      }
    });
  };

  this.getAll = (callback)=> {
    db.getAllRows(table_name, callback);
  };

  this.getWhere = (where, query_values, callback)=> {
    db.getRows(table_name, where, query_values, (err, results)=> {
      if(results) {
        callback(err, results);
      }
      else {
        callback(err);
      }
    });
  };

  this.searchAll = (keyword, callback)=> {
    let sql = '';
    let column_list = Object.keys(structure);
    sql = column_list.join(' LIKE ? OR ');
    sql = sql + ' LIKE ?';
    db.getRows(table_name, sql, column_list.map(v=>{return keyword}), callback);
  };

  this.searchColumns = (column_list, keyword, callback)=> {
    let sql = '';
    sql = column_list.join(' LIKE ? OR ');
    sql = sql + ' LIKE ?';
    db.getRows(table_name, sql, column_list.map(v=>{return keyword}), callback);
  };

  this.searchAllNRows = (keyword, N, callback)=> {
    let sql = '';
    let column_list = Object.keys(structure);
    sql = column_list.join(' LIKE ? OR ');
    sql = sql + ' LIKE ?';
    db.getRowsTopNRows(table_name, sql, column_list.map(v=>{return keyword}), N, callback);
  };

  this.searchColumnsNRows = (column_list, keyword, N, callback)=> {
    let sql = '';
    sql = column_list.join(' LIKE ? OR ');
    sql = sql + ' LIKE ?';
    db.getRowsTopNRows(table_name, sql, column_list.map(v=>{return keyword}), N, callback);
  };

  this.create = (properties_dict, callback)=> {
    if(do_timestamp) {
      properties_dict['createdate'] = Utils.DatetoSQL(new Date());
      properties_dict['modifydate'] = Utils.DatetoSQL(new Date());
    }
    db.appendRows(table_name, [properties_dict], callback);
  };

  this.replace = (properties_dict, callback)=> {
    if(do_timestamp) {
      properties_dict['modifydate'] = Utils.DatetoSQL(new Date());
    }
    db.replaceRows(table_name,  [properties_dict], callback);
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
          db.updateRows(table_name, model_key+' LIKE ?', [properties_dict[model_key]], properties_dict, callback);
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
    db.addFields(table_name, properties_dict, callback);
  };

  this.existProperty = (property_name, callback)=> {
    db.existField(table_name, property_name, callback);
  };

  this.removeProperties = (properties_list, callback)=> {
    db.removeFields(table_name, properties_list, callback);
  };

  this.remove = (key, callback)=> {
    db.deleteRows(table_name, model_key+' LIKE ?', [key], callback);
  };
};


module.exports = ObjModel;
