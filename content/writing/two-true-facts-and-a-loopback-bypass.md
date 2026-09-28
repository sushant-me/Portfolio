---
title: Two true facts I did not join up: an IPv6 loopback bypass in SunshineCTF's SiteCheck
date: 2026-09-28
summary: I spent six rounds on one 463-point web challenge getting the answer wrong, and the reason is worth more than the flag. Twice I measured something true, drew a correct conclusion from it, and then…
source: https://github.com/sushant-me/writeups/blob/main/2026-09-28-two-true-facts-and-a-loopback-bypass.md
---

I spent six rounds on one 463-point web challenge getting the answer wrong, and the
reason is worth more than the flag. Twice I measured something true, drew a correct
conclusion from it, and then used that conclusion to discard the actual vulnerability.
The challenge fell the moment I put the two facts next to each other.

The challenge was **SiteCheck** at SunshineCTF 2026. The flag is
`sun{fr4gm3nt3d_r3fl3ct10ns_1n_th3_futur3}`.

---

## The setup

SiteCheck is a web-diagnostics service. You register, and it offers one feature: give it
a URL and an "inspection drone" — a real headless Chrome — fetches it, times the load,
counts the resources, and returns a **viewport snapshot** at a fixed 1280×800.

The challenge text says the quiet part out loud:

> The drone politely refuses to inspect internal or local addresses. Safety first!

So it is an SSRF challenge. The flag is not in the fetching, though. It is on your own
personnel file, behind a clearance gate:

```html
<section id="clearance" class="dossier classified">
  <h2>Clearance Data <span class="stamp">CLASSIFIED</span></h2>
  <p>Restricted personnel token — visible only to holders of this file:</p>
  <div class="flag-plate">REDACTED · insufficient clearance</div>
</section>
```

Every account you can create is `Junior Inspector · Clearance BRONZE`.

## Wrong turn one: I found the bypass in round two and threw it away

The filter is a **string check on the host**, not a resolution check. `127.0.0.1`,
`localhost`, `127.1`, `0`, `2130706433`, `0177.0.0.1`, `0x7f000001` are all rejected.
`127.0.0.1.nip.io` sails through, because DNS resolves it to loopback while the string
is not an IP literal.

In the same pass I tested `http://[::1]/` and `http://[::ffff:127.0.0.1]/`. Both passed
the filter too. I wrote this down:

> `[::1]` also passes but nothing listens on those.

That sentence is *true*. Nothing listened on `[::1]:80`. And it is the reason I lost six
rounds — I tested the IPv6 loopback on the **default port**, found it empty, and
generalised "nothing listens there" to "this is not useful." I never tried `[::1]:3000`,
where the application itself was listening.

**A filter that only enumerates IPv4 spellings is not testing what it thinks it is.**

## Wrong turn two: I proved the drone was anonymous, and that was true and irrelevant

The stylesheet contains the author's own comments:

```css
/* instant anchor jumps: keeps the drone snapshot deterministic */
/* Spacers push the classified section well below the 800px snapshot fold. */
.spacer{height:520px}
.spacer.tall{height:820px}
```

That reads like a description of the intended solution: the flag is deliberately kept
out of the snapshot, *and* anchor jumps were made instant so a `#clearance` navigation
lands deterministically. I chased it for several rounds as "the drone must screenshot
`/profile#clearance` as an authenticated, cleared user."

Then I killed my own lead, properly. The drone has **no cookie jar** — I scanned a page
that sets a cookie, then scanned a page that echoes cookies, and the second snapshot
showed `"cookies": {}`. A fresh browser context per scan. Pointing it at `/profile` on
the public host, on `localhost.:3000`, on `127.0.0.1.nip.io:3000` and through an httpbin
redirect all rendered the **login page**, with and without a valid session on the
`/scan` request. Sending the drone's exact user agent (`SiteCheck-InspectionDrone/2062.1`)
with a real session still returned BRONZE.

So I concluded the snapshot lead was dead. **That conclusion was wrong**, and the error
was in the inference, not the measurement. I had shown the drone carries no cookie. I
had *not* shown the drone is untrusted. Loopback traffic was privileged server-side, so
the drone never needed a session at all.

## What I burned the other four rounds on

For completeness, because "I tried things" is not the same as "here is what is ruled
out" — every item below is a live measurement, not a guess:

- **60+ registration mass-assignment combinations** across `clearance`, `tier`, `level`,
  `rank`, `badge`, `role`, `clearanceLevel`, `clearance_level`, `isChief`, `isOmega`,
  with values `OMEGA`/`GOLD`/`SILVER`/`PLATINUM`/`4`. All BRONZE.
- **Session forgery.** `sc_session` is `<base64 uuid>.<HMAC-SHA256>`. No signature, empty
  signature, `.AAAA`, truncated, padded, raw UUID, swapped parts: all 302 to `/login`.
  ~518 candidate secrets × 9 message forms × {HMAC-SHA256/1/512/MD5, `H(k‖m)`, `H(m‖k)`}
  against a known id and signature: no match.
- **Prototype pollution** against a plain-object user store — the store *is* a plain
  object (the "already taken" check is `if (users[username])`, so `constructor` and
  `toString` are rejected as taken purely because they are inherited), but nothing moved
  clearance.
- **IDOR** on `/result/<id>` and `/screenshots/<uuid>.png`, **homoglyph/NFKC username
  collisions** (the charset is `[A-Za-z0-9_-]{3,24}`, so there is no collision to make),
  **JSON bodies** (400 — form-encoded only), **forwarded headers**, **UA spoofing**,
  **SSTI**, **SQLi**, **command injection**, **path traversal**, and a **route sweep in
  GET, OPTIONS, POST and PUT** that found nothing but `/dashboard` and `/Login`.

The one thing I would flag to anyone doing this kind of work: I found a reliable **DoS**
early and did not use it. Two `url` parameters make `req.body.url` an array, which throws
an unhandled `TypeError` inside the scan handler and **kills the Node process** (nginx
then returns 502, and because the user store is in-memory, every registered account
evaporates). It would have made a useful "fresh state" oracle. It was also a denial of
service against a box other teams were actively using, so I left it alone and noted it.

## The solve

```
POST /scan        url=http://[::1]:3000/profile#clearance
```

Three things happen at once, and each one is a fact I already had:

1. **`[::1]` passes the blocklist**, because the blocklist enumerates IPv4 spellings.
2. **The application's own loopback listener is trusted.** The request arriving over IPv6
   loopback is served as the built-in operator identity — the snapshot reads
   `Inspector: admin` / `Chief Inspection Drone · Clearance OMEGA` — so the restricted
   section renders **unredacted**.
3. **`#clearance` defeats the fold.** The fragment is never sent to the server; it only
   scrolls the browser. The 520px + 820px spacers that push the plate below the 800px
   snapshot are exactly what the author's comment described — and the anchor jump is
   what steps over them.

Then you fetch the snapshot from the result page (owner-scoped, like every scan
artifact) and read the flag out of it.

### Reproduction

```bash
T=https://spaceship.web.2026.sunshinectf.games
U=demo$RANDOM

curl -s -c jar -X POST "$T/register" -d "username=$U&password=Passw0rd!23"
# location: /result/<uuid>   ->  the report page
curl -s -i -b jar -X POST "$T/scan" \
     --data-urlencode 'url=http://[::1]:3000/profile#clearance'
# the report's <img src="/screenshots/<uuid>.png"> is the unredacted file
```

Two details that cost time and are easy to get wrong: the `#` must be sent **literally**
in the `url` field — percent-encoding it (`%23`) produces a 404 — and a naive helper that
does not share a cookie jar between `POST /scan` and `GET /result/<uuid>` gets a silent
302 to `/login` and returns nothing at all, which reads as "the route does not exist."

## A second solve, from a different direction

The event also had a zero-point physical track. One of those, *"This Code's Got Bars!
— 1-Dimensional and Patented!"*, is about a barcode, and every previous attempt had
assumed it needed the badge in your hand.

It did not. **The badge design files are public** — not in the `bsidesorlando` GitHub
org, which only carries the 2023 and 2025 badges, but under a separate org at
`badge-gallery/bsidesorlando-2026`. That repo has the full KiCad project, the JLCPCB
gerbers, and `hardware/uv_art.psd`.

One of that PSD's five layers is a **665×128 placed raster, and it is a Code 128
barcode**. Decoded two independent ways (`zbarimg` and `zxing-cpp`) to
`sun{ctf_r_4_h00m4n5}`.

The trap: the layer is *named* `sun{ctf_r_4_h00m4n5}.png`, so the obvious move is to
submit that string as the flag for the badge-layers challenge, which rejects it. The
barcode belongs to the barcode challenge. The layer name is the payload.

## The rule I took away

**Two true facts, not joined up, are how you lose an afternoon.** I knew the filter was
IPv4-only. I knew the app listened on 3000. I never put `[::1]` and `:3000` in the same
request, because I had already written down "nothing listens on IPv6" — from a test that
only covered port 80.

The generalisable version, which I think applies well beyond CTFs:

- **A denylist is a list of spellings, not a boundary.** Enumerating the ways to write
  `127.0.0.1` says nothing about `[::1]`, `[::ffff:127.0.0.1]`, or a DNS name that
  resolves to loopback. Test the *destination*, not the notation.
- **"The client is anonymous" does not imply "the request is untrusted."** I proved the
  drone had no session and treated that as proof it could not reach privileged state.
  Trust was attached to the peer address, not the credential. Those are independent, and
  I collapsed them.
- **A proof that a path is closed is only as wide as the test you ran.** "Nothing listens
  on IPv6" was one port on one host, and I wrote it as a general fact.

## Result

Team **nofear**, SunshineCTF 2026: **29/37**, finishing on the **maximum available score**
— level with first place on points, 92nd on the tie-break, which CTFd resolves by *when*
the score was reached. The eight unsolved challenges are the zero-point BSides Orlando
physical track (badge UART, books on a table, a dead drop, a venue FM broadcast, a Bingo
card) plus one hidden challenge with an entirely empty record.

I have written up the SiteCheck chain here rather than the flag alone because the flag
took twenty minutes and the six rounds of being wrong took a week.
