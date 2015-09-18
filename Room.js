var direction = require('./direction.js');

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
  this.users = [];  // Users currently in the room.
  this.groups = [];  // Groups that own this room.
  global.rooms[this.id] = this;
};

Room.prototype.lookAt = function(target, viewer) {
  if (target in global.users) {
    var target_user = global.users[target];
    var idx = this.users.indexOf(target_user);
    if (idx != -1) {
      // Found user in current room.
      var viewstring;
      if (target_user === viewer) {
        viewstring = 'You look at ' + target + ' (yourself).';
      } else {
        viewstring = 'You look at ' + target + '.';
      }
      if (target_user.desc) {
        viewstring += ' ' + target_user.desc;
      }
      viewer.send(viewstring);
      return true;
    }
  }
  return false;
};

Room.prototype.playerEnter = function(player, dir) {
  // Called when a player enters the room by any means.
  if (dir) {
    this.broadcast(
      player.name
      + ' comes from '
      + direction.the[direction.opposite[dir]]
      + '.');
  } else {
    this.broadcast(player.name + ' appears.');
  }
};

Room.prototype.playerLeave = function(player, dir) {
  // Called when a player leaves the room by any means.
  if (dir) {
    this.broadcast(
      player.name
      + ' goes '
      + direction.to_word[dir]
      + '.');
  } else {
    this.broadcast(player.name + ' disappears.');
  }
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

Room.prototype.broadcast = function(msg, exclusion) {
  this.users.forEach(function(user) {
    if (user != exclusion) {
      user.send(msg);
    }
  });
};

module.exports = function() {
  return Room;
}
