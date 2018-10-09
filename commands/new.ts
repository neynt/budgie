import * as Direction from '../direction';
import Room from '../room';
import User from '../user';

export const help_text = [
  'Usage: new [direction]',
  'Makes a new room in the specified direction. Use "new new" for a disconnected room.',
];

export function run(player: User, args: Array<string>) {
  if (args.length === 0) {
    player.send('New room in which direction? Use "new new" for a disconnected room.');
    return;
  }

  var old_room = player.room;
  var new_room = new Room();
  var dir = Direction.parse(args[0]);

  if (args[0] === 'new') {
    player.send('You create a new room.');
    player.tp_to_room(new_room);
    player.look();
  } else if (dir) {
    if (dir in player.room.exits) {
      player.send('There is already a room in that direction.');
    } else {
      new_room.exits[Direction.opposite(dir)] = old_room;
      old_room.exits[dir] = new_room;

      player.send('You create a room ' + Direction.to_the(dir) + '.');
      old_room.broadcast(
        player.name
        + ' creates a new room '
        + Direction.to_the(dir), player);

      player.run_command('go ' + dir);
    }
  } else {
    player.send('Invalid direction.');
    return;
  }
}
