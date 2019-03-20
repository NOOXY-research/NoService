// NoService/services/{{ servicename }}/entry.js
// Description:
// "{{ servicename }}/entry.js" description.
// Copyright 2018-2019 NOOXY. All Rights Reserved.
'use strict';

function Service(Me, NoService) {
  // Initialize your service here synchronous. Do not use async here!

  // Get the service socket of your service
  let ss = NoService.Service.ServiceSocket;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not NoService provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by NoService.SafeCallback.
  // E.g. setTimeout(NoService.SafeCallback(callback), timeout)
  let safec = NoService.SafeCallback;
  // Your settings in manifest file.
  let settings = Me.Settings;

  // Here is where your service start
  this.start = ()=> {
    // start you service
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
