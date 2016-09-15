module.exports = {
  help_text: [
    'Usage: goto [room id]',
    'Go directly to the room with the specified id.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Go to room with which id?');
    } else {
      var room_id = args[0];
      if (room_id in global.rooms) {
        player.tp_to_room(global.rooms[room_id]);
        player.look();
      } else {
        player.send('No such room.');
      }
    }
  }
};