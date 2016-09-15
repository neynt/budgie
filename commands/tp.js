module.exports = {
  help_text: [
    'Usage: tp [player name]',
    'Teleports you directly to the given player.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Teleport to who?');
      return;
    }
    var username = args[0];
    if (username in global.users) {
      player.send('You teleport to ' + username + '.');
      player.tp_to_room(global.users[username].room);
      player.look();
    } else {
      player.send('No such user.');
    }
  }
};