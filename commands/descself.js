module.exports = {
  help_text: [
    'Usage: descself [...]',
    "Sets your character's description. Others will see this description when they look at your character."
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Describe self what?');
    } else {
      var desc = args.join(' ');
      player.setDesc(desc);
      player.send('Described self as "' + desc + '"');
    }
  }
}