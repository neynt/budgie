// Web serving
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

static_files = [
  'index.html',
  'smush.css',
  'smush.js',
  'jquery-3.1.0.min.js'
];

static_files.forEach(function(filename) {
  app.get('/static/' + filename, function(req, res) {
    res.sendFile(__dirname + '/static/' + filename);
  });
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/static/index.html');
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
}, 300000);  // persist to disk every 5 min

io.on('connection', handle_connection);

http.listen(3069, function() {
  console.log('Listening on :3069');
});

process.on('SIGINT', function() {
  Database.save_all();
  console.log('Shutting down server.');
  process.exit();
});
