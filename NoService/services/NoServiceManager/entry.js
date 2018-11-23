// NoService/services/NoServiceManager/entry.js
// Description:
// "NoServiceManager/entry.js" .
// Copyright 2018 NOOXY. All Rights Reserved.
let NoServiceManager = new (require('./NoServiceManager'))()
// Service entry point
function Service(Me, API) {
  // Your service entry point
  // Get the service socket of your service
  let ss = API.Service.ServiceSocket;
  let Utils = API.Library.Utilities;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not API provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by API.SafeCallback.
  // E.g. setTimeout(API.SafeCallback(callback), timeout)
  let safec = API.SafeCallback;
  // Please save and manipulate your files in this directory
  let files_path = Me.FilesPath;
  // Your settings in manifest file.
  let settings = Me.Settings;
  let services_path = __dirname.split('/'+Me.Manifest.name)[0];
  let ServiceAPI = API.Service;

  // import API to NoServiceManager module
  NoServiceManager.importModel(API.Database.Model);
  NoServiceManager.importLibrary(API.Library);
  NoServiceManager.importMe(Me);
  NoServiceManager.importFilesPath(files_path);
  NoServiceManager.importDaemon(API.Daemon);
  NoServiceManager.importServiceAPI(ServiceAPI);

  this.start = ()=> {

    // memoryUsage limit control
    setInterval(()=> {
      if(settings.reach_memory_limit_relaunch) {
        API.Service.getWorkerMemoryUsage((err, servicememuse)=> {
          for(let service in servicememuse) {
            if(servicememuse[service].rss > settings.max_memory_per_service_MB*1024*1024) {
              console.log('Service "'+service+'" reached memoryUsage limit "'+servicememuse[service].rss/(1024*1024)+'/'+settings.max_memory_per_service_MB+'" MB.');
              API.Service.relaunch(service);
            }
          }
        });
      }
    }, settings.check_memory_interval_sec*1000);

    ss.sdef('createService', (json, entityID, returnJSON)=>{
      NoServiceManager.createService(json.name, json.type, (err)=> {
        let jsonr = {
          // succeess
          s: "succeess"
        };
        if(err)
          jsonr.s = err;

        returnJSON(false, jsonr);
      });
    });

    ss.sdef('getDependStack', (json, entityID, returnJSON)=> {
      let jsonr = {
        r: NoServiceManager.returnDependStack()
      };
      returnJSON(false, jsonr);
    });

    ss.sdef('listServicesRepoBind', (json, entityID, returnJSON)=> {

    });

    ss.sdef('bindServiceRepo', (json, entityID, returnJSON)=> {

    });

    ss.sdef('unbindServiceRepo', (json, entityID, returnJSON)=> {

    });

    ss.sdef('installService', (json, entityID, returnJSON)=> {
      API.Authorization.Authby.Password(entityID, (err, valid)=> {
        let method = json.m; // git
        let source = json.s; // github gitlab
        let repo =json.r;

        if(method = 'git') {
          if(source = 'github') {

          }
        }
      });
    });

    ss.sdef('upgradeAllService', (json, entityID, returnJSON)=> {
      let method = json.m; // git
      let source = json.s; // github gitlab
      let repo =json.r;

      if(method = 'git') {
        if(source = 'github') {

        }
      }
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

    NoServiceManager.launchOtherServices();
  }

  // If the daemon stop, your service recieve close signal here.
  this.close = ()=> {
    // Saving state of you service.
  }
}


// Export your work for system here.
module.exports = Service;
