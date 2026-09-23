#!/bin/sh
# Run the post check before every build, without betting the deploy on it.
#
# The check itself is Python because the rest of this repository's tooling is.
# Cloudflare Pages builds `npm run build`, and I cannot verify from here that its
# image ships python3. If it does not, a hard dependency would turn every deploy
# into a failure for a reason that has nothing to do with the site.
#
# So: run the check where the interpreter exists, and skip it loudly where it does
# not. Note the exit code is propagated rather than swallowed — a check that ran and
# found a problem must fail the build, and `check && echo ok || echo skipped` would
# hide exactly that.
set -e
here=$(dirname "$0")

if command -v python3 >/dev/null 2>&1; then
  exec python3 "$here/check-posts.py"
fi

echo "post check SKIPPED: python3 is not available in this environment" >&2
echo "  (the check did not run, so this build is not evidence that posts are well formed)" >&2
