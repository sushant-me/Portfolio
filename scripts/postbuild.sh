#!/bin/sh
# Check the emitted output for dead internal links, without betting the deploy on
# the interpreter being present. Same reasoning as prebuild.sh: the check is Python
# because the rest of the tooling is, and Cloudflare's image is not something this
# repository can verify. Skip loudly rather than hard-fail on a missing interpreter.
# The exit code is propagated, so a check that ran and found a problem does fail.
set -e
here=$(dirname "$0")

# Runs first and unconditionally: it is POSIX sh + grep, so there is no
# interpreter to be missing, and a build that lost the security headers should
# fail here rather than after the deploy. See the script for why this can only
# be checked in the output tree.
sh "$here/check-security-output.sh"

if command -v python3 >/dev/null 2>&1; then
  # Sequential rather than `exec`, because both checks have to run: linking and
  # search. A failure in either still fails the build through `set -e`.
  python3 "$here/check-links.py"
  exec python3 "$here/check-seo.py"
fi

echo "output checks SKIPPED: python3 is not available in this environment" >&2
echo "  (the link and SEO checks did not run, so this build is not evidence that" >&2
echo "   links resolve or that the pages are well described)" >&2
