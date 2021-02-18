# We want to build a static so it runs the same no matter the libraries installed
gcc --static stochsd-launcher.c -o stochsd
