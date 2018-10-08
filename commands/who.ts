import * as g from '@/global';
import User from '@/user';

export const help_text = [
  'Usage: who',
  'Shows you a list of players who are online.',
];

export function run(player: User, args: Array<string>) {
  var players_str = '';
  for (const username in g.users) {
    var user = g.users[username];
    if (user.online) {
      if (players_str) {
        players_str += ', ';
      }
      players_str += user.name;
    }
  }
  player.send('Online players: ' + players_str);
}
