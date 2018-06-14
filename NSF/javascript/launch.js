// NSF/launch.js
// Description:
// "launch.js" launch NOOXY Service deamon.
// Copyright 2018 NOOXY. All Rights Reserved.

let Core = require('./NSd/core');
var Path = require("path");
var fs = require('fs');


let _path = Path.resolve("./");
var _setting = JSON.parse(fs.readFileSync('setting.json', 'utf8'));
_setting["path"] = _path+'/';

let _core = new Core(_setting);

_core.checkandlaunch();
