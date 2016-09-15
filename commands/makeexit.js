var require_root = require.main.require;

var direction = require_root('./direction.js');
var Room = require_root('./Room.js')();

module.exports = {
  help_text: [
    'Usage: makeexit [direction] [room id]',
    'Creates a one-way exit to the given room in the given direction.'
  ],
  run: function(player, args) {
    if (args.length < 2) {
      player.send('Create one-way exit in which direction to which room?');
      return;
    }
    var dir = direction.parse(args[0]);
    var id = args[1];

    // Check a billion failure conditions
    if (!dir) {
      player.send('Invalid direction.');
      return;
    }

    if (!(id in global.rooms)) {
      player.send(`Room with id ${id} not found.`);
      return;
    }

    if (id == player.room.id) {
      player.send('You cannot link a room to itself!');
      return;
    }

    if (dir in player.room.exits) {
      player.send(`There is already an exit ${direction.to_the[dir]}.`);
      return;
    }

    var other_room = global.rooms[id];

    // Success!
    player.room.exits[dir] = other_room;
    player.room.broadcast(`${player.name} creates an exit ${direction.to_the[dir]}.`);
  }
};