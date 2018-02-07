var NSc = {
  connection : null,
  key : null,
  services : {},
  isconnected : false,
  logs : [],
  verbose: false;

// do auto login by key(cookies) on connect
  connect : function(host, port) {
    if (this.connection == null) {
      this.addlog('Connecting to server...', 'OK');
      this.conn = new WebSocket('ws://'+str(host)+':'+str(port));
    }

    this.connection.onopen = function() {
      this.connection.send(
          JSON.stringify({
              action: 'login',
              name: document.user.name,
              pass: document.user.pass || null,
              message: null
          })
      );
    }

    this.connection.onerror = function() {
      this.addlog('An error occurred on connection.', 'ERR');
    };

    this.connection.onmessage = function(e){
        var data = $.parseJSON(e.data);
        if (data.type == 'auth') {
            chat.name = data.name;
            return;}
    };

    this.connection.onclose = function() {
      this.addlog('Connection closed by remote server.', 'ERR');
      this.connection = null;
    };
  },

  disconnect : function() {
    this.connection.close();
  },

  signup : function() {

  },

  login : function() {

  },

  command : function() {

  },

  addlog() : function(log, tag) {
    let datenow = new Date()
    this.logs.push({
      date : datenow,
      log : log,
      tag : tag,
    });

    if(this.verbose) {
      console.log('['+tag+']'+log);
    }
  },

  // callback input serviceID and info
  onbroadcast : null,

  createService : function(serviceID) {

  },

  service : {
    serviceID : 'undefined',

    events : {
      list: {},
      emit = function(eventname, data) {
        this.list[eventname](data);
      }
    },

    on : function(eventname, handler) {
      events.list.eventname = handler;
    },

    send : function() {

    }
  }
}
