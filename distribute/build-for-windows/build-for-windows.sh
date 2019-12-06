#!/bin/bash
# A dependency for running this script is to build the javascript output to output/ by running build.sh
set -x
# Version v0.32.4 is well tested on Ubuntu 18.04. Don't update without testing

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 [NWJS_URL]"
  exit 1
fi

NWJS_URL=$1
NWJS_FILENAME=$(basename $NWJS_URL)
echo $NWJS_FILENAME | rev | cut -f 2- -d '.' | rev
NWJS_FOLDERNAME=${NWJS_FILENAME//\.zip/}

echo "NWJS_URL: "$NWJS_URL
echo "NWJS_FILENAME: "$NWJS_FILENAME
echo "NWJS_FOLDERNAME: "$NWJS_FOLDERNAME

STOCHSD_VERSION=$(node ../get-stochsd-version.js)
echo "Building stochsd version "$STOCHSD_VERSION

# Work in a temporary directory
mkdir tmp
cp ${NWJS_FILENAME}.md5 tmp/
cd tmp

RELEASE_NAME="stochsd-$STOCHSD_VERSION-win32"
cd $(dirname $0)
if ! md5sum --check ${NWJS_FILENAME}.md5
then
  rm $NWJS_FILENAME
  wget $NWJS_URL
fi
rm -Rf $NWJS_FOLDERNAME
rm -Rf stochsd
unzip $NWJS_FILENAME
mv $NWJS_FOLDERNAME $RELEASE_NAME
cd $RELEASE_NAME
cp -av ../../../output/package.nw package.nw
pwd
mv nw.exe stochsd.exe
