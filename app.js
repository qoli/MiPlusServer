// app 定義
const express = require('express')
const app = express()
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config.js')

var server = require('http').Server(app);
var io = require('socket.io').listen(app.listen(3002));
var Store = require("jfs");
var moment = require('moment');
var bodyParser = require('body-parser');


var db = new Store("_data", {
  type: 'single'
});

var adminChatID = 0;
var token = null;
var bot = null;
var ping = 0;
var pong = 0;

// TelegramBot 定義
if (config.tgbot) {

  token = config.token;
  bot = new TelegramBot(token, {
    polling: true
  });

  // 管理員 ID
  adminChatID = config.adminChatID;
  bot.sendMessage(adminChatID, "MiPlusServer online \r\non Date: " + now());

  // 設定 bot 接受指令
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    switch (msg.text) {
      case "id":
        bot.sendMessage(chatId, chatId);
        break;
      default:
        var obj = db.getSync("device");
        bot.sendMessage(chatId, now() + '\r\nMiPlusServer on nanoPi \r\n\r\n# Send Ping ' + ping + " ／ Reply " + pong + '\r\n\r\nLast Message: ' + obj['android'])
    }

  });
}

console.log('MiPlusServer, listening on *:3002');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded bodies

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

    if (config.tgbot) {
      bot.sendMessage(adminChatID, data);
    }

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

});

app.get('/setting', function(req, res) {
  var settingDB = db.getSync("setting");
  var room = ""
  var devices = ""

  console.log("Load Setting DB:");
  console.log(settingDB);

  if (settingDB.hasOwnProperty('room')) {
    room = settingDB.room
    devices = settingDB.devices
  }

  res.render('setting', {
    room: room,
    devices: devices
  })
})

app.post('/setting', function(req, res) {

  console.log("POST:");
  console.log(req.body);

  setting = {
    room: req.body.room,
    devices: req.body.devices
  }
  db.saveSync("setting", setting);

  if (config.tgbot) {
    bot.sendMessage(adminChatID, "Setting 更新配置檔")
  }

  res.redirect("/setting");
})

app.get('/getSetting', function(req, res) {

  var settingDB = db.getSync("setting");
  res.json(settingDB);
})


function now() {
  return moment().format('MMMM Do YYYY, h:mm:ss a');
}
