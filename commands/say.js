module.exports = {
  help_text: [
    'Usage: say [...]',
    'Sends a message to everyone in the same room as you.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Say what?');
      return;
    }

    var chat_msg = args.join(' ');
    if (chat_msg.length > 80000) {
      player.send('Your message is too long.');
    } else {
      player.room.broadcast(player.name + ' says: ' + chat_msg);
    }
  }
};

