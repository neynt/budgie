import User from '@/user';
import * as World from '../world';

export const help_text = [
  'Usage: shout [...]',
  'Sends a message to everyone online.',
];

export function run(player: User, args: Array<string>) {
  if (args.length === 0) {
    player.send('Shout what?');
    return;
  }

  var chat_msg = args.join(' ');
  if (chat_msg.length > 80000) {
    player.send('Your message is too long.');
  } else {
    World.broadcast(player.name + ' shouts: ' + chat_msg);
  }
}
