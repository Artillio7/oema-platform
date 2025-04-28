#!/bin/sh

sleep 5

for f in `ls /oema/*.js`
do
echo $f
mongo --host oswe-mongo $f
done
