// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

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
      test = test.replace(key, subs[key], "g");
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
  */

  function allowsConnectionTo(t) {
    var base = "http://example.com/foo.html";
    t.t(new csp.SecurityPolicy(undefined, base).allowsConnectionTo(base));
    t.t(new csp.SecurityPolicy("default-src *", base).allowsConnectionTo(base));
    t.f(new csp.SecurityPolicy("default-src 'none'", base).allowsConnectionTo(base));
    t.f(new csp.SecurityPolicy("default-src;", base).allowsConnectionTo(base));
    t.t(new csp.SecurityPolicy("", base).allowsConnectionTo(base));

    t.f(new csp.SecurityPolicy("default-src http://foo.com", base).allowsConnectionTo(base));
    t.f(new csp.SecurityPolicy("default-src http://*.com", base).allowsConnectionTo(base));
    t.f(new csp.SecurityPolicy("default-src https://example.com", base).allowsConnectionTo(base));

    t.t(new csp.SecurityPolicy("default-src 'self'", base).allowsConnectionTo("/foo"));
    t.f(new csp.SecurityPolicy("default-src 'none'", base).allowsConnectionTo("/foo"));
  },

  /*
  function allowsFontFrom() {

  },
  function allowsFormAction() {

  },
  function allowsFrameFrom() {

  },
  function allowsImageFrom() {

  },
  function allowsMediaFrom() {

  },
  function allowsObjectFrom() {

  },
  function allowsPluginType() {

  },
  function allowsScriptFrom() {

  },
  function allowsStyleFrom() {

  },
  function isActive() {

  },
  */
]);
