// NSF/services/NoServiceManager/entry.js
// Description:
// "NoServiceManager/entry.js" .
// Copyright 2018 NOOXY. All Rights Reserved.

var fs = require('fs');
// Service entry point
function start(api) {
  // Get the service socket of your service
  let ss = api.Service.ServiceSocket;
  let safec = api.SafeCallback;

  ss.def('createService', (json, entityID, returnJSON)=>{
    let service_name = json.name;
    let services_path = api.Daemon.Settings.services_path;
    let services_files_path = api.Daemon.Settings.services_files_path;
    let prototype_path = services_path+api.Me.Manifest.name+'/prototypes/';
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
}

// If the daemon stop, your service recieve close signal here.
function close(api) {
  // Saving state of you service.
}

// Export your work for system here.
module.exports = {
  start: start,
  close: close
}
