import * as g from './global';
import User from './user';
import { MessageLine, ComplexMessage } from './message';

function on_disconnect() {
  console.log('user disconnected');
}

export default function handle_connection(socket: SocketIO.Socket) {
  var user = null;
  console.log('a user connected');

  function emit_lines(lines: Array<string>) {
    const lines_array: Array<MessageLine> = [];
    lines.forEach((line) => {
      lines_array.push({ type: 'normal', text: line });
    });
    socket.emit('CMPLXMSG', { lines: lines_array });
  }

  emit_lines([
    'Welcome to Smush.',
    'What is your name? Or type "new" if this is your first time here.',
  ]);
  socket.emit('passwd', {enable: 0});
  socket.on('disconnect', on_disconnect);

  function bind_user(user: User) {
    user.login(socket);
    socket.on('CHATMSG', function(msg) {
      user.handle_msg(msg);
    });
    socket.on('disconnect', function(msg) {
      user.on_disconnect();
    });
    socket.removeListener('CHATMSG', handle_msg);
    socket.removeListener('disconnect', on_disconnect);
  }

  function handle_msg_new_user(msg: string) {
    var name = msg.toLowerCase();
    if (check_good_name(name)) {
      var user = new User(name);
      g.users[name] = user;
      socket.emit('CHATMSG', '"' + name + '" it is.');
      bind_user(user);
    }
  }

  function handle_initial_message(msg: string) {
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
      if (name in g.users) {
        bind_user(g.users[name]);
      } else {
        socket.emit('CHATMSG', 'There\'s no one with that name yet.')
      }
    }
  }

  function check_good_name(name: string) {
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
    if (name in g.users) {
      socket.emit('CHATMSG', 'Sorry, that name has already been taken.');
      return false;
    }
    return true;
  }

  let state = handle_initial_message;

  function handle_msg(msg: string) {
    state(msg);
  }

  socket.on('CHATMSG', handle_msg);
}

module.exports = handle_connection;
