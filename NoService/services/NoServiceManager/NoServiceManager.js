// NoServiceManager.js
// Description:
// "NoServiceManager.js" is a extension module for NoServiceManager.
// Copyright 2018 NOOXY. All Rights Reserved.

const fs = require('fs');
let Library;
let Model;
let Utils;
let Daemon;
let ServiceAPI;
let Me;

'use strict';

function NoServiceManager() {
  let _on_handler = {};

  let dependencies_level_stack = [];
  let service_bind_repo_status = {};

  let services_path;

  // import model from API in entry.js
  this.importModel = (model)=> {
    Model = model;
  };

  // import library from API in entry.js
  this.importLibrary = (library)=> {
    Library = library;
    Utils = Library.Utilities;
  };

  // import settings from API in entry.js
  this.importMe = (me)=> {
    Me = me;
    Settings = me.Settings;
  };

  this.importDaemon = (daemon) => {
    Daemon = daemon;
  };

  this.importServiceAPI = (api) => {
    ServiceAPI = api;
  };

  this.loadServiceBindRepoStatus = ()=> {
    fs.readdirSync(services_path).forEach(servicedir => {
      try {
        if(fs.lstatSync(services_path+'/'+servicedir).isDirectory()) {
          // reslove service_bind_repo_status
          let manifest = JSON.parse(fs.readFileSync(services_path+'/'+servicedir+'/manifest.json', 'utf8'));
          service_bind_repo_status[servicedir] = {};
          if(manifest.git_url) {
            service_bind_repo_status[servicedir].git_url = manifest.git_url;
          }
          service_bind_repo_status[servicedir].init = Utils.UnixCmd.isDirGitInitedSync(services_path+servicedir);
          // resolve end
        }
      }
      catch(e) {

      }
    })
  };

  // define you own funciton to be called in entry.js
  this.launchOtherServices = (callback)=> {
    Daemon.getSettings((err, dsettings)=> {
      services_path = dsettings.services_path;
      this.loadServiceBindRepoStatus();
      let launch = (err)=> {
        if(err) {
          console.log(err);
          Utils.TagLog('Service', 'AutoUpgrade failed! Skipped.');
        }

        let stacked_services = [];
        let unstacked_services = [];
        // Check version and dependencies.
        ServiceAPI.getServicesManifest((err, manifests)=> {
          unstacked_services = Object.keys(manifests);
          let root_level = {};
          for(let service_name in manifests) {
            let dependencies = manifests[service_name].dependencies;
            // check node
            if(dependencies) {
              let err = false;
              for(let package in dependencies.node_packages) {
                try {
                  require.resolve(package);
                } catch (e) {
                  console.log('Please install package "'+package+'" for service "'+service_name+'".');
                  err = true;
                }
              }
              if(err) {
                Daemon.close();
                return 0;
              }
              for(let service in dependencies.services) {
                let require_version = dependencies.services[service];
                if(manifests[service]) {
                  let actual_version = manifests[service].version;
                  if(Utils.compareVersion(actual_version, require_version)>=0||!dsettings.master_config.check_service_version) {

                  }
                  else {
                    console.log('Please deploy service "'+service+'(ver: '+require_version+')" for service "'+service_name+'".');
                    Daemon.close();
                  }
                }
                else {
                  console.log('Please deploy service "'+service+'(ver: '+require_version+')" for service "'+service_name+'".');
                  Daemon.close();
                }
              }
              if(Object.keys(dependencies.services).length == 0) {
                root_level[service_name]={version: manifests[service_name].version};
                stacked_services.push(service_name);
                let index = unstacked_services.indexOf(service_name);
                if (index > -1) {
                  unstacked_services.splice(index, 1);
                }
              };
            }
            else {
              console.log('Service "'+service_name+'" missing dependencies settings.');
              Daemon.close();
            }
          };
          // push root level
          dependencies_level_stack.push(root_level);
          // root should not be empty
          if(Object.keys(root_level).length == 0) {
            console.log('Occured circular dependency');
            console.log('List of successfully parse service: ', stacked_services);
            Daemon.close();
          }
          let finish_stacking = false;
          // stacking dependencies level
          while(!finish_stacking) {
            let this_level = {};
            for(let i in unstacked_services) {
              let service = unstacked_services[i];
              let dependended_services = manifests[service].dependencies.services;
              // check node
              let satisfied = true;
              for(let service_be_check in dependended_services) {
                if(!stacked_services.includes(service_be_check)) {
                  satisfied = false;
                }
              }

              if(satisfied == true) {
                this_level[service]={version: manifests[service].version, dependencies: dependended_services};
                stacked_services.push(service);
                let index = unstacked_services.indexOf(service);
                if (index > -1) {
                  unstacked_services.splice(index, 1);
                }
              }
            }

            if(Object.keys(this_level).length == 0&&unstacked_services.length != 0) {
              Utils.TagLog('*ERR*', 'Occured circular dependency');
              Utils.TagLog('*ERR*', 'List of successfully parsed service:');
              console.log(stacked_services);
              Utils.TagLog('*ERR*','List of not parsed service:');
              console.log(unstacked_services);
              Daemon.close();
              break;
            }
            else if(Object.keys(this_level).length != 0) {
              dependencies_level_stack.push(this_level);
            }
            finish_stacking = (unstacked_services.length == 0);
          }
          // launch services by dependencies level
          // remove launched
          // remove myself
          delete (dependencies_level_stack[0])[dsettings.master_service];
          // remove debug
          delete (dependencies_level_stack[0])[dsettings.debug_service];
          // start launching
          let init_from_level = (level, callback)=> {
            let left = Object.keys(dependencies_level_stack[level]).length;
            let call_callback = (err)=> {
              if(err&&left>=0) {
                left = -1;
                callback(err);
              }
              else {
                left--;
                if(left == 0) {
                  if(level<Object.keys(dependencies_level_stack).length-1) {
                    init_from_level(level+1, callback);
                  }
                  else {
                    callback(false);
                  }
                }
              }
            }
            for(let service_name in dependencies_level_stack[level]) {
              ServiceAPI.initialize(service_name, call_callback);
            }
          }

          init_from_level(0, (err)=> {
            if(err) {
              Utils.TagLog('*ERR*', '****** An error occured on initializing service. Closeing... ******');
              console.log(err);
              Daemon.close();
            }

            let launch_from_level = (level, callback)=> {
              let left = Object.keys(dependencies_level_stack[level]).length;
              let call_callback = (err)=> {
                if(err&&left>=0) {
                  left = -1;
                  callback(err);
                }
                else {
                  left--;
                  if(left == 0) {
                    if(level<Object.keys(dependencies_level_stack).length-1) {
                      launch_from_level(level+1, callback);
                    }
                    else {
                      callback(false);
                    }
                  }
                }
              }
              for(let service_name in dependencies_level_stack[level]) {
                ServiceAPI.launch(service_name, call_callback);
              }
            }
            launch_from_level(0, (err)=> {
              if(err) {
                Utils.TagLog('*ERR*', '****** An error occured on lauching service. Closeing...  ******');
                console.log(err);
                Daemon.close();
              }
              else {
                if(callback)
                  callback(false);
                // add back
                (dependencies_level_stack[0])[dsettings.master_service]={version: manifests[dsettings.master_service].version};
                // add back
                if(dsettings.debug_service)
                  (dependencies_level_stack[0])[dsettings.debug_service]={version: manifests[dsettings.debug_service].version};
                Utils.TagLog('service', Me.Manifest.name+' have launched your services successfully');
                console.log('\n');
              }
            });
          });
        });
      }
      if(Settings.startup_auto_upgrade) {
        Utils.TagLog('Service', 'Upgrading service...');
        this.bindAllServiceToRepository((err)=> {
          this.upgradeAllService(launch);
        });
      }
      else {
        launch();
      }

    });
  };

  this.returnDependStack = ()=> {
    return dependencies_level_stack;
  };

  this.createService = (service_name, type, callback) => {
    Daemon.getSettings((err, DaemonSettings)=> {
      services_path = DaemonSettings.services_path;
      let services_files_path = DaemonSettings.services_files_path;
      let prototype_path = services_path+Me.Manifest.name+'/prototypes/normal/';
      let commons_path = services_path+Me.Manifest.name+'/prototypes/__commons__/';

      let replace_template = {
        servicename: service_name
      };

      if(type) {
        prototype_path = services_path+Me.Manifest.name+'/prototypes/'+type+'/'
      }


      if(fs.existsSync(services_path+service_name)) {
        callback(new Error("Service existed."));
      }
      else {
        try {
          fs.mkdirSync(services_path+service_name);
          try {
            fs.mkdirSync(services_files_path+service_name);
          }
          catch (err) {} // Skip

          let manifest = JSON.parse(fs.readFileSync(commons_path+'manifest.json', 'utf8'));
          manifest.name = service_name;
          if(type == "complete") {
            manifest.JSONfunciton_prototypes['JSONfunciton1'] = {
              "displayname": "JSONfunction",
              "description": "JSONfunction description.",
              "secure": true,
              "protocol": {
                "JSON_call": {
                  "a": "return a related stuff."
                },
                "JSON_return": {
                  "c": "return c related stuff.",
                  "d": {
                    "e": "return c related stuff."
                  }
                }
              }
            }
          }

          fs.writeFileSync(services_path+service_name+'/manifest.json', JSON.stringify(manifest, null, 2));

          fs.readdirSync(prototype_path).forEach(file => {
            console.log(file);
            let str = fs.readFileSync(prototype_path+file, 'utf8');
            for(let i in replace_template) {
              str = str.replace(new RegExp('{{ '+i+' }}', 'g'), replace_template[i]);
            }
            if(replace_template[file.split('.')[0]]) {
              fs.writeFileSync(services_path+service_name+'/'+replace_template[file.split('.')[0]]+'.'+file.split('.')[1], str);
            }
            else {
              fs.writeFileSync(services_path+service_name+'/'+file, str);
            }
          })

          callback(false);
        }
        catch (err) {
          callback(err);
        }
      }
    });
  };

  this.killService = (service_name, callback)=> {

  };

  this.upgradeService = (service_name, callback)=> {
    if(service_bind_repo_status[service_name]?service_bind_repo_status[service_name].init:false) {
      Utils.UnixCmd.pullGitDir(services_path+service_name, Settings.repo_name, Settings.upgrade_branch, callback);
    }
    else {
      callback(new Error('Service git of "'+service_name+'" uninitialized.'));
    }
  };

  this.upgradeAllService = (callback)=> {
    let left = Object.keys(service_bind_repo_status).length;
    let call_callback = (err)=> {
      left--;
      if(err&&left>0) {
        left = -1;
        callback(err);
      }
      else if(left == 0) {
        callback(false);
      }
    }
    for(let service_name in service_bind_repo_status) {
      if(service_bind_repo_status[service_name].init) {
        Utils.TagLog('Service', 'Upgrading Service "'+service_name+'"');
        this.upgradeService(service_name, call_callback);
      }
      else {
        left--;
        if(left == 0) {
          callback(false);
        }
      }
    }
  };

  this.installService = (giturl, callback)=> {
    Daemon.getSettings((err, DaemonSettings)=> {
      let workingdir = Utils.generateUniqueID();
      services_path = DaemonSettings.services_path;
      fs.mkdirSync(workingdir);
      try {
        fs.mkdirSync(workingdir);
      }
      catch(e) {}
      Utils.UnixCmd.initGitDir(workingdir, giturl, Settings.repo_name, (err)=> {
        if(err) {
          callback(err);
        }
        else {
          Utils.UnixCmd.pullGitDir(workingdir, Settings.repo_name, Settings.upgrade_branch, (err)=>{
            if(err) {
              callback(err);
            }
            else {
              try {
                let manifest = JSON.parse(fs.readFileSync(workingdir+'/manifest.json', 'utf8'));
                fs.renameSync(workingdir, services_path+'/'+manifest.name);
                service_bind_repo_status[manifest.name] = {
                  git_url: giturl,
                  init: true
                };
                callback(false);
              }
              catch(err) {
                callback(err);
              }
            }
          });
        }
      });
    });
  };

  this.bindServiceToRepository = (service_name, callback)=> {
    if(!service_bind_repo_status[service_name].init&&service_bind_repo_status[service_name].git_url) {
      Utils.UnixCmd.initGitDir(services_path+'/'+service_name, service_bind_repo_status[service_name].git_url, Settings.repo_name, (err)=> {
        if(!err)
          service_bind_repo_status[service_name].init = true;
        callback(err);
      });
    }
    else {
      callback(false);
    }
  };

  this.bindAllServiceToRepository = (callback)=> {
    let left = Object.keys(service_bind_repo_status).length;
    let call_callback = (err)=> {
      if(err) {
        console.log(err);
      }
      left--;
      if(err&&left>0) {
        left = -1;
        callback(err);
      }
      else if(left == 0) {
        callback(false);
      }
    }
    for(let service_name in service_bind_repo_status) {
      this.bindServiceToRepository(service_name, call_callback);
    };
  };

  this.unbindAllServiceFromRepository = (callback)=> {
    let left = Object.keys(service_bind_repo_status).length;
    let call_callback = (err)=> {
      if(err) {
        console.log(err);
      }
      left--;
      if(err&&left>0) {
        left = -1;
        callback(err);
      }
      else if(left == 0) {
        callback(false);
      }
    }
    for(let service_name in service_bind_repo_status) {
      if(service_bind_repo_status[service_name].init) {
        this.unbindServiceFromRepository(service_name, call_callback);
      }
      else if(left == 0) {
        callback(false);
      }
    };
  };

  this.unbindServiceFromRepository = (service_name, callback)=> {
    if(service_bind_repo_status[service_name].init) {
      Utils.UnixCmd.uninitGitDir(services_path+'/'+service_name, (err)=> {
        if(!err)
          service_bind_repo_status[service_name].init = false;
        callback(err);
      });
    }
    else {
      callback(false);
    }
  };

  this.getServiceRepositoryBindList = (callback)=> {
    callback(false, service_bind_repo_status);
  };
  // on event register
  this.on = (event, callback)=> {
    _on_handler[event] = callback;
  }

  this.close = ()=> {

  };
}

module.exports = NoServiceManager;
