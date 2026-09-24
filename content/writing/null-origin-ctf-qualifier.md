---
title: Null Origin CTF 2026 — Qualifier Writeup
date: 2026-09-18
summary: Team: roamers • Event: Null Origin CTF 2026 — Qualifier • Focus: Reverse engineering chain, web, and the methodology that got us there
source: https://github.com/sushant-me/writeups/blob/main/2026-09-18-null-origin-ctf-qualifier.md
---

Team: roamers • Event: Null Origin CTF 2026 — Qualifier (12h) • Focus: Reverse engineering chain, web, and the
methodology that got us there

What this writeup is. Not a victory lap — we finished sixteenth. What I want to document properly is how
the interesting ones fell, because two of them were solved by refusing to trust the tools, and one of them
took most of the event. If you're reading this to learn the approach rather than the answers, that's the part
worth your time.


1. The board, and how we read it

Null Origin dropped us into roughly fifty-eight challenges spread across web, crypto, pwn, reverse engineering,
forensics, steganography and OSINT. A good chunk of them were chained: the REV chain ran 21 through 27,
the forensics chain 14 through 20, and each stage handed you a flag that unlocked the next one. The last entry
in a chain was a meta challenge that wanted every earlier flag plus its own solution.

The first thing we did — before touching a single binary — was read the event's own data through the
platform's frontend. The challenge list, the point values, the attempt budgets and the real end time were all
sitting in the same API calls the browser was already making. Two things came out of that immediately: a
ranking we could actually work against, and the realisation that the published end time and the platform's end
time were not the same number. We wrote the platform's value down and checked it again as the deadline
approached.

That sounds like housekeeping. It isn't. We lost a 3,000-point challenge later in the event purely through
handling, not through difficulty, and every one of those losses traces back to something we didn't establish
early enough.


2. Ouroboros — when the binary tells you the answer

Ouroboros (REV, 650) shipped as a keygen-me. The obvious move is to reverse the checker and build a key
generator. We did start there, and it was slow.

What actually broke it open was stepping back and asking a different question: what is this program comparing
against? The shipping binary contains a small verify routine that does exactly one thing:

# the whole check, in spirit
hex( SHA256( argv[1] ) )      ==   <ascii constant at file offset 0x89078>


That constant is the SHA-256 of the correct flag, written out as ASCII. Which means the binary doesn't need to
be reversed at all — it needs to be searched. And once you accept that, the second half falls out on its own:
this family of challenges hides the flag text as the author's own success banner, sitting in .rodata .
  # the flag body was sitting here the whole time
$ strings -t x ./verify | grep -i -E 'correct|wrong|rejected'
    48c353 you_found_where_it_eats_its_own_tail


Null0rigin{you_found_where_it_eats_its_own_tail}


One detail worth flagging, because it's the kind of trap that eats an hour: the shipped ./ouroboros binary
prints rejected even for the correct flag. There's a planted branch that branches on VMX/SVM support and lies
to you. The real checker is verify , and the real answer was never in ouroboros at all.


Takeaway
Before reversing logic, mine the strings and the data around them. Two habits paid for themselves
repeatedly on this board: grep the binary for a hex(SHA256(...)) constant — that's an offline oracle you
can test candidates against without spending a single submission — and read the .rodata region around
the success and failure messages, because that is where authored flag text lives. And never run the
author's own verify binary for guesswork: several of them self-lock after a few wrong answers and drop
a .strikes file next to themselves.


3. Hourglass — the meta, and the one that took the event

Hourglass (REV, 1000) was the seventh and final link in the reverse engineering chain. It arrived as three files:
a 912 KB hourglass binary, hourglass.kernel , and a 12.6 MB machine-image.bin . It refused to run.

The reason was mundane — qemu-system-x86_64 simply wasn't installed on the machine. So step one
wasn't reversing, it was getting the challenge to boot at all. Once QEMU was in place with the right firmware,
the picture changed completely:

$ ./hourglass <candidate> <password> <f21,f22,f23,f24,f25,f26>
    HOURGLASS prefix=.. final=.. nest=.. completion=.. tsc=..


Four arguments, comma-joined flags from the six earlier stages, and a kernel that boots and talks back. That
output line became our compass for the rest of the night.


The gate nobody was checking
Each layer has a gate. Structurally it's this:

F_j:   crypt <- sha512_crypt( argv[2], stage_salt )
compare    SHA256( "<stage>/vm/key|" + crypt )      ==   rodata_constant


Which looks like a normal password check, and isn't. The shadow hash is never actually compared — only
its salt is used. That single observation collapses the search space: you don't need the password, and roughly
one in eighty-one arbitrary passwords sails through the gate anyway.
For the earlier stages in the chain, the correct crypt string is embedded in the binary, byte-identical to the
shipped <stage>.shadow file. Hourglass is the exception — it has no embedded crypt string, which is
precisely why it's the meta. So we injected the shadow's own crypt string under GDB and let the gate pass on
its own terms:

# break after the crypt call, restore the buffer the gate expects
$ gdb ./hourglass
(gdb) b *0x40188f
(gdb) run
(gdb) set {char[128]} $rsp+0x360 = "<shadow crypt string>"
(gdb) continue


Seed delivery, and how to tell the real chain from the decoy
Layer seeds land at $rsp+0x1a0 + 32n , with per-layer bit lengths of 224, 256, 192, 208 and 320. The accept
test for each layer is GF(2)-linear — a splitmix64 keystream XORed against the candidate, reduced by parity
— which means it's solvable rather than brute-forceable:

KS_i   = splitmix64( xor of the 4 LE u64 of SHA256( t_n || le64(k) || le64(i) ) )
acc_i = XOR_j parity( KS_i[j] & X_n[j] )
accept iff acc_i == bit_i(T)


The important part is the signature of the genuine chain, because this challenge ships a decoy path that
feeds you a taunt flag:

all six layers use seed set A,
SHA256(t_n) == R_n[0:32] holds at every layer, and

all GF(2) systems come back full rank, zero free variables.

Anything else — a partial digest match, layer 1 on set A but layer 3 on set B — is the decoy. It will happily print
something flag-shaped at you. It is not the flag.

And the final piece: layer 5's X_5 is the raw candidate. Not a hash of it, not a transform — the candidate itself
is the flag. Once the chain verified clean, that was the answer.


Null0rigin{you_were_the_input_all_along}


There's an anti-debug layer too, and it's worth knowing about before you spend an hour confused: F_n may
hash its own .text region, so a breakpoint or a patch changes the value it's checking. Either trampoline into
executable padding outside the self-hashed range, or rename the TracerPid: probe string — which sits
outside the hashed region — and model the tracer as zero.


Takeaway
Read what a check actually consumes before you attack it. This gate looked like a password comparison
and was really a hash-of-a-hash with a salt side-channel; the "password" was never load-bearing. Also:
when a challenge ships a decoy path, find the invariant that distinguishes real from fake — here it was a
   three-part signature (seed set, digest match at every layer, full-rank systems) — and check that invariant
before you believe any output, including your own.


4. Broken Crown — a signing oracle wearing a costume

Broken Crown (Web, 200) presented an automated token issuance and verification service. The instinct is to
attack the login. The login is a decoy.

Two endpoints mattered:

/sign — an unrestricted RS256 signing oracle over the real key. It copies the kid from your request

       verbatim and signs whatever payload you hand it.
/verify — returns the flag when the verified payload carries the reserved claim scope == "root" ,

       matched exactly.

So there's no crypto to break. You ask the service to sign a payload claiming root, and then present it back to
the same service that just signed it.

# ask the oracle for exactly what you need
POST /sign    { "payload": { "scope": "root" } }
# then present it
POST /verify { "token": "<signed token>" }               -> flag


The endpoint that returns 500s — /token — is a decoy. It's there to look like the broken thing you're meant to
fix.


Null0rigin{jwk_kid_oracle_crown_31ef}


Takeaway
A signing endpoint you don't control the input to is an authorization bypass with extra steps. Before
attacking key material, ask whether the service will simply sign the claim you want. And treat the loudest
broken endpoint as hostile until proven otherwise — on this board the 500-ing route was bait every time.


5. Ghost Protocol — the block that wasn't a block

Ghost Protocol (Web, 200) was described as a hardened edge gateway in isolation. The reconnaissance that
mattered was on the query parameters, not the headers.

GET /asset?name=<url> performs an unfiltered server-side fetch. The filtering people trip over lives
somewhere else entirely — the internal substring block exists only on /edge 's X-Route header, not on the
request parameter you're actually using. Everyone who found the block assumed it applied globally and went
looking for a bypass for a filter that wasn't in the way.
The internal route is also /internal/secret , not the /internal/flag people guess first. Minimal repro:

curl "https://ghost-protocol-alyd.onrender.com/asset?
name=http%3A%2F%2Flocalhost%3A10000%2Finternal%2Fsecret"


One more misdirection worth recording, because it cost real time: responses occasionally come back queued .
That reads like a blocklist and isn't. It's the in-memory queue state of keys that were POSTed to /edge — the
service is telling you about its own backlog, not rejecting you.


Null0rigin{ghost_smuggling_cache_blind_ssrf_9a71}


Takeaway
Locate the filter precisely before you try to bypass it — which endpoint, which parameter, which header.
Half the "bypass" work on this challenge was wasted attacking a control that never applied to the request
being sent. And when a strange status word shows up, read it as state rather than as a verdict.


6. What actually cost us, and what I'd do differently

We finished sixteenth with thirty-five of fifty-five challenges solved. The gap to the qualifying cut was about two
thousand points, and it's worth being specific about where those points went, because none of them were lost
to unsolvable problems.

Loss                                What actually happened

~3,000 pts                          A login-protected challenge had a credential we'd recovered. We tested
account lockout                     candidates in a burst instead of establishing the right one first. Every failed
attempt extended the lock, the lock re-armed on the next request after it expired,
and the windows grew each time. By the time we understood the mechanism, the
lock ran past the end of the event. The challenge was fully solved on paper and
                                     scored zero.

~4,600 pts                          An eight-stage crypto chain turned out to be gated end to end by a key-loading
missing artifact                    routine that shipped in none of the distributed files. Every stage looked nearly
solved. We proved the situation rather than assuming it — 16,693 candidate
strings hashed against all eight stage digests, zero matches — but by then the
event was nearly over. Recognising an incomplete challenge in the first hour
                                     instead of the tenth was the lesson.

time                                We worked to an end time we'd inferred rather than one we'd read. The platform's
assumed deadline                    value was different. Read the window from the event itself, write it down, and re-
                                     check it as the close approaches.


What I'd keep
   Mine before you reverse. Banner strings in .rodata , and embedded hex(SHA256(flag)) constants as
free offline oracles.

Prove the challenge is solvable before investing. "This looks nearly done" and "this can be finished" are
different claims.

One attempt at anything with a lockout. Waiting doesn't restore the attempt — it re-arms the lock. The
only attempt worth making is one you're confident in.
Verify before submitting. A wrong flag is an ordinary loss. A confident invented one is worse than a wrong
guess.


The honest summary
Sixteenth place, and I can name the exact three things that decided it — all of them handling, none of
them cryptography. The solves I'm proudest of here aren't the clever ones; they're the two where we
stopped trusting a tool and asked what it was actually doing. Ouroboros fell when we stopped reversing
and started reading. Hourglass fell when we noticed the gate was checking a hash nobody compared.


Team: roamers • Event: Null Origin CTF 2026 — Qualifier • Flags documented: 25-ouroboros, 27-hourglass, Broken
Crown, Ghost Protocol

Reverse Engineering       Web      Chained Challenges         QEMU     GDB       JWT      SSRF       Hash Oracle


All flags shown were accepted by the scoring platform during the event. Technical details are reproduced from the working notes
kept while solving — offsets, breakpoints and invariants are as recorded at the time. Thanks to the Null Origin organisers and Team
CyberXoX for a board that rewarded reading things carefully.
