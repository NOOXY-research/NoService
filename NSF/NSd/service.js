// NSF/NSd/services.js
// Description:
// "services.js" provide library of services stuff.
// Copyright 2018 NOOXY. All Rights Reserved.


function Service(user, client) {
  _services = {};

  function ServiceObj() {
    let _entity_id = null;
    let _service_socket = null;
    let _service_path = null;

    this.launch = () => {

    };

    this.setupSocket = (SSocket) => {
      _service_socket = SSocket;
    };

    this.setupPath = (path) => {
      _service_path = path;
    };

    this.onSSMessage = (callback) => {
      
    };
  };

  function ServiceSocket() {
    let _send_handler = null;
    let _mode = null;

    this.launch = () => {

    };

    this.setup = () => {

    };

    this.send = () => {

    };

    this.onData = () => {

    };
  };

  function ActivitySocket() {
    let _send_handler = null;
    let _mode = null;

    this.launch = () => {

    };

    this.setup = () => {

    };

    this.send = () => {

    };

    this.onData = () => {

    };
  };

  this.ServiceHandler = () => {

  }
}

module.exports = Service;
