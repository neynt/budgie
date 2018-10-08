import User from '../user';
import * as Direction from '../direction';

export const help_text = [
  'Usage: go [direction]',
  'Moves in the direction specified. You can also type the direction directly, '
  + ' or the first letter of the direction.'
];

export function run(player: User, args: Array<string>) {
  if (args.length === 0) {
    player.send('Go which direction?');
    return;
  }
  const dir = Direction.parse(args[0]);
  if (!dir) {
    player.send(`${args[0]} isn't a direction.`);
    return;
  }
  if (dir in player.room.exits) {
    player.move_in_dir(dir);
    player.send(`You go ${Direction.to_word(dir)}.`);
    player.look();
  } else {
    player.send('You see no exit in that direction.');
  }
}
