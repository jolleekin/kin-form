import type { DeepKey, DeepKeyOrRoot } from "./types.ts";

type User = {
  name: string;
  age: number;
  address: {
    line1: string;
  };
  fields: {
    code: string;
    value: string | number;
  }[];
};

type F<K extends DeepKey<User>> = K;

type Valid =
  | F<"name">
  | F<"address.line1">
  | F<"fields.1.code">
  // Array indices match TypeScript's `${number}` pattern, not `${bigint}` —
  // chosen so a plain `number` (e.g. a `.map((_, i) => i)` index) assigns
  // straight into a path template without a cast. That pattern also happens
  // to match a trailing "." with nothing after (TS's `${number}` accepts
  // "0." as well as "0"), so this resolves to the same "not found" outcome
  // `getIn`/`setIn` already give any other missing path — not a new runtime
  // risk, just a type marginally looser than `${bigint}` was.
  | F<"fields.0.">;

// @ts-expect-error - "" isn't a path *into* User; use DeepKeyOrRoot for that
type Invalid0 = F<"">;
// @ts-expect-error - "x" is not a top-level key of User
type Invalid1 = F<"x">;
// @ts-expect-error - trailing "." with nothing after
type Invalid2 = F<"fields.">;
// @ts-expect-error - double "."
type Invalid3 = F<"address..line1">;
// @ts-expect-error - "x" is not a key of the fields[] element
type Invalid4 = F<"fields.x">;
// @ts-expect-error - "x" is not a key of address
type Invalid5 = F<"address.x">;

type H<K extends DeepKeyOrRoot<User>> = K;

// "" means "this node itself" — only DeepKeyOrRoot accepts it.
type ValidRoot = H<"">;

// LeafTypeMap can be extended via declaration merging so that consumer-defined
// object types (e.g. `URL`, a `Money` class, ...) are treated as opaque leaves
// instead of having their own properties exposed as paths.
declare module "./types.ts" {
  interface LeafTypeMap {
    Url: URL;
  }
}

type Profile = {
  name: string;
  website: URL;
};

type G<K extends DeepKey<Profile>> = K;

type ValidLeaf = G<"website">;
// @ts-expect-error - URL is registered in LeafTypeMap, so it's a leaf now;
// its own properties (e.g. "protocol") are no longer reachable as paths.
type InvalidIntoLeaf = G<"website.protocol">;
