var User = require('./User.js')();

var handle_connection = function(socket) {
  var user = null;
  console.log('a user connected');

  var emit_lines = function(lines) {
    lines_array = [];
    lines.forEach(function(line) {
      lines_array.push({ type: 'normal', text: line });
    });
    socket.emit('CMPLXMSG', { lines: lines_array });
  }

  emit_lines([
    'Welcome to Smush.',
    'What is your name? Or type "new" if this is your first time here.'
  ]);
  socket.emit('passwd', {enable: 0});


  var on_disconnect = function() {
    console.log('user disconnected');
  }
  socket.on('disconnect', on_disconnect);

  var bind_user = function(user) {
    user.login(socket);
    socket.on('CHATMSG', function(msg) {
      user.handle_msg(msg);
    });
    socket.on('disconnect', function(msg) {
      user.on_disconnect(msg);
    });
    socket.removeListener('CHATMSG', handle_msg);
    socket.removeListener('disconnect', on_disconnect);
  }

  var handle_msg_new_user = function(msg) {
    var name = msg.toLowerCase();
    if (check_good_name(name)) {
      var user = new User(name);
      global.users[name] = user;
      socket.emit('CHATMSG', '"' + name + '" it is.');
      bind_user(user);
    }
  }

  var handle_initial_message = function(msg) {
    if (msg === 'new') {
      // Start new user process.
      emit_lines([
        'You are about to enter a vibrant, mutable world.',
        'What name do you wish to be known by?'
      ]);
      state = handle_msg_new_user;
    } else {
      var name = msg;
      var id = name.toLowerCase();
      if (name in global.users) {
        bind_user(global.users[name]);
      } else {
        socket.emit('CHATMSG', 'There\'s no one with that name yet.')
      }
    }
  }

  var check_good_name = function(name) {
    if (!name.match(/^[A-Za-z]+$/)) {
      socket.emit('CHATMSG', 'Your name can only contain letters.');
      return false;
    }
    if (name.length < 3 || name.length > 16) {
      socket.emit('CHATMSG', 'Your name must be 3 to 16 letters long.');
      return false;
    }
    if (name === 'new') {
      socket.emit('CHATMSG', 'But then you wouldn\'t be able to log in!');
      return false;
    }
    if (name in global.users) {
      socket.emit('CHATMSG', 'Sorry, that name has already been taken.');
      return false;
    }
    return true;
  }

  var state = handle_initial_message;

  var handle_msg = function(msg) {
    state(msg);
  }

  socket.on('CHATMSG', handle_msg);
}

module.exports = handle_connection;
