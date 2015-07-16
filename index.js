var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var direction_order = ['n', 'e', 's', 'w', 'u', 'd'];

var opposite_dir = {
  'n': 's',
  's': 'n',
  'e': 'w',
  'w': 'e',
  'u': 'd',
  'd': 'u'
};

var dir_name = {
  'n': 'north',
  's': 'south',
  'e': 'east',
  'w': 'west',
  'u': 'up',
  'd': 'down'
};

var dir_name_come = {
  'n': 'the north',
  's': 'the south',
  'e': 'the east',
  'w': 'the west',
  'u': 'upwards',
  'd': 'downwards'
};

var direction_dict = {
  'n': 'n',
  'e': 'e',
  'w': 'w',
  's': 's',
  'u': 'u',
  'd': 'd',
  'north': 'n',
  'east': 'e',
  'west': 'w',
  'south': 's',
  'up': 'u',
  'down': 'd',
};

function parse_direction(msg) {
  if (msg in direction_dict) {
    return direction_dict[msg];
  } else {
    return null;
  }
};

function Room(id) {
  if (id) {
    this.id = id;
  } else {
    do {
      this.id = Math.floor((7 * Math.random() + 1) * Math.pow(36, 7)).toString(36);
    } while (this.id in rooms);
  }
  this.name = 'generic room';
  this.desc = 'There is nothing here.';
  this.exits = {};
  this.users = [];
  rooms[this.id] = this;
};
Room.prototype.change_desc = function(desc, changer) {
  this.desc = desc;
  this.users.forEach(function(user) {
    user.send(changer.name + ' changes the description of this room.');
    user.look();
  });
};
Room.prototype.change_name = function(name, changer) {
  var old_name = this.name;
  this.name = name;
  this.broadcast(changer.name + ' changes the name of this room from "' + old_name + '" to "' + name + '".');
};
Room.prototype.broadcast = function(msg) {
  this.users.forEach(function(user) {
    user.send(msg);
  });
};

function User(name) {
  this.name = name; // user's name
  this.password = ''; // user's password, stored in plaintext because we're bad (TODO: hash passwords)
  this.socket = null;  // user's authoritative socket
  this.login_socket = null;  // temporary socket for logging in
  this.room = rooms['center'];
  this.msg_handler = this.handle_msg_normal;
};
User.prototype.send = function(msg) {
  this.socket.emit('CHATMSG', msg);
};
User.prototype.look = function() {
  var room = this.room;
  var msg = '[' + room.name + '] ';
  msg += room.desc;

  // Users
  var users = '';
  room.users.forEach(function(user, i) {
    if (i > 0) {
      users += ', ';
    }
    users += user.name;
  });
  if (users) {
    msg += ' Users here: ' + users + '.'
  } else {
    msg += ' Nobody else is here.'
  }

  // Exits
  var exits = ''
  direction_order.forEach(function (dir, i) {
    if (dir in room.exits) {
      if (exits) {
        exits += ', ';
      }
      exits += dir;
    }
  });
  if (exits) {
    msg += ' Exits: ' + exits + '.';
  } else {
    msg += ' No exits.';
  }

  this.send(msg);
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
    new_room.broadcast(this.name + ' comes from ' + dir_name_come[opposite_dir[dir]] + '.');
    this.move_to_room(new_room);
    old_room.broadcast(this.name + ' goes ' + dir_name[dir] + '.');
    this.send('You go ' + dir_name[dir] + '.');
    this.look();
  } else {
    this.send('There is no clear exit in that direction. Maybe you should "create" one.');
  }
};
User.prototype.create_room_in_dir = function(dir) {
  if (!(dir in this.room.exits)) {
    var old_room = this.room;
    var new_room = new Room();
    new_room.exits[opposite_dir[dir]] = old_room;
    old_room.exits[dir] = new_room;
    this.move_in_dir(dir);
    old_room.broadcast(this.name + ' creates a new room to ' + dir_name_come[dir]);
  } else {
    this.send('There is already a room in that direction.');
  }
};
User.prototype.handle_msg_ask_password = function(msg) {
  if (msg == this.password) {
    this.login_socket.emit('Correct.');
    this.come_online();
  } else {
    this.login_socket.emit('Incorrect.');
  }
};
User.prototype.handle_msg_new_password = function(msg) {
  if (msg.length < 3) {
    this.login_socket.emit('Your password needs to be at least 3 characters long.');
  } else {
    this.password = msg;
    this.login_socket.emit('Your password has been set.');
    this.come_online();
  }
};
User.prototype.handle_msg_normal = function(msg) {
  console.log(this.name + ': ' + msg);

  var chunks = msg.split(' ');
  if (!chunks) return;
  if (chunks[0] == 'me') {
    var emote = chunks.slice(1).join(' ');
    io.emit('CHATMSG', this.name + ' ' + emote);
  } else if (chunks[0] == 'say') {
    var chat_msg = chunks.slice(1).join(' ');
    this.room.broadcast('[' + this.room.name + '] ' + this.name + ': ' + chat_msg);
  } else if (chunks[0] == 'shout') {
    var chat_msg = chunks.slice(1).join(' ');
    io.emit('CHATMSG', this.name + 'shouts : ' + chat_msg);
  } else if (chunks[0] == 'name') {
    var name = chunks.slice(1).join(' ');
    this.room.change_name(name, this);
  } else if (chunks[0] == 'desc') {
    var desc = chunks.slice(1).join(' ');
    this.room.change_desc(desc, this);
  } else if (chunks[0] == 'look') {
    this.look();
  } else if (chunks[0] == 'id') {
    this.send('id of ' + this.room.name + ': ' + this.room.id);
  } else if (chunks[0] == 'go') {
    if (chunks[1]) {
      var dir = parse_direction(chunks[1]);
      if (dir) {
        this.move_in_dir(dir);
      } else {
        this.send('Invalid direction.');
      }
    } else {
      this.send('Go which direction?');
    }
  } else if (chunks[0] == 'create') {
    if (chunks[1]) {
      var dir = parse_direction(chunks[1]);
      if (dir) {
        this.create_room_in_dir(dir);
      } else {
        this.send('Invalid direction.');
      }
    } else {
      this.send('Create room in which direction?');
    }
  } else if (chunks[0] == 'link') {
    var dir = parse_direction(chunks[1]);
    var id = chunks[2];
    if (dir && id in rooms) {
      // TODO: prevent linking rooms to themselves
      var other_room = rooms[id];
      if (dir in this.room.exits) {
        this.send('There is already an exit to ' + dir_name_come[dir] + '.');
        return;
      }
      if (opposite_dir[dir] in other_room.exits) {
        this.send('The other room already has an exit to ' + dir_name_come[opposite_dir[dir]] + '.');
        return;
      }
      this.room.exits[dir] = other_room;
      other_room.exits[opposite_dir[dir]] = this.room;
      this.room.broadcast(this.name + ' creates an exit to ' + dir_name_come[dir] + '.');
      other_room.broadcast(this.name + ' creates an exit from ' + dir_name_come[dir] + '.');
    } else {
      this.send('Usage: link [direction] [room id]');
    }
  } else if (chunks[0] == 'help') {
    this.send('Commands: say, me, desc, look, go, create');
  } else {
    this.send('Unrecognized command.');
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
    this.login_socket.emit('CHATMSG', "Please enter a new password. Note: they are not currently hashed, so don't use a real password.");
    this.msg_handler = this.handle_msg_new_password;
  }
};

// TODO: save to offline database, not just ram lol
var rooms = {};
rooms['center'] = new Room('center');
var users = {};

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  var user = null;
  console.log('a user connected');
  socket.emit('CHATMSG', 'Enter your name.');
  socket.on('disconnect', function() {
    console.log('user disconnected');
    if (user) {
      io.emit('CHATMSG', user.name + ' has disconnected.');
      user.leave_room();
      user.room.broadcast(user.name + ' disappears.');
    }
  });
  socket.on('CHATMSG', function handle_msg_not_logged_in(msg) {
    if (!user) {
      var good_name = true;
      if (!msg.match(/^[A-Za-z]+$/)) {
        socket.emit('CHATMSG', 'Your name can only contain letters.');
        good_name = false;
      }
      if (msg.length < 3 || msg.length > 16) {
        socket.emit('CHATMSG', 'Your name must be 3-16 letters long.');
        good_name = false;
      }
      if (good_name) {
        var name = msg.toLowerCase();
        if (msg in users) {
          user = users[name];
        }
        else {
          user = new User(name);
          users[name] = user;
        }
        user.login(socket);
        socket.on('CHATMSG', function(msg) {
          user.handle_msg(msg);
        });
        socket.removeListener('CHATMSG', handle_msg_not_logged_in);
      }
    }
  });
});

http.listen(3069, function() {
  console.log('listening on *:3069');
});
