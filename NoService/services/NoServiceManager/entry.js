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
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not API provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by api.SafeCallback.
  // E.g. setTimeout(api.SafeCallback(callback), timeout)
  let safec = api.SafeCallback;
  // Please save and manipulate your files in this directory
  let files_path = Me.FilesPath;
  // Your settings in manifest file.
  let settings = Me.Settings;

  let serviceAPI = api.Service;

  let isWin = require('os').platform().indexOf('win') > -1;
  let where = isWin ? 'where' : 'whereis';

  let checkupdate = (callback)=> {

  };

  this.start = ()=> {
    // initializing and launching services

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
    });


  }

  // If the daemon stop, your service recieve close signal here.
  this.close = ()=> {
    // Saving state of you service.
  }
}


// Export your work for system here.
module.exports = Service;
