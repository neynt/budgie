import User from '../user';

export const help_text = [
  'Usage: descself [...]',
  "Sets your character's description. Others will see this description when they look at your character.",
];

export function run(player: User, args: Array<string>) {
  if (args.length === 0) {
    player.send('Describe self what?');
  } else {
    var desc = args.join(' ');
    player.setDesc(desc);
    player.send('Described self as "' + desc + '"');
  }
}
