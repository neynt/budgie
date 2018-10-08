import User from '../user';
import * as g from '../global';

export const help_text = [
  'Usage: goto [room id]',
  'Go directly to the room with the specified id.',
];

export function run(player: User, args: Array<string>) {
  if (args.length === 0) {
    player.send('Go to room with which id?');
  } else {
    var room_id = args[0];
    if (room_id in g.rooms) {
      player.tp_to_room(g.rooms[room_id]);
      player.look();
    } else {
      player.send('No such room.');
    }
  }
}
