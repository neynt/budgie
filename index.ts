// Web serving
import express = require('express');
import http = require('http');
import socket_io = require('socket.io');
import Room from './room';
import * as g from './global';
import * as Database from './database';
import handle_connection from './handle_connection';

const app = express();
const server = new http.Server(app);
const io = socket_io(server);

const static_files = [
  'index.html',
  'smush.css',
  'smush.js',
  'jquery-3.1.0.min.js'
];

static_files.forEach((filename) => {
  app.get('/static/' + filename, (req, res) => {
    res.sendFile(__dirname + '/static/' + filename);
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/static/index.html');
});

// Game logic
g.rooms['center'] = new Room('center');

Database.load_all();
setInterval(Database.save_all, 300000); // persist to disk every 5 min

io.on('connection', handle_connection);

server.listen(3069, () => {
  console.log('Listening on :3069');
});

process.on('exit', () => {
  Database.save_all();
  console.log('Saving state and shutting down server.');
  process.exit();
});
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(1));
