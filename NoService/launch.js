// NoService/launch.js
// Description:
// "launch.js" launch NOOXY Service deamon.
// Copyright 2018 NOOXY. All Rights Reserved.

const Launcher = require('./NoService/launcher');
const Path = require("path");

Launcher.launch(Path.resolve("./"), Path.resolve("./")+'/setting.json');
