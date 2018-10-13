// NSF/services/NoShell/entry.js
// Description:
// "NoShell/entry.js" is a NSF Shell service.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

function start(Me, api) {
  let ss = api.Service.ServiceSocket;
  let sniffonJSON = false;
  let sniffonRAW = false;
  api.Daemon.getSettings((err, DaemonSettings)=>{
    api.Sniffer.onRouterJSON((err, json)=>{
      let j = JSON.stringify(json, null, 2);
      if(sniffonJSON) {
        try {
          api.Service.Entity.getfliteredEntitiesList("service=NoShell", (err, list)=>{
            if(!list.includes(json.d.d.i)) {
              ss.broadcastData({t:'stream', d:'Sniffer catch JSON on '+DaemonSettings.daemon_name+'" :\n'+j});
            }
          });
        }
        catch (err) {
          ss.broadcastData({t:'stream', d:'Sniffer catch JSON on '+DaemonSettings.daemon_name+'" :\n'+j});
          if(DaemonSettings.debug) {
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
              ss.broadcastData({t:'stream', d:'Sniffer catch RAW on '+DaemonSettings.daemon_name+'" :\n'+data});
            }
          });
        }
        catch (err) {
          ss.broadcastData({t:'stream', d:'Sniffer catch RAW on '+DaemonSettings.daemon_name+'" :\n'+data});
          if(DaemonSettings.debug) {
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
        if(DaemonSettings.debug) {
          console.log(err);
        }
        callback(false , {r:'Unknown command. Start at token "'+t0+'".'});
      }
    };
    // send command
    ss.sdef('sendC', (json, entityID, returnJSON)=>{
      let settings = DaemonSettings;
      let cmd = json.c.split(spliter);
      api.Service.Entity.getEntityMetaData(entityID, (err, emeta)=>{
        // commands dict
        let c_dict = {
          help: (t0, c0) =>{
            c0(false, {r:
              '[daemon]\n'+
              '  daemon [settings|stop]\n'+
              '\n'+
              '[service]\n'+
              '  service [list|[manifest|create|relaunch] {service name}]\n'+
              '  service [jfunclist|jfuncdict|jfuncshow] {target service}\n'+
              '  service jfunc {target service} {target username} {target jfunc} {JSON} ---Call a JSONfunction as target user.\n'+
              '  service entity [show {entityID}|list|count|showuser {username}]\n'+
              '\n'+
              '[activity]\n'+
              '  activity [listuser|showuser {username}]\n'+
              '\n'+
              // '  log [entity|protocol] {last N line of log}\n'+
              '[jfunc]\n'+
              '  jfunc {target service} {target jfunc} {JSON} ---Call a JSONfunction as admin.\n'+
              '\n'+
              '[auth]\n'+
              '  auth emit [password|token] {entityID}  ---Emit authorization proccess to targeted entity.\n'+
              '  auth updatetoken {username}  ---Update a user\'s token.\n'+
              '  auth updateprivilege {username} {value} ---Update a user\'s privilege.\n'+
              '\n'+
              '[user]\n'+
              '  user create {username} {displayname} {password} {comfirm} {detail} {firstname} {lastname} ---Create a NOOXY user.\n'+
              '  user chpasswd {username} {password}  ---Change a user\'s password.\n'+
              '  user meta {username}  ---Get a user\'s detail.\n'+
              '\n'+
              '[me]\n'+
              '  me\n'+
              '  me [entitymeta|chpasswd|usermeta|updatetoken]\n'+
              '\n'+
              '[noti]\n'+
              '  noti ---NOOXY notification\n'+
              '\n'+
              '[others]\n'+
              '  echo {keyword|text} ---Echo plain text.\n'+
              '  help ---This menu.\n'+
              '\n'+
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
                        api.Service.Entity.getEntityMetaData(t2[0], (err, r)=>{
                          c2(false, {r:JSON.stringify(r, null, 2)});
                        });
                      },

                      list: (t2, c2) => {
                        api.Service.Entity.getEntitiesId((err, r)=>{
                          c2(false, {r: JSON.stringify(r, null, 2)});
                        });
                      },

                      count: (t2, c2)=> {
                        c1(false, {r:JSON.stringify(api.Service.Entity.returnCount(), null, 2)});
                      },

                      showuser: (t2, c2) => {
                        api.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoActivity', (err, as)=> {
                          if(err) {
                            c2(false, {r:'Failed'});
                          }
                          else {
                            as.call('getActivity', {u: t2[0]}, (err, json)=>{
                              c2(false, {r:JSON.stringify(json, null, 2)});
                              as.close();
                            });
                          }
                        });
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

              relaunch: (t1, c1) => {
                api.Service.relaunch(t1[0]);
                c1(false, {r: "Emitted relaunch signal."});
              },

              list: (t1, c1) => {
                c1(false, {r:JSON.stringify(api.Service.returnList(), null, 2)});
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
                      c1(false, {r:'jfunc onData: \n'+ JSON.stringify(jfuncd==null?'{}':jfuncd, null, 2)+'\njfunc returnValue: '+JSON.stringify(msg, null, 2)});
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

          activity: (t0, c0) => {
            return _(t0, {
              showuser: (t1, c1) => {
                api.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoActivity', (err, as)=> {
                  if(err) {
                    c1(false, {r:'Failed'});
                  }
                  else {
                    as.call('getActivity', {u: t1[0]}, (err, json)=>{
                      c1(false, {r:JSON.stringify(json, null, 2)});
                      as.close();
                    });
                  }
                });
              },

              listuser: (t1, c1) => {
                api.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoActivity', (err, as)=> {
                  if(err) {
                    c1(false, {r:'Failed'});
                  }
                  else {
                    as.call('getOnline', {u: t1[0]}, (err, json)=>{
                      c1(false, {r:JSON.stringify(json.d, null, 2)});
                      as.close();
                    });
                  }
                });
              },

              log: (t1, c1) => {
                return _(t1, {
                  entity: (t2, c2)=>{

                  },

                  protocol: (t2, c2)=>{

                  }
                }, c1)
              }

            }, c0)
          },

          jfunc: (t0, c0) => {
            api.Service.ActivitySocket.createDefaultDeamonSocket(t0[0], 'admin', (err, as)=> {
              let jfuncd = {};
              as.onData = (data) => {
                jfuncd['onData no.'+Object.keys(jfuncd).length] = data;
              }
              let json_string = "";
              for(let i=2; i<t0.length; i++) {
                json_string += ' '+t0[i];
              }
              try {
                as.call(t0[1], JSON.parse(json_string), (err, msg)=>{
                  as.close();
                  c0(false, {r:'jfunc onData: \n'+ JSON.stringify(jfuncd==null?'{}':jfuncd, null, 2)+'\njfunc returnValue: '+JSON.stringify(msg, null, 2)});
                });
              }
              catch(e) {
                c0(false, {r:'jfunc error.\n'+e.toString()});
                console.log(e);
              }
            });
          },

          user: (t0, c0) => {
            _(t0, {
              meta: (t1, c1) => {
                api.Service.ActivitySocket.createDefaultDeamonSocket('NoUser', t1[0], (err, as)=> {
                  if(err) {
                    c1(false, {r:err});
                  }
                  else {
                    as.call('returnUserMeta', null, (err, json)=>{
                      if(err) {
                        c1(false, {r:err});
                        as.close();
                      }
                      else {
                        c1(false, {r:JSON.stringify(json, null, 2)});
                        as.close();
                      }
                    });
                  }
                });
                // api.Authenticity.getUserMeta(t1[0], (err, meta)=>{
                //   c1(false, {r:JSON.stringify(meta, null, 2)});
                // });
              },

              chpasswd: (t1, c1) => {
                api.Authenticity.updatePassword(t1[0], t1[1],(err)=>{
                  c1(false, {r:'Error->'+err});
                })
              },

              create: (t1, c1) => {
                api.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoUser', (err, as)=> {
                  if(err) {
                    c1(false, {r:'Failed'});
                  }
                  else {
                    as.call('createUser', {un: t1[0], dn: t1[1], pw: t1[2], cp: t1[3], dt: t1[4], fn: t1[5], ln: t1[6]}, (err, json)=>{
                      c1(false, {r:json?json.s:null});
                      as.close();
                    });
                  }
                });
              }
            }, c0);
          },

          auth: (t0, c0) => {
            _(t0, {
              updateprivilege: (t1, c1) => {
                if(t1[0] == api.Variables.default_user.username) {
                  c1(false, {r:'You should not change "'+api.Variables.default_user.username+'"\'s privilege.'});
                }
                else {
                  api.Authorization.Authby.Password(entityID, (err, pass)=>{
                    if(pass) {
                      api.Authenticity.updatePrivilege(t1[0], t1[1], (err)=>{
                        c1(false, {r:'Error->'+err});
                      })
                    }
                    else {
                      c1(false, {r:'Auth failed.'});
                    }
                  });
                }

              },
              updatetoken: (t1, c1) => {
                api.Authenticity.updateToken(t1[0], (err)=>{
                  c1(false, {r:'Error->'+err});
                })
              },
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
                  api.Service.Entity.getEntityOwner(entityID, (err, r)=>{
                    api.Authenticity.updatePassword(r, t1[0],(err)=>{
                      c1(false, {r:'Error->'+err});
                    })
                  });
                },
                entitymeta: (t1, c1) => {
                  api.Service.Entity.getEntityMetaData(entityID, (err, r)=>{
                    c1(false, {r: r});
                  });
                },
                usermeta: (t1, c1) => {
                  api.Service.Entity.getEntityOwner(entityID, (err, r)=>{
                    api.Authenticity.getUserMeta(r, (err, meta)=>{
                      c1(false, {r:JSON.stringify(meta, null, 2)});
                    });
                  });

                },
                updatetoken: (t1, c1) => {
                  api.Service.Entity.getEntityOwner(entityID, (err, r)=>{
                    api.Authenticity.updateToken(r, (err)=>{
                      c1(false, {r:'Error->'+err});
                    })
                  });
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
      });
    },
    (json, entityID, returnJSON)=>{
      returnJSON(false, {r:'Auth Failed.'});
    }
    );


    // welcome msg
    ss.sdef('welcome', (json, entityID, returnJSON)=>{
      api.Service.Entity.getEntityMetaData(entityID, (err, emeta)=>{
        let msg = '\nHello. '+emeta.owner+'(as entity '+entityID+').\n  Welcome accessing NoShell service of Daemon "'+DaemonSettings.daemon_name+'".\n';
        msg = msg + '  Daemon description: \n  ' + DaemonSettings.description+'\n';
        returnJSON(false, msg);
      });
    },
    (json, entityID, returnJSON)=>{
      api.Service.Entity.getEntityMetaData(entityID, (err, emeta)=>{
        let msg = '\nHello. '+emeta.owner+'(as entity '+entityID+').\n  You have no NoShell access to "'+DaemonSettings.daemon_name+'".\n';
        msg = msg + '  Daemon description: \n  ' + DaemonSettings.description+'\n';
        returnJSON(false, msg);
      });

    });
  });

};

function close() {
  console.log('NoShell closed.');
};

module.exports = {
  start: start,
  close: close
}
