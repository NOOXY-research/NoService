let _NSc = new NSc();
_NSc.connect('www.nooxy.tk', '1487', null);
_NSc.createActivitySocket('NoUser', (err, as)=>{
  $(function() {
    let status = $('#status');

    $('#signupform').submit(function() {
      as.call('createUser',
       {un: $("#signupform-username").val(),
       dn: null,
       pw: $("#signupform-password").val(),
       dt: null,
       fn: $("#signupform-firstname").val(),
       ln: $("#signupform-lastname").val()},
       (err, json) => {
         if(json.s.includes('Error')) {
           status.html('<span style="color: #E91E63">'+json.s+'</span>');
         }
         else {
           status.html('<span style="color: #4CAF50">'+json.s+'</span>');
         }
      });
      return false;
    })
    as.onClose=()=>{

    };
  });
});
