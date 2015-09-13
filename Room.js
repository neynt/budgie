function Room(id) {
  if (id) {
    this.id = id;
  } else {
    do {
      this.id = Math.floor((7 * Math.random() + 1) * Math.pow(36, 7)).toString(36);
    } while (this.id in global.rooms);
  }
  this.name = 'empty';
  this.desc = '';
  this.img = '';
  this.exits = {};
  this.users = [];
  global.rooms[this.id] = this;
};

Room.prototype.lookAt = function(target, viewer) {
  if (target in global.users) {
    var target_user = global.users[target];
    var idx = this.users.indexOf(target_user);
    if (idx != -1) {
      if (target_user === viewer) {
        viewer.send('You look at yourself.');
      } else {
        viewer.send('You look at ' + target + '.');
      }
      return true;
    }
  }
  return false;
};

Room.prototype.changeDesc = function(desc, changer) {
  this.desc = desc;
  this.broadcast(changer.name + ' changes the description of this room to: ' + desc);
};

Room.prototype.changeImg = function(img, changer) {
  this.img = img;
  if (img === '') {
    this.broadcast(changer.name + ' removes the image of this room.');
  } else {
    this.broadcast(changer.name + ' changes the image of this room.');
  }
};

Room.prototype.changeName = function(name, changer) {
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
