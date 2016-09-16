var Commands = {}

Commands.changepass = require('./changepass.js');
Commands.descroom = require('./descroom.js');
Commands.descself = require('./descself.js');
Commands.go = require('./go.js');
Commands.goto = require('./goto.js');
Commands.id = require('./id.js');
Commands.link = require('./link.js');
Commands.look = require('./look.js');
Commands.makeexit = require('./makeexit.js');
Commands.makeroom = require('./makeroom.js');
Commands.me = require('./me.js');
Commands.nameroom = require('./nameroom.js');
Commands.roomimage = require('./roomimage.js');
Commands.say = require('./say.js');
Commands.shout = require('./shout.js');
Commands.tp = require('./tp.js');
Commands.unlink = require('./unlink.js');
Commands.who = require('./who.js');

Commands.help = {
  help_text: [
    'Usage: help [command]',
    'Tells you how to use the specified command. If no command is specified, '
    + 'gives you a list of useful commands. Also, nice one.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.sendMsg([
        'Essential commands: look, go',
        'Account settings: changepass',
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
