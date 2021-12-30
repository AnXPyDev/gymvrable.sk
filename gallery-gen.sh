#!/bin/sh

M4CMD=GALLERY_MAKE_IMAGE
GREP_INVERT=-v

if [ "$1" == "thumb" ]; then
    M4CMD=GALLERY_MAKE_THUMBNAIL
    GREPINVERT=
fi

if [ -z "$2" ]; then
    echo "No directory specified"
    exit
fi

cd "img$2"

ls -1 | grep $GREP_INVERT "^thumb" | while read -r file; do
    echo "$M4CMD(\`/img$2$file')"
done
