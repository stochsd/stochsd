# Todo list for uploading new version

###Create new StochSD version (2020 july):

####Build general versions with gulp

1. Goto: `stochsd/distribute/`

2. Run `npm install`

3. Update version with `npm run update-version`

4. Run command: `npm run build`

   ###### This runs `gulp` and creates the folder `stochsd/distribute/output/` containing `package.nw/`  for the desktop version and `stochsd-web/` for the web version.

**Note:** If problems arise with gulp, set latest versions of [gulp](https://www.npmjs.com/package/gulp) and [gulp-useref](https://www.npmjs.com/package/gulp-useref) or 
learn more at https://www.udemy.com/starting-with-gulp/learn/v4/content.

####Make Windows version of StochSD

goto: `stochsd/distribute/package-for-windows/`

And run command:

`./build-for-win32.sh` or `./build-for-win64.sh` depending on what version is wanted.

This will create the folder `stochsd/distribute/package-for-windows/tmp/` containing `stochsd-yyyy.mm.dd-winXX`.

The version is dependent on the file: `stochsd/OpenSystemDynamics/src/version.js`

**Note:** If `zip` command is not installed in `Git BASH` [here is a guide](https://ranxing.wordpress.com/2016/12/13/add-zip-into-git-bash-on-windows/)



##Uploading StochSD to SourceForge via the website. 

__NOTE__: don't use the SourceForge website for uploading since it is not as reliable.

- To upload StochSD Web with FileZilla

  - Host: [web.sourceforge.net](http://web.sourceforge.net)  
  - Login with credentials 
  - Default folder for desktop-version upload: `/home/pfs/project/stochsd` 
  - Default folder for web-version upload: `/home/project-web/s/st/stochsd/htdocs`

- Upload `build/stochsd-web` and replace folder `/home/project-web/s/st/stochsd/htdocs/software` with same name.

  ## If nw.exe wont respond in windows?

  It might be because more then one version of nwjs was started and has created conflicting info in `c:/user/[username]/AppData/StochSD`. Delete this folder, and restart if necessary.

  **NOTE: Use NW.JS v0.48.2**

  ##Change icon for EXE file

  Use the program Resource Hacker to change exe file icon.

  ##To update website 

- Open repo `website_stochsd` 

- Run `npm run build`. This creates a `./build` folder

- upload `./build` to Filezilla and replace `homepage/`

##Local App data on windows

Settings for applications in folder:

`C:\Users\[username]\AppData\Local`




