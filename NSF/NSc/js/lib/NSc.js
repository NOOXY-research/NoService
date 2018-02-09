var NSc = {
  connection : null,
  key : null,
  services : {},
  isconnected : false,
  logs : [],
  verbose: false,
  _debug : false,
  debug : function(handler) {
    if(this.debug) {
      handler();
    }
  },

  // The method definitions of NSF, emitter, response, and request handler.
  methods : {
    _sessionnotsupport : function(data) {
      // session means which state we treat data as remote is requesting or responding.
      this.addlog('The session does not support with this method in client.', 'ERR');
      this.addLog(str(data), 'ERR');
    }
    _senddata: function(method, session, data) {
      var wrapped = JSON.stringify({
        method : method,
        session : session,
        data : data,
      });
      this.connection.send(wrapped);
    }

    signup : {

    },

    login : {
      emitter : function(username, password, reshandler) {
        this.handler.res = reshandler;
      },

      handler : function(data) {
        let sessions = {
          req : function(data) {
            NSc.method._sessionnotsupport();
          },
          res : function(data) {

          }
        }
        sessions[data.session](data);
      }
    },

    command : {

    }
  },

// do auto login by key(cookies) on connect
  connect : function(host, port) {
    if (this.connection == null) {
      this.addlog('Connecting to server...', 'OK');
      this.connection = new WebSocket('ws://'+str(host)+':'+str(port));
    }

    this.connection.onopen = function() {
      this.addlog('Connection established.', 'OK');
    }

    this.connection.onerror = function() {
      this.addlog('An error occurred on connection.', 'ERR');
    };

    this.connection.onmessage = function(e){
        var data = $.parseJSON(e.data);
        this.method[data.method].handler(data);
    };

    this.connection.onclose = function() {
      this.addlog('Connection closed by remote server.', 'ERR');
      this.connection = null;
    };
  },

  disconnect : function() {
    this.connection.close();
  },

  login : function(username, password) {
    let handler = function(data) {
      NSc.addLog(data.data, 'LOGIN');
    }
    method.login.emitter(username, password, handler);
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
    let theservice = new(this.service)

    return theservice;
  },

  Service : function() {
    this._serviceID = 'undefined',

    var _events = {
      list: {},
      emit = function(eventname, data) {
        this.list[eventname](data);
      }
    },

    this.on = function(eventname, handler) {
      events.list.eventname = handler;
    },

    this.send = function() {

    }
  }
}
