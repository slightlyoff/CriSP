CriSP
=====

CSP working for you, not the man.

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
