# MiPlusServer

關聯項目：

https://github.com/qoli/MiHomePlus

## Step
1. new config.js base config template.
2. node app.js
3. goto /setting update MiHomePlus setting.

## Config 模板

如果不需要 TelegramBot 把 tgbot 設定為 false 即可。

```javascript
module.exports = {
  tgbot: true,
  token: "",
  adminChatID: "0"
}

```


## Sync

```shell
rsync -avzP --exclude "node_modules" --delete ~/Documents/Web/MiPlusServer/ root@192.168.1.104:/root/MiPlusServer
```
