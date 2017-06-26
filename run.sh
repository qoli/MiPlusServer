#! /bin/sh

case $1 in
    start)
      screen -S homebridge -dm /opt/bin/homebridge
      screen -S miServer -dm /root/MiPlusServer/miServer.sh
      ;;

    stop)
      killall screen
      ;;
esac
exit 0
