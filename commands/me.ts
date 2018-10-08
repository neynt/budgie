import User from '@/user';

export const help_text = [
  'Usage: me [...]',
  'Performs an emote to everyone in the same room as you.'
];

export function run(player: User, args: Array<string>) {
  if (args.length === 0) {
    player.send('Emote what?');
  } else {
    var emote = args.join(' ');
    player.room.broadcast(player.name + ' ' + emote);
  }
}
