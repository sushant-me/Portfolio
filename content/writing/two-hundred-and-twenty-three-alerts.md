---
title: Two hundred and twenty-three alerts, and the ones I would not close
date: 2026-10-29
summary: GitHub's own records say 223 Dependabot alerts were fixed on this account on 28 and 29 October 2026 — 17 critical, 101 high, 92 medium, 13 low. That is not self-reported: each alert carries a…
source: https://github.com/sushant-me/writeups/blob/main/2026-10-29-two-hundred-and-twenty-three-alerts.md
---

GitHub's own records say **223 Dependabot alerts were fixed on this account on 28 and 29
October 2026** — 17 critical, 101 high, 92 medium, 13 low. That is not self-reported: each
alert carries a `fixed_at`, and `GET /repos/{owner}/{repo}/dependabot/alerts?state=fixed`
will reproduce the count.

**29 remain open. None is critical.** Three of them will stay, and this is about the two
hundred others: the ones where the fix was obvious, and the ones where the obvious fix was
wrong.

## Read the advisory, not the package name

The last high alert in one of my own projects was on `@nestjs/platform-express`. I treated
that as "the framework needs upgrading", and the framework's next major is **ESM-only**, so
the attempted fix was a module-system migration. Installing `@nestjs/*` 12 made `nest build`
pass and **all 65 test suites fail at import with zero tests run**, because the app is
CommonJS. I reverted it and recorded "needs an ESM migration" in my ledger.

That note was wrong. The advisory, opened rather than skimmed, was about **multer** — and
the reason the earlier root-level `multer` bump had not cleared it was a nested copy:

```
node_modules/@nestjs/platform-express/node_modules/multer: 2.4.0   ← the alerted copy
node_modules/multer:                                   2.5.0       ← what I had bumped
```

Nest pins its own multer. A targeted override moves that copy and nothing else:

```json
"overrides": { "@nestjs/platform-express": { "multer": "^2.5.0" } }
```

`npm install` will not re-resolve an existing lock entry, so the lock was regenerated. The
result: one multer at 2.5.0, `package.json` gains only the override, no direct dependency
version changes, `npm run build` exits 0, and the suite is **65 suites / 94 tests passing**.
The alert closed without the migration I had convinced myself was required.

The lesson is not "check the advisory". It is that a hypothesis about a *cause* stops being
checked the moment it is written down as a conclusion.

## A major upgrade is not the only way to move a package

Two of the sweeps were the same shape: npm's suggested fix was a framework major, and the
vulnerable code was not in the framework.

**`postcss` under Next.** Four advisories, all `postcss 8.4.31`, reached transitively. npm
offered Next 16 — a framework migration to fix a stylesheet compiler. An `overrides` entry
pinning `postcss` to `^8.5.32` cleared all four, and the app still rendered: the export
built and the page loaded in Chromium with its MapLibre canvas, three controls and no worker
error.

**`form-data` under `request`.** Two criticals, one package, at `2.3.3` inside `request`'s
`~2.3.2` range. `form-data`'s fix is **2.5.4** — a patch. The parent's range was the whole
obstacle, so the override went on the parent, not on everything (axios bundles
`form-data` 4.x; a blanket override would have been a different, riskier change).

Both are the same discipline: the fix belongs at the level where the constraint is, and a
major upgrade is only correct when the vulnerable code is actually in the major.

## A lock cannot resolve past its own declared Python

Six alerts in a tutorial repository looked stale in the ordinary way, and the ordinary fix
failed for a reason worth naming: the `Pipfile` declared `python_version = "3.8"`, and
**Flask 3.x requires Python ≥ 3.9**. `pipenv lock` under the declared version cannot reach
the fixed releases — the version pin is part of the dependency graph, not metadata beside it.

Raising the declaration to 3.12 and re-locking produced `flask 3.1.3`, `werkzeug 3.1.9`,
`python-dotenv 1.2.4` — every one at its first patched version. Verified by running the
exercise: `pipenv install --deploy`, then `python -m server`, and the book list serves at
`http://127.0.0.1:5000/` with HTTP 200. Six alerts to zero.

## The ones I would not close

Twenty-eight remain in a GitHub Skills exercise about supply chains. They sit in
`code/src/AttendeeSite/package-lock.json`, the lockfile for a demo app whose dependencies
arrive through the deprecated `@azure/ms-rest-nodeauth → request` chain.

I nearly deleted them. The declared entry point, `provisionComposer.js`, **does not exist**
in the repository, and no source file imports any of those packages — so the entire list is
unreachable, and removing it would have taken the account to zero open alerts.

Then I read the exercise. Its first activity tells participants:

> Navigate to the **Code** tab and locate the `code/src/AttendeeSite` folder.
> Commit the following content … to the `package-lock.json` file as the last item on the
> `dependencies` map

That lockfile is the lesson. Deleting its dependency map to make a dashboard go green would
break the exercise and would be a number I had gamed rather than fixed. It stays, with the
reason written down, and the honest note that the only real remedy is porting a sample app
off a deprecated SDK — a rewrite of teaching material that is never executed, for no
security gain.

## What a number does not say

"223 fixed" does not mean 223 vulnerabilities were exploitable here, and "29 open" does not
mean 29 live problems. It means the manifests moved. What I can say with evidence is
narrower and more useful:

- the two projects where the fix was a build-tool major (vite 5→8, react-router 6→7) were
  **rendered in a browser**, not just built, and so was the MapLibre major before them
- the framework bump that was reverted was caught by **tests failing at import**, not by
  review
- the Nest project's final state passes **94 tests**, and the tutorial **serves its pages**
- every remaining alert has a written reason, including the one where the right answer was
  to leave the code alone

The full list of what is left is in the repositories' own Dependabot pages, which is where
it should be — the point of this post is not the number, it is that three of the fixes were
wrong the first time and the checks that caught them were cheap.
