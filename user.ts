import * as g from './global';
import crypto from 'crypto';
import * as Direction from './direction';
import Room from './room';
import * as World from './world';
import { MessageLine, ComplexMessage } from './message';
import { commands } from './commands';

export default class User {
  name: string;
  desc: string;

  passhash: string | null;
  salt: string | null;

  socket: SocketIO.Socket | null;
  login_socket: any;
  online: boolean;
  room: any;

  handle_msg: (this: User, msg: string) => any;

  constructor(name: string) {
    this.name = name;
    this.desc = '';
    this.desc = ''; // user's description
    this.passhash = null; // hash(salt + password)
    this.salt = null; // salt for password
    this.socket = null;  // user's authoritative socket
    this.login_socket = null;  // temporary socket for logging in
    this.online = false;
    this.room = g.rooms['center'];
    this.handle_msg = this.handle_msg_normal;
  }

  run_command(msg: string) {
    var chunks = msg.split(' ');
    if (!chunks) return;

    var args = chunks.slice(1);
    var cmd = chunks[0].toLowerCase();

    var msg_as_dir = Direction.parse(msg)

    if (cmd in commands) {
      commands[cmd].run(this, args);
      return true;
    } else if (msg_as_dir) {
      commands.go.run(this, chunks);
      return true;
    } else {
      return false;  // command was not found
    }
  }

  handle_msg_normal(msg: string) {
    console.log(this.name + ': ' + msg);

    if (!this.run_command(msg)) {
      this.send('Unrecognized command. Type "help" for help.');
    }
  };

  setPassword(password: string) {
    this.salt = new Date().getTime().toString(36);
    var hasher = crypto.createHash('sha512');
    hasher.update(this.salt + password);
    this.passhash = hasher.digest('hex');
  };

  verifyPassword(password: string) {
    var hasher = crypto.createHash('sha512');
    hasher.update(this.salt + password);
    return hasher.digest('hex') === this.passhash;
  };

  setDesc(desc: string) { this.desc = desc; };
  getDesc() { return this.desc; };
  
  sendComplexMsg(msg: ComplexMessage) {
    // A complex message is an array of objects with type and text properties.
    this.socket!.emit('CMPLXMSG', msg);
  };

  send(msg: string) {
    this.socket!.emit('CHATMSG', msg);
  };

  sendImg(img_url: string) {
    this.socket!.emit('IMGMSG', img_url);
  };

  sendMsg(lines: Array<string>) {
    this.socket!.emit('GAMEMSG', {
      lines: lines
    });
  };

  look() {
    const room = this.room;

    const msg = {
      lines: [] as Array<MessageLine>,
    };

    // Name
    if (room.name) msg.lines.push({ type: 'title', text: room.name });
    // Images (disable for now)
    //if (room.img) msg.lines.push({ type: 'img', text: room.img });
    // Description
    if (room.desc) msg.lines.push({ type: 'normal', text: room.desc });

    // Users
    var users = '';
    room.users.forEach((user: User, i: number) => {
      if (user != this) {
        if (users) {
          users += ', ';
        }
        users += user.name;
      }
    }, this);
    if (users) {
      msg.lines.push({ type: 'normal', text: 'Users here: ' + users + '.' });
    }

    // Exits
    var exits = ''
    Direction.in_order.forEach((dir: string, i: number) => {
      if (dir in room.exits) {
        if (exits) {
          exits += ', ';
        }
        exits += Direction.to_word(dir) + ' (' + room.exits[dir].name + ')';
      }
    });
    if (exits) {
      msg.lines.push({ type: 'normal', text: 'Exits: ' + exits + '.' });
    }

    this.sendComplexMsg(msg);
  };

  enter_room(room: Room) {
    room.users.push(this);
    this.room = room;
  };

  leave_room() {
    var idx = this.room.users.indexOf(this);
    if (idx > -1) {
      this.room.users.splice(idx, 1);
    }
  };

  move_to_room(new_room: Room) {
    var old_room = this.room;
    this.leave_room();
    this.enter_room(new_room);
  };

  tp_to_room(new_room: Room) {
    // Move immediately from one room to another.
    var old_room = this.room;

    new_room.playerEnter(this);
    this.move_to_room(new_room);
    old_room.playerLeave(this);
  }

  move_in_dir(dir: Direction.t) {
    if (dir in this.room.exits) {
      var old_room = this.room;
      var new_room = old_room.exits[dir];

      new_room.playerEnter(this, dir);
      this.move_to_room(new_room);
      old_room.playerLeave(this, dir);
    } else {
      throw "Could not find exit in direction."
    }
  };

  handle_msg_ask_password(msg: string) {
    if (this.verifyPassword(msg)) {
      this.login_socket.emit('passwd', {enable: 0});
      this.come_online();
    } else {
      this.login_socket.emit('CHATMSG', 'Incorrect. Please try again.');
    }
  };

  handle_msg_new_password(msg: string) {
    if (msg.length < 3) {
      this.send('Your password needs to be at least 3 characters long.');
    } else {
      this.setPassword(msg);
      this.send('Your password has been changed.');
      this.socket!.emit('passwd', {enable: 0});
      this.handle_msg = this.handle_msg_normal;
    }
  };

  change_password() {
    this.socket!.emit('passwd', {enable: 1});
    this.send('Please enter your desired password.');
    this.handle_msg = this.handle_msg_new_password;
  };

  come_online() {
    if (this.socket) {
      this.send('You have logged in from somewhere else.');
      this.socket.disconnect();
    }
    this.socket = this.login_socket;
    this.online = true;

    World.broadcast(this.name + ' has come online.');
    this.run_command('who');
    this.room.broadcast(this.name + ' flickers and appears.');
    this.handle_msg = this.handle_msg_normal;
    this.enter_room(this.room);
    this.look();
  };

  login(socket: SocketIO.Socket) {
    this.login_socket = socket;
    if (this.passhash) {
      this.login_socket.emit('passwd', {enable: 1});
      this.login_socket.emit('CHATMSG', 'Please enter your password.');
      this.handle_msg = this.handle_msg_ask_password;
    } else {
      this.come_online();
      this.change_password();
    }
  };

  on_disconnect() {
    console.log('user disconnected: ' + this.name);
    this.leave_room();
    this.room.broadcast(this.name + ' flickers and disappears.');
    this.online = false;
  }
}
