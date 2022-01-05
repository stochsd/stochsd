#!/bin/bash
# A dependency for running this script is to build the javascript output to output/ by running build.sh
set -ex
# Version v0.32.4 is well tested on Ubuntu 18.04. Don't update without testing

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 [NWJS_ZIP_FILE] [PLATFORM_NAME]"
  echo "PLATFORM_NAME=[win32 or win64]"
  echo "Call ./build-for-win32.sh or ./build-for-win64.sh instead."
  exit 1
fi

if ! test -d "../output/package.nw"; then
	echo "package.nw does not exist. You need to build it first in the /distribute folder"
	exit 1
fi

PLATFORM_NAME=$1
NWJS_URL=$2

NWJS_ZIP_NAME=$(basename $NWJS_URL)
NWJS_FOLDER_NAME=$(basename $NWJS_ZIP_NAME .zip)

echo "NWJS_ZIP_NAME: "$NWJS_ZIP_NAME
echo "NWJS_FOLDER_NAME: "$NWJS_FOLDER_NAME
echo "PLATFORM_NAME: "$PLATFORM_NAME

STOCHSD_VERSION=$(node ../get-stochsd-version.js)
echo "Building stochsd version "$STOCHSD_VERSION

RELEASE_NAME="stochsd-${STOCHSD_VERSION}-${PLATFORM_NAME}"
echo $RELEASE_NAME

GIT_ROOT=$(git rev-parse --show-toplevel)
echo $GIT_ROOT

# Clear the old build folder and make a new one
rm -Rf $GIT_ROOT/distribute/nwjs-output/$PLATFORM_NAME/
mkdir -p $GIT_ROOT/distribute/nwjs-output/$PLATFORM_NAME/

# Unzip package templates
unzip $GIT_ROOT/distribute/nwjs-templates/$PLATFORM_NAME/$NWJS_ZIP_NAME -d $GIT_ROOT/distribute/nwjs-output/$PLATFORM_NAME/

# Rename release folder
cd $GIT_ROOT/distribute/nwjs-output/$PLATFORM_NAME/
mv $NWJS_FOLDER_NAME $RELEASE_NAME
cd $RELEASE_NAME

# Copy license and code
cp $GIT_ROOT/OpenSystemDynamics/src/license.html .
cp $GIT_ROOT/OpenSystemDynamics/src/third-party-licenses.html .
cp -av $GIT_ROOT/distribute/output/package.nw package.nw

# Rename binary to stochsd.exe
mv nw.exe StochSD.exe 

# Pack the final zip file
cd ..
zip -r $RELEASE_NAME.zip $RELEASE_NAME
echo
echo "File ready as "$(pwd)/$RELEASE_NAME.zip
