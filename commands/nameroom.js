module.exports = {
  help_text: [
    'Usage: nameroom [...]',
    'Changes the name of the current room.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Name this room what?');
    } else {
      var name = args.join(' ');
      player.room.changeName(name, player);
    }
  }
};