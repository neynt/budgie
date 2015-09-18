// Player enterable commands.

var direction = require('./direction.js');
var World = require('./World.js')();
var Room = require('./Room.js')();

var Commands = {}

Commands.say = {
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
      player.room.broadcast(player.name + ': ' + chat_msg);
    }
  }
};

Commands.shout = {
  help_text: [
    'Usage: shout [...]',
    'Sends a message to everyone online.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Shout what?');
      return;
    }

    var chat_msg = args.join(' ');
    if (chat_msg.length > 80000) {
      player.send('Your message is too long.');
    } else {
      World.broadcast(player.name + ' shouts: ' + chat_msg);
    }
  }
};

Commands.me = {
  help_text: [
    'Usage: me [...]',
    'Performs an emote to everyone in the same room as you.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Emote what?');
    } else {
      var emote = args.join(' ');
      player.room.broadcast(player.name + ' ' + emote);
    }
  }
}

Commands.descself = {
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

Commands.who = {
  help_text: [
    'Usage: who',
    'Shows you a list of players who are online.'
  ],
  run: function(player, args) {
    var players_str = '';
    for (username in global.users) {
      var user = global.users[username];
      if (user.online) {
        if (players_str) {
          players_str += ', ';
        }
        players_str += user.name;
      }
    }
    player.send('Online players: ' + players_str);
  }
}

Commands.nameroom = {
  help_text: [
    'Usage: nameroom [...]',
    'Changes the name of the current room.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Name this room what?');
    } else {
      var name = args.join(' ');
      player.room.changeName(name, player);
    }
  }
};

Commands.descroom = {
  help_text: [
    'Usage: descroom [...]',
    'Changes the description of the current room.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Describe this room what?');
    } else {
      var desc = args.join(' ');
      player.room.changeDesc(desc, player);
    }
  }
};

Commands.roomimage = {
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

Commands.look = {
  help_text: [
    'Usage: look (target)',
    'Looks at the given target. If not given, looks around your current room.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.look();
    } else {
      var target_name = args.join(' ');
      if (player.room.lookAt(target_name, player)) {
        // success!
      } else {
        player.send('There is no ' + target_name + ' here.');
      }
    }
  }
};

Commands.id = {
  help_text: [
    'Usage: id',
    'Gives you the id of the current room.'
  ],
  run: function(player, args) {
    player.send('id of ' + player.room.name + ' is ' + player.room.id);
  }
};

Commands.go = {
  help_text: [
    'Usage: go [direction]',
    'Moves in the direction specified. You can also type the direction directly.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Go which direction?');
      return;
    }

    var dir = direction.parse(args[0]);
    if (dir in player.room.exits) {
      player.move_in_dir(dir);
      player.send('You go ' + direction.to_word[dir] + '.');
      player.look();
    } else if (dir) {
      player.send('You see no exit in that direction.');
    }
  }
};

Commands.goto = {
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

Commands.tp = {
  help_text: [
    'Usage: tp [player name]',
    'Teleports you directly to the given player.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Teleport to who?');
      return;
    }
    var username = args[0];
    if (username in global.users) {
      player.send('You teleport to ' + username + '.');
      player.tp_to_room(global.users[username].room);
      player.look();
    } else {
      player.send('No such user.');
    }
  }
};

Commands.link = {
  help_text: [
    'Usage: link [direction] [room id]',
    'Creates bidirectional exits to the given room in the given direction.'
  ],
  run: function(player, args) {
    if (args.length < 2) {
      player.send('Link which direction to which room?');
      return;
    }
    var dir = direction.parse(args[0]);
    var id = args[1];

    // Check a billion failure conditions
    if (!dir) {
      player.send('Invalid direction.');
      return;
    }

    if (!(id in global.rooms)) {
      player.send('Room with id ' + id + ' not found.');
      return;
    }

    if (id == player.room.id) {
      player.send('You cannot link a room to itself!');
      return;
    }

    if (dir in player.room.exits) {
      player.send(
        'There is already an exit '
        + direction.to_the[dir]
        + '.');
      return;
    }

    var other_room = global.rooms[id];

    if (direction.opposite[dir] in other_room.exits) {
      player.send(
        'The other room already has an exit '
        + direction.to_the[direction.opposite[dir]]
        + '.');
      return;
    }

    // Success!
    player.room.exits[dir] = other_room;
    other_room.exits[direction.opposite[dir]] = player.room;

    // TODO: refactor creates messages
    player.room.broadcast(
      player.name + ' creates an exit ' + direction.to_the[dir] + '.');
    other_room.broadcast(
      player.name + ' creates an exit from ' + direction.the[direction.opposite[dir]] + '.');
  }
};

Commands.makeexit = {
  help_text: [
    'Usage: makeexit [direction] [room id]',
    'Creates a one-way exit to the given room in the given direction.'
  ],
  run: function(player, args) {
    if (args.length < 2) {
      player.send('Create one-way exit in which direction to which room?');
      return;
    }
    var dir = direction.parse(args[0]);
    var id = args[1];

    // Check a billion failure conditions
    if (!dir) {
      player.send('Invalid direction.');
      return;
    }

    if (!(id in global.rooms)) {
      player.send('Room with id ' + id + ' not found.');
      return;
    }

    if (id == player.room.id) {
      player.send('You cannot link a room to itself!');
      return;
    }

    if (dir in player.room.exits) {
      player.send(
        'There is already an exit '
        + direction.to_the[dir]
        + '.');
      return;
    }

    var other_room = global.rooms[id];

    // Success!
    player.room.exits[dir] = other_room;
    player.room.broadcast(
      player.name + ' creates an exit ' + direction.to_the[dir] + '.');
  }
};

Commands.unlink = {
  help_text: [
    'Usage: unlink [direction]',
    'Disconnects the two rooms.'
  ],
  run: function(player, args) {
    if (args.length < 1) {
      player.send('Unlink in which direction?');
      return;
    }

    var dir = direction.parse(args[0]);

    if (!dir) {
      player.send('Invalid direction.');
    }
    if (!(dir in player.room.exits)) {
      player.send('There is no exit to unlink in that direction.');
    }

    var other_room = player.room.exits[dir];
    if (other_room.exits[direction.opposite[dir]] == player.room) {
      // Remove returning exit, if exists.
      delete other_room.exits[direction.opposite[dir]];
    }
    delete player.room.exits[dir];

    // TODO: refactor creates messages
    player.room.broadcast(
      player.name + ' removes the exit ' + direction.to_the[dir] + '.');
    other_room.broadcast(
      player.name + ' removes the exit from ' + direction.the[dir] + '.');
  }
};

Commands.makeroom = {
  help_text: [
    'Usage: makeroom [direction]',
    'Makes a new room in the specified direction. Use "new" for a disconnected room.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Make room in which direction? Use "new" for a disconnected room.');
      return;
    }

    var old_room = player.room;
    var new_room = new Room();
    var dir = direction.parse(args[0]);

    if (args[0] === 'new') {
      player.send('You create a new room.');
      player.tp_to_room(new_room);
      player.look();
    } else if (dir) {
      if (dir in player.room.exits) {
        player.send('There is already a room in that direction.');
      } else {
        new_room.exits[direction.opposite[dir]] = old_room;
        old_room.exits[dir] = new_room;

        player.send('You create a room ' + direction.to_the[dir] + '.');
        old_room.broadcast(
          player.name
          + ' creates a new room '
          + direction.to_the[dir], player);

        player.run_command('go ' + dir);
      }
    } else {
      player.send('Invalid direction.');
      return;
    }
  }
};

Commands.help = {
  help_text: [
    'Usage: help [command]',
    'Tells you how to use the specified command. If no command is specified, '
    + 'gives you a list of useful commands. Also, haha.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.sendMsg([
        'Basic commands: look, go',
        'Socializing: say, shout, me, descself',
        'Game info: who, help',
        'Advanced movement: goto, tp',
        'Building: makeroom, nameroom, descroom, roomimage, makeexit, link, unlink',
        'Type "help [command]" for more detailed help about a command.'
      ]);
    } else if (args[0] in Commands) {
      player.sendMsg(Commands[args[0]].help_text);
    } else {
      player.send(args[0] + ' is not a command yet.');
    }
  }
};

module.exports = function() {
  return Commands;
}
