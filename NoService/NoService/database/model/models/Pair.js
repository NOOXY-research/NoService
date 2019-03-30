// NoService/NoService/database/models/Pair.js
// Description:
// "Pair.js" For something like relation or two keys objects.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';


let Utils = require('../../../library').Utilities;


function PairModel(db, table_name, model_key, structure, do_timestamp) {

  this.modeltype = 'Pair';
  this.ModelType = this.modeltype;

  this.create = (properties_dict, callback)=> {
    if(do_timestamp) {
      properties_dict['createdate'] = Utils.DatetoSQL(new Date());
      properties_dict['modifydate'] = Utils.DatetoSQL(new Date());
    }
    db.appendRows(table_name, [properties_dict], callback);
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

  this.getAll = (callback)=> {
    db.getAllRows(table_name, callback);
  };

  // return list
  this.getByPair = (pair, callback)=> {
    db.getRows(table_name, model_key[0]+' LIKE ? AND '+model_key[1]+' LIKE ?', pair, (err, results)=> {
      callback(err, results);
    });
  };

  // return list
  this.getByBoth = (both, callback)=> {
    db.getRows(table_name, model_key[0]+' LIKE ? OR '+model_key[1]+' LIKE ?', [both, both], (err, results)=> {
      callback(err, results);
    });
  };

  // return list
  this.getByFirst = (first, callback)=> {
    db.getRows(table_name, model_key[0]+' LIKE ?', [first], (err, results)=> {
      callback(err, results);
    });
  };

  // return list
  this.getBySecond = (second, callback)=> {
    db.getRows(table_name, model_key[1]+' LIKE ?', [second], (err, results)=> {
      callback(err, results);
    });
  };

  // return list
  this.replace = (properties_dict, callback)=> {
    if(do_timestamp) {
      properties_dict['modifydate'] = Utils.DatetoSQL(new Date());
    }
    if(properties_dict[model_key[0]]||properties_dict[model_key[1]]) {
      db.replaceRows(table_name, [properties_dict], callback);
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
      db.updateRows(table_name, model_key[0]+' LIKE ? AND '+model_key[1]+' LIKE ?', [properties_dict[model_key[0]], properties_dict[model_key[1]]], properties_dict, callback);
    }
    else if(properties_dict[model_key[0]]){
      db.updateRows(table_name, model_key[0]+' LIKE ?', [properties_dict[model_key[0]]], properties_dict, callback);
    }
    else if(properties_dict[model_key[1]]) {
      db.updateRows(table_name, model_key[1]+' LIKE ?', [properties_dict[model_key[1]]], properties_dict, callback);
    }
    else {
      callback(new Error('Either property "'+model_key[0]+'" or "'+model_key[1]+'" should be specified.'));
    }
  };

  this.removeByPair = (pair, callback)=> {
    db.deleteRows(table_name, model_key[0]+' LIKE ? AND '+model_key[1]+' LIKE ?', pair, callback);
  };

  this.removeByBoth = (both, callback)=> {
    db.deleteRows(table_name, model_key[0]+' LIKE ? OR '+model_key[1]+' LIKE ?', [both, both], callback);
  };

  this.removeByFirst = (first, callback)=> {
    db.deleteRows(table_name, model_key[0]+' LIKE ?', [first], callback);
  };

  this.removeBySecond = (second, callback)=> {
    db.deleteRows(table_name, model_key[1]+' LIKE ?', [second], callback);
  };

  this.addProperties = (properties_dict, callback)=> {
    for(let field in properties_dict) {
      properties_dict[field] = {type: properties_dict[field]};
    }
    db.addFields(table_name, properties_dict, callback);
  };

  this.existProperty = (property_name, callback)=> {
    db.existField(table_name, property_name, callback);
  };

  this.removeProperty = (properties_list, callback)=> {
    db.removeFields(table_name, properties_list, callback);
  };
};

module.exports = PairModel;
