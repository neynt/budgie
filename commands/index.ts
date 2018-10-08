import User from '../user';

interface Command {
  help_text: Array<string>;
  run: (player: User, args: Array<string>) => any;
}

export const commands: {[name: string]: Command} = {}
export default commands;

commands.changepass = require('./changepass');
commands.descroom = require('./descroom');
commands.descself = require('./descself');
commands.go = require('./go');
commands.goto = require('./goto');
commands.id = require('./id');
commands.link = require('./link');
commands.look = require('./look');
commands.makeexit = require('./makeexit');
commands.makeroom = require('./makeroom');
commands.me = require('./me');
commands.nameroom = require('./nameroom');
commands.roomimage = require('./roomimage');
commands.say = require('./say');
commands.shout = require('./shout');
commands.tp = require('./tp');
commands.unlink = require('./unlink');
commands.who = require('./who');
commands.help = {
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
    } else if (args[0] in commands) {
      player.sendMsg(commands[args[0]].help_text);
    } else {
      player.send(args[0] + ' is not a command yet.');
    }
  }
};
