module.exports = {
  help_text: [
    'Usage: who',
    'Shows you a list of players who are online.'
  ],
  run: function(player, args) {
    var players_str = '';
    for (username in global.users) {
      var user = global.users[username];
      if (user.online) {
        if (players_str) {
          players_str += ', ';
        }
        players_str += user.name;
      }
    }
    player.send('Online players: ' + players_str);
  }
}