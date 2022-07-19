# pjcl

This is version 1.0.0 of the Pomcor JavaScript Cryptographic Library
(PJCL), which has been refactored as an ES6 module and is primarily
intended at this time as a tool for implementing phishing-resistant
cryptographic authentication in web applications, as demonstrated in
the companion repositories
[fcorella/crypto-authn-demo-nosql](https://github.com/fcorella/crypto-authn-demo-nosql.git)
and
[fcorella/crypto-authn-demo-sql](https://github.com/fcorella/crypto-authn-demo-sql.git).

The file pjcl-with-argument-checking.js augments pjcl.js with code
that checks the arguments of cryptographic functions, to help with
debugging programs that use the library.  The file pjcl.js is derived
from the file pjcl-with-argument-checking.js by commenting out the
argument-checking preambles of the functions.

PJCL uses Deterministic Random Bit Generators (DRBGs) as specified in
NIST Special publication 800-90A Revision 1 for generation of random
bits, and needs sources of entropy.  The companion repositories
show how /dev/random can be used to obtain server entropy when PJCL is
used on the backend, under Nodejs, and how browser entropy can be
combined with entropy downloaded from the server when PJCL is used on
the front end.  The functions in browser-entropy.js provide browser
entropy obtained from the Crypto.getRandomValues() method of the Web
Crypto API.

## Documentation

Extensive cryptographic documentation can be found in
https://pomcor.com/pjcl/pjcl-documentation.pdf .

## Security

Beta test versions of PJCL, not published on GitHub, [were available
on the Pomcor
site](https://pomcor.com/pomcor-releases-pjcl-on-github-and-npm).  The
beta test versions have been [archived and
deprecated](https://pomcor.com/beta-versions-of-pjcl) and
are no longer maintained.  Any bugs found in this or future versions
of PJCL should be reported through the Pomcor contact form at
https://pomcor.com/contact-us/ .