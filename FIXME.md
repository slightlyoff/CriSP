TODO:
  * implement CSP header setting
  * implement CSP header merging
  * impmlement CSP union/intersection
  * implement connection tracking
  * implement preference page
    - Controls to allow/dissalow major CDNs & 3rd-party scripts (ga.js, jq...)
    - A configurator for your default policy
  * implement in-page notification of what is being blocked
    - A learning mode listener would tell us what was blocked
  * implement setting synchronization
  * add logo (photo of a lone potato chip?)
  * figure out how to enable parsing/using the meta-tag version
    - is it even implemented in WK yet?
  * add some sort of policy for sandboxing all iframes...do we need to do this
    with Mutation Observers?
  * add a "learning mode" to prevent total bustage on naive sites
    - Implement a local learning mode listener?
  * Move test to something modern and Node based (Mocha?)

DONE:
  * implement CSP rule parser
