import * as Direction from '@/direction';
import User from '@/user';

export const help_text = [
  'Usage: unlink [direction]',
  'Disconnects the two rooms.',
];

export function run(player: User, args: Array<string>) {
  if (args.length < 1) {
    player.send('Unlink in which direction?');
    return;
  }

  var dir = Direction.parse(args[0]);

  if (!dir) {
    player.send('Invalid direction.');
    return;
  }

  if (!(dir in player.room.exits)) {
    player.send('There is no exit to unlink in that direction.');
  }

  var other_room = player.room.exits(dir);
  if (other_room.exits[Direction.opposite(dir)] == player.room) {
    // Remove returning exit, if exists.
    delete other_room.exits[Direction.opposite(dir)];
  }
  delete player.room.exits[dir];

  // TODO: refactor creates messages
  player.room.broadcast(`${player.name} removes the exit ${Direction.to_the(dir)}.`);
  other_room.broadcast(`${player.name} removes the exit from ${Direction.the(dir)}.`);
}
