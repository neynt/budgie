var crypto = require('crypto');

var direction = require('./direction.js');
var Room = require('./Room.js')();
var Commands = require('./Commands.js')();
var World = require('./World.js')();

function User(name) {
  this.name = name; // user's name
  this.desc = ''; // user's description

  this.passhash = null; // hash(salt + password)
  this.salt = null; // salt for password

  this.socket = null;  // user's authoritative socket
  this.login_socket = null;  // temporary socket for logging in
  this.online = false;
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

User.prototype.setDesc = function(desc) {
  this.desc = desc;
};

User.prototype.sendComplexMsg = function(msg) {
  // A complex message is an array of objects with type and text properties.
  this.socket.emit('CMPLXMSG', msg);
};

User.prototype.send = function(msg) {
  this.socket.emit('CHATMSG', msg);
};

User.prototype.sendImg = function(img_url) {
  this.socket.emit('IMGMSG', img_url);
};

User.prototype.sendMsg = function(lines) {
  this.socket.emit('GAMEMSG', {
    lines: lines
  });
};

User.prototype.getDesc = function() {
  return this.desc;
};

User.prototype.look = function() {
  var room = this.room;

  var msg = {
    lines: [],
  };

  // Name
  if (room.name)
    msg.lines.push({ type: 'title', text: room.name });
  // Images
  if (room.img)
    msg.lines.push({ type: 'img', text: room.img });
  // Description
  if (room.desc)
    msg.lines.push({ type: 'normal', text: room.desc });

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
    msg.lines.push({ type: 'normal', text: 'Users here: ' + users + '.' });
  }

  // Exits
  var exits = ''
  direction.in_order.forEach(function (dir, i) {
    if (dir in room.exits) {
      if (exits) {
        exits += ', ';
      }
      exits += direction.to_word[dir];
    }
  });
  if (exits) {
    msg.lines.push({ type: 'normal', text: 'Exits: ' + exits + '.' });
  }

  this.sendComplexMsg(msg);
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

User.prototype.move_to_room = function(new_room) {
  var old_room = this.room;
  this.leave_room();
  this.enter_room(new_room);
};

User.prototype.tp_to_room = function(new_room) {
  // Move immediately from one room to another.
  var old_room = this.room;

  new_room.playerEnter(this);
  this.move_to_room(new_room);
  old_room.playerLeave(this);
}

User.prototype.move_in_dir = function(dir) {
  if (dir in this.room.exits) {
    var old_room = this.room;
    var new_room = old_room.exits[dir];

    new_room.playerEnter(this, dir);
    this.move_to_room(new_room);
    old_room.playerLeave(this, dir);
  } else {
    throw "Could not find exit in direction."
  }
};

User.prototype.run_command = function(msg) {
  var chunks = msg.split(' ');
  if (!chunks) return;

  var args = chunks.slice(1);
  var cmd = chunks[0].toLowerCase();

  var msg_as_dir = direction.parse(msg)

  if (cmd in Commands) {
    Commands[cmd].run(this, args);
  } else if (msg_as_dir) {
    Commands.go.run(this, chunks);
  } else {
    return false;  // command was not found
  }
  return true;  // command was successful
}

User.prototype.handle_msg_normal = function(msg) {
  console.log(this.name + ': ' + msg);

  if (!this.run_command(msg)) {
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
  if (this.socket) {
    this.send('You have logged in from somewhere else.');
    this.socket.disconnect();
  }
  this.socket = this.login_socket;
  this.online = true;

  this.login_socket.emit('passwd', {enable: 0});
  World.broadcast(this.name + ' has come online.');
  this.run_command('who');
  this.room.broadcast(this.name + ' flickers and appears.');
  this.msg_handler = this.handle_msg_normal;
  this.enter_room(this.room);
  this.look();
};

User.prototype.login = function(socket) {
  this.login_socket = socket;
  this.login_socket.emit('passwd', {enable: 1});
  if (this.passhash) {
    this.login_socket.emit('CHATMSG', 'Please enter your password.');
    this.msg_handler = this.handle_msg_ask_password;
  } else {
    this.login_socket.emit('CHATMSG', 'Please enter your desired password.');
    this.msg_handler = this.handle_msg_new_password;
  }
};

User.prototype.on_disconnect = function() {
  console.log('user disconnected: ' + this.name);
  this.leave_room();
  this.room.broadcast(this.name + ' flickers and disappears.');
  this.online = false;
}

module.exports = function() {
  return User;
}
