// NoUser.js
// Description:
// "NoUser.js" is a advanced user system for NoService.
// Copyright 2018 NOOXY. All Rights Reserved.

let Utils;
'use strict';

const USER_MODEL_NAME = 'User';
// the nouser module
function NoUser() {
  let _model_module;
  let _user_model;
  let countries;

  // import database from specified path
  this.importModel = (model, callback)=> {
    _model_module = model;
    model.exist(USER_MODEL_NAME, (err, has_model)=> {
      if(err) {
        callback(err);
      }
      else if(!has_model) {
        model.define(USER_MODEL_NAME, {
          model_type: "Object",
          do_timestamp: true,
          model_key: "userid",
          structure: {
            userid: 'VARCHAR(255)',
            email: 'VARCHAR(320)',
            gender: 'VARCHAR(1)',
            address: 'TEXT',
            phonenumber: 'VARCHAR(50)',
            birthday: 'DATE',
            country: 'VARCHAR(160)',
            aboutme: 'TEXT'
          }
        }, (err, user_model)=> {
          _user_model = user_model;
          callback(err);
        });
      }
      else {
        model.get(USER_MODEL_NAME, (err, user_model)=> {
          _user_model = user_model;
          callback(false);
        });
      }
    });
  };

  this.importUtils = (utils)=> {
    Utils = utils;
  };

  // import countries by list
  this.importCountries = (list) => {
    countries = list;
  };

  this.getUserMeta = (userid, callback) => {
    _user_model.get(userid, (err, user) => {
      if(user) {
        let user_meta = {
          userid: user.userid,
          email: user.email,
          gender : user.gender,
          phonenumber : user.phonenumber,
          birthday : user.birthday,
          country : user.country,
          address : user.address,
          aboutme : user.aboutme
        }
        try {
          user_meta.gender = user_meta.gender.replace('M', 'male');
          user_meta.gender = user_meta.gender.replace('F', 'female');
          user_meta.gender = user_meta.gender.replace('O', 'other');
        }
        catch(e) {

        }
        callback(false, user_meta);
      }
      else {
        callback(false, null);
      }

    });
  };

  this.updateUser = (userid, jsondata, callback) => {
    let pwdhash = null;
    try {
      jsondata.gender = jsondata.gender.replace('female', 'F');
      jsondata.gender = jsondata.gender.replace('male', 'M');
      jsondata.gender = jsondata.gender.replace('other', 'O');
    }
    catch (e) {

    }
    try{
      if(!Utils.validateEmail(jsondata.email)) {
        let err = new Error("Email invalid.");
        callback(err);
      }
      else if(jsondata.gender!='M'&&jsondata.gender!='F'&&jsondata.gender!='O') {
        let err = new Error("Gender invalid.");
        callback(err);
      }
      else if(isNaN(Date.parse(jsondata.birthday))) {
        let err = new Error("Birthday invalid.");
        callback(err);
      }
      else if(!countries.includes(jsondata.country)) {
        let err = new Error("Country invalid.");
        callback(err);
      }
      else {
        _user_model.update({
          userid: userid,
          email:  jsondata.email,
          gender: jsondata.gender,
          phonenumber: jsondata.phonenumber,
          birthday: jsondata.birthday,
          country: jsondata.country,
          address: jsondata.address,
          aboutme: jsondata.aboutme
        }, callback);
      }
    }
    catch (e) {
      callback(e);
    }
  };

  this.sendNotification = ()=> {

  };

  this.sendMail = ()=> {
    
  };

  this.deleteUser = (userid, callback) => {
    _user_model.remove(userid, callback);
  };

  this.close = () => {
    _model_module.close();
  };

};
module.exports = NoUser;
