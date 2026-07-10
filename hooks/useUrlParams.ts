"use client";

import { useSyncExternalStore } from "react";
import { useParams } from "next/navigation";

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getBrowserPathname() {
  return window.location.pathname;
}

function getServerPathname() {
  return null;
}

/**
 * Placeholder routes (e.g. /courses/0/modules/0/lessons/0/) are the only
 * static pages built for ids that didn't exist at build time — .htaccess
 * internally rewrites any unknown id to them. useParams() reflects the
 * static page that was actually served (all "0"s), not the real id in the
 * address bar. useSyncExternalStore lets us read the real browser pathname
 * once mounted on the client — falling back to useParams() (matching the
 * prerendered HTML) during the server/prerender snapshot so there's no
 * hydration mismatch.
 *
 * `pattern` must use plain (unnamed) capturing groups, in the same order
 * as `keys` — named groups are avoided because they require an ES2018+
 * TS target and this project targets ES2017.
 */
export function useUrlParams<T extends Record<string, string>>(
  pattern: RegExp,
  keys: readonly (keyof T)[]
): T {
  const staticParams = useParams<T>();
  const pathname = useSyncExternalStore(subscribeToLocation, getBrowserPathname, getServerPathname);

  if (pathname === null) return staticParams;

  const match = pathname.match(pattern);
  if (!match) return staticParams;

  return keys.reduce((acc, key, i) => {
    acc[key] = match[i + 1] as T[keyof T];
    return acc;
  }, {} as T);
}
