[license-badge]: https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=flat
[license-url]: https://www.gnu.org/licenses/agpl-3.0


# StochSD

[![License: AGPL v3][license-badge]][license-url]

[StochSD Homepage](https://stochsd.sourceforge.io/homepage/)

## What does the program do

StochSD is a stochastic simulation application, primarily developed to introduce statistical post-analysis from multiple simulations.

## How to run the software

### Setup
```
npm i
```

### Run locally in browser

#### Option 1 - Two terminals
To run I this project open 2 terminals to run 2 commands:
First to build, project and have any changes you do trigger rebuild:
```
npm run watch:all
```

Second:
```
npm run start
```

### Option 2 - One terminal less feedback

To run on localhost specified in [package.json](./package.json) under `scripts`.
This will however not show the link to open the page.
```
npm run dev
```

### Run locally in NW.js
```
npm run dev:nw
```

## How to use the program

Read user manual in `./OpenSystemDynamics/docs/StochSD_User_Manual.pdf`.

## Read code documentation
Look at documentation in `./OpenSystemDynamics/docs/code/`

