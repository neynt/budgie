var fs = require('fs');

var User = require('./User.js')();
var Room = require('./Room.js')();

function Database() {
}
Database.prototype.save_all = function() {
  process.stdout.write('saving to disk... ')
  var user_data = {};
  for (username in global.users) {
    var user = global.users[username];
    // do a sorta-deep-copy on the users
    user_data[username] = {
      passhash: user.passhash,
      salt: user.salt,
      room_id: user.room.id,
      desc: user.desc
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

Database.prototype.load_all = function() {
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
        user.desc = user_data.desc;
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
module.exports = function() {
  return new Database();
}
