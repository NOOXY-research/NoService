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
  ss.sdef('sendC', (json, entityID, returnJSON)=>{
    let settings = api.Daemon.Settings;
    let cmd = json.c.split(spliter);
    let emeta = api.Service.Entity.returnEntityMetaData(entityID);
    // commands dict
    let c_dict = {
      help: (t0, c0) =>{
        c0(false, {r:
          '[daemon]\n'+
          '  daemon [settings|stop]\n'+
          '[service]\n'+
          '  service [list|[manifest|create] {service name}]\n'+
          '  service [jfunclist|jfuncdict|jfuncshow] {target service}\n'+
          '  service jfunc {target service} {target username} {target jfunc} {JSON} ---Call a JSONfunction as target user.\n'+
          '  service entity [show {entityID}|list|count]\n'+
          '[auth]\n'+
          '  auth emit [password|token] {entityID}  ---Emit authorization proccess to targeted entity.\n'+
          '[user]\n'+
          '  user create {username} {displayname} {password} {comfirm} {detail} {firstname} {lastname} ---Create a NOOXY user.\n'+
          '[me]\n'+
          '  me\n'+
          '  me [entitymeta|chpasswd|usermeta|updatetoken]\n'+
          '[noti]\n'+
          '  noti ---NOOXY notification\n'+
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
                    c2(false, {r:JSON.stringify(api.Service.Entity.returnEntityMetaData(t2[0]), null, 2)});
                  },

                  list: (t2, c2) => {
                    c2(false, {r:JSON.stringify(api.Service.Entity.returnEntitiesID(), null, 2)});
                  },

                  count: (t2, c2)=> {
                    c1(false, {r:JSON.stringify(api.Service.Entity.returnCount(), null, 2)});
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
            c1(false, {r:JSON.stringify(api.Service.returnServiceManifest(t1[0]), null, 2)});
          },

          jfunclist: (t1, c1) => {
            c1(false, {r:JSON.stringify(api.Service.returnJSONfuncList(t1[0]), null, 2)});
          },

          jfuncdict: (t1, c1) => {
            c1(false, {r:JSON.stringify(api.Service.returnJSONfuncDict(t1[0]), null, 2)});
          },

          jfuncshow: (t1, c1) => {
            c1(false, {r:JSON.stringify(api.Service.returnJSONfuncDict(t1[0])[t1[1]], null, 2)});
          },


          jfunc: (t1, c1) => {
            api.Service.ActivitySocket.createDefaultDeamonSocket(t1[0], t1[1], (err, as)=> {
              let jfuncd = {};
              as.onData = (data) => {
                jfuncd['onData no.'+Object.keys(jfuncd).length] = data;
              }
              let json_string = "";
              for(let i=3; i<t1.length; i++) {
                json_string += ' '+t1[i];
              }
              try {
                as.call(t1[2], JSON.parse(json_string), (err, msg)=>{
                  as.close();
                  c1(false, {r:'jfunc onData: \n'+ JSON.stringify(jfuncd==null?'{}':jfuncd, null, 2)+'\njfunc returnValue: '+JSON.stringify(msg)});
                });
              }
              catch(e) {
                c1(false, {r:'jfunc error.\n'+e.toString()});
                console.log(e);
              }
            });
          }

        }, c0);
      },

      user: (t0, c0) => {
        _(t0, {
          create: (t1, c1) => {
            api.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoUser', (err, as)=> {
              if(err) {
                c1(false, {r:'Failed'});
              }
              else {
                as.call('createUser', {un: t1[0], dn: t1[1], pw: t1[2], cp: t1[3], dt: t1[4], fn: t1[5], ln: t1[6]}, (err, json)=>{
                  c1(false, {r:json.s});
                  as.close();
                });
              }
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
                c1(false, {r:JSON.stringify(meta, null, 2)});
              });
            },
            updatetoken: (t1, c1) => {
              api.Authenticity.updateToken(api.Service.Entity.returnEntityOwner(entityID), (err)=>{
                c1(false, {r:'Error->'+err});
              })
            }
          }, c0);
        }
      },

      daemon: (t0, c0) => {
        if(t0.length == 0) {
          c0(false, {r: JSON.stringify(settings.daemon_display_name+'('+settings.daemon_name+')\n'+settings.description, null, 2)});
        }
        else {
          _(t0, {
            settings: (t1, c1) => {
              c1(false, {r:JSON.stringify(settings, null, 2)});
            },
            stop: (t1, c1) => {
              c1(false, {r: 'Stopping daemon...'});
              api.Daemon.close();
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
  },
  (json, entityID, returnJSON)=>{
    returnJSON(false, {r:'Auth Failed.'});
  }
  );


  // welcome msg
  ss.sdef('welcome', (json, entityID, returnJSON)=>{
    let emeta = api.Service.Entity.returnEntityMetaData(entityID);
    let settings = api.Daemon.Settings;
    let msg = '\nHello. '+emeta.owner+'(as entity '+entityID+').\n  Welcome accessing NoShell service of Daemon "'+settings.daemon_name+'".\n';
    msg = msg + '  Daemon description: \n  ' + settings.description+'\n';

    returnJSON(false, msg);
  },
  (json, entityID, returnJSON)=>{
    let emeta = api.Service.Entity.returnEntityMetaData(entityID);
    let settings = api.Daemon.Settings;
    let msg = '\nHello. '+emeta.owner+'(as entity '+entityID+').\n  You have no NoShell access to "'+settings.daemon_name+'".\n';
    msg = msg + '  Daemon description: \n  ' + settings.description+'\n';

    returnJSON(false, msg);
  });
};

function close() {
  console.log('NoShell closed.');
};

module.exports = {
  start: start,
  close: close
}
