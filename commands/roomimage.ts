import User from '@/user';

export const help_text = [
  'Usage: roomimage [image url]',
  "Sets the room's image to the image at the given URL. Use \"roomimage none\" to remove the image."
];

export function run(player: User, args: Array<string>) {
  if (args.length === 0) {
    player.send('Set room image to what?');
  } else {
    var img = args.join(' ');
    if (img === 'none') {
      img = '';
    }
    player.room.changeImg(img, player);
  }
}
