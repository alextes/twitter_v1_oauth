# Twitter v1.1 OAuth

Helps build the authorization header for the twitter v1.1 API. _The library does not support the full v1.1 API!_

## Limitations
- Only the `GET` request method is supported.

## Usage
```ts
import { makeOAuthHeader } from "https://deno.land/x/twitter_v1_oauth/mod.ts";

fetch(
  "https://api.twitter.com/1.1/lists/members.json?list_id=1393929153997647873&count=500",
  {
    headers: {
      "Authorization": makeOAuthHeader(
        {
          baseUrl: "https://api.twitter.com",
          method: "GET",
          oauthAccessToken:
            "1366753588047978500-lOQ1dMdKnYmkuVMXEkPT2TfIQbE460",
          oauthConsumerKey: "IBt8XVwLWS8pNpYEDxLh2mp2M",
          oauthConsumerSecret: Deno.env.get("OAUTH_CONSUMER_SECRET")!,
          oauthTokenSecret: Deno.env.get("OAUTH_TOKEN_SECRET")!,
          pathname: "/1.1/lists/members.json",
          queryParameters: {
            count: "500",
            list_id: "1393929153997647873",
          },
        },
      ),
    },
  },
);
```
