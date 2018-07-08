let _NSc = new NSc();

$(function () {
  "use strict";
  var content = $('#messages1');
  var input = $('#command');
  let line = 0;


  _NSc.connect('127.0.0.1', '1487');
  let shell_as = _NSc.createActivitySocket('NoShell');

  function gotoBottom(id){
   var element = document.getElementById(id);
   element.scrollTop = element.scrollHeight - element.clientHeight;
  }

  $('#commandform').submit(function(){
    if(input.val() != '') {
      // connection.send(input.val());
      addLog(input.val(), 'ln'+line, 'black');
      line += 1;
      gotoBottom('messages-container-1');
      input.val('');
    }

    return false;
  });

  function addLog(message, date, color) {
    console.log('added')
    content.append('<li><span style="font-size:9px;color:#606060">'+date+'</span> <span style="font-size:9px;color:black;font-weight: bold;color:'+color+'">'+message+'</span></li>');
  }
})
