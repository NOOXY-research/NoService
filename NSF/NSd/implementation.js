// NSF/NSd/implementation.js
// Description:
// "implementation.js" provides manager to manage implemented functions which need to be
// implemented by service owner itself.
// Copyright 2018 NOOXY. All Rights Reserved.

function Implementation() {
  let _implts = {};

  this.setImplement = (name, callback) => {
    _implts[name] = callback;
  };

  this.callImplement = (name, callback) => {
    _implts[name](callback);
  };
}

module.exports = Implementation;
