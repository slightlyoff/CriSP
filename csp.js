(function(global){
"use strict";

var csp = global.csp = {};

//
// Utility methods
//

Object.defineProperty(Array.prototype, "_has", {
  value: function(value) {
    return this.indexOf(value) != -1;
  },
  writable: true,
  configurable: true,
  enumerable: false,
});

Object.defineProperty(String.prototype, "_has", {
  value: function(value) {
    return this.indexOf(value) != -1;
  },
  writable: true,
  configurable: true,
  enumerable: false,
});


var toCamelCase = (function() {
  var _tcc = Object.create(null);
  return function(str) {
    var cr = _tcc[str];

    if (cr) {
      return cr;
    }
    var first = true;
    var ccv = str.split(/[-_]/).map(function(v, i) {
      if (!v) { return; }
      if (v && !first) {
        return v.substr(0, 1).toUpperCase() + v.substr(1);
      }
      first = false;
      return v;
    }).join("");

    // Cache it.
    _tcc[str] = ccv;

    return ccv;
  };
})();

var own = function(obj, cb, context) {
  Object.getOwnPropertyNames(obj).forEach(cb, context||global);
  return obj;
};

var extend = function(obj, props) {
  own(props, function(x) {
    var pd = Object.getOwnPropertyDescriptor(props, x);
    if ( (typeof pd["get"] == "function") ||
         (typeof pd["set"] == "function") ) {
      Object.defineProperty(obj, x, pd);
    } else if (typeof pd["value"] == "function" ||x.charAt(0) === "_") {
      pd.writable = true;
      pd.configurable = true;
      pd.enumerable = false;
      Object.defineProperty(obj, x, pd);
    } else {
      obj[x] = props[x];
    }
  });
  return obj;
};

var inherit = function(props) {
  var ctor = null;
  var parent = null

  if (props["extends"]) {
    parent = props["extends"];
    delete props["extends"];
  }

  if (props["initialize"]) {
    ctor = props["initialize"];
    delete props["initialize"];
  }

  var realCtor = ctor || function() { };

  var rp = realCtor.prototype = Object.create(
    ((parent) ? parent.prototype : Object.prototype)
  );
  extend(rp, props);
  return realCtor;
};

//
// CriSP-y
//

var Url = csp.Url = inherit({
  initialize: function(url) {
    // Initialize the object shape.
    this.source = url || "";
    this.scheme = "";
    this.host = "";
    this.port = "";
    this.query = "";
    this.file = "";
    this.hash = "";
    this.path = "";

    this.hasWildcardHost = false;
    this.hasWildcardPort = false;
    /*
    this.relative = "";
    this.params = {};
    this.segments = [];
    */

    if (url) {
      this._parseUrl(url);
    }
  },

  toString: function() {
    /*
    console.log(this.scheme);
    console.log(this.path);
    */
    var url = "";
    if (this.scheme) {
      url += this.scheme;
    }
    if (this.host || this.path) {
      if (this.scheme) {
        url += "://";
      }
      if (this.hasWildcardHost) {
        url += "*";
      }
      url += this.host;
      if (this.hasWildcardPort) {
        url += ":*";
      } else if (this.port) {
        url += ":" + this.port;
      }
      if (this.file || this.query || this.path) {
        if (this.path) {
          url += this.path;
        }
      } else {
        url += "/";
      }
      if (this.hash) {
        url += "#" + this.hash;
      }
      if (this.query) {
        url += "?" + this.query;
      }
    }
    return url;
  },

  // FIXME(slightlyoff): TESTS!!!
  _parseUrl: function(url) {
    /*
    // NOTE: we can't use this because browser-provided URL parsing is too
    // restrictive = (

    // James Padolsey's code from:
    //    http://james.padolsey.com/javascript/parsing-urls-with-the-dom/
    // Modifed to my liking.

    var a =  document.createElement("a");
    a.href = url;
    this.scheme = a.protocol.replace(":", "");
    this.host = a.hostname;
    this.port = a.port;
    this.query = a.search;
    this.params = (function(){
      var ret = {},
        // FIXME: it's not clear that "&" is the delimiter in all cases
        seg = a.search.replace(/^\?/, "").split("&"),
        len = seg.length, i = 0, s;

      for (;i<len;i++) {
        if (!seg[i]) { continue; }
        s = seg[i].split('=');
        ret[s[0]] = s[1];
      }
      return ret;
    })();

    this.file = (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1];
    this.hash = a.hash.replace('#','');
    this.path = a.pathname.replace(/^([^\/])/,'/$1');
    this.relative = (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1];
    this.segments = a.pathname.replace(/^\//,'').split('/');
    */

    // Parsing constants
    var SCHEME_SEP = "://";
    var PORT_TOKEN = ":";
    var SLASH = "/";

    if (url._has(SCHEME_SEP)){
      this.scheme = url.substring(0, url.indexOf(SCHEME_SEP));
    }
    var remainder = "";
    var hostPart = url;
    if (url._has(SCHEME_SEP)) {
      // Lop the scheme off
      hostPart = url.substring(url.indexOf(SCHEME_SEP) + SCHEME_SEP.length);
    }

    // FIXME: should probably validate host based on production in EBNF
    var idx = -1;
    var idxen = [
          hostPart.indexOf(SLASH),
          hostPart.indexOf(PORT_TOKEN)
        ].filter(function(i) { return i != -1; });

    if (idxen.length) {
      idx = Math.min.apply(null, idxen);
    }

    if (idx == -1) {
      // If we don't have a "/" or a ":", the whole thing is the host
      this.host = hostPart;
      return;
    }

    this.host = hostPart.substring(0, idx);
    remainder = hostPart.substring(idx+1);

    if (this.host) {
      // Now look for a port and path
      if (hostPart.indexOf(PORT_TOKEN) == idx) {
        // We've got a port. Save it and continue.
        var si = remainder.indexOf(SLASH);
        if (si != -1) {
          this.port = remainder.substring(0, remainder.indexOf(SLASH));
          remainder = remainder.substring(remainder.indexOf(SLASH)+1);
        } else {
          this.port = remainder;
          return;
        }
      }
      if (remainder) {
        // FIXME(slightlyoff): do we need to prepend "/"?
        // this.path = remainder;
        var pathParts = remainder.split("?", 2);
        if (pathParts[1]) {
          this.query = pathParts[1];
        }
        this.path = "/" + pathParts[0];
        var fileParts = this.path.split("/");
        this.file = fileParts[fileParts.length - 1] || "";
      }
    } else {
      this.path = "/";
    }
  },

  set host(host) {
    // Is the host wildcarded? If so, strip the astrisk; it makes comparison
    // simpler later on, as we can do a simple suffix test.
    var ASTERISK = "*";
    var PERIOD = ".";

    if (host.indexOf(ASTERISK) == 0 && host.indexOf(PERIOD) == 1) {
      this.hasWildcardHost = true;
      this._host = host.substring(1);
    } else {
      this.hasWildcardHost = false;
      this._host = host;
    }
  },
  get host() {
    return this._host;
  },

  set port(port) {
    // Is the port wildcarded? If so, strip it; it makes comparison
    // simpler later on, as we can just check the bool.
    var ASTERISK = "*";
    if (port == ASTERISK) {
      this.hasWildcardPort = true;
      this._port = true;
    } else {
      this.hasWildcardPort = false;
      this._port = port;
    }
  },
  get port() {
    return this._port;
  },
  get effectivePort() {
    // If port is the empty string, return the default port for the URL's scheme
    if (this.port == "") {
      // FIXME: Are we sure that the scheme matches the document's scheme?
      switch (this.scheme) {
        case "https":
          return 443;
        case "http":
          return 80;
        default:
          return "";
      };
    }
    return this.port;
  }
});

// Parsing is giving by spec as:
//  source-list       = *WSP [ source-expression *( 1*WSP source-expression ) *WSP ]
//                    / *WSP "'none'" *WSP
//  source-expression = scheme-source / host-source / keyword-source
//  scheme-source     = scheme ":"
//  host-source       = [ scheme "://" ] host [ port ] [ path ]
//  keyword-source    = "'self'" / "'unsafe-inline'" / "'unsafe-eval'"
//  scheme            = <scheme production from RFC 3986, section 3.1>
//  host              = "*" / [ "*." ] 1*host-char *( "." 1*host-char )
//  host-char         = ALPHA / DIGIT / "-"
//  path              = <path production from RFC 3986, section 3.3>
//  port              = ":" ( 1*DIGIT / "*" )
var SourceExpression = csp.SourceExpression = inherit({
  extends: Url,
  initialize: function(expressionStr) {
    Url.call(this);

    this._parseExpression(expressionStr);
  },

  _keywordSources: [ "'self'", "'unsafe-inline'", "'unsafe-eval'" ],
  _parseExpression: function(expr) {
    // See if it's one of our reserved tokens
    if (this._keywordSources._has(expr)) {
      this.keywordSource = expr;
    } else {
      // Parse it as a URL pattern
      this._parseUrl(expr);
    }
  },

  portIsDefaultForScheme: function() {
    if (!this.port) return true;
    var scheme = this.scheme || "http";
    switch(scheme) {
      case "http":
        return this.port == "80";
      case "https":
        return this.port == "443";
      default:
        return true;
    }
  }
});

var ciMatch = function() {
  // Case-insensitive match all arguments
  var match = true;
  var varArgs = Array.prototype.slice.call(arguments, 0);
  var first = varArgs.shift().toUpperCase();
  varArgs.every(function(a) {
    if (a.toUpperCase() != first) {
      match = false;
      return false;
    }
    return true;
  });
  return match;
};

var ciSuffix = function(string, suffix) {
    // Is 'suffix' a case-insensitive suffix of 'string'?
    var idx = string.toUpperCase().lastIndexOf(suffix.toUpperCase());
    return !( idx == -1 || idx + suffix.length != string.length)
};


// A URL matches a source list, if, and only if, the URL matches at least one
// source expression in the set of source expressions obtained by parsing the
// source list. Notice that no URLs match an empty set of source expressions,
// such as the set obtained by parsing the source list 'none'.

var matchSourceExpression =
  csp.matchSourceExpression =
  function(documentUrl, source, url) {
  // 3.2.2.2 Matching
  //
  // To check whether a URL matches a source expression, the user agent must use
  // an algorithm equivalent to the following:
  //
  // If the source expression a consists of a single U+002A ASTERISK character
  // (*), then return does match.
  if (source == "*") { return true; }

  // Empty set, no match for anything.
  if (source == "'none'") { console.log("source == 'none'"); return false; }

  var doc = new SourceExpression(documentUrl);
  var se = new SourceExpression(source);
  var url = new SourceExpression(url);

  // If the source expression matches the grammar for scheme-source:
  if (se.scheme == se.source) {
    //   If the URL's scheme is a case-insensitive match for the source
    //   expression's scheme, return does match.

    //   Otherwise, return does not match.

    return ciMatch(se.scheme, url.scheme);
  }

  // If the source expression matches the grammar for host-source:
  if (se.host) {
    //   If the URL does not contain a host, then return does not match.
    if (!url.host) return false;

    //   Let uri-scheme, uri-host, and uri-port be the scheme, host, and port of
    //   the URL, respectively. If the URL does not have a port, then let uri-
    //   port be the default port for uri-scheme. Let uri-path be the path of
    //   the URL after decoding percent-encoded characters. If the URL does not
    //   have a path, then let uri-path be the U+002F SOLIDUS character (/).

    //   If the source expression has a scheme that is not a case insensitive
    //   match for uri-scheme, then return does not match.
    if (se.scheme) {
      if (!ciMatch(se.scheme, url.scheme)) return false;
    } else {
      // If the source expression does not have a scheme and if uri-scheme is
      // not a case insensitive match for the scheme of the protected resource's
      // URL, then return does not match.
      if (!ciMatch(url.scheme, doc.scheme)) return false;
    }

    //   If the first character of the source expression's host is an U+002A
    //   ASTERISK character (*) and the remaining characters, including the
    //   leading U+002E FULL STOP character (.), are not a case insensitive
    //   match for the rightmost characters of uri-host, then return does not
    //   match.
    if (se.hasWildcardHost && !ciSuffix(url.host, se.host)) return false;

    //   If uri-host is not a case insensitive match for the source expression's
    //   host, then return does not match.
    if (!se.hasWildcardHost && !ciMatch(se.host, url.host)) return false;

    //   If the source expression does not contain a port and uri-port is not
    //   the default port for uri-scheme, then return does not match.
    if (!se.port && !url.portIsDefaultForScheme()) return false;

    //   If the source expression does contain a port, then return does not
    //   match if port does not contain a U+002A ASTERISK character (*), and
    //   port does not represent the same number as uri-port.
    if (se.port && !se.hasWildcardPort &&
        (se.effectivePort != url.effectivePort)) {
      return false;
    }

    //   If the source expression contains a non-empty path, then:
    if (se.path) {
      //     Let decoded-path be the result of decoding path's percent-encoded
      //     characters.
      var decodedPath = decodeURIComponent(se.path);

      //     If the final character of decoded-path is the U+002F SOLIDUS
      //     character (/), and decoded-path is not a prefix of uri-path, then
      //     return does not match.
      if (decodedPath.charAt(decodedPath.length-1) == "/") {
        if (url.path.indexOf(decodedPath) != 0) {
          return false;
        }

      //     If the final character of decoded-path is not the the U+002F
      //     SOLIDUS character (/), and decoded-path is not an exact match for
      //     uri-path then return does not match.
      } else {
        if (url.path != decodedPath) {
          return false;
        }
      }
    }

    //   Otherwise, return does match.
    return true;
  }

  // If the source expression is a case insensitive match for 'self' (including
  // the quotation marks), then return does match if the URL has the same
  // scheme, host, and port as the protected resource's URL (using the default
  // port for the appropriate scheme if either or both URLs are missing ports).
  if (se.keywordSource == "'self'") {
    return (
      (url.scheme == doc.scheme) &&
      (url.host == doc.host) &&
      (url.port == doc.port)
    );
  }

  // Otherwise, return does not match.
  return false;
};

var matchSourceExpressionList = function(base, list, url) {
  for (var y = 0; y < list.length; y++) {
    if (matchSourceExpression(base, list[y], url)) {
      return true;
    }
  }
  return false;
};

// Models each policy directive. Instances are used in SecurityPolicy.
var PolicyDirective = csp.PolicyDirective = inherit({

  initialize: function(policyName) {
    this.name = policyName;
    this.set = false;
    this.sourceList = [];
  },

  addSource: function(origin) {
    if (!origin) return;
    this.set = true;
    this.sourceList.push(origin);
  },

  toString: function() {
    return this.name + ((this.sourceList.length) ?
                        (" " + this.sourceList.join(" ")) : "");
  },

});

// Class to model a policy
//
// From the 1.1 spec we have an (as-yet unimplemneted) scripting interface:
//
// interface SecurityPolicy {
//     readonly attribute DOMString[] reportURIs;
//     bool allowsEval();
//     bool allowsInlineScript();
//     bool allowsInlineStyle();
//     bool allowsConnectionTo(DOMString url);
//     bool allowsFontFrom(DOMString url);
//     bool allowsFormAction(DOMString url);
//     bool allowsFrameFrom(DOMString url);
//     bool allowsImageFrom(DOMString url);
//     bool allowsMediaFrom(DOMString url);
//     bool allowsObjectFrom(DOMString url);
//     bool allowsPluginType(DOMString type);
//     bool allowsScriptFrom(DOMString url);
//     bool allowsStyleFrom(DOMString url);
//     bool isActive();
// };
var SecurityPolicy = csp.SecurityPolicy = inherit({

  initialize: function(policyStringOrPolicy, baseUrl) {
    // Initialize the following properties:
    //    defaultSrc
    //    scriptSrc
    //    objectSrc
    //    styleSrc
    //    imgSrc
    //    mediaSrc
    //    frameSrc
    //    fontSrc
    //    connectSrc
    //    formAction
    //    sandbox
    //    scriptNonce
    //    pluginTypes
    //    reportUri
    SecurityPolicy.directives.forEach(function(directive){
      this[toCamelCase(directive)] = new PolicyDirective(directive);
    }, this);

    this.baseUrl = baseUrl;

    // We act as a copy constructor should we be passed an SP
    if ((policyStringOrPolicy instanceof SecurityPolicy) ||
        (typeof policyStringOrPolicy == "string")) {
      this._parsePolicy(policyStringOrPolicy+"")
    }
  },

  _parsePolicy: function(policy) {
    var clauses = policy.split(";")
    clauses.forEach(function(clause) {
      var terms = clause.trim().split(/[\s\t]+/);
      if (!terms.length) return;
      var directive = toCamelCase(terms.shift());
      var prop = this[directive];
      if (prop instanceof PolicyDirective) {
        prop.set = true;
        prop.sourceList = terms;
      }
    }, this);
  },

  toString: function() {
    var r = [];
    SecurityPolicy.directives.forEach(function(d) {
      var prop = this[toCamelCase(d)];
      if (prop && prop.set) {
        r.push(prop.toString());
      }
    }, this);
    // console.log(r.join("; "));
    return r.join("; ");
  },

  _allowsFromSet: function(type, set) {
    for (var x = 0; x < set.length; x++) {
      if (set[x].set) {
        return (set[x].sourceList._has(type));
      }
    }
    return true;
  },

  _allowsUrlFromSet: function(url, set) {
    if (!this.baseUrl) throw new Exception("No baseUrl set!");

    var base = this.baseUrl;
    for (var x = 0; x < set.length; x++) {
      if (set[x].set) {
        return matchSourceExpressionList(base, set[x].sourceList, url);
      }
    }
    return true;
  },

  // FIXME: this should be an attribute getter
  get allowsEval() {
    return this._allowsFromSet("'unsafe-eval'",
                               [this.scriptSrc, this.defaultSrc]);
  },

  get allowsInlineScript() {
    return this._allowsFromSet("'unsafe-inline'",
                               [this.scriptSrc, this.defaultSrc]);
  },

  get allowsInlineStyle() {
    return this._allowsFromSet("'unsafe-inline'",
                               [this.styleSrc, this.defaultSrc]);
  },

  allowsConnectionTo: function(url) {
    return this._allowsUrlFromSet(url,
                                  [this.connectSrc, this.defaultSrc]);

  },

  allowsFontFrom: function(url) {
    return this._allowsUrlFromSet(url,
                                  [this.fontSrc, this.defaultSrc]);
  },
  allowsFormAction: function(url) {
    return this._allowsUrlFromSet(url,
                                  [this.formAction, this.defaultSrc]);
  },

  allowsFrameFrom: function(url) {

  },
  allowsImageFrom: function(url) {

  },
  allowsMediaFrom: function(url) {

  },
  allowsObjectFrom: function(url) {

  },
  allowsPluginType: function(type) {

  },
  allowsScriptFrom: function(url) {

  },
  allowsStyleFrom: function(url) {

  },
  // FIXME: this should be an attribute getter
  isActive: function() {

  },

});

// Merging SecurityPolicy instances *weakens* the overall policy. For the most
// restrictive subset, see SecurityPolicy.intersection(...)
SecurityPolicy.union = function(/*...varArgs*/) {
  var p = new SecurityPolicy();
  var varArgs = Array.prototype.slice.call(arguments, 0).map(function(a) {
    return new SecurityPolicy(a);
  });

  varArgs.forEach(function(arg) {
    SecurityPolicy.directives.forEach(function(d) {
      var propName = toCamelCase(d);
      var prop = arg[propName];
      if (prop && prop.set) {
        prop.sourceList.forEach(function(origin) {
          // FIXME(slightlyoff): we should be smarter when merging policies
          // here. What we really want to konw is is the URL/source in question
          // not already allowed?". If not, we want to add it.
          if (p[propName].sourceList._has(origin)) {
            p[propName].sourceList.push(origin);
          }
        });
      }
    });
  });

  return p;
};

SecurityPolicy.intersection = function(/*...varArgs*/) {
  var varArgs = Array.prototype.slice.call(arguments, 0).map(function(a) {
    return new SecurityPolicy(a);
  });
  var baseline = varArgs.shift();

  // We baseline our union on the first policy and subtract from there.
  var p = new SecurityPolicy(baseline);

  if (!varArgs.length || !baseline) {
    return p;
  }

  varArgs.forEach(function(arg) {
    SecurityPolicy.directives.forEach(function(d) {
      var propName = toCamelCase(d);
      if (!p[propName].sourceList.length) return;
      // Leave only common values
      var prop = arg[propName];
      if (prop && prop.set) {
        prop.sourceList.forEach(function(origin) {
          if (p[propName].sourceList._has(origin)) {
            p[propName].sourceList.push(origin);
          }
        });
      }
    });
  });

  return p;
};

SecurityPolicy.headerList = [
  "X-WebKit-CSP",
  "X-Content-Security-Policy",
  "Content-Security-Policy",
  // If a site sends us a "Report-Only" directive, we enforced it.
  "X-WebKit-CSP-Report-Only",
  "Content-Security-Policy-Report-Only",
  "X-Content-Security-Policy-Report-Only"
];

SecurityPolicy.directiveReservedValues = [
  "'none'",
  "'self'",
  "'unsafe-inline'",
  "'unsafe-eval'"
];

SecurityPolicy.directives = [
  "default-src",
  "script-src",
  "object-src",
  "style-src",
  "img-src",
  "media-src",
  "frame-src",
  "font-src",
  "connect-src",
  "form-action",
  "sandbox",
  "script-nonce",
  "plugin-types",
  "report-uri"
];

})(this);
