import * as g from './global';

export function broadcast(msg: string) {
  for (const username in g.users) {
    const user = g.users[username];
    if (user.socket) {
      g.users[username].send(msg);
    }
  }
}
