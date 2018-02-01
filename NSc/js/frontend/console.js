$(function () {
  "use strict";
  var content = $('#messages1');
  var input = $('#command');

  $('#commandform').submit(function(){
    if(input.val() != '') {
      // connection.send(input.val());
      addLog(input.val(), 'None', 'black')
      input.val('');
    }
    return false;
  });

  function addLog(message, date, color) {
    console.log('added')
    content.append('<li><span style="font-size:9px;color:#606060">'+date+'</span> <span style="font-size:9px;color:black;font-weight: bold;color:'+color+'">'+message+'</span></li>');
  }

  function gotoBottom(id){
   var element = document.getElementById(id);
   element.scrollTop = element.scrollHeight - element.clientHeight;
  }
})
