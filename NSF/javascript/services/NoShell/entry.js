// NSF/services/NoShell/entry.js
// Description:
// "NoShell/entry.js" is a NSF Shell service.
// Copyright 2018 NOOXY. All Rights Reserved.

function start(api) {
  let ss = api.Service.ServiceSocket;
  let sniffonJSON = false;
  let sniffonRAW = false;

  api.Sniffer.onRouterJSON((err, json)=>{
    j = JSON.stringify(json, null, 2);
    if(sniffonJSON) {
      try {
        api.Service.Entity.getfliteredEntitiesList("service=NoShell", (err, list)=>{
          if(!list.includes(json.d.d.i)) {
            ss.broadcastData({t:'stream', d:'Sniffer catch JSON on '+api.Daemon.Settings.daemon_name+'" :\n'+j});
          }
        });
      }
      catch (err) {
        ss.broadcastData({t:'stream', d:'Sniffer catch JSON on '+api.Daemon.Settings.daemon_name+'" :\n'+j});
        if(api.Daemon.Settings.debug) {
          console.log(err);
        }
      }
    }
  });

  api.Sniffer.onRouterRawData((err, data)=>{
    if(sniffonRAW) {
      try {
        api.Service.Entity.getfliteredEntitiesList("service=NoShell", (err, list)=>{
          if(!list.includes(json.d.d.i)) {
            ss.broadcastData({t:'stream', d:'Sniffer catch RAW on '+api.Daemon.Settings.daemon_name+'" :\n'+data});
          }
        });
      }
      catch (err) {
        ss.broadcastData({t:'stream', d:'Sniffer catch RAW on '+api.Daemon.Settings.daemon_name+'" :\n'+data});
        if(api.Daemon.Settings.debug) {
          console.log(err);
        }
      }
    }
  })

  let spliter = ' ';

  let replace = (list, bere, re) => {
    for(let i in list) {
      if(list[i] == bere) {
        list[i] = re;
      }
    }
  }

  let returnToken = (tokens) => {
    let t = null;
    while(tokens.length != 0 &&tokens[0] == '') {
      tokens.shift();
    }
    if(tokens.length != 0 && tokens[0] != '') {
      t  = tokens.shift();
    }
    else {
      return null;
    }
    while(tokens.length != 0 &&tokens[0] == '') {
      tokens.shift();
    }
    return t;
  }

  let _ = (tokens, dict, callback) => {
    let t0 = tokens[0];
    let t = returnToken(tokens);
    try {
      dict[t](tokens, callback);
    }
    catch (err) {
      if(api.Daemon.Settings.debug) {
        console.log(err);
      }
      callback(false , {r:'Unknown command. Start at token "'+t0+'".'});
    }
  };
  // send command
  ss.def('sendC', (json, entityID, returnJSON)=>{
    let settings = api.Daemon.Settings;
    let cmd = json.c.split(spliter);
    let emeta = api.Service.Entity.returnEntityMetaData(entityID);
    // commands dict
    let c_dict = {
      help: (t0, c0) =>{
        c0(false, {r:
          '[daemon]\n'+
          '  daemon [settings]\n'+
          '[service]\n'+
          '  service [list|[manifest|create] {service name}]\n'+
          '  service listjfunc {target service}\n'+
          '  service jfunc {target service} {target username} {target jfunc} {JSON} ---Call a JSONfunction as target user.\n'+
          '  service entity [show {entityID}|list|count]\n'+
          '[auth]\n'+
          '  auth emit [password|token] {entityID}  ---Emit authorization proccess to targeted entity.\n'+
          '[me]\n'+
          '  me\n'+
          '  me [entitymeta|chpasswd|usermeta]\n'+
          '[sniffer]\n'+
          '  sniffer router json [on|off]'+
          '[others]\n'+
          '  echo {keyword|text} ---Echo plain text.\n'+
          '  help ---This menu.\n'+
          'Keywords: \n'+
          '  Me -> your entityID.'
        });;
      },

      service: (t0, c0) => {
        return _(t0, {
          entity: (t1, c1) => {
            api.Authorization.Authby.Token(entityID, (err, pass)=>{
              if(pass) {
                r = _(t1, {
                  show: (t2, c2) => {
                    c2(false, {r:api.Service.Entity.returnEntityMetaData(t2[0])});
                  },

                  list: (t2, c2) => {
                    c2(false, {r:api.Service.Entity.returnEntitiesID()});
                  },

                  count: (t2, c2)=> {
                    c1(false, {r:api.Service.Entity.returnCount()});
                  }

                }, c1);
              }
              else {
                c1(false , {r:"Auth failed"});
              }
            });
          },

          create: (t1, c1) => {
            api.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoServiceManager', (err, as)=> {
              if(err) {
                c1(false, {r:'Failed'});
              }
              else {
                as.call('createService', {name: t1[0]}, (err, msg)=>{
                  c1(false, {r:msg.s});
                  as.close();
                });
              }
            });
          },

          list: (t1, c1) => {
            c1(false, {r:api.Service.returnList()});
          },

          manifest: (t1, c1) => {
            c1(false, {r:api.Service.returnServiceManifest(t1[0])});
          },

          listjfunc: (t1, c1) => {
            c1(false, {r:api.Service.returnJSONfuncList(t1[0])});
          },

          jfunc: (t1, c1) => {
            api.Service.ActivitySocket.createDefaultDeamonSocket(t1[0], t1[1], (err, as)=> {
              as.call(t1[2], t1[3],(err, msg)=>{
                c1(false, {r:msg});
                as.close();
              });
            });
          }

        }, c0);
      },

      auth: (t0, c0) => {
        _(t0, {
          emit: (t1, c1) => {
            _(t1, {
              password: (t2, c2) => {
                api.Authorization.Authby.Password(t2[0], (err, pass)=>{
                  c2(false, {r: pass});
                });
              },
              token: (t2, c2) => {
                api.Authorization.Authby.Token(t2[0], (err, pass)=>{
                  c2(false, {r: pass});
                });
              }
            }, c1);
          }
        }, c0);
      },

      me: (t0, c0) => {
        if(t0.length == 0) {
          c0(false, {r: 'You are '+emeta.owner+'. Connected with ActivitySocket('+entityID+'). :D'});
        }
        else {
          _(t0, {
            chpasswd: (t1, c1) => {
              api.Authenticity.updatePassword(api.Service.Entity.returnEntityOwner(entityID), t1[0],(err)=>{
                c1(false, {r:'Error->'+err});
              })

            },
            entitymeta: (t1, c1) => {
              c1(false, {r:api.Service.Entity.returnEntityMetaData(entityID)});
            },
            usermeta: (t1, c1) => {
              api.Authenticity.getUserMeta(api.Service.Entity.returnEntityOwner(entityID), (err, meta)=>{
                c1(false, {r:meta});
              });
            }
          }, c0);
        }
      },

      daemon: (t0, c0) => {
        if(t0.length == 0) {
          c0(false, {r: settings.daemon_display_name+'('+settings.daemon_name+')\n'+settings.description});
        }
        else {
          _(t0, {
            settings: (t1, c1) => {
              c1(false, {r:settings});
            }
          }, c0);
        }
      },

      echo: (t0, c0) => {
        c0(false, {r: t0[0]});
      },

      sniffer: (t0, c0) => {
        return _(t0, {
          router: (t1, c1) => {
            api.Authorization.Authby.Token(entityID, (err, pass)=>{
              if(pass) {
                r = _(t1, {
                  json: (t2, c2) => {
                    if(t2[0] == 'on') {
                      sniffonJSON = true;
                      c2(false, {r:'Sniffer on Router JSON on.'});
                    }
                    else {
                      sniffonJSON = false;
                      c2(false, {r:'Sniffer on Router JSON off.'});
                    }
                  },

                  raw: (t2, c2) => {
                    if(t2[0] == 'on') {
                      sniffonRAW = true;
                      c2(false, {r:'Sniffer on Router RAW on.'});
                    }
                    else {
                      sniffonRAW = false;
                      c2(false, {r:'Sniffer on Router RAW off.'});
                    }
                  }
                }, c1);
              }
              else {
                c1(false , {r:"Auth failed"});
              }
            });
          }
        }, c0);
      }
    };

    replace(cmd, 'Me', entityID);
    _(cmd, c_dict, returnJSON);
  });


  // welcome msg
  ss.def('welcome', (json, entityID, returnJSON)=>{
    let emeta = api.Service.Entity.returnEntityMetaData(entityID);
    let settings = api.Daemon.Settings;
    let msg = '\nHello. '+emeta.owner+'(as entity '+entityID+').\n  Welcome accessing NoShell service of Daemon "'+settings.daemon_name+'".\n';
    msg = msg + '  Daemon description: \n  ' + settings.description+'\n';

    returnJSON(false, msg);
  });
}

module.exports = {
  start: start,
  close: null
}
