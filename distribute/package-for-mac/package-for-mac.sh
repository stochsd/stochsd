#!/bin/bash
set -ex

NWJS_URL="https://dl.nwjs.io/v0.43.3/nwjs-sdk-v0.43.3-osx-x64.zip"
NWJS_ZIP_NAME=$(basename $NWJS_URL)
NWJS_ZIP_MD5=8c64b83ec6c6d045f2a00f0f1e2e59ce
NWJS_FOLDER_NAME=$(basename $NWJS_ZIP_NAME .zip)

STOCHSD_VERSION=$(node ../get-stochsd-version.js)
echo "Building stochsd version "$STOCHSD_VERSION

rm -Rf output

mkdir -p download
mkdir -p output

cd download


# If file does not exist
if [[ ! -f $NWJS_ZIP_NAME ]]
then
  curl -O $NWJS_URL
fi

# If file has invalid md5
if [[ "$(md5 -q $NWJS_ZIP_NAME)" != $NWJS_ZIP_MD5 ]]
then
	echo "Invalid md5. Redownloading"
	curl -O $NWJS_URL
fi

#md5 -q nwjs-sdk-v0.43.3-osx-x64.zip
unzip $NWJS_ZIP_NAME -d ../output
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
