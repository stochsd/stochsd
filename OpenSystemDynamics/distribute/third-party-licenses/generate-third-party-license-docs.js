#!/usr/bin/env node

thirdparties = [
            {
				"name": "NW.js",
				"links": ["https://github.com/nwjs/nw.js"],
				"typeoflicense": "MIT License",
				"license_text": `
				Copyright (c) 2011-2019 NW.js Authors 
				Copyright (c) 2011-2019 The Chromium Authors 
				Copyright (c) 2011-2018 Intel Corp 
				
				Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: 
				
				The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
				
				THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`
			},
            {
				"name":"Electron",
				"links": ["https://electronjs.org/",
                "https://github.com/electron/electron/blob/master/LICENSE"],
				"typeoflicense":"MIT License",
				"license_text":`Copyright (c) 2013-2019 GitHub Inc.
				
				Permission is hereby granted, free of charge, to any person obtaining a copy
				of this software and associated documentation files (the "Software"), to deal
				in the Software without restriction, including without limitation the rights
				to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
				copies of the Software, and to permit persons to whom the Software is
				furnished to do so, subject to the following conditions:
				
				The above copyright notice and this permission notice shall be included in
				all copies or substantial portions of the Software.
				
				THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`
			},
            {
				"name":"jQuery",
				"links": ["https://jquery.org/",
                "https://github.com/jquery/jquery/blob/master/LICENSE.txt"],
				"typeoflicense":"MIT License",
				"license_text":`Copyright JS Foundation and other contributors, https://js.foundation/
				
				Permission is hereby granted, free of charge, to any person obtaining a copy
				of this software and associated documentation files (the "Software"), to deal
				in the Software without restriction, including without limitation the rights
				to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
				copies of the Software, and to permit persons to whom the Software is
				furnished to do so, subject to the following conditions:
				
				The above copyright notice and this permission notice shall be included in
				all copies or substantial portions of the Software.
				
				THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`
			},
			{
				"name":"jqPlot",
				"links": ["https://github.com/jqPlot/jqPlot"],
				"typeoflicense":"MIT License",
				"license_text":`
Copyright (c) 2009-2015 Chris Leonello

jqPlot is currently available for use in all personal or commercial projects under both the MIT and GPL version 2.0 licenses. This means that you can choose the license that best suits your project and use it accordingly.

jqPlot includes date instance methods and printf/sprintf functions by other authors:

Date instance methods
Author: Ken Snyder (ken d snyder at gmail dot com) Date: 2008-09-10 Version: 2.0.2 (http://kendsnyder.com/sandbox/date/) License: Creative Commons Attribution License 3.0 (http://creativecommons.org/licenses/by/3.0/)

JavaScript printf/sprintf functions
Author: Ash Searle Version: 2007.04.27 http://hexmen.com/blog/2007/03/printf-sprintf/ http://hexmen.com/js/sprintf.js The author (Ash Searle) has placed this code in the public domain: \"This code is unrestricted: you are free to use it however you like.\"
`
			},
			{
				"name":"jQuery-UI",
				"links": ["https://github.com/jquery/jquery-ui", "https://github.com/jquery/jquery-ui/blob/master/LICENSE.txt"],
				"typeoflicense":"",
				"license_text": `Copyright jQuery Foundation and other contributors, https://jquery.org/

This software consists of voluntary contributions made by many
individuals. For exact contribution history, see the revision history
available at https://github.com/jquery/jquery-ui

The following license applies to all parts of this software except as
documented below:

====

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

====

Copyright and related rights for sample code are waived via CC0. Sample
code is defined as all source code contained within the demos directory.

CC0: http://creativecommons.org/publicdomain/zero/1.0/

====

All files located in the node_modules and external directories are
externally maintained libraries used by this software which have their
own licenses; we recommend you read them, as their terms may differ from
the terms above.
				`
			},
			{
				"name": "jStat",
				"links": ["https://github.com/jstat/jstat", "https://github.com/jstat/jstat/blob/1.x/LICENSE"],
				"typeoflicense": "MIT License",
				"license_text": `
Copyright (c) 2013 jStat

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
`
			},
            {
				"name":"Springy",
				"links": ["https://github.com/dhotson/springy/", "https://github.com/dhotson/springy/blob/master/LICENSE"],
				"typeoflicense":"MIT License",
				"license_text":`Copyright (c) 2010 Dennis Hotson
				
				Permission is hereby granted, free of charge, to any person obtaining a copy
				of this software and associated documentation files (the "Software"), to deal
				in the Software without restriction, including without limitation the rights
				to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
				copies of the Software, and to permit persons to whom the Software is
				furnished to do so, subject to the following conditions:
				
				The above copyright notice and this permission notice shall be included in
				all copies or substantial portions of the Software.
				
				THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`
			},
            {
				"name":"RedBlackTree.js/RedBlackNode.js",
				"links": ["http://www.kevlindev.com/license.txt"],
				"typeoflicense":"BSD License",
				"license_text":`Copyright (c) 2000-2004, Kevin Lindsey
                All rights reserved.

                Redistribution and use in source and binary forms, with or without
                modification, are permitted provided that the following conditions are met:

                    - Redistributions of source code must retain the above copyright notice,
                      this list of conditions and the following disclaimer.

                    - Redistributions in binary form must reproduce the above copyright
                      notice, this list of conditions and the following disclaimer in the
                      documentation and/or other materials provided with the distribution.

                    - Neither the name of this software nor the names of its contributors
                      may be used to endorse or promote products derived from this software
                      without specific prior written permission.

                THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
                ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
                WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
                DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
                ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
                (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
                LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
                ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
                (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
                SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
                `
			},
            {
				"name":"Normalize.css",
				"links": ["https://github.com/necolas/normalize.css/", "https://github.com/necolas/normalize.css/blob/master/LICENSE.md"],
				"typeoflicense":"MIT license",
				"license_text":`
Copyright © Nicolas Gallagher and Jonathan Neal

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE				`
			},
			{
				"name":"ANTLR",
				"links": ["https://www.antlr.org/", "https://www.antlr.org/license.html"],
				"typeoflicense":"BSD license",
				"license_text":`
				Copyright (c) 2012 Terence Parr and Sam Harwell
				All rights reserved.
				
				Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
				
					Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
					Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
					Neither the name of the author nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission. 
				
				THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
`
			},
];
		
		
function generateHtml() {
	let html = `
	<html>
	<head>
	</head>
	<body>
	`;
	for (let party of thirdparties) {
		html += (`
			<div>	
				<h1>${party.name}</h1>
				<ul>
					${party.links.map(lnks => `<li><a href="${lnks}" target="_blank">${lnks}</a></li>`).join('')}
				</ul>
				<b>${party.typeoflicense}</b></br>
				${party.license_text.replace(/\n/g, "<br />")}
			</div>
			<hr style="width:98%;"/>
		`);
	}
	html+=`
	</body>
	</html>
	`;
	return html;
}

function generateMarkDown() {
	// Line breaks are made with double space in markdown https://gist.github.com/shaunlebron/746476e6e7a4d698b373
	let text = '';
	for (let party of thirdparties) {
			text+="# "+party.name+"  \n"
			for (link of party.links)  {
				text+=link+"  \n"
			}
			text+="**"+party.typeoflicense+"**  \n";
			// text+=party.license_text.replace(/\t/g, 'tab').replace(/\s\s+/g, 'hej').replace(/\n/g, "\n  ")
			text+=party.license_text.replace(/\t/g, '').replace(/    +/g, '').replace(/\n/g, "  \n")+"  \n"
	}
	return text;
}

const fs = require('fs');


function writeLicenseFile(filename, text) {
	fs.writeFile(filename, text, function(err) {
		if(err) {
			return console.log(err);
		}
		console.log("Licenses written to "+filename);
	}); 
}

writeLicenseFile("../../src/third-party-licenses.html", generateHtml());
writeLicenseFile("../../../third-party-licenses.md", generateMarkDown());
