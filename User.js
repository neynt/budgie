var crypto = require('crypto');
var io = null;

var direction = require('./direction.js');
var Room = require('./Room.js')();
var Commands = require('./Commands.js')();

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
      if (users) {
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
      + direction.the[direction.opposite[dir]]
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
    this.send('You see no exit in that direction.');
  }
};

User.prototype.create_new_room = function() {
  var old_room = this.room;
  var new_room = new Room();
  this.send('You create a brand new room.');
  this.move_to_room(new_room);
  old_room.broadcast(this.name + ' disappears.');
};

User.prototype.create_room_in_dir = function(dir) {
  if (!(dir in this.room.exits)) {
    var old_room = this.room;
    var new_room = new Room();
    new_room.exits[direction.opposite[dir]] = old_room;
    old_room.exits[dir] = new_room;
    this.send('You create a room ' + direction.to_the[dir] + '.');
    this.move_in_dir(dir);
    old_room.broadcast(this.name + ' creates a new room ' + direction.to_the[dir]);
  } else {
    this.send('There is already a room in that direction.');
  }
};

User.prototype.handle_msg_normal = function(msg) {
  console.log(this.name + ': ' + msg);

  var chunks = msg.split(' ');
  if (!chunks) return;

  var args = chunks.slice(1);
  var cmd = chunks[0].toLowerCase();

  if (cmd in Commands) {
    Commands[cmd].run(this, args);
  } else if (cmd in direction.direction_dict) {
    var dir = direction.parse(chunks[0]);
    this.move_in_dir(dir);
  } else {
    this.send('Unrecognized command. Type "help" for help.');
  }
};

User.prototype.handle_msg_ask_password = function(msg) {
  if (this.verifyPassword(msg)) {
    this.come_online();
  } else {
    this.login_socket.emit('CHATMSG', 'Incorrect. Please try again.');
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
  this.room.broadcast(this.name + ' appears.');
  this.msg_handler = this.handle_msg_normal;
  this.enter_room(this.room);
  this.look();
};

User.prototype.login = function(socket) {
  this.login_socket = socket;
  if (this.passhash) {
    this.login_socket.emit('CHATMSG', 'Please enter your password.');
    this.msg_handler = this.handle_msg_ask_password;
  } else {
    this.login_socket.emit('CHATMSG', 'Please enter a new password.');
    this.msg_handler = this.handle_msg_new_password;
  }
};

module.exports = function(incoming_io) {
  io = incoming_io;
  return User;
}
