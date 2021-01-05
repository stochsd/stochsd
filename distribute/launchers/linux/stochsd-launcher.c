#include<stdio.h>
#include<stdlib.h>
#include <libgen.h>
#include <string.h>
#include <unistd.h>

/*
Learning material
https://stackoverflow.com/questions/28745252/getting-directory-of-binary-in-c
https://www.systutorials.com/how-to-get-the-directory-path-and-file-name-from-a-absolute-path-in-c-on-linux/
https://linuxhint.com/exec_linux_system_call_c/
https://www.techonthenet.com/c_language/standard_library_functions/string_h/strcat.php
*/

int main(int argc, char **argv) {
	const int PATH_MAX=512;
	char binary_path[PATH_MAX];
    char *res = realpath(argv[0], binary_path);
	if (res) {
		char* binary_directory = dirname(binary_path);

		chdir(binary_directory);
		
		return system("./nw");
    } else {		
        perror("realpath failed. Could not locate ./nw");

        exit(EXIT_FAILURE);
    }
}