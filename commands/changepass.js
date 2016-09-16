module.exports = {
  help_text: [
    'Usage: changepass',
    'Changes your password.'
  ],
  run: function(player, args) {
    player.change_password();
  }
};