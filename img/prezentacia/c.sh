echo $1;
cd $1;
rm -rf min
cp -rf max min;
cd min;
ls
magick mogrify -resize 40% *;
cd ../..
