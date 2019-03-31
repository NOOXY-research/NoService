// NoService/services/youservice/entry.js
// Description:
// "youservice/entry.js" description.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
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


  let log = (obj)=>{
    console.log('< NOSERVICE TESTER > ', obj);
  }
  // Your service entry point
  this.start = ()=> {
    log(Me);

    NoService.Authenticity.searchUsersByUsernameNRows('ad%', 1, (err, rows)=> {
      log('searchUsersByUsernameNRows Test');
      log(rows);
    });

    // ServiceFunction is a function that can be defined, which others entities can call.
    // It is a NOOXY Service Framework Standard
    log('ServiceSocket Test');
    ss.def('jfunc1', (json, entityId, returnJSON)=>{
      NoService.Authorization.Authby.Token(entityId, (err, pass)=>{
        log('Auth status: '+pass)
        log(json);
        // Code here for JSONfunciton
        // Return Value for ServiceFunction call. Otherwise remote will not recieve funciton return value.
        let json_be_returned = {
          d: 'Hello! ServiceFunction return from service!'
        }
        // First parameter for error, next is JSON to be returned.
        returnJSON(false, json_be_returned);
      });
    });

    // Safe define a ServiceFunction.
    ss.sdef('SafeServiceFunction', (json, entityId, returnJSON)=>{
      // Code here for JSONfunciton
      // Return Value for ServiceFunction call. Otherwise remote will not recieve funciton return value.
      let json_be_returned = {
        d: 'Hello! NOOXY Service Framework!'
      }
      // First parameter for error, next is JSON to be returned.
      returnJSON(false, json_be_returned);
    },
    // In case fail.
    ()=>{
      log('Auth Failed.');
    });

    // ServiceSocket.onData, in case client send data to this Service.
    // You will need entityId to Authorize remote user. And identify remote.
    ss.on('data', (entityId, data) => {
      // Get Username and process your work.
      NoService.Service.Entity.getEntityOwner(entityId, (err, username)=>{
        // To store your data and associated with userid INSEAD OF USERNAME!!!
        // Since userid can be promised as a unique identifer!!!
        let userid;
        // Get userid from API
        NoService.Authenticity.getUserIdByUsername(username, (err, id) => {
          userid = id;
        });
        // process you operation here
        log('Recieved a data from activity.');
        log(data);
      });
    });
    // ServiceSocket.onConnect, in case on new connection.
    ss.on('connect', (entityId, callback) => {
      log('Activty "'+entityId+'" connected.');
      // Send data to client.
      ss.sendData(entityId, 'A sent data from service.');
      ss.sendDataToUsername('admin', 'An entity connected. Msg to admin.');
      ss.emit(entityId, 'event1', 'Event msg. SHOULD APPEAR(1/3)');
      ss.emit(entityId, 'event2', 'Event msg. SHOULD NOT APPEAR.');

      NoService.Service.Entity.addEntityToGroups(entityId, ['superuser', 'whatever', 'good'], (err)=> {
        ss.sendDataToIncludingGroups(['superuser', 'good', 'excluded'], 'Superuser entity group msg. SHOULD NOT APPEAR');
        ss.sendDataToIncludingGroups(['superuser', 'good'], 'Superuser entity group msg. SHOULD APPEAR(1/2)');
        ss.sendDataToGroups(['superuser', 'good'], 'Superuser entity group msg. SHOULD APPEAR(2/2)');
        ss.emitToGroups(['superuser', 'good', 'excluded'], 'event2', 'Event msg. SHOULD NOT APPEAR');
        ss.emitToGroups(['superuser', 'good'], 'event1', 'Event msg. SHOULD APPEAR(2/3)');
        ss.emitToIncludingGroups(['superuser', 'good'], 'event1', 'Event msg. SHOULD APPEAR(3/3)');
        ss.emitToIncludingGroups(['superuser', 'good', 'excluded'], 'event1', 'Event msg. SHOULD NOT APPEAR');
        log('Starting stress test on emiting event. In 5 sec.');
        setTimeout(()=> {
          for(let i=0; i< 20000; i++) {
            ss.emitToGroups(['superuser', 'good', 'excluded'], 'stress', 'Event msg. SHOULD NOT APPEAR');
            ss.emitToGroups(['superuser', 'good'], 'stress', 'Event msg. SHOULD APPEAR(2/3)');
          };
          ss.emit(entityId, 'stressOK');
        }, 5000);
      });
      // Do something.
      // report error;
      callback(false);
    });
    // ServiceSocket.onClose, in case connection close.
    ss.on('close', (entityId, callback) => {
      // Get Username and process your work.
      NoService.Service.Entity.getEntityOwner(entityId, (err, username)=>{
        // To store your data and associated with userid INSEAD OF USERNAME!!!
        // Since userid can be promised as a unique identifer!!!
        let userid;
        // Get userid from API
        NoService.Authenticity.getUserIdByUsername(username, (err, id) => {
          userid = id;
        });
        // process you operation here
        log('ServiceSocket closed properly. ', entityId);
        // report error;
        callback(false);
      });
    });

    // Access another service on this daemon
    NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('NoTester', (err, activitysocket)=> {
      activitysocket.on('data', (err, data)=> {
        log('Received data from service.')
        log(data);
      });
      activitysocket.onEvent('event1', (err, data)=> {
        log('Received event1 data from service.')
        log(data);
      });
      let i = 0;
      let p = ['(-*)', '(*-)', '(-*)', '(*-)'];
      activitysocket.onEvent('stress', (err, data)=> {
        // process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        i = (i + 1) % 4;
        process.stdout.write('  '+p[i]+'stressing  ');  // write text
      });
      activitysocket.onEvent('stressOK', (err, data)=> {
        console.log('');
        log('StressOK');
        setTimeout(()=>{
          activitysocket.close();
        }, 1000);
      });
      activitysocket.sendData('A sent data from activity.');
      activitysocket.call('jfunc1', {d:'Hello! ServiceFunction call from client!'}, (err, json)=> {
        log(json);
      });
    });

    log('Get RawModel Test.');
    // Test Get Model
    NoService.Database.RAWModel.get(NoService.Constants.AUTHE_USER_MODEL_NAME, (err, model)=> {
      log('Got RawModel "'+NoService.Constants.AUTHE_USER_MODEL_NAME+'". ModelType: '+model.modeltype);
    });
    // Test Object Model
    log('Object Model Test.');
    NoService.Database.Model.define('ObjectTest', {
      model_type: "Object",
      do_timestamp: true,
      model_key: "objkey",
      structure: {
        objkey: 'INTEGER',
        property1: 'TEXT',
        property2: 'INTEGER'
      }
    }, (err, model)=>{
      if(err) {
        log(err.stack)
      }
      else {
        log('Object Model Create.');
        model.create({
          objkey: 0,
          property1: 'HAHA',
          property2: 0
        }, (err)=> {
          if(err) {
            log(err.stack)
          }
          else {
            log('Object Model Get.');
            model.get(0, (err, result)=> {
              if(err) {
                log(err.stack)
              }
              else {
                log(result);
                log('Object Model Replace.');
                model.replace({
                  objkey: 0,
                  property1: 'HAHARPLACE',
                  property2: 0
                }, (err)=> {
                  if(err) {
                    log(err.stack)
                  }
                  else {
                    model.get(0, (err, result)=> {
                      log(result);
                      NoService.Database.Model.remove('ObjectTest', (err)=>{
                        if(err) {
                          log(err.stack);
                        }
                        else {
                          log('Object Model PASS.');
                        }
                      });
                    });
                  }
                });
              }
            });
          }
        });
      }
    });


    // Test IndexedList Model
    log('IndexedList Model Test.');
    NoService.Database.Model.define('IndexedListTest', {
      model_type: "IndexedList",
      do_timestamp: true,
      structure: {
        property1: 'TEXT',
        property2: 'INTEGER'
      }
    }, (err, model)=>{
      if(err) {
        log(err.stack)
      }
      else {
        log('IndexedList Model Append Test.');
        model.appendRows([
          {
            property1: 'A',
            property2: 0
          },
          {
            property1: 'B',
            property2: 1
          },
          {
            property1: 'C',
            property2: 2
          },
          {
            property1: 'D',
            property2: 3
          }
        ], (err)=> {
          if(err) {
            log(err.stack)
          }
          else {
            log('IndexedList Model Get Test.');
            model.getAllRows((err, result)=> {
              if(err) {
                log(err.stack)
              }
              else {
                log(result);
                log('IndexedList Model Update Test.');
                model.updateRows([
                  {
                    Idx: 1,
                    property1: 'Br'
                  },
                  {
                    Idx: 2,
                    property1: 'Cr'
                  }
                ], (err)=> {
                  if(err) {
                    log(err.stack);
                  }
                  else {
                    log('IndexedList Model getRowsFromTo Test.');
                    model.getRowsFromTo(1, 2, (err, result)=> {
                      log(result);
                      NoService.Database.Model.remove('IndexedListTest', (err)=>{
                        if(err) {
                          log(err.stack);
                        }
                        else {
                          log('IndexedList Model PASS.');
                        }
                      });
                    });
                  }
                });
              }
            });
          }
        });
      }
    });

    // Test GroupIndexedList Model
    log('GroupIndexedList Model Test.');
    NoService.Database.Model.define('GroupIndexedList', {
      model_type: "GroupIndexedList",
      do_timestamp: true,
      structure: {
        property1: 'TEXT',
        property2: 'INTEGER'
      }
    }, (err, model)=>{
      if(err) {
        log(err.stack)
      }
      else {
        log('GroupIndexedList Model Append Test.');
        model.appendRows('Group1' ,[
          {
            property1: 'A',
            property2: 0
          },
          {
            property1: 'B',
            property2: 1
          },
          {
            property1: 'C',
            property2: 2
          },
          {
            property1: 'D',
            property2: 3
          }
        ], (err)=> {
          if(err) {
            log(err.st)
          }
          else {
            log('GroupIndexedList Model Get Test.');
            model.getAllRows('Group1' ,(err, result)=> {
              if(err) {
                log(err.stack)
              }
              else {
                log(result);
                log('GroupIndexedList Model append Test.');
                model.appendRows('Group2' ,[
                  {
                    property1: 'AA2',
                    property2: 0
                  },
                  {
                    property1: 'BB2',
                    property2: 1
                  },
                  {
                    property1: 'CC2',
                    property2: 2
                  },
                  {
                    property1: 'DD2',
                    property2: 3
                  }
                ], (err)=> {
                  if(err) {
                    log(err.stack)
                  }
                  else {
                    log('GroupIndexedList Model Update Test.');
                    model.updateRows('Group1', [
                      {
                        Idx: 1,
                        property1: 'Br'
                      },
                      {
                        Idx: 2,
                        property1: 'Cr'
                      }
                    ], (err)=> {
                      if(err) {
                        log(err.stack);
                      }
                      else {
                        log('GroupIndexedList Model getRowsFromTo Test.');
                        model.getRowsFromTo('Group2' ,1, 2, (err, result)=> {
                          log(result);
                          log('GroupIndexedList Model searchAll Test.');
                          model.searchAllNRows('Group2', '%2', 3, (err, rows)=> {
                            log(rows);
                            if(err) {
                              log(err.stack);
                            }
                            else {
                              NoService.Database.Model.remove('GroupIndexedList', (err)=>{
                                if(err) {
                                  log(err.stack);
                                }
                                else {
                                  log('GroupIndexedList Model PASS.');
                                }
                              });
                            }
                          });

                        });
                      };
                    });
                  };
                });
              };
            });
          };
        });
      };
    });
  }

  // If the daemon stop, your service recieve close signal here.
  this.close = ()=> {
    log('Service Closed');
    // Saving state of you service.
    // Please save and manipulate your files in this directory
  }
}

// Export your work for system here.
module.exports = Service;
