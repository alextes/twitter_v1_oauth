// deno-lint-ignore-file camelcase
import * as A from "https://deno.land/x/fun@v1.0.0/array.ts";
import * as O from "https://deno.land/x/fun@v1.0.0/option.ts";
import { pipe } from "https://deno.land/x/fun@v1.0.0/fns.ts";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";
import nonceCharPool from "./nonce_char_pool.ts";

const randomPick = <A>(pool: A[]): A =>
  pipe(
    pool,
    A.lookup(Math.floor(Math.random() * pool.length)),
    (item) => O.toUndefined(item)!,
  );

const buildNonce = () =>
  pipe(
    Array(32).fill(undefined),
    A.IndexedTraversable.map(() => randomPick(nonceCharPool)),
    (arr) => arr.join(""),
  );

// OAuth1's idea of RFC3986 uri encoding differs from JavaScript's.
const encodeOAuthUri = (str: string): string =>
  pipe(
    str,
    encodeURIComponent,
    (str) => str.replaceAll("!", "%21"),
    (str) => str.replaceAll("'", "%27"),
    (str) => str.replaceAll("(", "%28"),
    (str) => str.replaceAll(")", "%29"),
    (str) => str.replaceAll("*", "%2A"),
  );

export type MakeOAuthHeaderOptions = {
  baseUrl: string;
  pathname: string;
  queryParameters: Record<string, string>;
  oauthConsumerKey: string;
  oauthConsumerSecret: string;
  oauthAccessToken: string;
  oauthTokenSecret: string;
  method: "GET";
};

export const makeOAuthHeader = ({
  baseUrl,
  method,
  oauthAccessToken,
  oauthConsumerKey,
  oauthConsumerSecret,
  oauthTokenSecret,
  pathname,
  queryParameters,
}: MakeOAuthHeaderOptions) => {
  const params = {
    ...queryParameters,
    oauth_consumer_key: oauthConsumerKey,
    oauth_nonce: buildNonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: oauthAccessToken,
    oauth_version: "1.0",
  };

  return pipe(
    {
      ...params,
      oauth_signature: makeSignature({
        baseUrl,
        method,
        oauthConsumerSecret,
        oauthTokenSecret,
        params,
        pathname,
      }),
    },
    Object.entries,
    A.map(([key, value]) =>
      `${encodeOAuthUri(key)}="${encodeOAuthUri(value)}"`
    ),
    (arr) => arr.join(", "),
    (str) => `OAuth ${str}`,
  );
};

type MakeSignatureOptions = {
  baseUrl: string;
  method: "GET";
  oauthConsumerSecret: string;
  oauthTokenSecret: string;
  params: Record<string, string>;
  pathname: string;
};

const makeSignature = (
  {
    baseUrl,
    method,
    oauthConsumerSecret,
    oauthTokenSecret,
    params,
    pathname,
  }: MakeSignatureOptions,
): string => {
  const parameterString = pipe(
    params,
    Object.entries,
    A.map(([key, value]) => [encodeOAuthUri(key), encodeOAuthUri(value)]),
    (kvPairs) => [...kvPairs].sort(([keyA], [keyB]) => keyA > keyB ? 1 : -1),
    A.map(([key, value]) => `${key}=${value}`),
    (strs) => strs.join("&"),
  );

  const sigBaseString = `${method}&${encodeOAuthUri(`${baseUrl}${pathname}`)}&${
    encodeOAuthUri(
      parameterString,
    )
  }`;

  const signingKey = `${encodeOAuthUri(oauthConsumerSecret)}&${
    encodeOAuthUri(
      oauthTokenSecret,
    )
  }`;

  const hash = hmac("sha1", signingKey, sigBaseString, "utf8", "base64");

  if (hash instanceof Uint8Array) {
    throw new Error("hashing function returned Uint8Array instead of string");
  }

  return hash;
};
