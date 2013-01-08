// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by an Apache-style license that can be
// found in the LICENSE file.

"use strict";

// FIXME(slightlyoff): Fetch the default policy from storage/preferences.
//  chrome.storage.sync.set({defaultPolicy: defaultPolicy}, function() {});
//  chrome.storage.sync.get(["defaultPolicy"], function(items) {});

var HEADER_NAME = "X-WebKit-CSP";

// FIXME(slighltyoff): stub for now!

var policyTypes = {
  promsicuious:
    "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:;",
  ssl:
    "default-src https:; script-src https: 'unsafe-inline'; style-src https: 'unsafe-inline'",
};
var defaultPolicy = new csp.SecurityPolicy(policyTypes.promsicuious);

chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
    // Parse whatever policy has been sent, merge it with our preferred policy,
    // and set the union as the new CSP

    // FIXME: should we try to be case-insenstitive here?
    var cspHeaders = [];
    var headers = [];
    details.responseHeaders.forEach(function(h) {
      ((csp.SecurityPolicy.headerList.indexOf(h.name) != -1)
        ? cspHeaders : headers).push(h);
    });
    if (cspHeaders.length) {
      var policies = cspHeaders.map(function(h) { return h.value; });
      policies.unshift(defaultPolicy.policy);

      var merged = csp.SecurityPolicy.merge.apply(null, policies);
      // console.log("enforcing merged policy:", merged.policy);
      headers.push({
        // FIXME: should this be unprefixed now?
        name: HEADER_NAME,
        value: merged.policy,
      });
    } else {
      // console.log("enforcing default policy:", defaultPolicy.policy);
      headers.push({
        // FIXME: should this be unprefixed now?
        // name: "X-Content-Security-Policy",
        name: HEADER_NAME,
        value: defaultPolicy.policy,
      });
    }
    return { responseHeaders: headers };
  },
  // filters
  {
      urls: ["<all_urls>"],
      // May be:
      //   ["main_frame", "sub_frame", "stylesheet",
      //    "script", "image", "object",
      //    "xmlhttprequest", "other"]
      //
      //  We only want to advertise CSP policy for the top-level and iframe
      //  navigations.
      types: ["main_frame", "sub_frame"]
  },
  // extraInfoSpec
  [ "responseHeaders", "blocking"]
);

// onBeforeRequest:
//    We add a header to denote the CSP policy we'll enforce based on
//    the user's preferences unless the site sends one.
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(info) {
    info.requestHeaders.push({
      name: "X-CriSP-Enforced-Policy",
      value: defaultPolicy.toString()
    })
  },
  // filters
  {
    urls: ["<all_urls>"],
    // May be:
    //   ["main_frame", "sub_frame", "stylesheet",
    //    "script", "image", "object",
    //    "xmlhttprequest", "other"]
    //
    //  We only want to advertise CSP policy for the top-level and iframe
    //  navigations.
    types: ["main_frame", "sub_frame"]
  },
  // extraInfoSpec
  [ "requestHeaders", "blocking" ]
);


/*
chrome.webRequest.onCompleted.addListener(function(object details) {...});

  Fired when a request is completed.

Listener Parameters

details ( object )

tabId ( integer )

  The ID of the tab in which the request takes place. Set to -1 if the request
  isn't related to a tab.

parentFrameId ( integer )

  ID of frame that wraps the frame which sent the request. Set to -1 if no
  parent frame exists.

fromCache ( boolean )

Indicates if this response was fetched from disk cache.

url ( string )

ip ( optional string )

  The server IP address that the request was actually sent to. Note that it may
  be a literal IPv6 address.

statusLine ( optional string )

  HTTP status line of the response.

frameId ( integer )

  The value 0 indicates that the request happens in the main frame; a positive
  value indicates the ID of a subframe in which the request happens. If the
  document of a (sub-)frame is loaded (type is main_frame or sub_frame), frameId
  indicates the ID of this frame, not the ID of the outer frame. Frame IDs are
  unique within a tab.

requestId ( string )

  The ID of the request. Request IDs are unique within a browser session. As a
  result, they could be used to relate different events of the same request.

timeStamp ( double )

  The time when this signal is triggered, in milliseconds since the epoch.

responseHeaders ( optional HttpHeaders )

  The HTTP response headers that were received along with this response.

type ( enumerated string ["main_frame", "sub_frame", "stylesheet", "script",
                          "image", "object", "xmlhttprequest", "other"] )

  How the requested resource will be used.

method ( string )

  Standard HTTP method.

statusCode ( integer )

  Standard HTTP status code returned by the server.
*/
/*
chrome.webRequest.onHeadersReceived.addListener(function(object deails) {...});

  Fired when HTTP response headers of a request have been received.

Listener Parameters

deails ( object )

  tabId ( integer )

    The ID of the tab in which the request takes place. Set to -1 if the request
    isn't related to a tab.

  parentFrameId ( integer )

    ID of frame that wraps the frame which sent the request. Set to -1 if no
    parent frame exists.

  url ( string )

  timeStamp ( double )

    The time when this signal is triggered, in milliseconds since the epoch.

  statusLine ( optional string )

    HTTP status line of the response.

  frameId ( integer )

    The value 0 indicates that the request happens in the main frame; a positive
    value indicates the ID of a subframe in which the request happens. If the
    document of a (sub-)frame is loaded (type is main_frame or sub_frame), frameId
    indicates the ID of this frame, not the ID of the outer frame. Frame IDs are
    unique within a tab.

  requestId ( string )

    The ID of the request. Request IDs are unique within a browser session. As a
    result, they could be used to relate different events of the same request.

  responseHeaders ( optional HttpHeaders )

    The HTTP response headers that have been received with this response.

  type (
    enumerated string ["main_frame", "sub_frame", "stylesheet", "script", "image",
                      "object", "xmlhttprequest", "other"] )

    How the requested resource will be used.

  method ( string )

    Standard HTTP method.
*/