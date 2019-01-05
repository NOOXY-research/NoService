// NoService/services/NoShell/entry.js
// Description:
// "NoShell/entry.js" is a NoService Shell service.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

function Service(Me, NoService) {
  // Your service entry point
  // Get the service socket of your service
  let ss = NoService.Service.ServiceSocket;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not API provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by NoService.SafeCallback.
  // E.g. setTimeout(NoService.SafeCallback(callback), timeout)
  let safec = NoService.SafeCallback;
  // Your settings in manifest file.
  let settings = Me.Settings;

  this.start = ()=> {
    let sniffonJSON = false;
    let sniffonRAW = false;
    NoService.Daemon.getSettings((err, DaemonSettings)=>{
      NoService.Daemon.getVariables((err, DaemonVars)=>{

        NoService.Sniffer.onRouterJSON((err, json)=> {
          let j = JSON.stringify(json, null, 2);
          if(sniffonJSON) {
            try {
              NoService.Service.Entity.getfliteredEntitiesList("service=NoShell", (err, list)=>{
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

        NoService.Sniffer.onRouterRawData((err, data)=>{
          if(sniffonRAW) {
            try {
              NoService.Service.Entity.getfliteredEntitiesList("service=NoShell", (err, list)=>{
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

        ss.on('connect', (entityID, callback)=>{
          NoService.Authorization.Authby.isSuperUser(entityID, (err, pass)=> {
            if(pass) {
              NoService.Service.Entity.getEntityMetaData(entityID, (err, emeta)=>{
                let msg = '\nHello. '+emeta.owner+'(as entity '+entityID+').\n  Welcome accessing NoShell service of Daemon "'+DaemonSettings.daemon_name+'".\n';
                msg = msg + '  Daemon description: \n  ' + DaemonSettings.description+'\n'+'NoService Daemon Version: '+DaemonVars.version+'\n';
                NoService.Authorization.Authby.Token(entityID, (err, pass)=> {
                  if(pass) {
                    ss.semit(entityID, 'welcome', msg);
                  }
                  else {

                  }
                });
                // NoService.Authorization.emitSignin(entityID);
                callback(false);
              });
            }
            else {
              NoService.Service.Entity.getEntityMetaData(entityID, (err, emeta)=>{
                let msg = '\nHello. '+emeta.owner+'(as entity '+entityID+').\n  You have no NoShell access to "'+DaemonSettings.daemon_name+'".\n';
                ss.semit(entityID, 'welcome', msg);
                // NoService.Authorization.emitSignin(entityID);

                callback(false);
              });
            }
          });
        });

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
          NoService.Service.Entity.getEntityMetaData(entityID, (err, emeta)=>{
            // commands dict
            let c_dict = {
              help: (t0, c0) =>{
                c0(false, {r:
                  '[daemon]\n'+
                  '  daemon [settings|stop|memuse|upgrade]\n'+
                  '\n'+
                  '[service]\n'+
                  '  service [list|cbo|memuse|dependstack]\n'+
                  '  service [manifest|create|relaunch] {service name}\n'+
                  '  service [jfunclist|jfuncdict|jfuncshow] {target service}\n'+
                  '  service jfunc {target service} {target username} {target jfunc} {JSON} ---Call a JSONfunction as target user.\n'+
                  '  service entity [show {entityID}|list|count|showuser {username}]\n'+
                  '  service git install {repos/service} {gitsource} \n'+
                  '  service git [upgrade|bind|unbind] {service name}\n'+
                  '  service git [list|upgradeall|bindall|unbindall]\n'+
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
                  '[database]\n'+
                  '  db query "{your query}"\n'+
                  '  db model list ---List all model on this daemon.\n'+
                  '  db model [show|exist|remove] {model_name} ---Show model structure.\n'+
                  '  db model get {model_name} {key_value} ---get model instance.\n'+
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
              db: (t0, c0) => {
                return _(t0, {
                  query: (t1, c1) => {
                    let query = "";
                    for(let i=0; i<t1.length; i++) {
                      query += ' '+t1[i];
                    }
                    query = query.trim();
                    NoService.Database.Database.query(query, (err, r)=>{
                      c1(false, {r:JSON.stringify({
                        query: query,
                        err: err,
                        results: r
                      }, null, 2)});
                    });
                  },
                  model: (t1, c1) => {
                    _(t1, {
                      list: (t2, c2) => {
                        NoService.Database.RAWModel.getModelsDict((err, dict)=>{
                          c2(false, {r:JSON.stringify(Object.keys(dict), null, 2)});
                        });
                      },

                      remove: (t2, c2) => {
                        NoService.Database.RAWModel.remove(t2[0], (err)=>{
                          c2(false, {r:JSON.stringify({err: err}, null, 2)});
                        });
                      },

                      show: (t2, c2) => {
                        NoService.Database.RAWModel.getModelsDict((err, dict)=>{
                          c2(false, {r:JSON.stringify(dict[t2[0]], null, 2)});
                        });
                      },

                      get: (t2, c2) => {
                        NoService.Database.RAWModel.get(t2[0], (err, model)=>{
                          if(model.modeltype == 'GroupIndexedList') {
                            c2(false, {r: "ModelType \"GroupIndexedList\" not support yet."});
                          }
                          else if(model.modeltype == 'Pair'){
                            model.getbyBoth(t2[1], (err, result)=> {
                              c2(false, {r:JSON.stringify(result, null, 2)});
                            });
                          }
                          else {
                            model.get(t2[1], (err, result)=> {
                              c2(false, {r:JSON.stringify(result, null, 2)});
                            });
                          }
                        });
                      },

                      exist: (t2, c2)=> {
                        NoService.Database.RAWModel.exist(t2[0], (err, exist)=> {
                          c1(false, {r:exist});
                        });
                      }
                    }, c1);
                  }
                }, c0);
              },
              service: (t0, c0) => {
                return _(t0, {
                  git: (t1, c1) => {
                    return _(t1, {
                      install: (t2, c2)=>{
                        NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoServiceManager', (err, as)=> {
                          if(err) {
                            c2(false, {r:'Failed'});
                          }
                          else {
                            as.call('installService', {m: 'git', r: t2[0], s: t2[1]}, (err, json)=>{
                              c2(false, {r:JSON.stringify(json, null, 2)});
                              as.close();
                            });
                          }
                        });
                      },
                      bind: (t2, c2)=>{
                        NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoServiceManager', (err, as)=> {
                          if(err) {
                            c2(false, {r:'Failed'});
                          }
                          else {
                            as.call('bindServiceRepo', {n: t2[0]}, (err, json)=>{
                              c2(false, {r:JSON.stringify(json, null, 2)});
                              as.close();
                            });
                          }
                        });
                      },
                      unbind: (t2, c2)=>{
                        NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoServiceManager', (err, as)=> {
                          if(err) {
                            c2(false, {r:'Failed'});
                          }
                          else {
                            as.call('unbindServiceRepo', {n: t2[0]}, (err, json)=>{
                              c2(false, {r:JSON.stringify(json, null, 2)});
                              as.close();
                            });
                          }
                        });
                      },
                      upgrade: (t2, c2)=>{
                        NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoServiceManager', (err, as)=> {
                          if(err) {
                            c2(false, {r:'Failed'});
                          }
                          else {
                            as.call('upgradeService', {n: t2[0]}, (err, json)=>{
                              c2(false, {r:JSON.stringify(json, null, 2)});
                              as.close();
                            });
                          }
                        });
                      },
                      upgradeall: (t2, c2)=>{
                        NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoServiceManager', (err, as)=> {
                          if(err) {
                            c2(false, {r:'Failed'});
                          }
                          else {
                            as.call('upgradeAllService', {}, (err, json)=>{
                              c2(false, {r:JSON.stringify(json, null, 2)});
                              as.close();
                            });
                          }
                        });
                      },
                      bindall: (t2, c2)=>{
                        NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoServiceManager', (err, as)=> {
                          if(err) {
                            c2(false, {r:'Failed'});
                          }
                          else {
                            as.call('bindAllServiceRepo', {}, (err, json)=>{
                              c2(false, {r:JSON.stringify(json, null, 2)});
                              as.close();
                            });
                          }
                        });
                      },
                      unbindall: (t2, c2)=>{
                        NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoServiceManager', (err, as)=> {
                          if(err) {
                            c2(false, {r:'Failed'});
                          }
                          else {
                            as.call('unbindAllServiceRepo', {}, (err, json)=>{
                              c2(false, {r:JSON.stringify(json, null, 2)});
                              as.close();
                            });
                          }
                        });
                      },
                      list: (t2, c2)=>{
                        NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoServiceManager', (err, as)=> {
                          if(err) {
                            c2(false, {r:'Failed'});
                          }
                          else {
                            as.call('listServicesRepoBind', {}, (err, json)=>{
                              c2(false, {r:JSON.stringify(json, null, 2)});
                              as.close();
                            });
                          }
                        });
                      },
                    }, c1)
                  },
                  entity: (t1, c1) => {
                    NoService.Authorization.Authby.Token(entityID, (err, pass)=>{
                      if(pass) {
                        _(t1, {
                          show: (t2, c2) => {
                            NoService.Service.Entity.getEntityMetaData(t2[0], (err, r)=>{
                              c2(false, {r:JSON.stringify(r, null, 2)});
                            });
                          },

                          list: (t2, c2) => {
                            NoService.Service.Entity.getEntitiesId((err, r)=>{
                              c2(false, {r: JSON.stringify(r, null, 2)});
                            });
                          },

                          count: (t2, c2)=> {
                            NoService.Service.Entity.getCount((err, count)=> {
                              c1(false, {r:JSON.stringify(count, null, 2)});
                            });
                          },

                          showuser: (t2, c2) => {
                            NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoActivity', (err, as)=> {
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
                    NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoServiceManager', (err, as)=> {
                      if(err) {
                        c1(false, {r:'Failed'});
                      }
                      else {
                        let cmd = {name: t1[0]};
                        if(t1[1]) {
                          cmd.type = t1[1];
                        }
                        as.call('createService', cmd, (err, msg)=>{
                          c1(false, {r:msg.s});
                          as.close();
                        });
                      }
                    });
                  },

                  relaunch: (t1, c1) => {
                    NoService.Service.relaunch(t1[0]);
                    c1(false, {r: "Emitted relaunch signal."});
                  },

                  list: (t1, c1) => {
                    NoService.Service.getList((err, list)=> {
                      c1(false, {r:JSON.stringify(list, null, 2)});
                    });
                  },

                  dependstack:(t1, c1)=> {
                    NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoServiceManager', (err, as)=> {
                      if(err) {
                        c1(false, {r:'Failed'});
                      }
                      else {
                        as.call('getDependStack', null, (err, json)=>{
                          c1(false, {r:JSON.stringify(json.r, null, 2)});
                          as.close();
                        });
                      }
                    });
                  },

                  cbo: (t1, c1) => {
                    NoService.Service.getCBOCount((err, count)=> {
                      c1(false, {r:JSON.stringify(count, null, 2)});
                    });
                  },

                  memuse: (t1, c1) => {
                    NoService.Service.getWorkerMemoryUsage((err, usage)=> {
                      c1(false, {r:JSON.stringify(usage, null, 2)});
                    });
                  },

                  manifest: (t1, c1) => {
                    NoService.Service.getServiceManifest(t1[0], (err, m)=> {
                      c1(false, {r:JSON.stringify(m, null, 2)});
                    })
                  },

                  jfunclist: (t1, c1) => {
                    NoService.Service.getJSONfuncList(t1[0],(err, list)=> {
                      c1(false, {r:JSON.stringify(list, null, 2)});
                    });
                  },

                  jfuncdict: (t1, c1) => {
                    NoService.Service.getJSONfuncDict(t1[0], (err, dict)=> {
                      c1(false, {r:JSON.stringify(dict, null, 2)});
                    });
                  },

                  jfuncshow: (t1, c1) => {
                    NoService.Service.getJSONfuncDict(t1[0], (err, dict)=> {
                      c1(false, {r:JSON.stringify(dict[t1[1]], null, 2)});
                    });
                  },


                  jfunc: (t1, c1) => {
                    if(t1[0].length && t1[1].length && t1[3].length) {
                      NoService.Service.ActivitySocket.createDefaultDeamonSocket(t1[0], t1[1], (err, as)=> {
                        let jfuncd = {};
                        as.on('data', (data) => {
                          jfuncd['onData no.'+Object.keys(jfuncd).length] = data;
                        });
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
                    else {
                      c1(false, {r:'usage: jfunc {service} {jfunc} {json}'});
                    }
                  }

                }, c0);
              },

              activity: (t0, c0) => {
                return _(t0, {
                  showuser: (t1, c1) => {
                    NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoActivity', (err, as)=> {
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
                    NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoActivity', (err, as)=> {
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
                NoService.Service.ActivitySocket.createDefaultDeamonSocket(t0[0], 'admin', (err, as)=> {
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
                    NoService.Service.ActivitySocket.createDefaultDeamonSocket('NoUser', t1[0], (err, as)=> {
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
                    // NoService.Authenticity.getUserMeta(t1[0], (err, meta)=>{
                    //   c1(false, {r:JSON.stringify(meta, null, 2)});
                    // });
                  },

                  chpasswd: (t1, c1) => {
                    NoService.Authenticity.updatePassword(t1[0], t1[1],(err)=>{
                      c1(false, {r:'Error->'+err});
                    })
                  },

                  create: (t1, c1) => {
                    NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoUser', (err, as)=> {
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
                    if(t1[0] == NoService.Variables.default_user.username) {
                      c1(false, {r:'You should not change "'+NoService.Variables.default_user.username+'"\'s privilege.'});
                    }
                    else {
                      NoService.Authorization.Authby.Password(entityID, (err, pass)=>{
                        if(pass) {
                          NoService.Authenticity.updatePrivilege(t1[0], t1[1], (err)=>{
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
                    NoService.Authenticity.updateToken(t1[0], (err)=>{
                      c1(false, {r:'Error->'+err});
                    })
                  },
                  emit: (t1, c1) => {
                    _(t1, {
                      password: (t2, c2) => {
                        NoService.Authorization.Authby.Password(t2[0], (err, pass)=>{
                          c2(false, {r: pass});
                        });
                      },
                      token: (t2, c2) => {
                        NoService.Authorization.Authby.Token(t2[0], (err, pass)=>{
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
                      NoService.Service.Entity.getEntityOwner(entityID, (err, r)=>{
                        NoService.Authenticity.updatePassword(r, t1[0],(err)=>{
                          c1(false, {r:'Error->'+err});
                        })
                      });
                    },
                    entitymeta: (t1, c1) => {
                      NoService.Service.Entity.getEntityMetaData(entityID, (err, r)=>{
                        c1(false, {r: JSON.stringify(r, null, 2)});
                      });
                    },
                    usermeta: (t1, c1) => {
                      NoService.Service.Entity.getEntityOwner(entityID, (err, r)=>{
                        NoService.Authenticity.getUserMeta(r, (err, meta)=>{
                          c1(false, {r:JSON.stringify(meta, null, 2)});
                        });
                      });

                    },
                    updatetoken: (t1, c1) => {
                      NoService.Service.Entity.getEntityOwner(entityID, (err, r)=>{
                        NoService.Authenticity.updateToken(r, (err)=>{
                          c1(false, {r:'Error->'+err});
                        })
                      });
                    }
                  }, c0);
                }
              },

              daemon: (t0, c0) => {
                if(t0.length == 0) {
                  c0(false, {r: settings.daemon_display_name+'('+settings.daemon_name+')\n'+settings.description+'\n'+'Version: '+DaemonVars.version});
                }
                else {
                  _(t0, {
                    settings: (t1, c1) => {
                      c1(false, {r:JSON.stringify(settings, null, 2)});
                    },
                    memuse: (t1, c1) => {
                      c1(false, {r:JSON.stringify(process.memoryUsage(), null, 2)});
                    },
                    stop: (t1, c1) => {
                      c1(false, {r: 'Stopping daemon...'});
                      NoService.Daemon.close();
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
                    NoService.Authorization.Authby.Token(entityID, (err, pass)=>{
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
          NoService.Service.Entity.getEntityMetaData(entityID, (err, emeta)=>{
            let msg = '\nHello. '+emeta.owner+'(as entity '+entityID+').\n  Welcome accessing NoShell service of Daemon "'+DaemonSettings.daemon_name+'".\n';
            msg = msg + '  Daemon description: \n  ' + DaemonSettings.description+'\n'+'NoService Daemon Version: '+DaemonVars.version+'\n';
            returnJSON(false, msg);
          });
        },
        (json, entityID, returnJSON)=>{
          NoService.Service.Entity.getEntityMetaData(entityID, (err, emeta)=>{
            let msg = '\nHello. '+emeta.owner+'(as entity '+entityID+').\n  You have no NoShell access to "'+DaemonSettings.daemon_name+'".\n';
            returnJSON(false, msg);
          });
        });
      });
    });
  };

  this.close = ()=> {
    console.log('NoShell closed.');
  };
}



module.exports = Service;
