var require_root = require.main.require;

var direction = require_root('./direction.js');

module.exports = {
  help_text: [
    'Usage: go [direction]',
    'Moves in the direction specified. You can also type the direction directly, '
    + ' or the first letter of the direction.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Go which direction?');
      return;
    }

    var dir = direction.parse(args[0]);
    if (dir in player.room.exits) {
      player.move_in_dir(dir);
      player.send(`You go ${direction.to_word[dir]}.`);
      player.look();
    } else if (dir) {
      player.send('You see no exit in that direction.');
    } else {
      player.send(`${args[0]} isn't a direction.`);
    }
  }
};