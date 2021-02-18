#!/bin/bash
set -ex

# The responsibility of this file is to download nwjs and unzip it in the right folder "package-for-mac/output"

# the URL for nwjs is in here
source url-config.sh

NWJS_ZIP_NAME=$(basename $NWJS_URL)
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

unzip $NWJS_ZIP_NAME -d ../output
