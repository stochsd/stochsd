#!/bin/bash
# A dependency for running this script is to build the javascript output to output/ by running build.sh
set -x
# Version v0.32.4 is well tested on Ubuntu 18.04. Don't update without testing

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 [NWJS_URL] [PLATFORM_NAME]"
  echo "PLATFORM_NAME=[win32 or win64]"
  echo "Call ./build-for-win32.sh or ./build-for-win64.sh instead."
  exit 1
fi

if ! test -d "../output/package.nw"; then
	echo "package.nw does not exist. You need to build it first in the /distribute folder"
	exit 1
fi

NWJS_FOLDERNAME=$1
PLATFORM_NAME=$2

echo "NWJS_FOLDERNAME: "$NWJS_FOLDERNAME
echo "PLATFORM_NAME: "$PLATFORM_NAME



STOCHSD_VERSION=$(node ../get-stochsd-version.js)
echo "Building stochsd version "$STOCHSD_VERSION

# Work in a temporary directory
mkdir tmp
cp ${NWJS_FILENAME}.md5 tmp/
cd tmp

RELEASE_NAME="stochsd-${STOCHSD_VERSION}-${PLATFORM_NAME}"
cd $(dirname $0)

# Cloning package templates
echo "Cloning package templates from submodules... Takes a while"
git submodule update --init --recursive
cp -av ../../packaging-templates/$NWJS_FOLDERNAME $RELEASE_NAME
cd $RELEASE_NAME
cp -av ../../../output/package.nw package.nw
pwd
