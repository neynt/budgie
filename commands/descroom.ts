import User from '../user';

export const help_text = [
  'Usage: descroom [...]',
  'Changes the description of the current room.',
];

export function run(player: User, args: Array<string>) {
  if (args.length === 0) {
    player.send('Describe this room what?');
  } else {
    var desc = args.join(' ');
    player.room.changeDesc(desc, player);
  }
}
