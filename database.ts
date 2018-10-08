import * as g from './global';
import User from './user';
import Room from './room';
import fs from 'fs';

export function save_all() {
  const user_data: any = {};
  for (const username in g.users) {
    const user = g.users[username];
    // do a sorta-deep-copy on the users
    user_data[username] = {
      passhash: user.passhash,
      salt: user.salt,
      room_id: user.room.id,
      desc: user.desc
    }
  }
  const room_data: any = {};
  for (const id in g.rooms) {
    const room = g.rooms[id];
    const exit_data: any = {};
    for (const exit_dir in room.exits) {
      exit_data[exit_dir] = room.exits[exit_dir].id;
    }
    room_data[id] = {
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
}

export function load_all() {
  if (fs.existsSync('./saved_data.json')) {
    try {
      var data = JSON.parse(fs.readFileSync('./saved_data.json', 'utf-8'));
      var user_data = data.users;
      var room_data = data.rooms;

      for (const id in room_data) {
        var room = new Room(id);
        room.name = room_data[id].name;
        room.desc = room_data[id].desc;
        room.img = room_data[id].img;
        g.rooms[id] = room;
      }
      for (const id in room_data) {
        const exits: {[dir: string]: Room} = {};
        for (const exit_dir in room_data[id].exits) {
          exits[exit_dir] = g.rooms[room_data[id].exits[exit_dir]];
        }
        g.rooms[id].exits = exits;
      }
      for (const name in user_data) {
        var user = new User(name);
        user.passhash = user_data[name].passhash;
        user.salt = user_data[name].salt;
        user.room = g.rooms[user_data[name].room_id];
        user.desc = user_data[name].desc;
        g.users[name] = user;
      }
      console.log('loaded data from disk');
    } catch (err) {
      console.log('failed to load data from disk:', err);
    }
  } else {
    console.log('no data found on disk');
  }
}
