#!/bin/sh
# Assert the security headers and the RFC 9116 security.txt are actually in the
# build output, not just in the source tree.
#
# Why a separate check when CI already builds the site: the failure mode here is
# silent. public/_headers is only read by Cloudflare Pages from the output root
# (out/_headers), and public/.well-known/security.txt only exists on the live
# site if the static export copied a dot-directory out of public/. Both are
# things that can start failing without any file in the repository changing —
# a Next upgrade that stops copying dot-directories, or a rename of the output
# directory. The scan that asked for these files cannot see the repository, so
# nothing else would notice until the next external scan.
#
# Deliberately POSIX sh with grep: this must run in the same build that deploys
# the site, where an interpreter is not guaranteed (see prebuild.sh for the same
# reasoning about python3).
set -e
here=$(dirname "$0")
root=$(cd "$here/.." && pwd)
out="$root/out"

fail() {
  echo "security output check FAILED: $1" >&2
  exit 1
}

[ -f "$out/_headers" ] || fail "out/_headers is missing — Cloudflare Pages would serve no header rules at all"

for header in \
  "Strict-Transport-Security" \
  "X-Content-Type-Options" \
  "X-Frame-Options" \
  "Referrer-Policy" \
  "Permissions-Policy" \
  "Content-Security-Policy"
do
  grep -q "^  $header:" "$out/_headers" || fail "out/_headers does not set $header"
done

# The HSTS value is the part that matters: a header with max-age=0 is present and
# useless, and a short max-age is nearly so.
grep -q "^  Strict-Transport-Security: .*max-age=63072000" "$out/_headers" \
  || fail "HSTS is present but not pinned to max-age=63072000"

# frame-ancestors is what modern browsers enforce; X-Frame-Options alone is the
# legacy half of the pair the scan asked for.
grep -q "frame-ancestors 'none'" "$out/_headers" \
  || fail "Content-Security-Policy does not contain frame-ancestors 'none'"

[ -f "$out/.well-known/security.txt" ] \
  || fail "out/.well-known/security.txt is missing — the static export did not copy the dot-directory (see next.config.ts / public/)"

grep -q "^Contact:" "$out/.well-known/security.txt" \
  || fail "security.txt has no Contact field"
grep -q "^Expires: 20[0-9][0-9]-" "$out/.well-known/security.txt" \
  || fail "security.txt has no RFC 9116 Expires date"

echo "security output check OK: 6 headers on /*, HSTS pinned, frame-ancestors set, security.txt emitted" >&2
