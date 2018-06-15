function start(api) {
  let ss = api.Service.ServiceSocket;

  let spliter = ' ';

  let _ = (tokens, dict, callback) => {
    let t = null;
    while(tokens.length != 0 &&tokens[0] == null) {
      tokens.shift();
    }
    if(tokens.length != 0 && tokens[0] != null) {
      t  = tokens.shift();
    }
    else {
      callback(false , {r:"unknown command"});
    }
    while(tokens.length != 0 &&tokens[0] == null) {
      tokens.shift();
    }
    try {
      dict[t](tokens, callback);
    }
    catch (err) {
      callback(false , {r:"unknown command"});
    }

  };

  // send command
  ss.def('sendC', (json, entityID, returnJSON)=>{
    let cmd = json.c.split(spliter);
    // commands dict
    let c_dict = {
      service: (t0, c0) => {
        return _(t0, {
          entity: (t1, c1) => {
            api.Authorization.Authby.Password(entityID, (err, pass)=>{
              if(pass) {
                r = _(t1, {
                  show: (t2, c2) => {
                    c2(false, {r:api.service.Entity.returnEntityMetaData(show_remain)});
                  },

                  list: (t2, c2) => {
                    c2(false, {r:api.Service.Entity.returnEntitiesID()});
                  },

                }, c1);
              }
              else {
                callback(false , {r:"Auth failed"});
              }
            });
          },

          socket: (t1, c1) => {
            return  _(socket_remain, {

            }, c1);
          }

        }, c0);
      },
      me: (t0, c0) => {
        return _(t0, {
          meta: (t1, c1) => {
            c1(false, {r:api.Service.Entity.returnEntityMetaData(entityID)});
          }
        }, c0);
      }
    };

    _(cmd, c_dict, returnJSON);
  });


  // welcome msg
  ss.def('welcome', (json, entityID, returnJSON)=>{
    let emeta = api.Service.Entity.returnEntityMetaData(entityID);
    let settings = api.Daemon.Settings;
    let msg = '\n'+emeta.owner+'. Welcome accessing NoShell of Server "'+settings.daemon_name+'"\n';
    msg = msg + settings.description+'\n';
    msg = msg + 'Your entityMetaData(entityID: '+entityID+'): \n';
    msg = msg + JSON.stringify(emeta, null, 2);

    returnJSON(false, msg);
  });
}

module.exports = {
  start: start
}
