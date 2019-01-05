// NoService/launch.js
// Description:
// "launch.js" launch NOOXY Service deamon.
// Copyright 2018 NOOXY. All Rights Reserved.

let Launcher = require('./NoService/launcher');
var Path = require("path");
var fs = require('fs');


let _path = Path.resolve("./");
var _settings = JSON.parse(fs.readFileSync('setting.json', 'utf8'));
_settings["path"] = _path+'/';

Launcher.launch(_settings);
