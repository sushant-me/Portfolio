import type { Metadata } from "next";
import HomeClient from "./HomeClient";

/**
 * The homepage is the one indexable page whose body must be a client component:
 * it is a long scroll experience built from `useState`, `useEffect`, scroll
 * listeners and a WebGL scene, none of which can run on the server. A client
 * component cannot export `metadata`, so this file stays a thin server wrapper
 * that owns the metadata and renders the client tree underneath it.
 *
 * The canonical matters more here than anywhere else on the site, because the
 * homepage is reachable as both `https://sushantpoudel2028.com.np` and
 * `https://sushantpoudel2028.com.np/`, and both currently answer 200. Every other
 * page publishes an absolute canonical of its own; without one here the root is
 * the only address on the site with no stated preference.
 */
export const metadata: Metadata = {
  alternates: { canonical: "https://sushantpoudel2028.com.np/" },
};

export default function Page() {
  return <HomeClient />;
}
