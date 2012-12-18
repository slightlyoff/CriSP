// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by an Apache-style license that can be
// found in the LICENSE file.

"use strict";

(function(global) {

  var toString = function(item) {
    var t = (typeof item);
    if (t == "undefined") {
      return "undefined";
    } else if (t == "string") {
      return item;
    } else if (t == "number") {
      return item + "";
    } else if (item instanceof Array) {
      return item + "";
    }
    return item + "";
  }

  // A minimal console
  var log = function(hint, args){
    var r = "";
    var al = args.length;
    r += ((hint ? hint + ":" : "") + toString(args[0]));
    for(var i = 1; i < al; i++){
      r += (" " + toString(args[i]));
    }
    print(r);
  };

  // Intentionally define console in the global namespace
  global.console = {
    log:    function() { log(0, Array.prototype.slice.call(arguments, 0)); },
    error:  function() { log("ERROR", Array.prototype.slice.call(arguments, 0)); },
    warn:   function() { log("WARN", Array.prototype.slice.call(arguments, 0)); }
  };

})(this);

doh.squelch = false;

// Dependencies
load("../csp.js");

// Tests
load("csp-test.js");
