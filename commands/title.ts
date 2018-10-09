import User from '@/user';

export const help_text = [
  'Usage: title [...]',
  'Changes the title of the current room.'
];

export function run(player: User, args: Array<string>) {
  if (args.length === 0) {
    player.send('Title this room what?');
  } else {
    var name = args.join(' ');
    player.room.changeName(name, player);
  }
}
