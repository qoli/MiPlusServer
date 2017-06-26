# MiPlusServer

關聯項目：

https://github.com/qoli/MiHomePlus

## Sync
```shell
rsync -avzP --exclude "node_modules" --delete ~/Documents/Web/MiPlusServer/ root@192.168.1.104:/root/MiPlusServer
```
## Config

homebridge auto boot.

```shell
/root/MiPlusServer/run.sh start
```
