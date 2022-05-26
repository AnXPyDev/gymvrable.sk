#!/bin/sh

if [ -z "$1" ]; then
    echo "No path provided"
    exit
fi

cd $1

if [ "$2" = "clean" ]; then
    set -x
    rm thumb*
    exit
fi

ls -1 | grep -v "^thumb" | while read -r file; do
    echo "$file -> thumb_$file (300x300)"
    magick "$file" -resize 300x300 "thumb_$file"
done
