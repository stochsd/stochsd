#!/bin/bash
set -ex

# get NWJS_URL
source url-config.sh

NWJS_ZIP_NAME=$(basename $NWJS_URL)
NWJS_FOLDER_NAME=$(basename $NWJS_ZIP_NAME .zip)

STOCHSD_VERSION=$(node ../get-stochsd-version.js)
echo "Building stochsd version "$STOCHSD_VERSION


cd download


# If file does not exist
if [[ ! -f $NWJS_ZIP_NAME ]]
then
  echo "nwjs zip-file not found"
  exit 1
fi

cd ../output/
cd $NWJS_FOLDER_NAME

# Copy javascript code
cp -av ../../../output/package.nw nwjs.app/Contents/Resources/app.nw

cp ../../../../icons/stochsd.icns nwjs.app/Contents/Resources/app.icns
cp ../../../../icons/stochsd.icns nwjs.app/Contents/Resources/document.icns

APP_NAME="StochSD ${STOCHSD_VERSION}"
mv nwjs.app "${APP_NAME}".app

mkdir dmg
cp -av "${APP_NAME}".app dmg/

cp ../../../../OpenSystemDynamics/src/license.html dmg/
cp ../../../../OpenSystemDynamics/src/third-party-licenses.html dmg/

cd dmg
ln -s /Applications
cd ..

hdiutil create "stochsd-${STOCHSD_VERSION}-mac.dmg" -ov -volname "${APP_NAME}" -fs HFS+ -srcfolder "dmg"

open . &
