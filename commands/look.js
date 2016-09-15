module.exports = {
  help_text: [
    'Usage: look (target)',
    'Looks around the room. If target is given, looks at the target.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.look();
    } else {
      var target_name = args.join(' ');
      if (player.room.lookAt(target_name, player)) {
        // success!
      } else {
        player.send('There is no ' + target_name + ' here.');
      }
    }
  }
};