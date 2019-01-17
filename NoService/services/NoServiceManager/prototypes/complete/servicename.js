// {{ servicename }}.js
// Description:
// "{{ servicename }}.js" is a extension module for {{ servicename }}.
// Copyright 2018 NOOXY. All Rights Reserved.

'use strict';
let models_dict = require('./models.json')

function {{ servicename }}(Me, NoService) {
  let Settings = Me.Settings;
  let _models;
  let _on_handler = {};

  // define you own funciton to be called in entry.js
  this.whateverfunction = (callback)=> {
    callback(false, 'haha');

    // call onwhateverfunction_called handler
    if(_on_handler['whateverfunction_called'])
      _on_handler['whateverfunction_called']();
  };

  // on event register
  this.on = (event, callback)=> {
    _on_handler[event] = callback;
  };

  this.launch = (callback)=> {
    NoService.Database.Model.doBatchSetup(models_dict, (err, models)=> {
      _models = models;
      if(callback)
        callback(err);
    });
  };

  this.close = ()=> {

  };
}

module.exports = {{ servicename }};
