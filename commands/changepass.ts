import User from '../user';

export const help_text = [
  'Usage: changepass',
  'Changes your password.',
];

export function run(player: User, args: Array<string>) {
  player.change_password();
}
