var World = {};
World.broadcast = function(msg) {
  // Broadcasts a CHATMSG to every online user.
  for (var username in global.users) {
    var user = global.users[username];
    if (user.socket) {
      global.users[username].send(msg);
    }
  }
}

module.exports = function() {
  return World;
}
