import User from '../user';

interface Command {
  help_text: Array<string>;
  run: (player: User, args: Array<string>) => any;
}

export const commands: {[name: string]: Command} = {}
export default commands;

commands.look = require('./look');
commands.who = require('./who');

commands.go = require('./go');
commands.goto = require('./goto');
commands.tp = require('./tp');

commands.passwd = require('./passwd');

commands.say = require('./say');
commands.shout = require('./shout');
commands.me = require('./me');
commands.descself = require('./descself');

commands.new = require('./new');
commands.title = require('./title');
commands.desc = require('./desc');
commands.id = require('./id');
commands.link = require('./link');
commands.image = require('./image');
commands.unlink = require('./unlink');
commands.help = {
  help_text: [
    'Usage: help [command]',
    'Tells you how to use the specified command. If no command is specified, '
    + 'gives you a list of useful commands. Also, nice one.'
  ],
  run: function(player, args) {
    if (args.length === 0) {
      player.sendMsg([
        'Info: look, who, help',
        'Movement: go, goto, tp',
        'Account: passwd',
        'Social: say, shout, me, descself',
        'Building: new, title, desc, image, link, unlink',
        'Type "help [command]" for more detailed help about a command.'
      ]);
      return;
    }
    const cmd = args[0];
    if (cmd in commands) {
      player.sendMsg(commands[cmd].help_text);
    } else {
      player.send(cmd + ' is not a command.');
    }
  }
};
