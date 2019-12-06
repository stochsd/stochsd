#!/bin/bash
# A dependency for running this script is to build the javascript output to output/ by running build.sh
set -x
# Version v0.32.4 is well tested on Ubuntu 18.04. Don't update without testing

pwd
./build-for-windows.sh "https://dl.nwjs.io/v0.15.4/nwjs-sdk-v0.15.4-win-ia32.zip" win32
