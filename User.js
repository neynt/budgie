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
    this.send('You see no exit in that direction. Maybe you could "create" one.');
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
  var cmd = chunks[0].toLowerCase();
  if (cmd in direction.direction_dict) {
    var dir = direction.parse(chunks[0]);
    this.move_in_dir(dir);
  } else if (cmd == 'me') {
    var emote = chunks.slice(1).join(' ');
    this.room.broadcast(this.name + ' ' + emote);
  } else if (cmd == 'say') {
    var chat_msg = chunks.slice(1).join(' ');
    this.room.broadcast(this.name + ': ' + chat_msg);
  } else if (cmd == 'shout') {
    var chat_msg = chunks.slice(1).join(' ');
    io.emit('CHATMSG', this.name + ' shouts: ' + chat_msg);
  } else if (cmd == 'nameroom') {
    var name = chunks.slice(1).join(' ');
    this.room.change_name(name, this);
  } else if (cmd == 'descroom') {
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
  } else if (cmd == 'tp') {
    var room_id = chunks[1];
    if (room_id in global.rooms) {
      this.move_to_room(global.rooms[room_id]);
    }
  } else if (cmd == 'create') {
    if (chunks[1]) {
      var dir = direction.parse(chunks[1]);
      if (dir) {
        this.create_room_in_dir(dir);
      } else if (chunks[1] == 'new') {
        this.create_new_room();
      } else {
        this.send('Invalid direction.');
      }
    } else {
      this.send('Create room in which direction? Use "create new" for a disconnected room.');
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
    var arg = chunks[1];
    if (arg == 'say') {
      this.send('Usage: say [...]');
      this.send('Sends a message to everyone in the same room as you.');
    } else if (arg == 'shout') {
      this.send('Usage: shout [...]');
      this.send('Sends a message to everyone online.');
    } else if (arg == 'me') {
      this.send('Usage: me [...]');
      this.send('Performs an emote to everyone in the same room as you.');
    } else if (arg == 'nameroom') {
      this.send('Usage: nameroom [...]');
      this.send('Changes the name of the current room.');
    } else if (arg == 'descroom') {
      this.send('Usage: descroom [...]');
      this.send('Changes the description of the current room.');
    } else if (arg == 'look') {
      this.send('Usage: look');
      this.send('Looks around your current room.');
    } else if (arg == 'id') {
      this.send('Usage: id');
      this.send('Gives you the id of the current room, for linking purposes.');
    } else if (arg == 'go') {
      this.send('Usage: go [direction]');
      this.send('Moves in the direction specified. You can also type the direction directly.');
    } else if (arg == 'create') {
      this.send('Usage: create [direction]');
      this.send('Creates a new room in the specified direction. Use "new" for a disconnected room.');
    } else {
      this.send('Important commands: say, shout, me, nameroom, descroom, look, id, go, create.');
      this.send('Type "help [command]" for more detailed help.');
    }
  } else {
    this.send('Unrecognized command.');
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
  this.room.broadcast(this.name + ' appears before your very eyes.');
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
