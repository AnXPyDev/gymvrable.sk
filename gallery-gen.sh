#!/bin/sh

M4CMD=Gallery-MakeImage
GREP_INVERT=-v

[ "$1" = "thumb" ] && M4CMD=Gallery-MakeThumbnail && GREPINVERT=
[ -z "$2" ] && echo "No directory specified" && exit

cd "img$2"

ls -1 | grep $GREP_INVERT "^thumb" | while read -r file; do
    echo "$M4CMD(\`/img$2$file')"
done
