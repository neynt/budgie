module.exports = {
  help_text: [
    'Usage: id',
    'Gives you the id of the current room.'
  ],
  run: function(player, args) {
    player.send('id of ' + player.room.name + ' is ' + player.room.id);
  }
};