const express = require('express')
const app = express()
var server = require('http').Server(app);
var io = require('socket.io').listen(app.listen(3002));
var Store = require("jfs");
var db = new Store("data", {
  type: 'single'
});

var ping = 0;

// 允許靜態目錄
app.use(express.static('static'));

// 美化日誌
app.use(function(req, res, next) {
  console.log("");
  console.log('Time:', Date.now());
  console.log("URL:", req.originalUrl);
  next();
});

// 建立 Socket.io
io.sockets.on('connection', function(socket) {

  // 顯示 Connect
  console.log("");
  console.log(">>> Connected");
  socket.emit('new', {
    welcome: 'connection'
  });

  // 連線 / 斷開連線
  socket.on('android', function(data) {
    var obj = db.getSync("device");
    obj['android'] = data
    var id = db.saveSync("device", obj);
    console.log("");
    console.log("Socket:");
    console.log("> " + data);
  });

  // 當斷線
  socket.on('disconnect', function() {
    console.log("");
    console.log("<<< Disconnected");
  });

  // Pong
  socket.on("Pong", function(d) {
    console.log("> on Pong ... " + d);
  })
});

// 循環 Ping
setInterval(function() {
  ping++;
  io.sockets.emit('Ping', Date.now());
  console.log("");
  console.log("> Send Ping ... " + ping);
}, 20000);

/**
 * 首頁
 */
app.get('/', function(req, res) {
  res.send('MiPLus Server.')
})

/**
 * 讀取某設備狀態
 */
app.get('/device/:name', function(req, res) {
  var obj = db.getSync("device");

  console.log("Device...");
  console.log("> Read: " + req.params.name + " / " + obj[req.params.name]);

  res.send(obj[req.params.name]);
})

/**
 * 更改某設備狀態
 */
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


/**
 * 從 Android 設備更新服務器記錄的設備狀態
 */
app.get('/sync/:name/:status', function userIdHandler(req, res) {
  var obj = db.getSync("device");

  console.log("Sync...");
  console.log("> Device: " + req.params.name);
  console.log("> Status: " + obj[req.params.name] + " => " + req.params.status);

  obj[req.params.name] = req.params.status
  db.saveSync("device", obj);
  res.json('Set: ' + obj[req.params.name] + " => " + req.params.status);

});

console.log('MiPlusServer, listening on *:3002');
