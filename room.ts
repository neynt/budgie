import * as g from './global';
import User from './user';
import * as Direction from './direction';

export default class Room {
  id: string;
  name: string;
  desc: string;
  img: string;
  exits: {[d: string]: Room};
  users: Array<User>;
  groups: Array<string>;

  constructor(id?: string) {
    if (id) {
      this.id = id;
    } else {
      do {
        this.id = Math.floor((7 * Math.random() + 1) * Math.pow(36, 7)).toString(36);
      } while (this.id in g.rooms);
    }
    this.name = 'empty';
    this.desc = '';
    this.img = '';
    this.exits = {};
    this.users = [];  // Users currently in the room.
    this.groups = [];  // Groups that own this room.
    g.rooms[this.id] = this;
  }

  lookAt(target: string, viewer: User) {
    if (target in g.users) {
      var target_user = g.users[target];
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

  playerEnter(player: User, dir?: Direction.t) {
    // Called when a player enters the room by any means.
    if (dir) {
      this.broadcast(
        player.name
        + ' comes from '
        + Direction.the(Direction.opposite(dir))
        + '.');
    } else {
      this.broadcast(player.name + ' appears.');
    }
  };

  playerLeave(player: User, dir: Direction.t) {
    // Called when a player leaves the room by any means.
    if (dir) {
      this.broadcast(
        player.name
        + ' goes '
        + Direction.to_word(dir)
        + '.');
    } else {
      this.broadcast(player.name + ' disappears.');
    }
  };

  changeDesc(desc: string, changer: User) {
    this.desc = desc;
    this.broadcast(`${changer.name} changes the description of this room to: ${desc}`);
  };

  changeImg(img: string, changer: User) {
    this.img = img;
    if (img === '') {
      this.broadcast(changer.name + ' removes the image of this room.');
    } else {
      this.broadcast(changer.name + ' changes the image of this room.');
    }
  };

  changeName(name: string, changer: User) {
    var old_name = this.name;
    this.name = name;
    this.broadcast(changer.name + ' changes the name of this room to "' + name + '".');
  };

  broadcast(msg: string, exclusion?: User) {
    this.users.forEach(function(user) {
      if (user != exclusion) {
        user.send(msg);
      }
    });
  };
}

module.exports = Room;
