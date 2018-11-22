// NoService/services/NoServiceManager/entry.js
// Description:
// "NoServiceManager/entry.js" .
// Copyright 2018 NOOXY. All Rights Reserved.

var fs = require('fs');
// Service entry point
function Service(Me, api) {
  // Your service entry point
  // Get the service socket of your service
  let ss = api.Service.ServiceSocket;
  let Utils = api.Library.Utilities;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not API provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by api.SafeCallback.
  // E.g. setTimeout(api.SafeCallback(callback), timeout)
  let safec = api.SafeCallback;
  // Please save and manipulate your files in this directory
  let files_path = Me.FilesPath;
  // Your settings in manifest file.
  let settings = Me.Settings;
  let isWin = require('os').platform().indexOf('win') > -1;
  let where = isWin ? 'where' : 'whereis';
  let dependencies_level_stack = [];

  let checkupdate = (callback)=> {

  };

  this.start = ()=> {
    // initializing and launching services
    let launch_other_services = ()=> {
      api.Daemon.getSettings((err, dsettings)=> {
        let ServiceAPI = api.Service;

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
              for(let package in dependencies.node_packages) {
                try {
                  require.resolve(package);
                } catch (e) {
                  console.log('Please install package "'+package+'" for service "'+service_name+'".');
                  api.Daemon.close();
                }
              }
              for(let service in dependencies.services) {
                let require_version = dependencies.services[service];
                if(manifests[service]) {
                  let actual_version = manifests[service].version;
                  if(Utils.compareVersion(actual_version, require_version)>=0||!dsettings.master_config.check_service_version) {

                  }
                  else {
                    console.log('Please deploy service "'+service+'(ver: '+require_version+')" for service "'+service_name+'".');
                    api.Daemon.close();
                  }
                }
                else {
                  console.log('Please deploy service "'+service+'(ver: '+require_version+')" for service "'+service_name+'".');
                  api.Daemon.close();
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
              api.Daemon.close();
            }
          };
          // push root level
          dependencies_level_stack.push(root_level);
          // root should not be empty
          if(Object.keys(root_level).length == 0) {
            console.log('Occured circular dependency');
            console.log('List of successfully parse service: ', stacked_services);
            api.Daemon.close();
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
              api.Daemon.close();
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
              Utils.TagLog('*ERR*', '****** An error occured on initializing service. ******');
              console.log(err);
              api.Daemon.close();
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
                Utils.TagLog('*ERR*', '****** An error occured on lauching service. ******');
                console.log(err);
                api.Daemon.close();
              }
              else {
                Utils.TagLog('service', Me.Manifest.name+' have launched your service successfully.');
              }
            });
          });
        });
      });
    };


    // initializing and launching services end

    setInterval(()=> {
      if(settings.reach_memory_limit_relaunch) {
        api.Service.getWorkerMemoryUsage((err, servicememuse)=> {
          for(let service in servicememuse) {
            if(servicememuse[service].rss > settings.max_memory_per_service_MB*1024*1024) {
              console.log('Service "'+service+'" reached memoryUsage limit "'+servicememuse[service].rss/(1024*1024)+'/'+settings.max_memory_per_service_MB+'" MB.');
              api.Service.relaunch(service);
            }
          }
        });
      }
    }, settings.check_memory_interval_sec*1000);

    api.Daemon.getSettings((err, DaemonSettings)=> {
      ss.sdef('createService', (json, entityID, returnJSON)=>{
        let service_name = json.name;
        let services_path = DaemonSettings.services_path;
        let services_files_path = DaemonSettings.services_files_path;
        let prototype_path = services_path+Me.Manifest.name+'/prototypes/';
        let jsonr = {
          // succeess
          s: "Unstated"
        };
        api.Authorization.Authby.Token(entityID, (err, pass)=> {
          if(fs.existsSync(services_path+service_name)) {
            jsonr.s = new Error("Service existed.");
            returnJSON(false, jsonr);
          }
          else {
            try {
              fs.mkdirSync(services_path+service_name);
              try {
                fs.mkdirSync(services_files_path+service_name);
              }
              catch (err) {} // Skip
              fs.createReadStream(prototype_path+'readme.md').pipe(fs.createWriteStream(services_path+service_name+'/readme.md'));
              fs.createReadStream(prototype_path+'entry.js').pipe(fs.createWriteStream(services_path+service_name+'/entry.js'));
              let manifest = JSON.parse(fs.readFileSync(prototype_path+'manifest.json', 'utf8'));
              manifest.name = service_name;
              fs.writeFile(services_path+service_name+'/manifest.json', JSON.stringify(manifest, null, 2), (err) => {
                if(err) {
                  jsonr.s = err;
                  returnJSON(false, jsonr);
                }
                else {
                  jsonr.s = 'Succeess';
                  returnJSON(false, jsonr);
                }
              });
            }
            catch (err) {
              jsonr.s = err;
              returnJSON(false, jsonr);
            }
          }
        });
      });

      ss.sdef('getDependStack', (json, entityID, returnJSON)=> {
        let jsonr = {
          r: dependencies_level_stack
        };
        returnJSON(false, jsonr);
      });

      ss.sdef('installService', (json, entityID, returnJSON)=> {
        api.Authorization.Authby.Password(entityID, (err, valid)=> {
          let method = json.m; // git
          let source = json.s; // github gitlab
          let repo =json.r;

          if(method = 'git') {
            if(source = 'github') {

            }
          }
        });
      });

      ss.sdef('upgradeService', (json, entityID, returnJSON)=> {
        let method = json.m; // git
        let source = json.s; // github gitlab
        let repo =json.r;

        if(method = 'git') {
          if(source = 'github') {

          }
        }
      });

      ss.sdef('killService', (json, entityID, returnJSON)=> {

      });

      launch_other_services();
    });
  }

  // If the daemon stop, your service recieve close signal here.
  this.close = ()=> {
    // Saving state of you service.
  }
}


// Export your work for system here.
module.exports = Service;
