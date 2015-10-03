var User = require('./User.js')();

var handle_connection = function(socket) {
  var user = null;
  console.log('a user connected');
  socket.emit('CHATMSG', 'What is your username? Type "new" if you\'ve never been here before.');
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
      bind_user(user);
    }
  }

  var handle_initial_message = function(msg) {
    if (msg === 'new') {
      // Start new user process.
      socket.emit('CHATMSG', 'Please enter a username. It must be between 3 and 16 letters long.');
      state = handle_msg_new_user;
    } else {
      var name = msg.toLowerCase();
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
      socket.emit('CHATMSG', 'Your name must be 3-16 letters long.');
      return false;
    }
    if (name === 'new') {
      socket.emit('CHATMSG', 'You can\'t use that name! Nice try, though.');
      return false;
    }
    if (name in global.users) {
      socket.emit('CHATMSG', 'That name has already been taken.');
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
