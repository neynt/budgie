module.exports = {
  help_text: [
    'Usage: me [...]',
    'Performs an emote to everyone in the same room as you.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Emote what?');
    } else {
      var emote = args.join(' ');
      player.room.broadcast(player.name + ' ' + emote);
    }
  }
}