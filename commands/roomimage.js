module.exports = {
  help_text: [
    'Usage: roomimage [image url]',
    "Sets the room's image to the image at the given URL. Use \"roomimage none\" to remove the image."
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Set room image to what?');
    } else {
      var img = args.join(' ');
      if (img === 'none') {
        img = '';
      }
      player.room.changeImg(img, player);
    }
  }
};