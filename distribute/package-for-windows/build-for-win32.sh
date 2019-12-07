#!/bin/bash
# A dependency for running this script is to build the javascript output to output/ by running build.sh
set -x
# Version v0.32.4 is well tested on Ubuntu 18.04. Don't update without testing

pwd
./build-for-windows.sh "nwjs-0.15.4-win32-stochsd" win32
