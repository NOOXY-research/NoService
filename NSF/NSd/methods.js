var methods = {
  _sessionnotsupport : function(data) {

  }

  _senddata: function(method, session, data) {
    var wrapped = JSON.stringify({
      method : method,
      session : session,
      data : data,
    });
    ws.connection.send(wrapped);
  }

  signup : {

  },

  login : {
    emitter : function(username, password, reshandler) {
      NSc.methods._senddata('login', 'req', {username : username, password : password});
      this.handler.res = reshandler;
    },

    handler : function(data) {
      let sessions = {
        req : function(data) {
          methods._sessionnotsupport();
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
