(function() {
  var socket = io();
  var messages = $('#messages');
  var inputbox = $('#inp');
  inputbox.focus();

  function scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
  }

  window.addEventListener("resize", function() {
    scrollToBottom();
  });
  $('form').submit(function() {
    var val = inputbox.val();
    if (val) {
      socket.emit('CHATMSG', val);
      inputbox.val('');
    }
    return false;
  });
  socket.on('CHATMSG', function(msg) {
    messages.append(
      $('<div>').addClass('msg_block').append(
        $('<p>').text(msg)));
    scrollToBottom();
  });
  socket.on('IMGMSG', function(imgurl) {
    var image = $('<img>').attr('src', imgurl);
    messages.append(
      $('<div>').addClass('msg_block').append(
        image));
    image.load(scrollToBottom);
    image.error(scrollToBottom);
    scrollToBottom();
  });
  socket.on('GAMEMSG', function(msg) {
    var msg_div = $('<div>');
    msg_div.addClass('msg_block');
    msg.lines.forEach(function(line) {
      msg_div.append($('<p>').text(line));
    });
    messages.append(msg_div);
    scrollToBottom();
  });
  socket.on('CMPLXMSG', function(msg) {
    var msg_div = $('<div>').addClass('msg_block');
    msg.lines.forEach(function(line) {
      switch(line.type) {
        case 'title':
          msg_div.append($('<h3>').text(line.text));
          document.title = 'Smush - ' + line.text;
          break;
        case 'normal':
          msg_div.append($('<p>').text(line.text));
          break;
        case 'img':
          var image = $('<img>').attr('src', line.text);
          msg_div.append(image);
          image.load(scrollToBottom);
          image.error(scrollToBottom);
          break;
      }
    });
    messages.append(msg_div);
    scrollToBottom();
  });
  socket.on('passwd', function(msg) {
    if (msg.enable) inputbox.prop({type: 'password'});
    else inputbox.prop({type: 'text'});
    inputbox.focus();
  });
  socket.on('disconnect', function() {
    messages.append(
      $('<div>').addClass('msg_block client_side_msg').append(
        $('<p>').text('Disconnected from server.')));
    scrollToBottom();
  });
})();

