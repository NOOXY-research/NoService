// {{ servicename }}.js
// Description:
// "{{ servicename }}.js" is a extension module for {{ servicename }}.
// Copyright 2018 NOOXY. All Rights Reserved.

let Library;
let Model;
let Settings;

'use strict';

function {{ servicename }}() {
  let _on_handler = {};

  // import model from API in entry.js
  this.importModel = (model)=> {
    Model = model;
  };

  // import library from API in entry.js
  this.importLibrary = (library)=> {
    Library = library;
  };

  // import settings from API in entry.js
  this.importSettings = (settings)=> {
    Settings = settings;
  };

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
  }

  this.close = ()=> {

  };
}

module.exports = {{ servicename }};
