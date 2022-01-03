#!/bin/bash
# A dependency for running this script is to build the javascript output to output/ by running build.sh
set -ex
# Version v0.32.4 is well tested on Ubuntu 18.04. Don't update without testing

if ! test -d "../output/package.nw"; then
       echo "package.nw does not exist. You need to build it first in the /distribute folder"      
       exit 1
fi

NWJS_URL='https://dl.nwjs.io/v0.59.1/nwjs-sdk-v0.59.1-linux-x64.tar.gz'
NWJS_FILENAME=$(basename $NWJS_URL)
NWJS_UNZIPPED_FILENAME=$(echo "${NWJS_FILENAME%.*.*}")

STOCHSD_VERSION=$(node ../get-stochsd-version.js)
echo "Building stochsd version "$STOCHSD_VERSION

# Work in a temporary directory
rm -Rf tmp
mkdir -p tmp
cd tmp

RELEASE_NAME="stochsd-$STOCHSD_VERSION-linux"

wget $NWJS_URL

tar -xzvf $NWJS_FILENAME
rm -Rf $RELEASE_NAME
mv $NWJS_UNZIPPED_FILENAME $RELEASE_NAME
cd $RELEASE_NAME
cp -av ../../../output/package.nw package.nw
cp ../../../../OpenSystemDynamics/src/license.html .
cp ../../../../OpenSystemDynamics/src/third-party-licenses.html .
pwd
mv nw stochsd
cd ..
tar -czvf $RELEASE_NAME.tgz $RELEASE_NAME/
