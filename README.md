CriSP
=====

A user-specified CSP extension for Chromium.

Licensed [Apache License 2.0](LICENSE), Copyright 2012 [Google](https://github.com/google).

What Is This?
-------------

[Content Security Policy](http://www.w3.org/Security/wiki/Content_Security_Policy) 
(aka "CSP") is a mechanism that allows web developers to control the behavior
of browsers, notably disabling many on-by-default capabilities in web pages,
such as the ability to request scripts from any other site or to run plugins.

As a developer-facing feature, CSP allows sites to lock-down these capabilities
via a policy provided to the browser on a page-by-page basis. This extension
allows you, the user, to provide a *default policy* which is stricter than the
browser's default (wide-open) policy, putting the power of CSP in your hands.

It also provides the ability to configure policies on a site-by-site (and
eventually, site-type) basis, disabling dangerous features for your banking
sites while leaving them on for general browsing.

Contained in this repository you'll find the sources for the Chrome extension,
an implementation of CSP in JavaScript, and tests.

Getting Started
---------------

This repo pulls in other Git repositories through
[submodules](http://help.github.com/submodules/). After cloning the repo, run:

```
$ git submodule init
$ git submodule update
...
```
To run the test from the command line, first, see if they already run without
any extra work (they should on most Mac or Linux boxes):

```
$ cd tests
$ ./run.sh
...
```

If you get an error like: 

```
$ ./run.sh 
FAILED: No JavaScript Runtime Found! Please install Java or the V8 Shell (d8) and add them to your $PATH
```

Check out a copy of V8, build the "d8" and "shell" targets, and add them to
your $PATH.

License
-------

This project is licensed under the [Apache License 2.0](LICENSE), except for
the contents of the "third_party" directory, where licenses are noted on a
per-directory basis. No "third_party" code is required for the essential
functioning of this library/extension.

