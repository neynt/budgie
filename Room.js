function Room(id) {
  if (id) {
    this.id = id;
  } else {
    do {
      this.id = Math.floor((7 * Math.random() + 1) * Math.pow(36, 7)).toString(36);
    } while (this.id in global.rooms);
  }
  this.name = 'Empty room';
  this.desc = 'There is nothing here.';
  this.exits = {};
  this.users = [];
  global.rooms[this.id] = this;
};

Room.prototype.change_desc = function(desc, changer) {
  this.desc = desc;
  this.users.forEach(function(user) {
    user.send(changer.name + ' changes the description of this room.');
    user.look();
  });
};

Room.prototype.change_name = function(name, changer) {
  var old_name = this.name;
  this.name = name;
  this.broadcast(changer.name + ' changes the name of this room to "' + name + '".');
};

Room.prototype.broadcast = function(msg) {
  this.users.forEach(function(user) {
    user.send(msg);
  });
};

module.exports = function() {
  return Room;
}
