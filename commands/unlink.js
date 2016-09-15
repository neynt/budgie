var require_root = require.main.require;

var direction = require_root('./direction.js');

module.exports = {
  help_text: [
    'Usage: unlink [direction]',
    'Disconnects the two rooms.'
  ],
  run: function(player, args) {
    if (args.length < 1) {
      player.send('Unlink in which direction?');
      return;
    }

    var dir = direction.parse(args[0]);

    if (!dir) {
      player.send('Invalid direction.');
    }
    if (!(dir in player.room.exits)) {
      player.send('There is no exit to unlink in that direction.');
    }

    var other_room = player.room.exits[dir];
    if (other_room.exits[direction.opposite[dir]] == player.room) {
      // Remove returning exit, if exists.
      delete other_room.exits[direction.opposite[dir]];
    }
    delete player.room.exits[dir];

    // TODO: refactor creates messages
    player.room.broadcast(`${player.name} removes the exit ${direction.to_the[dir]}.`);
    other_room.broadcast(`${player.name} removes the exit from ${direction.the[dir]}.`);
  }
};