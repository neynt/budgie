import User from '@/user';

export const help_text = [
  'Usage: nameroom [...]',
  'Changes the name of the current room.'
];

export function run(player: User, args: Array<string>) {
  if (args.length === 0) {
    player.send('Name this room what?');
  } else {
    var name = args.join(' ');
    player.room.changeName(name, player);
  }
}
