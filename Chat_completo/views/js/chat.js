var user = {};

$(document).foundation();
$(document).ready(function () {
  $('#login-modal').foundation('reveal', 'open');
});


function login() {
  $.ajax({
    type: "POST",
    url: '/login',
    data: $('#login-form').serialize(),
    success: function (data) {
      $('#alerts').empty();
      if (data.error) {
        var html = '<div data-alert class="alert-box alert round">'
                   + data.err.msg + '</div>';
        $('#alerts').append(html);
      }
      else {
        user = data.user;
        var socket = new io();
        configureSocket(socket);
        $('#btn-login').css('display', 'none');
        $('#login-modal').foundation('reveal', 'close');
      }
    },
    dataType: 'json'
  });
}


function appendMessage(msg) { 
  
  moment.lang(navigator.language); 
  var humanDate = moment(new Date(msg.date)).calendar();

  var html = '<div class="small-11">' +
          '<blockquote><h6>' + msg.username + ':</h6>' + 
          msg.message +
          '<cite>' + humanDate + '</cite></blockquote>' +
          '</div>';
             
  $('#list-msgs').append( html );
}


function configureSocket(socket) {
    
  socket.on('all online users', function (users) {
    console.log(users.length + ' users received');
    for (var i=0; i<users.length; i++) 
    {
      var htmluser = '<li id="' + users[i]._id + '">' + users[i]._id + '</li>';
      $('#online-userslist').append(htmluser);
    }
  });
    
  socket.on('chat message', function (msg) {
    appendMessage(msg);
  });
    
  socket.on('latest messages', function (messages) {
    for (var i = messages.length - 1; i >= 0; i--) {
      appendMessage(messages[i]);
    };
  })
   
  socket.on('new user', function (nuser) {
    var linuser = '<li id="' + nuser._id + '">'+ nuser._id + '</li>';
    $('#online-userslist').append(linuser);

  });
    
  socket.on('remove user', function (nuser) {
    $('#' + nuser._id).remove();
  });
  
  $('#new-msg').keyup(function (evt) {
    if (evt.keyCode === 13) {
      var nmsg = {
        username : user._id,
        message : $('#new-msg').val(),
        date: Date.now()        
      }
      socket.emit('chat message', nmsg);
      $('#new-msg').val('');
    }
  });
  
  socket.emit('all online users');
  
  socket.emit('latest messages');
    
  socket.emit('new user', user);
  
}