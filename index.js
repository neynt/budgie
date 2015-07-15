var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

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

function Room() {
  this.desc = 'You are in a generic room.';
  this.exits = {};
  this.users = [];
};
Room.prototype.change_desc = function(desc, changer) {
  this.desc = desc;
  this.users.forEach(function(user) {
    user.send(changer.name + ' changes the description of this room.');
    user.look();
  });
};
Room.prototype.broadcast = function(msg) {
  this.users.forEach(function(user) {
    user.send(msg);
  });
};

function User(name) {
  this.name = name;
  this.room = rooms['center'];
};
User.prototype.send = function(msg) {
  this.socket.emit('chat message', msg);
};
User.prototype.look = function() {
  var msg = this.room.desc;

  // Users
  var users = '';
  this.room.users.forEach(function(user, i) {
    if (i > 0) {
      users += ', ';
    }
    users += user.name;
  });
  if (users) {
    msg += ' [Users here: ' + users + ']'
  } else {
    msg += ' [Nobody else is here.]'
  }

  // Exits
  var exits = Object.keys(this.room.exits).join(', ');
  if (exits) {
    msg += ' [Exits: ' + exits + ']';
  } else {
    msg += '[No exits.]';
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
    this.send('There is no clear exit in that direction. Maybe you should /create one.');
  }
};
User.prototype.create_room_in_dir = function(dir) {
  if (!(dir in this.room.exits)) {
    var new_room = new Room();
    new_room.exits[opposite_dir[dir]] = this.room;
    this.room.exits[dir] = new_room;
    this.move_in_dir(dir);
  } else {
    this.send('There is already a room in that direction.');
  }
};
User.prototype.handle_msg = function(msg) {
  var chunks = msg.split(' ');
  if (!chunks) return;
  if (chunks[0][0] == '/') {
    // handle command
    if (chunks[0] == '/me') {
      var emote = chunks.slice(1).join(' ');
      io.emit('chat message', this.name + ' ' + emote);
    } else if (chunks[0] == '/desc') {
      var desc = chunks.slice(1).join(' ');
      this.room.change_desc(desc, this);
    } else if (chunks[0] == '/look') {
      this.look();
    } else if (chunks[0] == '/go') {
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
    } else if (chunks[0] == '/create') {
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
    } else if (chunks[0] == '/help') {
      this.send('Commands: /me, /desc, /look, /go, /create');
    } else {
      this.send('Unrecognized command.');
    }
  } else {
    io.emit('chat message', this.name + ': ' + msg);
  }
};

var rooms = {
  'center': new Room()
};
var users = {};

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  var user = null;
  console.log('a user connected');
  socket.emit('chat message', 'Enter your name.');
  socket.on('disconnect', function() {
    console.log('user disconnected');
    if (user) {
      io.emit('chat message', user.name + ' has disconnected.');
      user.leave_room();
      user.room.broadcast(user.name + ' disappears.');
    }
  });
  socket.on('chat message', function(msg) {
    if (!user) {
      if (msg in users) {
        user = users[msg];
      }
      else {
        user = new User(msg);
        users[msg] = user;
      }
      io.emit('chat message', user.name + ' has come online.');
      user.socket = socket;
      user.send('Type /help for help.');
      user.room.broadcast(user.name + ' appears before your very eyes.');
      user.enter_room(user.room);
      user.look();
    }
    else {
      user.handle_msg(msg);
    }
  });
});

http.listen(3069, function() {
  console.log('listening on *:3069');
});
