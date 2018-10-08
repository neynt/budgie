import User from '../user';

export const help_text = [
  'Usage: id',
  'Gives you the id of the current room.',
];

export function run(player: User, args: Array<string>) {
  player.send('id of ' + player.room.name + ' is ' + player.room.id);
}
