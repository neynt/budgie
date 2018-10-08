import * as Direction from '../direction';
import * as g from '../global';
import Room from '../room';
import User from '../user';

export const help_text = [
  'Usage: makeexit [direction] [room id]',
  'Creates a one-way exit to the given room in the given direction.'
];

export function run(player: User, args: Array<string>) {
  if (args.length < 2) {
    player.send('Create one-way exit in which direction to which room?');
    return;
  }
  var dir = Direction.parse(args[0]);
  var id = args[1];

  // Check a billion failure conditions
  if (!dir) {
    player.send('Invalid direction.');
    return;
  }

  if (!(id in g.rooms)) {
    player.send(`Room with id ${id} not found.`);
    return;
  }

  if (id == player.room.id) {
    player.send('You cannot link a room to itself!');
    return;
  }

  if (dir in player.room.exits) {
    player.send(`There is already an exit ${Direction.to_the(dir)}.`);
    return;
  }

  var other_room = g.rooms[id];

  // Success!
  player.room.exits[dir] = other_room;
  player.room.broadcast(`${player.name} creates an exit ${Direction.to_the(dir)}.`);
}
