var fs = require('fs');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var direction = require('./direction.js');
var User = require('./User.js')(io);
var Room = require('./Room.js')();

global.rooms = {};
global.rooms['center'] = new Room('center');
global.users = {};

function save_to_db() {
  process.stdout.write('saving to disk... ')
  var user_data = {};
  for (username in global.users) {
    var user = global.users[username];
    // do a sorta-deep-copy on the users
    user_data[username] = {
      passhash: user.passhash,
      salt: user.salt,
      room_id: user.room.id
    }
  }
  var room_data = {};
  for (room_id in global.rooms) {
    var room = global.rooms[room_id];
    var exit_data = {};
    for (exit_dir in room.exits) {
      exit_data[exit_dir] = room.exits[exit_dir].id;
    }
    room_data[room_id] = {
      name: room.name,
      desc: room.desc,
      img: room.img,
      exits: exit_data
    }
  }
  fs.writeFileSync('./saved_data.json', JSON.stringify({
    users: user_data,
    rooms: room_data
  }));
  console.log('saved');
}

function load_from_db() {
  if (fs.existsSync('./saved_data.json')) {
    try {
      var data = JSON.parse(fs.readFileSync('./saved_data.json', 'utf-8'));
      var user_data = data.users;
      var room_data = data.rooms;

      for (room_id in room_data) {
        var room = new Room(room_id);
        room.name = room_data[room_id].name;
        room.desc = room_data[room_id].desc;
        room.img = room_data[room_id].img;
        global.rooms[room_id] = room;
      }
      for (room_id in room_data) {
        var exits = {};
        for (exit_dir in room_data[room_id].exits) {
          exits[exit_dir] = global.rooms[room_data[room_id].exits[exit_dir]];
        }
        global.rooms[room_id].exits = exits;
      }
      for (username in user_data) {
        var user = new User(username);
        user.passhash = user_data[username].passhash;
        user.salt = user_data[username].salt;
        user.room = global.rooms[user_data[username].room_id];
        global.users[username] = user;
      }
      console.log('loaded data from disk');
    } catch (err) {
      console.log('failed to load data from disk:', err);
    }
  } else {
    console.log('no data found on disk');
  }
}

load_from_db();
setInterval(save_to_db, 60000);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  var user = null;
  console.log('a user connected');
  socket.emit('IMGMSG', 'http://i.imgur.com/FPZQECH.png');
  //socket.emit('IMGMSG', 'https://i.imgur.com/5b4LCCT.png');
  socket.emit('CHATMSG', 'Welcome to Salty Mush.');
  socket.emit('CHATMSG', 'What is your name?');
  socket.on('disconnect', function() {
    console.log('user disconnected');
    if (user) {
      io.emit('CHATMSG', user.name + ' has disconnected.');
      user.leave_room();
      user.room.broadcast(user.name + ' disappears.');
      user.online = false;
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
        if (name in global.users) {
          user = global.users[name];
        }
        else {
          user = new User(name);
          global.users[name] = user;
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

process.on('SIGINT', function() {
  save_to_db();
  console.log('Shutting down server.');
  process.exit();
});
