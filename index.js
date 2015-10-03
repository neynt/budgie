// Web serving
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Game logic
var Database = require('./Database')();
var Room = require('./Room.js')();
var handle_connection = require('./handle_connection');

global.rooms = {};
global.rooms['center'] = new Room('center');
global.users = {};

Database.load_all();
setInterval(function() {
  Database.save_all();
}, 60000);

io.on('connection', handle_connection);

http.listen(3069, function() {
  console.log('listening on *:3069');
});

process.on('SIGINT', function() {
  Database.save_all();
  console.log('Shutting down server.');
  process.exit();
});
