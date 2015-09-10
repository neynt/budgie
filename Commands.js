// Player enterable commands.

var direction = require('./direction.js');

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
      for (var username in global.users) {
        var user = global.users[username];
        if (user.socket) {
          global.users[username].send(player.name + ' shouts: ' + chat_msg);
        }
      }
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
      player.room.change_name(name, player);
    }
  }
};

Commands.descroom = {
  help_text: [
    'Usage: descroom [...]',
    'Changes the description of the current room.'
  ],
  run: function(player, args) {
    var desc = args.join(' ');
    player.room.changeDesc(desc, player);
  }
};

Commands.look = {
  help_text: [
    'Usage: look',
    'Looks around your current room.'
  ],
  run: function(player, args) {
    player.look();
  }
}

Commands.id = {
  help_text: [
    'Usage: id',
    'Gives you the id of the current room.'
  ],
  run: function(player, args) {
    player.send('id of ' + player.room.name + ' is ' + player.room.id);
  }
}

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
    if (dir) {
      player.move_in_dir(dir);
    } else {
      player.send('Invalid direction.');
    }
  }
}

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
        // TODO: refactor appear messages
        var old_room = player.room;
        global.rooms[room_id].broadcast(
          player.name
          + ' appears!');
        player.move_to_room(global.rooms[room_id]);
        old_room.broadcast(
          player.name
          + ' disappears!');
        player.look();
      } else {
        player.send('No such room.');
      }
    }
  }
}

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
      var old_room = player.room;
      global.users[username].room.broadcast(
        player.name
        + ' appears!');
      // TODO: refactor appear messages
      player.move_to_room(global.users[username].room);
      old_room.broadcast(
        player.name
        + ' disappears!');
      player.look();
    } else {
      player.send('No such user.');
    }
  }
}

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

    if (direction.opposite[dir] in other_room.exits) {
      player.send(
        'The other room already has an exit '
        + direction.to_the[direction.opposite[dir]]
        + '.');
      return;
    }

    // Success!
    var other_room = global.rooms[id];
    player.room.exits[dir] = other_room;
    other_room.exits[direction.opposite[dir]] = player.room;

  // TODO: refactor creates messages
    player.room.broadcast(
      player.name + ' creates an exit ' + direction.to_the[dir] + '.');
    other_room.broadcast(
      player.name + ' creates an exit from ' + direction.the[direction.opposite[dir]] + '.');
  }
}

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

    var dir = direction.parse(chunks[1]);

    if (!dir) {
      player.send('Invalid direction.');
    }
    if (!(dir in player.room.exits)) {
      player.send('There is no exit to unlink in that direction.');
    }

    var other_room = player.room.exits[dir];
    if (other_room.exits[direction.opposite[dir]] == player.room) {
      delete other_room.exits[direction.opposite[dir]];
    }
    delete player.room.exits[dir];

    // TODO: refactor creates messages
    player.room.broadcast(
      player.name + ' removes the exit ' + direction.to_the[dir] + '.');
    other_room.broadcast(
      player.name + ' removes the exit from ' + direction.the[dir] + '.');
  }
}

Commands.create = {
  help_text: [
    'Usage: create [direction]',
    'Creates a new room in the specified direction. Use "new" for a disconnected room.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.send('Create room in which direction? Use "create new" for a disconnected room.');
      return;
    }

    if (args[0] === 'new') {
      player.create_new_room();
      player.look();
      return;
    }

    var dir = direction.parse(args[0]);

    if (!dir) {
      player.send('Invalid direction.');
      return;
    }

    if (args[0] === 'new') {
    } else {
      player.create_room_in_dir(dir);
    }
  }
}

Commands.help = {
  help_text: [
    'Usage: help [command]',
    'Tells you how to use the specified command. If no command is specified,'
    + 'gives you a list of useful commands. Also, haha.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.sendMsg([
        'Basic commands: look, go',
        'Communication: say, shout, me',
        'Advanced movement: goto, tp',
        'Editing: create, id, nameroom, descroom, link, unlink',
        'Type "help [command]" for more detailed help about a command.'
      ]);
    }
    else if (args[0] in Commands) {
      player.sendMsg(Commands[args[0]].help_text);
    }
  }
}

module.exports = function() {
  return Commands;
}
