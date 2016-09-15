module.exports = {
  help_text: [
    'Usage: descroom [...]',
    'Changes the description of the current room.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Describe this room what?');
    } else {
      var desc = args.join(' ');
      player.room.changeDesc(desc, player);
    }
  }
};