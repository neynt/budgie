import * as g from '@/global';
import User from '@/user';

export const help_text = [
  'Usage: tp [player name]',
  'Teleports you directly to the given player.',
];

export function run(player: User, args: Array<string>) {
  if (args.length === 0) {
    player.send('Teleport to who?');
    return;
  }
  var username = args[0];
  if (username in g.users) {
    player.send('You teleport to ' + username + '.');
    player.tp_to_room(g.users[username].room);
    player.look();
  } else {
    player.send('No such user.');
  }
}
