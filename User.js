var crypto = require('crypto');
var io = null;

var direction = require('./direction.js');
var Room = require('./Room.js')();

function User(name) {
  this.name = name; // user's name
  this.passhash = null; // hash(salt + password)
  this.salt = null; // salt for password
  this.socket = null;  // user's authoritative socket
  this.login_socket = null;  // temporary socket for logging in
  this.room = global.rooms['center'];
  this.msg_handler = this.handle_msg_normal;
};
User.prototype.setPassword = function(password) {
  this.salt = new Date().getTime().toString(36);
  var hasher = crypto.createHash('sha512');
  hasher.update(this.salt + password);
  this.passhash = hasher.digest('hex');
};
User.prototype.verifyPassword = function(password) {
  var hasher = crypto.createHash('sha512');
  hasher.update(this.salt + password);
  return hasher.digest('hex') === this.passhash;
};
User.prototype.send = function(msg) {
  this.socket.emit('CHATMSG', msg);
};
User.prototype.look = function() {
  var room = this.room;
  var msg = '[' + room.name + '] ';
  msg += room.desc;
  this.send(msg);

  // Users
  var users = '';
  room.users.forEach(function(user, i) {
    if (user != this) {
      if (i > 0) {
        users += ', ';
      }
      users += user.name;
    }
  }, this);
  if (users) {
    this.send('Users here: ' + users + '.');
  }

  // Exits
  var exits = ''
  direction.in_order.forEach(function (dir, i) {
    if (dir in room.exits) {
      if (exits) {
        exits += ', ';
      }
      exits += dir;
    }
  });
  if (exits) {
    this.send(' Exits: ' + exits + '.');
  }
};
User.prototype.enter_room = function(room) {
  room.users.push(this);
  this.room = room;
};
User.prototype.leave_room = function() {
  var idx = this.room.users.indexOf(this);
  if (idx > -1) {
    this.room.users.splice(idx, 1);
  }
};
User.prototype.move_to_room = function(room) {
  this.leave_room();
  this.enter_room(room);
};
User.prototype.move_in_dir = function(dir) {
  if (dir in this.room.exits) {
    var old_room = this.room;
    var new_room = old_room.exits[dir];
    new_room.broadcast(
      this.name
      + ' comes from '
      + direction.to_the[direction.opposite[dir]]
      + '.');
    this.move_to_room(new_room);
    old_room.broadcast(
      this.name
      + ' goes '
      + direction.to_word[dir]
      + '.');
    this.send('You go ' + direction.to_word[dir] + '.');
    this.look();
  } else {
    this.send('There is no clear exit in that direction. Maybe you should "create" one.');
  }
};
User.prototype.create_room_in_dir = function(dir) {
  if (!(dir in this.room.exits)) {
    var old_room = this.room;
    var new_room = new Room();
    new_room.exits[direction.opposite[dir]] = old_room;
    old_room.exits[dir] = new_room;
    this.send('You create a room ' + direction.to_the[dir]);
    this.move_in_dir(dir);
    old_room.broadcast(this.name + ' creates a new room to ' + direction.to_the[dir]);
  } else {
    this.send('There is already a room in that direction.');
  }
};
User.prototype.handle_msg_normal = function(msg) {
  console.log(this.name + ': ' + msg);

  var chunks = msg.split(' ');
  if (!chunks) return;
  var cmd = chunks[0].toLowerCase();
  if (cmd == 'me') {
    var emote = chunks.slice(1).join(' ');
    io.emit('CHATMSG', this.name + ' ' + emote);
  } else if (cmd == 'say') {
    var chat_msg = chunks.slice(1).join(' ');
    this.room.broadcast(this.name + ': ' + chat_msg);
  } else if (cmd == 'shout') {
    var chat_msg = chunks.slice(1).join(' ');
    io.emit('CHATMSG', this.name + ' shouts: ' + chat_msg);
  } else if (cmd == 'name') {
    var name = chunks.slice(1).join(' ');
    this.room.change_name(name, this);
  } else if (cmd == 'desc') {
    var desc = chunks.slice(1).join(' ');
    this.room.change_desc(desc, this);
  } else if (cmd == 'look') {
    this.look();
  } else if (cmd == 'id') {
    this.send('id of ' + this.room.name + ': ' + this.room.id);
  } else if (cmd == 'go') {
    if (chunks[1]) {
      var dir = direction.parse(chunks[1]);
      if (dir) {
        this.move_in_dir(dir);
      } else {
        this.send('Invalid direction.');
      }
    } else {
      this.send('Go which direction?');
    }
  } else if (cmd == 'create') {
    if (chunks[1]) {
      var dir = direction.parse(chunks[1]);
      if (dir) {
        this.create_room_in_dir(dir);
      } else {
        this.send('Invalid direction.');
      }
    } else {
      this.send('Create room in which direction?');
    }
  } else if (cmd == 'link') {
    var dir = direction.parse(chunks[1]);
    var id = chunks[2];
    if (dir && id in global.rooms) {
      var other_room = global.rooms[id];
      if (id == this.room.id) {
        this.send('You cannot link a room to itself!');
        return;
      }
      if (dir in this.room.exits) {
        this.send(
          'There is already an exit '
          + direction.to_the[dir]
          + '.');
        return;
      }
      if (direction.opposite[dir] in other_room.exits) {
        this.send(
          'The other room already has an exit '
          + direction.to_the[direction.opposite[dir]]
          + '.');
        return;
      }
      this.room.exits[dir] = other_room;
      other_room.exits[direction.opposite[dir]] = this.room;
      this.room.broadcast(
        this.name
        + ' creates an exit '
        + direction.to_the[dir]
        + '.');
      other_room.broadcast(
        this.name
        + ' creates an exit from '
        + direction.the[direction.opposite[dir]]
        + '.');
    } else {
      this.send('Usage: link [direction] [room id]');
    }
  } else if (cmd == 'help') {
    this.send('Commands: say, me, desc, look, go, create');
  } else {
    this.send('Unrecognized command.');
  }
};
User.prototype.handle_msg_ask_password = function(msg) {
  if (this.verifyPassword(msg)) {
    this.login_socket.emit('CHATMSG', 'Correct.');
    this.come_online();
  } else {
    this.login_socket.emit('CHATMSG', 'Incorrect.');
  }
};
User.prototype.handle_msg_new_password = function(msg) {
  if (msg.length < 3) {
    this.login_socket.emit('CHATMSG', 'Your password needs to be at least 3 characters long.');
  } else {
    this.setPassword(msg);
    this.login_socket.emit('CHATMSG', 'Your password has been set.');
    this.come_online();
  }
};
User.prototype.handle_msg = function(msg) {
  this.msg_handler(msg);
};
User.prototype.come_online = function() {
  this.socket = this.login_socket;
  io.emit('CHATMSG', this.name + ' has come online.');
  this.send('Type "help" for help.');
  this.room.broadcast(this.name + ' appears before your very eyes.');
  this.msg_handler = this.handle_msg_normal;
  this.enter_room(this.room);
  this.look();
};
User.prototype.login = function(socket) {
  this.login_socket = socket;
  if (this.password) {
    this.login_socket.emit('CHATMSG', 'Please enter your password.');
    this.msg_handler = this.handle_msg_ask_password;
  } else {
    this.login_socket.emit('CHATMSG', 'Please enter a new password. Note: they are not currently hashed, so do not use a real password.');
    this.msg_handler = this.handle_msg_new_password;
  }
};

module.exports = function(incoming_io) {
  io = incoming_io;
  return User;
}
