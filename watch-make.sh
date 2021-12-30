#!/bin/sh

while inotifywait -re modify source/; do
    make > /dev/stdout
done
