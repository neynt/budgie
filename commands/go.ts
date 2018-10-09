import User from '../user';
import * as Direction from '../direction';

const dir_parts = [];
for (const short_dir in Direction._to_word) {
  const long_dir = Direction._to_word[short_dir];
  dir_parts.push(`${long_dir} (${short_dir})`);
}

export const help_text = [
  'Usage: (go) [direction]',
  `Moves in the direction specified. You can also type the direction directly.`,
  `Available directions are: ${dir_parts.join(', ')}`,
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
