// app 定義
const express = require('express')
const app = express()
var server = require('http').Server(app);
var io = require('socket.io').listen(app.listen(3002));
var Store = require("jfs");
var moment = require('moment');

var db = new Store("_data", {
  type: 'single'
});

const config = require('config.js')

var ping = 0;
var pong = 0;

// TelegramBot 定義
const TelegramBot = require('node-telegram-bot-api');
const token = config.token;
const bot = new TelegramBot(token, {
  polling: true
});

// 管理員 ID
const adminChatID = config.adminChatID;

bot.sendMessage(adminChatID, "MiPlusServer online \r\non Date: " + now());

console.log('MiPlusServer, listening on *:3002');


// 允許靜態目錄
app.use(express.static('static'));

app.set('views', './views');
app.set('view engine', 'pug');

// 美化日誌
app.use(function(req, res, next) {
  console.log("");
  console.log('Time:', now());
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

    bot.sendMessage(adminChatID, data);
  });

  // 當斷線
  socket.on('disconnect', function() {
    console.log("");
    console.log("<<< Disconnected");
  });

  // Pong
  socket.on("Pong", function(d) {
    console.log("> on Pong ... " + d);
    pong = d;
  })
});

// 循環 Ping
setInterval(function() {
  ping++;
  io.sockets.emit('Ping', Date.now());
  console.log("");
  console.log("> Send Ping ... " + ping);
}, 50000);


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

  // bot.sendMessage(adminChatID, "> Device: " + req.params.name + ', >Set: ' + obj[req.params.name] + " => " + req.params.status);

});


bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  var obj = db.getSync("device");

  bot.sendMessage(chatId, now() + '\r\nMiPlusServer on nanoPi \r\n\r\n# Send Ping ' + ping + " ／ Reply " + pong + '\r\n\r\nLast Message: ' + obj['android'])
});

app.get('/setting', function(req, res) {
  var setting = db.getSync("setting");
  res.render('setting', {
    title: 'Hey',
    message: 'Hello there!'
  })
})

app.post('/setting', function(req, res) {

  setting = {
    room: '',
    devices: ''
  }
  db.saveSync("device", setting);
  res.redirect("/setting");
})


function now() {
  return moment().format('MMMM Do YYYY, h:mm:ss a');
}
