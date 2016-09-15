var require_root = require.main.require;

var direction = require_root('./direction.js');
var Room = require_root('./Room.js')();

module.exports = {
  help_text: [
    'Usage: makeroom [direction]',
    'Makes a new room in the specified direction. Use "new" for a disconnected room.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Make room in which direction? Use "new" for a disconnected room.');
      return;
    }

    var old_room = player.room;
    var new_room = new Room();
    var dir = direction.parse(args[0]);

    if (args[0] === 'new') {
      player.send('You create a new room.');
      player.tp_to_room(new_room);
      player.look();
    } else if (dir) {
      if (dir in player.room.exits) {
        player.send('There is already a room in that direction.');
      } else {
        new_room.exits[direction.opposite[dir]] = old_room;
        old_room.exits[dir] = new_room;

        player.send('You create a room ' + direction.to_the[dir] + '.');
        old_room.broadcast(
          player.name
          + ' creates a new room '
          + direction.to_the[dir], player);

        player.run_command('go ' + dir);
      }
    } else {
      player.send('Invalid direction.');
      return;
    }
  }
};