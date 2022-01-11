#!/bin/bash
cd $(dirname $0)
STOCHSD_VERSION=$(./get-stochsd-version.js)
cat analytics/analytics.js >> output/web/${STOCHSD_VERSION}/MultiSimulationAnalyser/multisimulationanalyser.min.js
