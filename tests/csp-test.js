// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by an Apache-style license that can be
// found in the LICENSE file.

"use strict";

var t = doh;

var toStringTester = function(url) {
  var expected = url;
  if (url instanceof Array) {
    expected = url[0];
    url = url[1];
  }
  var u = new csp.Url(url);
  doh.is(expected, u.toString());
};

doh.add("csp.Url", [
  function no_parse() {
    var u = new csp.Url();
    t.is(u.source, "");
    t.is(u.scheme, "");
    t.is(u.host, "");
    t.is(u.port, "");
    t.is(u.file, "");
    t.is(u.hash, "");
    t.is(u.path, "");
  },
  function toString() {
    var strings = [
      "file:///",
      [ "http://example.com/", "http://example.com" ],
      "http://example.com/",
      "http://example.com/foo.html",
      "http://www.example.com/foo.html?thinger",
      "http://www.example.com/foo.html?thinger=whatevs",
      "http://example.com:8080/foo.html?thinger=whatevs",
      [ "example.com/", "example.com" ],
      [ "example.com:80/", "example.com:80" ],
      [ "example.com:8080/", "example.com:8080"],

      "*.example.com/",
      [ "*.example.com/", "*.example.com" ],
      "*.example.com/foo.html",
      "*.example.com:8080/",
      [ "*.example.com:8080/", "*.example.com:8080" ],
      "*.example.com:*/foo.html",
      "*.example.com:*/",
      [ "*.example.com:*/", "*.example.com:*" ],
      "*.example.com:*/foo.html",
    ].forEach(toStringTester);
  },
  function parseError() {
    // TODO
  },
]);

doh.add("csp.SourceExpression", [

]);

doh.add("csp.matchSourceExpression", [
]);

// Generate an identical set of tests for each method
[{ METHOD: "allowsEval",         ALLOW: "'unsafe-eval'",   SOURCE: "script-src" },
 { METHOD: "allowsInlineScript", ALLOW: "'unsafe-inline'", SOURCE: "script-src" },
 { METHOD: "allowsInlineStyle",  ALLOW: "'unsafe-inline'", SOURCE: "style-src" },
].forEach(function(subs){
  [
    // Neither default-src nor script-src are set
    "t.t((new csp.SecurityPolicy()).METHOD);",

    // Explicitly allowed
    "t.t((new csp.SecurityPolicy(\"SOURCE ALLOW\")))",
    "t.t((new csp.SecurityPolicy(\"default-src ALLOW\")))",
    "t.t((new csp.SecurityPolicy(\"SOURCE ALLOW\")).METHOD);",
    "t.t((new csp.SecurityPolicy(\"default-src ALLOW\")).METHOD);",

    // Should fail
    "t.f((new csp.SecurityPolicy(\"SOURCE;\")).METHOD);",
    "t.f((new csp.SecurityPolicy(\"default-src;\")).METHOD);",
    "t.f((new csp.SecurityPolicy(\"SOURCE 'none'\")).METHOD);",
    "t.f((new csp.SecurityPolicy(\"SOURCE\")).METHOD);",
    "t.f((new csp.SecurityPolicy(\"default-src ALLOW; SOURCE\")).METHOD);",
    "t.f((new csp.SecurityPolicy(\"default-src *; SOURCE 'none'\")).METHOD);",
    "t.f((new csp.SecurityPolicy(\"SOURCE 'none'\")).METHOD);",
    "t.f((new csp.SecurityPolicy(\"SOURCE *\")).METHOD);",
    "t.f((new csp.SecurityPolicy(\"SOURCE 'self'\")).METHOD);",

  ].forEach(function(test) {
    Object.keys(subs).forEach(function(key) {
      while(test.indexOf(key) >= 0) {
        test = test.replace(key, subs[key]);
      }
    });
    doh.add("csp.SecurityPolicy", test);
  });
});

// Generate an identical set of tests for each method
[{ METHOD: "allowsConnectionTo", SOURCE: "connect-src" },
 { METHOD: "allowsFontFrom",     SOURCE: "font-src",    EXT: ".ttf" },
 { METHOD: "allowsFormAction",   SOURCE: "form-action" },
 { METHOD: "allowsFrameFrom",    SOURCE: "frame-src" },
 { METHOD: "allowsImageFrom",    SOURCE: "img-src",     EXT: ".png" },
 { METHOD: "allowsMediaFrom",    SOURCE: "media-src",   EXT: ".webm" },
 { METHOD: "allowsObjectFrom",   SOURCE: "object-src",  EXT: ".swf" },
 { METHOD: "allowsScriptFrom",   SOURCE: "script-src",  EXT: ".js" },
 { METHOD: "allowsStyleFrom",    SOURCE: "style-src",   EXT: ".css" },
].forEach(function(subs){
  subs.STD_PORT = "http://example.com:80/foo" + (subs.EXT||"");
  subs.BASE = "http://example.com/foo" + (subs.EXT||"");
  [
    // Neither default-src nor script-src are set
    "t.t((new csp.SecurityPolicy()).METHOD);",
    "t.t(new csp.SecurityPolicy(undefined, \"BASE\").METHOD(\"BASE\"));",
    "t.t(new csp.SecurityPolicy(\"\", \"BASE\").METHOD(\"BASE\"));",
    "t.t(new csp.SecurityPolicy(\"SOURCE *\", \"BASE\").METHOD(\"BASE\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE 'none'\", \"BASE\").METHOD(\"BASE\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE;\", \"BASE\").METHOD(\"BASE\"));",

    "t.f(new csp.SecurityPolicy(\"SOURCE http://foo.com\", \"BASE\").METHOD(\"BASE\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE http://foo.com:80\", \"BASE\").METHOD(\"BASE\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE http://foo.com:8080\", \"BASE\").METHOD(\"BASE\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE http://foo.com:*\", \"BASE\").METHOD(\"BASE\"));",
    "t.t(new csp.SecurityPolicy(\"SOURCE http://*.com\", \"BASE\").METHOD(\"BASE\"));",
    "t.t(new csp.SecurityPolicy(\"SOURCE http://*.com:80\", \"BASE\").METHOD(\"BASE\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE http://*.com:8080\", \"BASE\").METHOD(\"BASE\"));",
    "t.t(new csp.SecurityPolicy(\"SOURCE http://*.com:*\", \"BASE\").METHOD(\"BASE\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE https://example.com\", \"BASE\").METHOD(\"BASE\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE https://example.com:443\", \"BASE\").METHOD(\"BASE\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE https://example.com:8080\", \"BASE\").METHOD(\"BASE\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE https://example.com:*\", \"BASE\").METHOD(\"BASE\"));",

    "t.t(new csp.SecurityPolicy(\"SOURCE 'self'\", \"BASE\").METHOD(\"/foo\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE 'none'\", \"BASE\").METHOD(\"/foo\"));",

    "t.t(new csp.SecurityPolicy(undefined, \"STD_PORT\").METHOD(\"STD_PORT\"));",
    "t.t(new csp.SecurityPolicy(\"SOURCE *\", \"STD_PORT\").METHOD(\"STD_PORT\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE 'none'\", \"STD_PORT\").METHOD(\"STD_PORT\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE;\", \"STD_PORT\").METHOD(\"STD_PORT\"));",
    "t.t(new csp.SecurityPolicy(\"\", \"STD_PORT\").METHOD(\"STD_PORT\"));",

    "t.f(new csp.SecurityPolicy(\"SOURCE http://foo.com\", \"STD_PORT\").METHOD(\"STD_PORT\"));",
    "t.t(new csp.SecurityPolicy(\"SOURCE http://*.com\", \"STD_PORT\").METHOD(\"STD_PORT\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE https://example.com\", \"STD_PORT\").METHOD(\"STD_PORT\"));",

    "t.t(new csp.SecurityPolicy(\"SOURCE 'self'\", \"STD_PORT\").METHOD(\"/foo\"));",
    "t.f(new csp.SecurityPolicy(\"SOURCE 'none'\", \"STD_PORT\").METHOD(\"/foo\"));",
  ].forEach(function(test) {
    Object.keys(subs).forEach(function(key) {
      while(test.indexOf(key) >= 0) {
        test = test.replace(key, subs[key]);
      }
    });
    doh.add("csp.SecurityPolicy", test);
  });
});

doh.add("csp.SecurityPolicy", [
  function toString(t) {
    [
      "default-src",
      "default-src; script-src",
      "default-src 'unsafe-eval'; script-src",
    ].forEach(function(p) {
      var policy = new csp.SecurityPolicy(p);
      t.is(p, policy.toString());
    });
  },
  /*
  function ctor() {
  },
  function parseError() {
  },
  function allowsPluginType() {
  },
  function isActive() {
  },
  */
  function wildcardIntersection(t) {
    var base = "http://example.com/foo.html";
    var resource = "http://example.com/foo.css";

    var restrictive = new csp.SecurityPolicy("style-src http://foo.com:*", base);
    var liberal = new csp.SecurityPolicy("style-src http://*.com", base);

    // Sanity check
    t.f(restrictive.allowsStyleFrom(resource));
    t.t(liberal.allowsStyleFrom(resource));

    // Identity
    var r2 = csp.SecurityPolicy.intersection(restrictive);
    r2.baseUrl = base;
    var l2 = csp.SecurityPolicy.intersection(liberal);
    l2.baseUrl = base;
    t.f(r2.allowsStyleFrom(resource));
    t.t(l2.allowsStyleFrom(resource));

    // Now ensure that the intersection is the more restrictive variant
    var intersection = csp.SecurityPolicy.intersection(restrictive, liberal);

    // FIXME(slightlyoff): this is terrible. We should probably just force
    // intersection and union to take SP args and not strings in order to ensure
    // that we have sane bases more of the time, else we're in the situation
    // where we hae to mangle the arguments to support passing a common base
    // somehow. Ugggg.
    //
    // ...perhaps duck-typing in the copy constructor will save us? Then you can
    // pass a base in a small object:
    //
    //    csp.SecurityPolicy.intersection({ policy: "...", base: "..."}, ...);
    intersection.baseUrl = base;
    t.f(intersection.allowsStyleFrom(resource));

    // Ensure that we're order-independent
    var i2 = csp.SecurityPolicy.intersection(liberal, restrictive);
    i2.baseUrl = base;
    t.f(i2.allowsStyleFrom(resource));
  },

  function disjointIntersection(t) {
    var base = "http://example.com/foo.html";
    var css = "http://example.com/foo.css";
    var font = "http://example.com/foo.ttf";

    var stylePolicy = new csp.SecurityPolicy("style-src http://foo.com:*", base);
    var fontPolicy = new csp.SecurityPolicy("font-src http://*.com", base);

    // Sanity check
    t.f(stylePolicy.allowsStyleFrom(css));
    t.t(fontPolicy.allowsStyleFrom(css));
    t.t(fontPolicy.allowsFontFrom(font));
    t.f(fontPolicy.allowsFontFrom("https://baz.org/foo.ttf"));
    t.f(fontPolicy.objectSrc.set);
    t.t(fontPolicy.fontSrc.set);

    // Now ensure that the intersection is the more restrictive variant
    var intersection = csp.SecurityPolicy.intersection(stylePolicy, fontPolicy);
    intersection.baseUrl = base;
    t.t(intersection.allowsFontFrom(font));
    t.f(intersection.allowsFontFrom("https://baz.org/foo.ttf"));
    t.f(intersection.allowsStyleFrom(css));
    t.f(intersection.objectSrc.set);
    t.t(intersection.fontSrc.set);
  },

  function specificIntersection(t) {
    var base = "http://example.com/foo.html";
    var fooResource = "http://foo.com/foo.css";
    var exampleResource = "http://example.com/foo.css";

    var foo  = new csp.SecurityPolicy("style-src http://foo.com/ https://thirdparty.com/", base);
    var example = new csp.SecurityPolicy("style-src http://example.com/ https://thirdparty.com/", base);

    // Sanity check
    t.t(foo.allowsStyleFrom(fooResource));
    t.f(foo.allowsStyleFrom(exampleResource));
    t.t(example.allowsStyleFrom(exampleResource));
    t.f(example.allowsStyleFrom(fooResource));
    t.f(example.allowsStyleFrom("https://baz.org/foo.css"));
    t.f(example.objectSrc.set);
    t.f(example.fontSrc.set);

    // Now ensure that the intersection is the more restrictive variant
    var intersection = csp.SecurityPolicy.intersection(foo, example);
    intersection.baseUrl = base;
    t.f(intersection.allowsStyleFrom(fooResource));
    t.f(intersection.fontSrc.set);
  },

  function union(t) {
    var base = "http://example.com/foo.html";
    var fooResource = "http://foo.com/foo.css";
    var exampleResource = "http://example.com/foo.css";

    var foo  = new csp.SecurityPolicy(
      "object-src; style-src http://foo.com/ https://thirdparty.com/", base);
    var example = new csp.SecurityPolicy("style-src http://example.com/ https://thirdparty.com/", base);

    // Sanity check
    t.t(foo.allowsStyleFrom(fooResource));
    t.f(foo.allowsStyleFrom(exampleResource));
    t.t(foo.objectSrc.set);
    t.t(example.allowsStyleFrom(exampleResource));
    t.f(example.allowsStyleFrom(fooResource));
    t.f(example.allowsStyleFrom("https://baz.org/foo.css"));
    t.f(example.objectSrc.set);
    t.f(example.fontSrc.set);

    var union = csp.SecurityPolicy.union(foo, example);
    union.baseUrl = base;
    t.t(union.allowsStyleFrom(fooResource));
    t.t(union.allowsObjectFrom(fooResource));
    t.f(union.fontSrc.set);
  },

  function merge(t) {
    var base = "http://example.com/foo.html";
    var fooResource = "http://foo.com/foo.css";
    var exampleResource = "http://example.com/foo.css";

    var foo  = new csp.SecurityPolicy(
      "object-src; style-src http://foo.com/ https://thirdparty.com/", base);
    var example = new csp.SecurityPolicy("style-src http://example.com/ https://thirdparty.com/", base);

    var merger = csp.SecurityPolicy.merge(foo, example);
    merger.baseUrl = base;
    t.t(merger.allowsStyleFrom(fooResource));
    // This behavior is what separates union() from merge() and makes merge()
    // the more restrictive variant.
    t.f(merger.allowsObjectFrom(fooResource));
    t.f(merger.fontSrc.set);
  },
]);
