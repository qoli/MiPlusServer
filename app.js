const express = require('express')
const app = express()
var server = require('http').Server(app);
var io = require('socket.io').listen(app.listen(3002));
var Store = require("jfs");
var db = new Store("data", {
  type: 'single'
});

app.use(express.static('static'));
app.use(function(req, res, next) {
  console.log("");
  console.log('> Time:', Date.now());
  console.log("> req.originalUrl:", req.originalUrl);
  next();
});

io.sockets.on('connection', function(socket) {
  socket.emit('new', {
    welcome: 'connection'
  });
  socket.on('android', function(data) {
    var obj = db.getSync("device");
    obj['android'] = data
    var id = db.saveSync("device", obj);
    console.log("");
    console.log("> Socket:");
    console.log(data);
    console.log("");
  });
});

app.get('/', function(req, res) {
  res.json('MiPLus Server.')
})

app.get('/device/:name', function(req, res) {
  var obj = db.getSync("device");

  console.log("Device...");
  console.log("> Read: " + req.params.name + " / " + obj[req.params.name]);

  res.send(obj[req.params.name]);
})

app.get('/device/:name/:status', function(req, res) {
  console.log("Device...");
  console.log("> Set: " + req.params.name + " to: " + req.params.status);

  var action = {
    updateDevice: req.params.name,
    status: req.params.status
  }

  // Socket 喚醒 Android 點擊按鈕
  io.sockets.emit('update', action);
  res.json(action)
})

app.get('/sync/:name/:status', function userIdHandler(req, res) {
  var obj = db.getSync("device");

  console.log("Sync...");
  console.log("> Device: " + req.params.name);
  console.log("> FROM: " + obj[req.params.name]);
  console.log("> TO: " + req.params.status);

  obj[req.params.name] = req.params.status
  res.json('Set: ' + db.saveSync("device", obj));

});

console.log('MiPlusServer, listening on *:3002');
