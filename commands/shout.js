var require_root = require.main.require;

var World = require_root('./World.js')();

module.exports = {
  help_text: [
    'Usage: shout [...]',
    'Sends a message to everyone online.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Shout what?');
      return;
    }

    var chat_msg = args.join(' ');
    if (chat_msg.length > 80000) {
      player.send('Your message is too long.');
    } else {
      World.broadcast(player.name + ' shouts: ' + chat_msg);
    }
  }
};