let _NSc = new NSc();
_NSc.connect('www.nooxy.tk', '1487', 'admin');
_NSc.createActivitySocket('NoShell', (err, as)=>{
  console.log('adfas');
  $(function () {
    var content = $('#messages1');
    var input = $('#command');
    let line = 0;

    function addLog(message, tag, color) {
      content.append('<li><span style="font-size:11px;color:#606060">'+tag+'</span><span style="font-size:10px;color:'+color+'"><pre style="white-space: pre-wrap;margin:0;">'+message+'</pre></span></li>');
    }

    as.call('welcome', null, (err, msg) => {
      addLog(msg, 'welcome', '#263238');
    });

    function gotoBottom(id){
     var element = document.getElementById(id);
     element.scrollTop = element.scrollHeight - element.clientHeight;
    }

    $('#commandform').submit(function(){
      if (input.val() == 'logout') {
        console.log(_NSc);
        _NSc.getImplement((err, implement_module)=>{
          implement_module.returnImplement('logout')();
          addLog("Logged out.", '[ln'+line+']>>> logout', '#263238');
          input.val('');
        });
      }
      else if (input.val() != '') {
        let cmd = input.val();
        as.call('sendC', {c: cmd}, (err, json)=>{
          addLog(json.r, '[ln'+line+']>>> '+cmd, '#263238');
          line += 1;
          gotoBottom('messages-container-1');
        });
        input.val('');
      }
      return false;
    });
    as.onClose=()=>{
      addLog("Activity closed.", '', '#E91E63');
    };
  })
});
