// NoService/launch.js
// Description:
// "launch.js" launch NOOXY Service deamon.
// Copyright 2019 NOOXY. All Rights Reserved.

const Launcher = require('./NoService').Runtime.Launcher;
const Path = require("path");

Launcher.launch(Path.resolve("./"), Path.resolve("./")+'/setting.json');
