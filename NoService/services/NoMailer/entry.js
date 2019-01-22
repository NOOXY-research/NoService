// NoService/services/NoMailer/entry.js
// Description:
// "NoMailer/entry.js" description.
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';
const NodeMailer = require('nodemailer');

function Service(Me, NoService) {
  // Initialize your service here synchronous. Do not use async here!

  // Get the service socket of your service
  let ss = NoService.Service.ServiceSocket;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not NoService provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by NoService.SafeCallback.
  // E.g. setTimeout(NoService.SafeCallback(callback), timeout)
  let safec = NoService.SafeCallback;
  let transporter = NodeMailer.createTransport(Me.Settings.transporter_settings);

  // ServiceSocket.onData, in case client send data to this Service.
  // You will need entityID to Authorize remote user. And identify remote.
  ss.on('data', (entityID, data) => {

  });
  // ServiceSocket.onConnect, in case on new connection.
  ss.on('connect', (entityID, callback) => {
    // Do something.
    // report error;
    callback(false);
  });
  // ServiceSocket.onClose, in case connection close.
  ss.on('close', (entityID, callback) => {
  });

  // Here is where your service start
  this.start = ()=> {
    // Access another service on this daemon
    // NoService.Service.ActivitySocket.createDefaultAdminDeamonSocket('Another Service', (err, activitysocket)=> {
      // accessing other service
    // });
    NoService.Daemon.getSettings((err, DaemonSettings)=>{
      ss.sdef('sendMail', (json, entityID, returnJSON)=> {
        json.from = DaemonSettings.company_name+' <'+Me.Settings.transporter_settings.auth.user+'>';
        transporter.sendMail(json, (error, info)=> {
          if (error) {
            returnJSON(false, {s: JSON.stringify(error, null, 2)});

            // console.log(error);
          } else {
            returnJSON(false, {s: JSON.stringify(info, null, 2)});

            // console.log('Email sent: ' + info.response);
          }
        })
        // First parameter for error, next is JSON to be returned.

      },
      // In case fail.
      ()=>{
        console.log('Auth Failed.');
      });
    });
  }

  // If the daemon stop, your service recieve close signal here.
  this.close = ()=> {
    // Close your service here synchronous. Do not use async here!
    // Saving state of you service.
    // Please save and manipulate your files in this directory
  }
}

// Export your work for system here.
module.exports = Service;
