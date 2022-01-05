#!/bin/bash
set -ex

# The responsibility of this file is to download nwjs and unzip it in the right folder "package-for-mac/output"

# the URL for nwjs is in here

PLATFORM_NAME=$1
NWJS_URL=$2

NWJS_ZIP_NAME=$(basename $NWJS_URL)
NWJS_FOLDER_NAME=$(basename $NWJS_ZIP_NAME .zip)

cd ../nwjs-templates
mkdir -p $PLATFORM_NAME
cd $PLATFORM_NAME

wget --continue $NWJS_URL
