#!/bin/bash
# A dependency for running this script is to build the javascript output to output/ by running build.sh
set -x
# Version v0.32.4 is well tested on Ubuntu 18.04. Don't update without testing

# Work in a temporary directory
mkdir tmp
cd tmp

RELEASE_NAME="stochsd-2019.12.06-linux"
cd $(dirname $0)
if ! md5sum --check md5sum.nwjs-linux
then
  rm nwjs-sdk-v0.32.4-linux-x64.tar.gz
  wget https://dl.nwjs.io/v0.32.4/nwjs-sdk-v0.32.4-linux-x64.tar.gz
fi
rm -Rf stochsd
tar -xzvf nwjs-sdk-v0.32.4-linux-x64.tar.gz
mv nwjs-sdk-v0.32.4-linux-x64 $RELEASE_NAME
cd $RELEASE_NAME
cp -av ../../../output/package.nw package.nw
mv nw stochsd
cd ..
tar -czvf $RELEASE_NAME.tar.gz $RELEASE_NAME/