// NoService/NoService/library/runtime.js
// Description:
// "runtime.js" provide often used rumtime related library.
// E.g. Match room. etc
// Copyright 2018 NOOXY. All Rights Reserved.
'use strict';

module.exports.MatchRoom = function() {
  let _on_dict = {
    'ParticipateMatched': null,
    'MatchModified': null,
    'MatchEstablished': null,
    'MatchClosed': null,
    'MatchFail': null
  };


  // matchid: {participates:{id1: meta, id2: meta}, content: whatever}
  let _matches_queue = {};
  let _matches = {};

  this.setMaxParticipate = ()=> {

  };

  this.setTimeout = ()=> {

  };

  // return true or false callback(participateid, participate_meta, match_data)
  this.setMatchJoinPolicy = (callback)=> {

  };

  // return true or false callback(match_data)
  this.setMatchEstablishPolicy = (callback)=> {

  };

  this.queueParticipate = (participateid, participate_meta) => {

  };

  this.endMatch = (matchid) => {

  };

  this.quitParticipate = (participateid) => {

  };

  this.ParticipatejoinMatchbyId = (matchid) => {

  };

  this.createMatch = (matchid, participates, content) => {

  };

  this.modifyMatch = (participateid, content, callback)=> {

  };

  this.on = (eventname, callback)=> {
    _on_dict[eventname] = callback;
  };
};

module.exports.GroupMatchRoom = function() {

};
