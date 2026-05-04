/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as games_roomPlayerGuesses from "../games/roomPlayerGuesses.js";
import type * as games_roomPlayerSubmissions from "../games/roomPlayerSubmissions.js";
import type * as games_roomStatePrompts from "../games/roomStatePrompts.js";
import type * as games_rooms from "../games/rooms.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as privateData from "../privateData.js";
import type * as roomStates from "../roomStates.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "games/roomPlayerGuesses": typeof games_roomPlayerGuesses;
  "games/roomPlayerSubmissions": typeof games_roomPlayerSubmissions;
  "games/roomStatePrompts": typeof games_roomStatePrompts;
  "games/rooms": typeof games_rooms;
  healthCheck: typeof healthCheck;
  http: typeof http;
  privateData: typeof privateData;
  roomStates: typeof roomStates;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
