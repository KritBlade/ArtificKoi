/* ============================================================================
 * globalLogic.cjs — Window B resolver (School v4).
 * Version: `const ENGINE_VERSION` below — the ONE place it is written. Bump it on every change.
 *
 * The deterministic game engine: the AI writes only /Intent/*; this code computes
 * every real consequence (affection, checks, clock, calendar, events, H growth).
 * Hosted by mvu-helper in a Worker (the page sees async proxies as globalThis.LogicEngine);
 * mvu-helper's turn runner calls resolveTurn after MVU applies the AI's <UpdateVariable>, every reply.
 * RES is the SOLE writer of the clock and of every EngineDerived field.
 *
 * THE CLOCK — GAME-TIME MODEL (fixed-offset timezone):
 *   World.Date/Weekday/Time   the scene's plain CIVIL datetime, prose-driven via
 *                             /Intent/sceneClock ("HH:MM" civil; a report earlier
 *                             than the clock beside /Intent/pastMidnight = ONE crossed
 *                             midnight, loudly logged; without it the report is dropped).
 *                             The clock NEVER rewinds.
 *   GameTime = CivilTime - 7:30 — a game-day is 00:00-23:59 in game time (= civil
 *                             07:30 -> next 07:29). civilToGame() is the ONE
 *                             conversion; bands are 5 contiguous game-day segments
 *                             (band 4 = the small hours = the OVERFLOW band: only
 *                             drifted into, never advanced into).
 *   EngineDerived.DayDate     WHICH game-day is being played — the calendar key
 *                             every day-identity reader uses (lookupDay, grade,
 *                             EventPack `Date` sugar). Written on every day-roll.
 *   daysOwed (derived, never stored) = gameDate(World.*) - DayDate. >=1 means the
 *                             prose left game-days behind (a time skip, a night
 *                             past 07:30, a hand-edited date). The SAME resolve
 *                             closes every owed day through settleDay() — the
 *                             catch-up; a daySwing on that reply pays the first
 *                             day closed, and nothing is ordered from narrate.
 *                             @Graduation stops the catch-up: an arc reset must
 *                             come from prose, so that day alone keeps an ORDER
 *                             (PendingState.DayEndOrderedFor).
 *   settleDay()               the ONE day-end path — voluntary sceneAdvance,
 *                             Next-Block, the block cap's evening advance and the
 *                             catch-up all run this body: pre-roll swing,
 *                             calendar consult (dated jump / TIME-LEAP / +1),
 *                             resume rule (prose already inside the landed game-day
 *                             keeps its clock, else the morning start — never
 *                             rewinds), grade, payday, neglect sweep.
 *   Mode                      pacing ONLY: SCHOOL (bands 0-3, block cap Sta/10
 *                             min 3, auto-advance) vs OPEN (uncapped). The payout
 *                             tier lives wholly in DayCheck (a FREE calendar row
 *                             reads DATEOUT, '-' pays nothing = SERIES-SWING).
 *   EngineDerived.DayCheckRoll  the day's ROLLED check "rawdie:N;mod:N;total:N;dc:N"
 *                             on a DAY_CHECK tier (ACADEMIC, SPORTS, CULTURE): PRE deals die ⑤ once,
 *                             RES freezes the four numbers at (2k), the day-end swing
 *                             pays deriveOutcome() of them and the narrator's token
 *                             only names the girl. '' until rolled; reset on every
 *                             day-roll.
 *   EngineDerived.BlockReplyCount  replies played in the current band AFTER the reply that
 *                             entered it: 0 on that reply, whether its own clock crossed
 *                             in or an advance moved it. Counts on OPEN days too.
 *                             PACING PRESSURE only — never a beat cursor.
 *   EngineDerived.IsClockAheadOfProse  true when an advance (block cap, sceneAdvance,
 *                             Next-Block, a day settle or calendar jump) left the clock
 *                             where this reply's prose never reached: the next reply must
 *                             OPEN there (<Block_Transition>'s handover, PRE's no-dice
 *                             gate). False when the prose's own clock is the clock.
 *   EngineDerived.LastStepDone  the day-spine STEP CURSOR "<band>.<step>" — the last step
 *                             of the contiguous run narrate's /Intent/stepDone dumps have
 *                             reported played (a step may span many replies, so a reply
 *                             counter can never stand in for this). Stored/clamped by the
 *                             genre-neutral applyStepDone (eventpack.cjs) — monotonic
 *                             within the day, never ahead of the clock's band; the
 *                             pointer = stored step + 1 when its band is current,
 *                             else the current band's step 1. Cleared by settleDay.
 *   EngineDerived.ClocklessStreak  consecutive resolves with no sceneClock report;
 *                             >=3 warns CLOCK PARKED (warn only, never act).
 *   /Intent/stepDone          "<band>.<step>[,…]" — a DUMP of the spine steps narrate's
 *                             prose played this reply, any order (omitted while the live
 *                             step is still running); applyStepDone sorts it. Applied after
 *                             the clock drift so the ahead-guard judges against the FINAL band.
 *
 * DICE are NOT here — an in-scene roll must precede the prose, so the d20 pool is
 * dealt on the PRE rail; RES verifies dies against the dealt pool and derives
 * outcomes from numbers, never trusting an AI-written verdict.
 * ========================================================================== */
(function (root) {
  'use strict';

  // ---- engine identity (GP3 §24). All three are STRING LITERALS, exported at the foot of this file:
  // mvu-helper reads them from the running module, and validates a not-yet-running artifact by reading
  // these same declaration lines. An indirection (`= someCall()`) cannot be read from source and so is
  // refused by design — the stance EVENT_PACK_ADAPTER's paths already take. ----
  //
  // WHICH BUILD this engine is. Identity only: it is reported, displayed and logged, never COMPARED.
  // Nothing may gate on it — an event pack gates on EVENT_PACK_FORMAT (grammar), a menu or plugin on
  // `exposes` and ENGINE_TYPE. Bump it on every change to this file; it is the ONLY place the version
  // is written, so there is no second copy to fall out of step with.
  const ENGINE_VERSION = 'v0.206.1';
  // WHICH GAME this is — the ONE name plugins branch on.
  const ENGINE_NAME = 'School';
  // WHICH FAMILY this engine belongs to, beside WHICH GAME it is. The two are not synonyms: a menu
  // built for any school-life game branches on the TYPE, while a plugin written for THIS game's
  // vocabulary branches on the NAME. They coincide here because School v4 is the first of its family;
  // an RPG backport would declare ENGINE_NAME 'FinalFantasy' with ENGINE_TYPE 'RPG'. Neither is a
  // compatibility verdict on its own — the pack's `exposes` map says where state actually lives.
  const ENGINE_TYPE = 'School';

  // ---- tuple helpers: stored values are [value, "Label"]; preserve the label ----
  const get = (t, d) => (Array.isArray(t) ? t[0] : (t === undefined ? d : t));
  const setVal = (obj, key, v) => {
    const cur = obj[key];
    obj[key] = Array.isArray(cur) ? [v, cur[1]] : [v, key];
  };
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  // ---- i18n (display localization) — storage/code hold the ENGLISH KEY; this maps a key to a per-language label
  // at the player-facing edges ONLY (the stat-menu binds through i18nLabel below). Node: require the authored table
  // (./i18n.cjs — its SIBLING in engine/). In the card, pack.json's engineOrder runs that file earlier in the same
  // script, setting root.__I18N_API__, and the fallback below reaches it.
  // Missing table/lang/key ⇒ the key itself (English fallback). Language = Preferences.Lang. ----
  let I18N_API = null;
  try { if (typeof require === 'function') I18N_API = require('./i18n.cjs'); } catch (_e) { /* browser: no require → prelude global */ }
  if (!I18N_API && root && root.__I18N_API__) I18N_API = root.__I18N_API__;

  // ---- event engine (Cluster 6C spine) — the genre-NEUTRAL WHEN-DSL grammar + scan tie-break + fire,
  // shared across genres and copied into engine/ as a LIBRARY member (event-pack-plan §6.5.1;
  // artifact-development-workflow §2.3). Same dual-mode as i18n:
  // Node/tests require it; in the card, engineOrder runs eventpack.cjs earlier in the same script and this
  // reads root.__EVENTPACK__. This engine holds no genre vocabulary — EVENT_PACK_ADAPTER below DECLARES
  // School's paths, writable roots, aliases and clock, and the library runs every pack on them. ----
  let EVENTPACK_API = null;
  try { if (typeof require === 'function') EVENTPACK_API = require('./eventpack.cjs'); } catch (_e) { /* browser: no require → prelude global */ }
  if (!EVENTPACK_API && root && root.__EVENTPACK__) EVENTPACK_API = root.__EVENTPACK__;
  // localize a bound stat_data value for DISPLAY. path = the field path (e.g. "Mood" / "World.Weather"); the last
  // segment picks the category; statData supplies Preferences.Lang. Non-enum field or no table ⇒ value unchanged.
  function i18nLabel(path, val, statData) {
    // NB no clock special-case here. v0.71 made this labeler translate World.Date/Time into civil form,
    // which was a workaround for display surfaces reading the CURSOR; v0.73 publishes World.Wall* for
    // exactly that and every surface reads it, so the workaround is deleted rather than left as a second
    // mechanism. A surface that still asks about World.Time gets it verbatim — extended hours and all,
    // which is honest: that field IS the internal cursor.
    if (!I18N_API) return val;
    const cat = I18N_API.catOf(String(path || '').split('.').pop());
    if (!cat) return val;
    const lang = get(((statData || {}).Preferences || {}).Lang, '');
    return I18N_API.labelOf(cat, String(val), lang);
  }

  // ---- surface a caught failure without aborting the turn (CLAUDE.md: NEVER hide a caught exception).
  // Routes through the browser's squadWarn (mvu-helper's MvuHelper.log: always-on, printed as
  // "[mvu-helper] [engine:game] [RES] …"); console.warn under Node/test, where no host is wired. Always-on warn is right:
  // both callers below degrade the DISPLAY only (the turn's state still resolves), so it's a warn, not an error. ----
  //
  // MOST CALLERS PASS NO ERROR OBJECT — they report a refused input or a broken expectation, not a catch.
  // Forwarding an absent `e` printed a bare "undefined" on the end of 25 of the 27 warn lines, which reads
  // like a value the engine failed to compute and sends the next reader looking for one. Only pass it on
  // when there is one.
  const warnRes = (ctx, e) => {
    try {
      const hasError = e !== undefined;
      if (root && typeof root.squadWarn === 'function') {
        if (hasError) root.squadWarn('[RES]', ctx, e); else root.squadWarn('[RES]', ctx);
      } else if (typeof console !== 'undefined' && console.warn) {
        if (hasError) console.warn('[RES] ' + ctx, e); else console.warn('[RES] ' + ctx);
      }
    } catch (_ignore) { /* EXPECTED: logging must never itself abort the resolve */ }
  };

  // ---- a NOTE is a warn nobody has to act on: it prints YELLOW like a warn (it is a gap in the data), but it
  // is GATED behind mvu-helper's `pipeline` debug domain, because it reports on quality, not on breakage. The
  // refusals below are always-on warns; a missing Biography is not an incident, it is something you want to see
  // only when you are already reading the turn. Silent when the extension is absent (a standalone card). ----
  const noteRes = (msg) => {
    try { if (root && typeof root.squadNote === 'function') root.squadNote('[RES]', msg); }
    catch (_ignore) { /* EXPECTED: logging must never itself abort the resolve */ }
  };

  // ---- a [PRE]-time line: pickSameRoundEvent runs on mvu-helper's PRE seam, before narrate and long before RES,
  // so its lines carry the PRE stage ("[mvu-helper] [engine:game] [PRE] …") on the `pipeline` debug domain. They
  // explain a verdict nobody has to act on, so they stay gated. Silent when the extension is absent. ----
  const notePre = (msg) => {
    try { if (root && typeof root.squad === 'function') root.squad('[PRE]', msg); }
    catch (_ignore) { /* EXPECTED: logging must never itself abort the pick */ }
  };

  // ---- <RES_Variable> audit block: diff before→after stat_data into JSONPatch-SHAPED ops (absolute values,
  // real paths) so the player can SEE the behind-the-scenes changes RES applied. Display-only: it has NO
  // <JSONPatch> tag, so MVU's parser (which extracts json_?patch) ignores it entirely — never re-applied. Skips
  // the transient /Intent namespace + MVU meta keys; new sub-objects (a built classmate) collapse to a marker. ----
  function diffOps(cur, prev, base, ops) {
    if (!cur || typeof cur !== 'object') return;
    for (const k of Object.keys(cur)) {
      if (k === '$meta' || k === '$internal' || k === '$key' || k === 'template') continue;
      if (k === 'AddClassmateArmedAt') continue;                  // #6 gate-liveness bookkeeping — not a player-facing stat
      if (k === 'CoActivityStatsToday') continue;                 // co-activity per-day cap bookkeeping — not a player-facing stat
      if (k === 'LastTrainingWeek') continue;                     // the week each kind of training session went — not a player-facing stat
      if (k === 'QuestStatPointsToday') continue;                 // quest-stat per-day cap bookkeeping — not a player-facing stat
      if (base === '' && k === 'Intent') continue;                 // transient bookkeeping — not a "real" stat change
      const a = cur[k], b = prev ? prev[k] : undefined;
      const path = base + '/' + k;
      if (Array.isArray(a) && a.length === 2 && (a[0] === null || typeof a[0] !== 'object')) {
        const bv = (Array.isArray(b) && b.length === 2) ? b[0] : undefined;
        if (b === undefined) ops.push({ op: 'add', path: path + '/0', value: a[0] });
        else if (bv !== a[0]) ops.push({ op: 'replace', path: path + '/0', value: a[0] });
      } else if (a && typeof a === 'object' && !Array.isArray(a)) {
        if (b === undefined) ops.push({ op: 'add', path: path, value: '...(record built by RES)...' });
        else diffOps(a, b, path, ops);
      }
    }
  }
  // The audit's BODY only. mvu-helper owns the tag around it and adds it: <RES_Variable> for the turn's
  // resolve, <RES_POST_Variable> for the POST relay's — two tags, because both blocks sit in one message
  // and list the same girl's Affection with different numbers. The card's regex pair minimizes them separately.
  function buildResBlock(before, after) {
    const ops = [];
    try { diffOps(after, before, '', ops); } catch (e) { warnRes('buildResBlock: diffOps threw — audit block omitted this turn (state still resolved)', e); return ''; }
    if (!ops.length) return '';
    return '[\n' + ops.map((o) => '  ' + JSON.stringify(o)).join(',\n') + '\n]';
  }
  const snapshot = (o) => { try { return JSON.parse(JSON.stringify(o)); } catch (e) { warnRes('snapshot: deep-clone threw — before-image unavailable, this turn\'s RES audit diff may be inaccurate', e); return null; } };

  // ---- mechanical tables (the numbers that left the prompt; social_system OUTCOME TABLES) ----
  // STAKES = affection swing by the narrator-declared DIFFICULTY tier, NOT by check type. Reward climbs /
  // penalty deepens as the tier rises. The BASE DC for each tier lives in Window A (the EJS ladder) — this
  // resolver only applies the OUTCOME. This is what separates intensity from channel: touch-face and grope
  // are both PhysicalRequest, but the narrator rates them Easy vs Extreme, so they land very differently.
  // An Extreme CritFail additionally trips ConflictActive (an overreach that blows up in your face).
  const STAKES = {
    Trivial:  { CritSuccess: 6,  Success: 3,  Failure: 0,  CritFail: -1  },
    Easy:     { CritSuccess: 9,  Success: 6,  Failure: 0,  CritFail: -2  },
    Moderate: { CritSuccess: 13, Success: 9,  Failure: -2, CritFail: -4  },
    Hard:     { CritSuccess: 19, Success: 13, Failure: -4, CritFail: -7  },
    Extreme:  { CritSuccess: 26, Success: 17, Failure: -7, CritFail: -12 },
  };
  const DIFFICULTIES = ['Trivial', 'Easy', 'Moderate', 'Hard', 'Extreme'];
  const DEFAULT_DIFFICULTY = 'Moderate';                 // an omitted/unknown difficulty resolves as Moderate

  // ── THE KEYED MICROFORMAT (v0.49.0) ────────────────────────────────────────
  // Engine-wide punctuation standard ("grammar A") — each separator has exactly ONE job:
  //   ','  separates ITEMS in a list        (as /Intent/initiative, /Intent/arrive already do)
  //   ';'  separates FIELDS within an item  (as /Intent/hact already does)
  //   ':'  separates KEY from VALUE         (everywhere)
  //   '|'  separates sub-parts of free text (as /Intent/quest, /Intent/recordEvent already do)
  // So one check reads: "target:Mitsuki;type:Probe;difficulty:Hard;rawdie:9;total:11;dc:17",
  // and several are ','-joined. /Intent/check was the one channel violating that table (it used
  // ';' as a LIST separator); this makes it conform.
  //
  // WHY KEYED. The format this replaces was positional, and position 3 was the Outcome — i.e. the
  // conclusion had to be written BEFORE the die, total and DC it depends on. A small model answered
  // first and back-filled numbers afterwards, so the numbers routinely contradicted the verdict
  // (live: 9 checks, 9 "Success", 4 of them impossible). Keys remove the ordering trap entirely and
  // make future fields additive instead of breaking every position after them.
  //
  // TOLERANT BY DESIGN, because the whole point is surviving a weak writer: keys are case-folded,
  // whitespace is ignored, unknown keys are skipped (forward compatibility), and an unkeyed FIRST
  // field is read as the target so the /Intent/hact habit ("Sui;act:…") cannot produce a failure.
  // A mangled field costs that one field — not the whole check, the way a broken JSON brace would.
  const parseKeyedFields = (item) => {
    const out = {};
    const parts = String(item).split(';').map((s) => s.trim()).filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      const at = parts[i].indexOf(':');
      if (at < 0) { if (i === 0) out.target = parts[i]; continue; }      // bare leader = target (hact shape)
      out[parts[i].slice(0, at).trim().toLowerCase()] = parts[i].slice(at + 1).trim();
    }
    return out;
  };

  // THE OUTCOME RULE — the single definition, and the reason the AI no longer declares a verdict.
  // A PURE function of three FROZEN numbers: it reads no stat_data, so it cannot drift between the
  // Window-A panel (which renders the player-visible line at prompt assembly) and RES (which applies
  // it after narrate). That state-independence IS the same-reply guarantee — see CLAUDE.md "Same
  // reply calculation protection". It is ALSO why `total` stays in the intent rather than being
  // re-summed here: the channel mod reads MainChar stats, and /Intent/training can move those during
  // this very resolve — a recomputed total could disagree with the one the player was already shown.
  // ⚠ current_variable_data.txt carries a byte-identical copy for the panel. Change one, change both.
  const deriveOutcome = (rawDie, total, dc) => (rawDie === 20 ? 'CritSuccess'
                                              : rawDie === 1  ? 'CritFail'
                                              : total >= dc   ? 'Success'
                                              : 'Failure');
  // ── THE DC RULE (v0.56.0) — PRE STATES JUDGEMENTS, THIS CODE DOES THE ARITHMETIC ─────────────
  // /Intent/check carries PRE's whole derivation, not just its answer: dcmod + base + traitfit +
  // hobbyfit + dc. Everything here is a pure function of those FROZEN fields and two constant
  // tables — it reads no stat_data, exactly like deriveOutcome(), so the DC printed in Window A's
  // panel and the DC RES resolves against cannot drift (CLAUDE.md "Same reply calculation
  // protection"). That state-independence is why the ladder does NOT move into this file: the
  // situational part of her dcmod reads Mood / Embarrassment / ConflictActive / Sociability, and narrate can
  // emit ops that move those before RES runs, so a live re-derive could contradict the number the
  // player was already shown.
  //
  // WHY IT EXISTS (live 2026-08-11): PRE reported `traitFit:"clash"` in its JSON verdict and then
  // applied the MATCH modifier to the number — Hard 17 − 2 = 15 where the ladder and its own
  // verdict demanded 17 + 2 = 19. Nothing caught it. The old format carried only the answer, so a
  // sign flip was indistinguishable from an honest DC, and the check that would have caught it
  // (CHECK DESYNC) had been retired in v0.49.0 for firing AFTER the prose was committed. A DC is
  // not a judgement — it is a lookup plus two signed deltas — so asking a small model to compute
  // it was asking for the one thing it is worst at while it had already told us every input.
  // The verdict WORD is what travels now (`traitfit:clash`), never the model's own signed number:
  // a number is self-consistent with whatever it was added to and therefore unverifiable, which is
  // precisely how the live bug hid.
  // ⚠ current_variable_data.txt carries a byte-identical copy for the panel. Change one, change both.
  const TIER_BASE_DC = { Trivial: 8, Easy: 11, Moderate: 14, Hard: 17, Extreme: 20 };
  // A DC never drops below this however far along she is: with the MainChar roll mod, DC 3 means only a
  // natural 1 misses — and a natural 1 is a CritFail anyway. So the floor keeps a stupid move losable
  // without ever making a sensible one a formality. <Social_check_system> states it to PRE verbatim, so
  // PRE's own dc and this one agree and the DC note stays quiet for a floored row.
  const DC_FLOOR = 3;
  const TRAIT_FIT_DELTA = { match: -2, clash: 2, neutral: 0 };
  // Returns the AUTHORITATIVE dc plus the contract breaks found getting there. Never throws, never
  // reads state. `notes` empty = PRE's own numbers agreed with the rules at every step.
  const resolveCheckDc = (f, difficulty) => {
    const notes = [];
    const dcMod = Number(f.dcmod), claimedBase = Number(f.base), hobbyFit = Number(f.hobbyfit);
    const traitFit = String(f.traitfit || '').trim().toLowerCase();
    const traitDelta = TRAIT_FIT_DELTA[traitFit];
    const base = TIER_BASE_DC[difficulty] + dcMod;
    if (claimedBase !== base) {
      notes.push('BASE: PRE read ' + claimedBase + ' off her ladder row but ' + difficulty +
                 ' at [dcmod ' + (dcMod >= 0 ? '+' : '') + dcMod + '] is ' + base + ' (wrong column?)');
    }
    // Out-of-contract hobby deltas are NAMED but still USED: the value is present and numeric, the
    // arithmetic below still verifies against it, and inventing a substitute would be this engine
    // covering for the PRE prompt's flaw rather than reporting it.
    if (hobbyFit !== 0 && hobbyFit !== -2 && hobbyFit !== -3) {
      notes.push('HOBBYFIT: ' + hobbyFit + ' is not one of 0 / -2 / -3 (used as written)');
    }
    const dc = Math.max(DC_FLOOR, base + traitDelta + hobbyFit);
    if (Number(f.dc) !== dc) {
      notes.push('DC: PRE wrote ' + Number(f.dc) + ' but ' + base + ' ' + (traitDelta >= 0 ? '+' : '') +
                 traitDelta + ' (traitfit ' + traitFit + ') ' + (hobbyFit >= 0 ? '+' : '') + hobbyFit +
                 ' (hobbyfit) = ' + dc + (dc === DC_FLOOR && base + traitDelta + hobbyFit < DC_FLOOR
                   ? ' (floored at ' + DC_FLOOR + ')' : ''));
    }
    return { dc, notes };
  };

  // THE CROSSING CHECK — the PhysicalRequest [PRE] rolls on the line that crosses into H while no H scene runs, for a girl
  // whose crossing roll is owed (isCrossingRollOwed; social_system-pre.txt PhysicalRequest). Its verdict, by the rules RES
  // scores every check with, decides three things one way: whether the latch opens before the narrator writes
  // (hBoundaryVerdict), whether her act that reply still owes its first-time gate die (buildHactSnapshot), and whether a
  // narrator "enter" for her is refused (RES, the H latch).
  // PURE, like deriveOutcome: { <Key>: outcome } for every resolvable PhysicalRequest in a ','-joined /Intent/check
  // value. A check missing a number or its derivation is left out, exactly as RES skips it.
  function physicalRequestOutcomes(checkStr) {
    const outcomes = {};
    for (const one of String(checkStr || '').split(',').map((s) => s.trim()).filter(Boolean)) {
      const f = parseKeyedFields(one);
      if (f.type !== 'PhysicalRequest' || !f.target) continue;
      const rawDie = Number(f.rawdie), total = Number(f.total);
      const isResolvable = [rawDie, total, Number(f.dc), Number(f.dcmod), Number(f.base), Number(f.hobbyfit)].every(Number.isFinite)
        && TRAIT_FIT_DELTA[String(f.traitfit || '').trim().toLowerCase()] !== undefined;
      if (!isResolvable) continue;
      const difficulty = DIFFICULTIES.find((d) => d.toLowerCase() === String(f.difficulty || '').trim().toLowerCase()) || DEFAULT_DIFFICULTY;
      outcomes[f.target] = deriveOutcome(rawDie, total, resolveCheckDc(f, difficulty).dc);
    }
    return outcomes;
  }
  const isWonOutcome = (outcome) => outcome === 'Success' || outcome === 'CritSuccess';
  // HER FIRST H WITH HIM — whether the line that crosses into H is rolled for her (user ruling 2026-10-29). Until an act
  // has landed on her in an H scene (every H experience field still 0), her yes to the scene is the crossing
  // PhysicalRequest; after it, and always for a Loyal_Puppy, his line opens the scene off hcue with no roll. Inside the
  // scene each act's own first time still takes its gate die (hactGateOwed).
  // ⚠ check_dc_dice-pre.txt mirrors this for its H SCENE line — Tools/test_check_dc_dice.cjs holds the two together.
  function isCrossingRollOwed(c) {
    if (!c || typeof c !== 'object' || String(get(c.RelationshipStage, '')) === 'Loyal_Puppy') return false;
    return Object.values(HEXP).every((field) => (Number(get(c[field], 0)) || 0) === 0);
  }
  // The crossing outcomes that count: physicalRequestOutcomes for the girls whose crossing roll is owed. A PhysicalRequest
  // on a girl past her first H with him is an ordinary check, never her yes to the scene.
  function owedCrossingOutcomes(CM, checkStr) {
    const outcomes = physicalRequestOutcomes(checkStr);
    const owed = {};
    for (const k of Object.keys(outcomes)) if (isCrossingRollOwed((CM || {})[k])) owed[k] = outcomes[k];
    return owed;
  }

  // MOOD stays keyed by TYPE — the flavor of the interaction (the magnitude does NOT live here; difficulty owns it).
  // 10 GENERIC social-intent channels. Compete = a contest — PHYSICAL→STR / MENTAL→INT (PRE picks the stat when it
  // rolls, the ONLY non-CHA path; it absorbed the old SchoolActivity's duel/sports/study-off). Confess = he asks her to
  // be his girlfriend: the ONE check that promotes, a WON one making a Dating or FWB girl his Girlfriend. Repair = the
  // RECONCILIATION check (a WON one clears ConflictActive). Probe = draw out her truth (a WON one gates a narrator
  // reveal via /Intent/record). Collaborative study/club/festival = a co-activity (mundane :CoStat), NOT a check.
  const TYPE_MOOD = {
    Flirt:            { CritSuccess: 'Loving',  Success: 'Playful', Failure: 'Embarrassed', CritFail: 'Irritated'   },
    Support:          { CritSuccess: 'Loving',  Success: 'Happy',   Failure: null,          CritFail: 'Anxious'     },
    Gesture:          { CritSuccess: 'Loving',  Success: 'Happy',   Failure: 'Embarrassed', CritFail: 'Embarrassed' },
    Persuade:         { CritSuccess: 'Happy',   Success: 'Happy',   Failure: 'Neutral',     CritFail: 'Irritated'   },
    Compete:          { CritSuccess: 'Excited', Success: 'Happy',   Failure: 'Irritated',   CritFail: 'Embarrassed' },  // contest: PHYSICAL→STR / MENTAL→INT (PRE picks)
    EmotionalRequest: { CritSuccess: 'Loving',  Success: 'Happy',   Failure: 'Anxious',     CritFail: 'Sad'         },  // a heavy emotional ask: a promise, a hard truth
    Confess:          { CritSuccess: 'Loving',  Success: 'Happy',   Failure: 'Anxious',     CritFail: 'Sad'         },  // asks her to be his girlfriend → promotes Dating/FWB
    PhysicalRequest:  { CritSuccess: 'Loving',  Success: 'Happy',   Failure: 'Embarrassed', CritFail: 'Embarrassed' },  // touch/kiss/intimacy ladder
    Repair:           { CritSuccess: 'Loving',  Success: 'Happy',   Failure: 'Anxious',     CritFail: 'Angry'       },  // apologize / make amends → clears ConflictActive on a win
    Probe:            { CritSuccess: 'Loving',  Success: 'Happy',   Failure: 'Neutral',     CritFail: 'Anxious'     },  // draw out her truth → gates a reveal
  };
  const MUNDANE_DELTA = { Exceptional: 6, Positive: 4, Neutral: 2, Negative: 0, Harmful: -3 };
  // STRAIN grades — the UNROLLED fall, and the mirror of MUNDANE_DELTA's loss side on purpose. The recorder
  // names the SIZE OF THE WOUND in a word; this table is the only place the number lives.
  //
  // WHY IT IS THIS SMALL. Strain is the one affection move that costs nothing to claim: no difficulty
  // tier, no dice, no check — the POST pass reads the finished prose and says so. An unrolled channel must
  // not outweigh a rolled one, so these sit on MUNDANE_DELTA's loss scale: the worst an unrolled read of a
  // scene can do is -3, shallower than a rolled Moderate CritFail.
  //
  // A WORD, NOT A NUMBER, because a magnitude is a JUDGMENT and the recorder is an observer (the
  // card-wide doctrine). It reports what the prose showed; the engine prices it. Same shape as
  // /Intent/mundane, which has always worked this way.
  const STRAIN_DELTA = { Minor: -1, Hurt: -2, Severe: -3 };
  // DAY-END SWING magnitudes (EVENT-DAY SWING TIERS + FREE date-out · Cluster 6B). ⚠ These TIERS
  // (BONDING/SCHOOL-FESTIVAL/SPORTS/ACADEMIC/CULTURE/CLIMAX/DATEOUT) are CALENDAR-owned EVENT-DAY categories — a
  // SEPARATE axis from the 10 in-scene social-check TYPES (Flirt/Support/Gesture/Persuade/Compete/EmotionalRequest/Confess/
  // PhysicalRequest/Repair/Probe). The day's tier comes from EngineDerived.DayCheck (the calendar), NEVER a narrator TYPE pick, and it
  // carries its OWN large magnitude here — it does NOT go through TYPE+Difficulty+STAKES. Affection is 0-100, so the
  // deliberately-large DATE-TIER numbers (BONDING/SCHOOL-FESTIVAL/CLIMAX) FILL the bar — the excess CLAMPS — and a
  // filled auto-advance stage rolls one rung (a tentpole day spent on ONE girl advances the route). The STAT-SHOWCASE
  // tier (SPORTS/ACADEMIC/CULTURE) is smaller & sub-cap-ish (accumulating; balanced by frequency — SPORTS and
  // CULTURE 1×/yr each pay ~2× ACADEMIC 2×/yr; the 2-day 文化祭 pays CULTURE on d1 and the SCHOOL-FESTIVAL date
  // tier on d2, ~135/day against the sports festival's 120 for its one day). Keyed by the SAME outcome tokens as an
  // in-scene check (CritSuccess|Success|Failure|CritFail); every tier but DATEOUT is named by narrate's /Intent/daySwing.
  // DATEOUT = the ordinary FREE-day date-out, which the engine grades and pays itself (payDateOut): +100 for a
  // CritSuccess, +50 for a Success, +30 for a Failure, nothing to a girl still in a fight. All bypass the daily cap.
  const SWING = {
    BONDING:           { CritSuccess: 150, Success: 120, Failure: 60, CritFail: 30 },
    'SCHOOL-FESTIVAL': { CritSuccess: 150, Success: 120, Failure: 60, CritFail: 30 },
    CLIMAX:            { CritSuccess: 200, Success: 150, Failure: 80, CritFail: 40 },
    SPORTS:            { CritSuccess: 120, Success: 80,  Failure: 30, CritFail: -5 },
    CULTURE:           { CritSuccess: 120, Success: 80,  Failure: 30, CritFail: -5 },
    ACADEMIC:          { CritSuccess: 60,  Success: 40,  Failure: 15, CritFail: -5 },
    DATEOUT:           { CritSuccess: 100, Success: 50,  Failure: 30, CritFail: 0 },
  };
  // A tier that pays only when narrate's daySwing names the girl — so a day that closes without one forfeits it.
  const isSwingNamedByNarrate = (tier) => !!SWING[tier] && tier !== 'DATEOUT';
  // DAY-CHECK ROLL (the STAT-SHOWCASE tiers) — a d20 the PRE call deals ONCE on the day, never a narrator verdict.
  // DC = round(class-average Lore stat / 5), so the class itself is the bar: ACADEMIC against the 21 cards' INT
  // (mean 58.2 → 12); SPORTS against their STA (mean 55.1 → 11), because Lore carries no STR for the girls and STA
  // is their athletic stat, while the MOD folds MainChar's STR — the relay is STR-primary; CULTURE (文化祭 d1, the
  // booth the class builds and opens) against their ELE (mean 47.2 → 9, the lowest bar of the three — a student
  // booth IS a low bar), while the MOD folds MainChar's CHA, because what fills a booth is showmanship and he has
  // no elegance of his own to fold. Every bar is a CONSTANT off the 21 cards, never the present girl's stat, so no
  // tier rewards bringing one heroine over another. Tools/test_resolver.cjs
  // holds all three numbers to the Lore/ cards and to the two prompt copies of each. MainChar mod = floor(stat / 25),
  // the same fold the social ladder prints. The roll is frozen on EngineDerived.DayCheckRoll for the day (numbers
  // only, never a stored verdict — Window A and applyDaySwing both derive it with deriveOutcome) and the day-end
  // swing pays the DIE's outcome; the narrator's daySwing token only names the girl. A tier absent here (BONDING /
  // SCHOOL-FESTIVAL / CLIMAX) keeps the narrator's judgment of the day; DATEOUT is graded by the engine (payDateOut).
  const DAY_CHECK = { ACADEMIC: { stat: 'Int', dc: 12 }, SPORTS: { stat: 'Str', dc: 11 }, CULTURE: { stat: 'Cha', dc: 9 } };
  // THE DATE-OUT'S CRITSUCCESS ROLL (payDateOut): only a full day (the sharers' ledger at DAILY_AFFECTION_CAP) rolls,
  // and a d20 of this or more makes it a CritSuccess, so +100 stays rare even for a perfect day (18-20, 15%).
  const DATEOUT_CRIT_DC = 18;
  // THE DATE-OUT'S BRIEF-MEETING BAR (payDateOut): a girl shares the day only if POST saw her with him in at least
  // this many replies of it, so a hello in passing takes no share.
  const DATEOUT_MIN_REPLIES = 5;
  // route ladder
  // THE STAGE LADDER. Main route: Stranger → Acquaintance → Friend → Dating (each automatic at Affection 100, which
  // resets) → Girlfriend (a WON Confess check). Branches: Friend → Friends_With_Benefits (the FWB proposal roll),
  // FWB → Girlfriend (her consent: a WON Confess), and Dating/Girlfriend → Loyal_Puppy (the Loyal-Puppy demand roll).
  const LADDER = { Stranger: 'Acquaintance', Acquaintance: 'Friend', Friend: 'Dating' };
  // The Loyal-Puppy demand (2l): {{user}} demands her total submission, PRE rolls one die, and it converts her when the
  // RAW die reaches this, no modifiers. A Dating or Girlfriend heroine with Lewdness at 50 or more is eligible when she
  // is a schemer (Hagaruro above 60) or her H submission has reached Submissive (M_level 30 or more, submissionBand).
  // ⚠ MIRRORED in check_dc_dice-pre.txt (the eligibility PRE reads) and current_variable_data.txt
  // (the ## SOCIAL CHECK RESULT line) — change one, change all three (Tools/test_resolver.cjs holds them together).
  const PUPPY_DEMAND = { target: 16, stages: ['Dating', 'Girlfriend'], minHagaruro: 61, minMLevel: 30, minLewdness: 50 };
  const isPuppyEligible = (stage, hagaruro, mLevel, lewdness) => PUPPY_DEMAND.stages.indexOf(stage) >= 0
    && lewdness >= PUPPY_DEMAND.minLewdness && (hagaruro >= PUPPY_DEMAND.minHagaruro || mLevel >= PUPPY_DEMAND.minMLevel);
  // A refused demand costs her this much Lewdness (2l): he pushed past what she was ready to give, and it cools her.
  // From Lewdness 50-59 it drops her below PUPPY_DEMAND.minLewdness, so the next demand waits until she has built it
  // back. Engine-only: PRE and the panel never print it.
  const PUPPY_REFUSAL_LEWDNESS_COST = 10;
  const STAGE_PREV = { Acquaintance: 'Stranger', Friend: 'Acquaintance', Dating: 'Friend', Girlfriend: 'Dating',
    Friends_With_Benefits: 'Friend', Loyal_Puppy: 'Estranged' };   // FWB demotes back down its own branch; a broken Loyal_Puppy falls to Estranged
  const CAPS_AT_100 = ['Girlfriend', 'Friends_With_Benefits', 'Loyal_Puppy'];
  // /Intent/relationship apply ORDER + coherence, for the ','-joined list (2c). Rank runs stage-structural →
  // exit → flag → magnitude, so an Affection-reading gate is never pre-emptively failed by a strain the
  // narrator wrote first — see the ordering note at (2c) for the worked case.
  // The two CONFLICT_* lists are the field-level truth about which actions WRITE ConflictActive, and which way.
  // (`fwb` is NOT in this vocabulary — it is PRE's, on its own /Intent/fwb path.)
  const REL_RANK = { demote: 0, betray: 0, walkoff: 1, conflict: 2, reconcile: 2, strain: 3 };
  const REL_STRUCTURAL = ['demote', 'betray'];               // each moves RelationshipStage outright
  const REL_CONFLICT_ON = ['demote', 'betray', 'conflict'];  // writes ConflictActive = true
  const REL_CONFLICT_OFF = ['reconcile', 'walkoff'];         // writes ConflictActive = false
  const NEGLECT_STAGES = ['Dating', 'Girlfriend'];
  const DAILY_AFFECTION_CAP = 30;   // the most a heroine's Affection may RISE, net, in one game-day from capped sources; a fall is never limited and gives its room back (applyAffection)
  // The MainChar stats narrate may REPORT for training / co-activity. Sta is not reported, it is landed: a physical
  // session or co-activity (reported as Str) goes into Str or Sta at the engine's pick (pickPhysicalStat), because
  // Sta sets the block cap and his H energy cost and has no everyday source of its own.
  const MC_TRAINABLE = ['Int', 'Str', 'Cha'];
  // Str and Sta are the PHYSICAL pair: a gain aimed at one that it has no room for goes to the other (physicalPair).
  const PHYSICAL_STATS = ['Str', 'Sta'];
  // #6: auto-disarm an AddClassmate gate this many MESSAGES after arming if the narrator never emits a build
  // (≈2 AI turns; mids advance ~2 per turn). Guards against a gate armed but never consumed → stuck armed forever.
  const ADD_CLASSMATE_GRACE_MSGS = 4;
  const SCHOOL_BLOCKS = ['07:30', '12:00', '16:00', '19:00'];
  // ---- GAME-TIME CLOCK — a fixed-offset timezone ------------------------------------------
  // World.Date/Time is the SCENE'S plain civil clock — what a character reads off a wall; prose drives it
  // via /Intent/sceneClock and it may hold any civil minute. The GAME steers by EngineDerived.DayDate
  // (WHICH game-day) + the derived band (WHERE in it). GameTime = CivilTime - 7:30: a game-day is exactly
  // 00:00-23:59 in game time (= civil 07:30 -> next-day 07:29), so the civil date flips mid-game-day and
  // no band wraps. ONE conversion (civilToGame) at the boundary; every date/band question computes in
  // game coordinates. The band is STORED NOWHERE — derived per call, so clock and band cannot desync.
  //   band 0 = game 00:00-04:29 = civil 07:30-11:59  (morning)
  //   band 1 = game 04:30-08:29 = civil 12:00-15:59  (lunch/afternoon)
  //   band 2 = game 08:30-11:29 = civil 16:00-18:59  (after class)
  //   band 3 = game 11:30-16:29 = civil 19:00-23:59  (evening)
  //   band 4 = game 16:30-23:59 = civil 00:00-07:29  (small hours — the OVERFLOW band: never advanced
  //            INTO, only drifted into; sitting in it means this game-day should be ending)
  const timeToMin = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t == null ? '' : t).trim()); return m ? (Number(m[1]) * 60 + Number(m[2])) : null; };
  const minToTime = (min) => { const m = Math.max(0, Math.round(min)); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  const BLOCK_MINS = SCHOOL_BLOCKS.map(timeToMin);                       // [450, 720, 960, 1140] civil
  const GAME_OFFSET_MIN = BLOCK_MINS[0];                                 // 450 — the timezone offset
  const gameMinOf = (civilMin) => (civilMin - GAME_OFFSET_MIN + 1440) % 1440;
  const bandOf = (gameMin) => gameMin >= 990 ? 4 : gameMin >= 690 ? 3 : gameMin >= 510 ? 2 : gameMin >= 270 ? 1 : 0;
  // Which band a civil HH:MM sits in — date-free (the offset is fixed, so time alone decides the band).
  const bandFromTime = (t) => { const n = timeToMin(t); return n == null ? 0 : bandOf(gameMinOf(n)); };
  const addIso = (iso, n) => { const d = new Date(String(iso || '').slice(0, 10) + 'T00:00:00Z'); if (isNaN(d)) return String(iso || ''); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  // THE ONE TIMEZONE CONVERSION — civil (date, HH:MM) -> { gameDate, gameMin, band }. Band 4 (civil
  // 00:00-07:29) belongs to YESTERDAY's game-day; everything downstream reads these game coordinates.
  const civilToGame = (dateIso, timeStr) => {
    const n = timeToMin(timeStr);
    if (n == null) return null;
    const gm = gameMinOf(n);
    return { gameDate: n < GAME_OFFSET_MIN ? addIso(dateIso, -1) : String(dateIso || '').slice(0, 10), gameMin: gm, band: bandOf(gm) };
  };
  // Every World.Date write goes through here so Weekday can never desync from the civil date.
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const setCivilDate = (W, iso) => {
    setVal(W, 'Date', iso);
    const d = new Date(String(iso).slice(0, 10) + 'T00:00:00Z');
    if (!isNaN(d)) setVal(W, 'Weekday', WD[d.getUTCDay()]);
  };
  const dayNum = (s) => { const d = new Date(String(s || '').slice(0, 10) + 'T00:00:00Z'); return isNaN(d) ? null : Math.floor(d / 86400000); };
  const daysBetween = (a, b) => { const x = dayNum(a), y = dayNum(b); return (x == null || y == null) ? 0 : (y - x); };
  // The game-day being PLAYED: EngineDerived.DayDate, or the civil World.Date before the first day roll.
  const playedDay = (sd) => String(get((sd.EngineDerived || {}).DayDate, get((sd.World || {}).Date, ''))).slice(0, 10);
  // The MONDAY of a date's school week (Mon-Sun), as an ISO date — the key a once-a-week budget stamps.
  // Anchored on Monday because that is where the school week starts; epoch day 0 was a Thursday, hence +3.
  // '' for an unreadable date, so a caller can tell "no week" from a real one.
  const weekOf = (s) => { const d = dayNum(s); return d == null ? '' : new Date((d - ((d + 3) % 7)) * 86400000).toISOString().slice(0, 10); };
  // deterministic string hash (FNV-1a, 32-bit unsigned) — seeds the reproducible weather + scatter picks below.
  // NOT Math.random: same date/block/key → same result, so a re-fire is idempotent and the tests stay deterministic.
  const hashStr = (s) => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  // murmur3's 32-bit finalizer over hashStr: every input bit moves the whole word, so seeds that differ by one
  // character (the next week, a stat one point higher) still give a fair coin, never a pattern.
  const mixedHash = (s) => { let h = hashStr(s); h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; };
  // WHICH stat a reported physical gain raises: Str or Sta, a fair coin. Seeded by the gain's slot (the training
  // week; for a co-activity, 'day ' + its game-day) AND his current Str and Sta, so a regenerate of the same reply
  // lands the same way (no rerolling by swipe), while two saves, or the next loop of the calendar, diverge as soon as
  // their numbers do.
  const pickPhysicalStat = (MC, seed) =>
    PHYSICAL_STATS[mixedHash('physical|' + seed + '|' + (Number(get(MC.Str, 0)) || 0) + '|' + (Number(get(MC.Sta, 0)) || 0)) % 2];
  // [first, the other physical stat] — the order gainsWithinCap fills, so a maxed one passes its gain on.
  const physicalPair = (first) => [first, first === 'Str' ? 'Sta' : 'Str'];
  // A MainChar gain under the 100 ceiling, as [{ stat, amount, value }] — only what actually lands. The points go into
  // `stats` in order, each up to 100, so a physical pair sends what a maxed stat cannot take to the other one, and a
  // single stat at 99 takes 1 of 3. Every stat already at 100 gives an empty list.
  const gainsWithinCap = (MC, stats, amount) => {
    const gains = []; let left = amount;
    for (const stat of stats) {
      const now = Number(get(MC[stat], 0)) || 0;
      const take = Math.min(left, Math.max(0, 100 - now));
      if (take > 0) { gains.push({ stat, amount: take, value: now + take }); left -= take; }
    }
    return gains;
  };
  // Why a gain that landed nothing was refused: a reported physical one (Str) had both of the pair at 100.
  const nothingToBuild = (stat) => (stat === 'Str' ? 'Str and Sta are both 100' : stat + ' is 100') + ' — nothing left to build';

  // ---- ENGINE-AUTHORED DISPLAY BARS --------------------------------------
  // RES is the only writer of the clock, so RES renders its display too: the date/time/weather bar and the
  // location line, returned as `leadText`. The genre-blind host writes it at the top of the story (the block
  // the card's [Initmvuhelper] leadText names) of every reply that returns it, AFTER the fence+save and whatever
  // the model wrote, and a later resolve of the same reply refreshes it in place; the model never writes a bar. The caption reads World.* directly — civil,
  // prose-driven, nothing to convert. `endedAtMin` overrides the TIME only, for the stale-report refusal:
  // the caption must say where the WRITTEN scene ended, not where the held cursor waits (transient, this
  // resolve only — no stored field).
  const renderLeadText = (statData, endedAtMin) => {
    const W = statData.World || {};
    const c = {
      date: String(get(W.Date, '')),
      weekday: String(get(W.Weekday, '')),
      time: (typeof endedAtMin === 'number' && endedAtMin >= 0) ? minToTime(endedAtMin) : String(get(W.Time, '')),
    };
    const wx = String(get(W.Weather, ''));
    const lk = String(get(W.Location, ''));
    let ls = lk;
    const lr = (((statData.WorldRecord || {}).Locations || {})[lk]) || null;
    if (lr && typeof lr.Label === 'string' && lr.Label && lr.Label !== lk) ls = lk + ' (' + lr.Label + ')';
    return '[ 🗓️ Date: ' + c.date + ' (' + c.weekday + ') | 🕰️ Time: ' + c.time + ' | Weather: ' + i18nLabel('World.Weather', wx, statData) + ' ]'
      + '\n📍 Location: ' + ls;
  };

  // ---- CALENDAR (yearschedule · Cluster 6) — the pre-laid 3-year arc on the real 2026-2029 calendar. SPARSE:
  // only break/event ANCHOR rows are listed; every unlisted day follows the weekday default (Mon-Fri SCHOOL /
  // Sat-Sun FREE). Rows verbatim from <Year_Schedule>, with WKD dropped (re-derived from the real date via
  // getUTCDay) and ROLL_TO's "(Wkd)" annotation dropped (same). Columns:
  //   DATE | MODE | LABEL | CHECK | ROLLTO(+1 | yyyy-mm-dd jump) | SPINE(@key the narrator plays, or -)
  // The arc LOOPS via the TIME-LEAP on the Graduation row (its ROLLTO jumps back to game-start 2026-04-08);
  // the same absolute-date table replays each loop (Date is reset to 2026-04-08). ----
  const CALENDAR_ROWS =
    // YEAR 1 · Grade 1
    '2026-04-08|EVENT|Entrance Ceremony 入学式|-|+1|@Entrance_Ceremony\n' +
    '2026-04-09|SCHOOL|First lessons 授業開始|-|+1|@First_Lessons\n' +
    '2026-04-29|FREE|Golden Week|-|2026-05-05|@Golden_Week\n' +
    '2026-05-05|FREE|Golden Week|-|2026-05-06|@Golden_Week\n' +
    '2026-07-02|SCHOOL|Term Finals prep 期末試験一週間前|-|+1|@Exams_Prep\n' +
    '2026-07-09|SCHOOL|Term Finals 期末試験|ACADEMIC|+1|@Exams\n' +
    '2026-07-20|FREE|Summer|-|2026-07-28|@Summer\n' +
    '2026-07-28|FREE|Summer|-|2026-08-05|@Summer\n' +
    '2026-08-05|FREE|Summer|-|2026-08-13|@Summer\n' +
    '2026-08-13|EVENT|Obon お盆 d1 迎え火・盆踊り|BONDING|2026-08-15|@Obon\n' +
    '2026-08-15|EVENT|Obon お盆 d2 送り火・灯籠流し|BONDING|2026-08-23|@Obon\n' +
    '2026-08-23|FREE|Summer|-|2026-08-31|@Summer\n' +
    '2026-08-31|FREE|Summer|-|2026-09-01|@Summer\n' +
    '2026-10-02|SCHOOL|Sports Festival prep 体育祭一週間前|-|+1|@Sports_Festival_Prep\n' +
    '2026-10-10|EVENT|Sports Festival 体育祭|SPORTS|+1|@Sports_Festival\n' +
    '2026-10-30|SCHOOL|Cultural Festival prep 文化祭準備|-|+1|@Cultural_Festival_Prep\n' +
    '2026-11-07|EVENT|Cultural Festival 文化祭 d1|CULTURE|+1|@Cultural_Festival\n' +
    '2026-11-08|EVENT|Cultural Festival 文化祭 d2|SCHOOL-FESTIVAL|+1|@Cultural_Festival\n' +
    '2026-12-24|EVENT|Christmas Eve クリスマスイブ|BONDING|2026-12-25|@Winter_Holidays\n' +
    '2026-12-25|EVENT|Christmas クリスマス|BONDING|2026-12-31|@Winter_Holidays\n' +
    '2026-12-31|EVENT|New Year\'s Eve 大晦日|BONDING|2027-01-01|@Winter_Holidays\n' +
    '2027-01-01|EVENT|New Year 正月・初詣|BONDING|2027-01-04|@Winter_Holidays\n' +
    '2027-01-04|FREE|Winter break 冬休み|-|2027-01-08|@Winter_Break\n' +
    '2027-02-14|EVENT|Valentine\'s Day バレンタインデー|BONDING|+1|@Valentines_Day\n' +
    '2027-02-17|SCHOOL|Year-End Exams prep 学年末試験一週間前|-|+1|@Exams_Prep\n' +
    '2027-02-24|SCHOOL|Year-End Exams 学年末試験|ACADEMIC|+1|@Exams\n' +
    '2027-03-14|EVENT|White Day ホワイトデー|BONDING|+1|@White_Day\n' +
    '2027-03-25|FREE|Spring Break|-|2027-03-29|@Spring_Break\n' +
    '2027-03-29|FREE|Spring Break|-|2027-04-02|@Spring_Break\n' +
    '2027-04-02|FREE|Spring Break|-|2027-04-07|@Spring_Break\n' +
    '2027-04-07|FREE|Spring Break|-|2027-04-08|@Spring_Break\n' +
    // YEAR 2 · Grade 2 (grade-up 2027-04-08)
    '2027-04-29|FREE|Golden Week|-|2027-05-05|@Golden_Week\n' +
    '2027-05-05|FREE|Golden Week|-|2027-05-06|@Golden_Week\n' +
    '2027-07-02|SCHOOL|Term Finals prep 期末試験一週間前|-|+1|@Exams_Prep\n' +
    '2027-07-09|SCHOOL|Term Finals 期末試験|ACADEMIC|+1|@Exams\n' +
    '2027-07-20|FREE|Summer|-|2027-07-28|@Summer\n' +
    '2027-07-28|FREE|Summer|-|2027-08-05|@Summer\n' +
    '2027-08-05|FREE|Summer|-|2027-08-13|@Summer\n' +
    '2027-08-13|EVENT|Obon お盆 d1 迎え火・盆踊り|BONDING|2027-08-15|@Obon\n' +
    '2027-08-15|EVENT|Obon お盆 d2 送り火・灯籠流し|BONDING|2027-08-23|@Obon\n' +
    '2027-08-23|FREE|Summer|-|2027-08-31|@Summer\n' +
    '2027-08-31|FREE|Summer|-|2027-09-01|@Summer\n' +
    '2027-10-01|SCHOOL|Sports Festival prep 体育祭一週間前|-|+1|@Sports_Festival_Prep\n' +
    '2027-10-09|EVENT|Sports Festival 体育祭|SPORTS|+1|@Sports_Festival\n' +
    '2027-10-12|SCHOOL|School Trip prep 修学旅行事前指導|-|+1|@School_Trip_Prep\n' +
    '2027-10-19|EVENT|School Trip 修学旅行 d1|-|+1|@School_Trip\n' +
    '2027-10-20|EVENT|School Trip 修学旅行 d2|-|+1|@School_Trip\n' +
    '2027-10-21|EVENT|School Trip 修学旅行 d3|-|+1|@School_Trip\n' +
    '2027-10-22|EVENT|School Trip 修学旅行 d4|BONDING|+1|@School_Trip\n' +
    '2027-10-29|SCHOOL|Cultural Festival prep 文化祭準備|-|+1|@Cultural_Festival_Prep\n' +
    '2027-11-06|EVENT|Cultural Festival 文化祭 d1|CULTURE|+1|@Cultural_Festival\n' +
    '2027-11-07|EVENT|Cultural Festival 文化祭 d2|SCHOOL-FESTIVAL|+1|@Cultural_Festival\n' +
    '2027-12-24|EVENT|Christmas Eve クリスマスイブ|BONDING|2027-12-25|@Winter_Holidays\n' +
    '2027-12-25|EVENT|Christmas クリスマス|BONDING|2027-12-31|@Winter_Holidays\n' +
    '2027-12-31|EVENT|New Year\'s Eve 大晦日|BONDING|2028-01-01|@Winter_Holidays\n' +
    '2028-01-01|EVENT|New Year 正月・初詣|BONDING|2028-01-04|@Winter_Holidays\n' +
    '2028-01-04|FREE|Winter break 冬休み|-|2028-01-08|@Winter_Break\n' +
    '2028-02-14|SCHOOL|Valentine\'s Day バレンタインデー|BONDING|+1|@Valentines_Day\n' +
    '2028-02-17|SCHOOL|Year-End Exams prep 学年末試験一週間前|-|+1|@Exams_Prep\n' +
    '2028-02-24|SCHOOL|Year-End Exams 学年末試験|ACADEMIC|+1|@Exams\n' +
    '2028-03-14|SCHOOL|White Day ホワイトデー|BONDING|+1|@White_Day\n' +
    '2028-03-25|FREE|Spring Break|-|2028-03-29|@Spring_Break\n' +
    '2028-03-29|FREE|Spring Break|-|2028-04-02|@Spring_Break\n' +
    '2028-04-02|FREE|Spring Break|-|2028-04-07|@Spring_Break\n' +
    '2028-04-07|FREE|Spring Break|-|2028-04-08|@Spring_Break\n' +
    // YEAR 3 · Grade 3 (grade-up 2028-04-08)
    '2028-04-29|FREE|Golden Week|-|2028-05-05|@Golden_Week\n' +
    '2028-05-05|FREE|Golden Week|-|2028-05-06|@Golden_Week\n' +
    '2028-07-03|SCHOOL|Term Finals prep 期末試験一週間前|-|+1|@Exams_Prep\n' +
    '2028-07-10|SCHOOL|Term Finals 期末試験|ACADEMIC|+1|@Exams\n' +
    '2028-07-20|FREE|Summer|-|2028-07-28|@Summer\n' +
    '2028-07-28|FREE|Summer|-|2028-08-05|@Summer\n' +
    '2028-08-05|FREE|Summer|-|2028-08-13|@Summer\n' +
    '2028-08-13|EVENT|Obon お盆 d1 迎え火・盆踊り|BONDING|2028-08-15|@Obon\n' +
    '2028-08-15|EVENT|Obon お盆 d2 送り火・灯籠流し|BONDING|2028-08-23|@Obon\n' +
    '2028-08-23|FREE|Summer|-|2028-08-31|@Summer\n' +
    '2028-08-31|FREE|Summer|-|2028-09-01|@Summer\n' +
    '2028-10-06|SCHOOL|Sports Festival prep 体育祭一週間前|-|+1|@Sports_Festival_Prep\n' +
    '2028-10-14|EVENT|Sports Festival 体育祭|SPORTS|+1|@Sports_Festival\n' +
    '2028-10-10|SCHOOL|School Trip prep 修学旅行事前指導|-|+1|@School_Trip_Prep\n' +
    '2028-10-17|EVENT|School Trip 修学旅行 d1|-|+1|@School_Trip\n' +
    '2028-10-18|EVENT|School Trip 修学旅行 d2|-|+1|@School_Trip\n' +
    '2028-10-19|EVENT|School Trip 修学旅行 d3|-|+1|@School_Trip\n' +
    '2028-10-20|EVENT|School Trip 修学旅行 d4|BONDING|+1|@School_Trip\n' +
    '2028-10-27|SCHOOL|Cultural Festival prep 文化祭準備|-|+1|@Cultural_Festival_Prep\n' +
    '2028-11-04|EVENT|Cultural Festival 文化祭 d1|CULTURE|+1|@Cultural_Festival\n' +
    '2028-11-05|EVENT|Cultural Festival 文化祭 d2|SCHOOL-FESTIVAL|+1|@Cultural_Festival\n' +
    '2028-12-24|EVENT|Christmas Eve クリスマスイブ|BONDING|2028-12-25|@Winter_Holidays\n' +
    '2028-12-25|EVENT|Christmas クリスマス|BONDING|2028-12-31|@Winter_Holidays\n' +
    '2028-12-31|EVENT|New Year\'s Eve 大晦日|BONDING|2029-01-01|@Winter_Holidays\n' +
    '2029-01-01|EVENT|New Year 正月・初詣|BONDING|2029-01-04|@Winter_Holidays\n' +
    '2029-01-04|FREE|Winter break 冬休み|-|2029-01-08|@Winter_Break\n' +
    '2029-02-13|SCHOOL|Year-End Exams prep 学年末試験一週間前|-|+1|@Exams_Prep\n' +
    '2029-02-14|SCHOOL|Valentine\'s Day バレンタインデー|BONDING|+1|@Valentines_Day\n' +
    '2029-02-21|SCHOOL|Year-End Exams 学年末試験|ACADEMIC|+1|@Exams\n' +
    '2029-03-01|EVENT|Graduation 卒業式 → TIME-LEAP|CLIMAX|2026-04-08|@Graduation\n';
  // ---- SPINE_STEPS — how many steps each spine DAY declares per band, as <Event_Spines> (event_spines.txt)
  // writes them. The engine never reads the lorebook, so this is a COPY, and Tools/verify_calendar_mirror.cjs
  // fails the build unless it equals the file. Keyed "<@spine>" for a one-day body and "<@spine> <day>" where a
  // spine holds several day bodies: the calendar label's "dN", or the body's own "M/D". A band a body leaves
  // out declares no steps; a spine or day absent here (a pool day, Christmas) declares none at all.
  // What it is FOR: whether narrate's "complete:" on the day signpost is true — every band that declares
  // steps must have had them all reported (spineUnfinished). The prose may add steps past these; only the
  // declared ones are required. ----
  const SPINE_STEPS = {
    '@Entrance_Ceremony': { 0: 7, 1: 2 },
    '@First_Lessons': { 0: 2, 1: 1 },
    '@Exams_Prep': { 0: 1 },
    '@Exams': { 0: 2, 1: 2 },
    '@Obon d1': { 0: 2, 1: 1, 3: 3 },
    '@Obon d2': { 0: 1, 1: 1, 3: 2 },
    '@Sports_Festival_Prep': { 0: 1 },
    '@Sports_Festival': { 0: 3, 1: 2, 2: 2 },
    '@Cultural_Festival_Prep': { 2: 2, 3: 1 },
    '@Cultural_Festival d1': { 0: 2, 1: 1, 2: 1 },
    '@Cultural_Festival d2': { 0: 1, 1: 1, 2: 1, 3: 1 },
    '@School_Trip_Prep': { 2: 2, 3: 1 },
    '@School_Trip d1': { 0: 1, 1: 1, 2: 1 },
    '@School_Trip d2': { 0: 1, 1: 1, 2: 1 },
    '@School_Trip d3': { 0: 1, 3: 3 },
    '@School_Trip d4': { 0: 1, 1: 1 },
    '@Valentines_Day': { 0: 2, 1: 2, 2: 1 },
    '@White_Day': { 0: 1, 1: 1, 2: 1 },
    '@Winter_Holidays 12/24': { 0: 1, 1: 1, 3: 3 },
    '@Winter_Holidays 12/31': { 0: 1, 2: 1, 3: 2 },
    '@Graduation': { 0: 2, 1: 2, 2: 1, 3: 1 },
  };
  const CALENDAR = (function () {
    const m = {};
    for (const line of CALENDAR_ROWS.split('\n')) {
      if (!line.trim()) continue;
      const p = line.split('|');
      // MODE COLLAPSE (Mode = pacing only): row FREE/EVENT both mean OPEN (uncapped clock); the payout
      // tier moved wholly into CHECK — a FREE row's implicit tier is DATEOUT, EVENT keeps its column,
      // '-' pays nothing (the SERIES-SWING mechanism). Rows keep the FREE/EVENT spelling as data.
      const openRow = p[1] === 'FREE' || p[1] === 'EVENT';
      m[p[0]] = { mode: openRow ? 'OPEN' : p[1], label: p[2],
        check: p[3] === '-' ? (p[1] === 'FREE' ? 'DATEOUT' : '') : p[3],
        rollTo: p[4], spine: p[5] === '-' ? '' : p[5] };
    }
    return m;
  })();
  const lookupDay = (iso) => CALENDAR[String(iso || '').slice(0, 10)] || null;
  // GRADE is date-derivable (yearschedule ARC BACKBONE): school-year N starts each April. Absolute per-arc; the
  // TIME-LEAP resets Date to 2026-04-08 so it reads Grade 1 again. Lexical ISO compare is safe. Caps 3.
  const gradeFromDate = (iso) => { const d = String(iso || '').slice(0, 10); return d >= '2028-04-01' ? 3 : d >= '2027-04-01' ? 2 : 1; };

  // ---- WEATHER — a season-fitting World.Weather per BLOCK. ENGLISH KEYS (Clear/Rain/Fog/Storm) — display localizes
  // via engine/i18n.cjs (seed shows 晴朗 under zh-TW). Per-month pool, weighted by repetition: June 梅雨 skews Rain;
  // midsummer occasional Storm; autumn/deep-winter some Fog; else Clear. The game-day's morning band draws from the
  // pool; each later band either HOLDS the band before it (WEATHER_HOLD_PCT) or draws again, so rain can set in or
  // clear between blocks without flipping every block. The band comes from the clock alone (civilToGame), so an EVENT
  // or OPEN day changes the sky at the same block times as a SCHOOL day. DETERMINISTIC off (game date, band): a
  // re-fire of the same block reads the same sky, and nothing is stored but World.Weather itself. ----
  const WEATHER_BY_MONTH = {
    1: ['Clear', 'Clear', 'Fog', 'Clear'], 2: ['Clear', 'Clear', 'Fog', 'Clear'], 3: ['Clear', 'Clear', 'Rain', 'Clear'],
    4: ['Clear', 'Clear', 'Rain', 'Clear'], 5: ['Clear', 'Clear', 'Rain', 'Clear'], 6: ['Rain', 'Rain', 'Rain', 'Clear'],
    7: ['Clear', 'Clear', 'Clear', 'Storm'], 8: ['Clear', 'Clear', 'Clear', 'Storm'], 9: ['Clear', 'Fog', 'Clear', 'Clear'],
    10: ['Clear', 'Fog', 'Clear', 'Clear'], 11: ['Clear', 'Fog', 'Clear', 'Clear'], 12: ['Clear', 'Clear', 'Fog', 'Clear'],
  };
  const WEATHER_HOLD_PCT = 50;
  const weatherAt = (gameDate, band) => {
    const iso = String(gameDate).slice(0, 10);
    const pool = WEATHER_BY_MONTH[Number(iso.slice(5, 7))] || ['Clear'];
    let sky = pool[hashStr(iso) % pool.length];
    for (let b = 1; b <= band; b++) {
      if (hashStr(iso + '#hold' + b) % 100 < WEATHER_HOLD_PCT) continue;
      sky = pool[hashStr(iso + '#band' + b) % pool.length];
    }
    return sky;
  };
  // Writes the sky for wherever the clock stands now. resolveTurn calls it once, after every clock write (drift,
  // block advance, day roll, catch-up, TIME-LEAP) and before the event scan, so a World.Weather gate reads this block's
  // sky. An unreadable clock leaves the weather as it was.
  function syncWeather(statData, log) {
    const W = statData.World || (statData.World = {});
    const g = civilToGame(String(get(W.Date, '')).slice(0, 10), String(get(W.Time, SCHOOL_BLOCKS[0])));
    if (!g) return;
    const sky = weatherAt(g.gameDate, g.band);
    if (String(get(W.Weather, '')) !== sky) { setVal(W, 'Weather', sky); log.push('Weather -> ' + sky + ' (band ' + g.band + ')'); }
  }

  // ---- EVENT SCHEDULE (event_schedule.txt · Cluster 6C) — the data-driven trigger engine. RES evaluates
  // every reply, arms the fire-one winner into EngineDerived.EventArmed, Window-A surfaces it, <Event_Body>
  // injects only that @KEY's DO body (EJS-gated, like <Event_Spines>), and the narrator emits /Intent/eventFire;
  // the library then runs the row's declared writes. Each row:
  //   key    the @KEY the narrator plays + fires
  //   cat    TRG (every reply) | TIME (date-anchored; the Date= token gates it) — priority: TIME outranks TRG
  //   series (optional) the SeriesKey → the prereq `Quest(<series>).Step==N-1` ORDERS the chain ("prior done
  //          AND this not yet"). EVERY row is a one-shot: the library marks a fired key at EventPack.fired.<key>
  //   prereq/when  &-joined predicate strings (WHEN-DSL, eventpack.cjs); BOTH must hold. '-'/'' = no constraint.
  //   check  the tied social-check tier name (day-end swing) or '' — narrate hint only; NPC rewards stay narrative.
  //   fx     { summary, scope, writes: [{ path, key?, set?, add?, remove? }] } — the STRUCTURAL consequence,
  //          applied by the library under the rules EVENT_PACK_ADAPTER.writes declares. Prose reward = the body.
  // The trigger table is DATA, not code: it lives in the dedicated stat_data root (EventPack.triggers, seeded from
  // initmvu.json — official base rows; community packs overlay via mvu-helper), so a non-coder adds/edits an event
  // as pure JSON (+ its English body in event_schedule.txt) without touching this engine. The whole engine —
  // grammar, LHS resolution (aliases · DaysSince · raw paths), scan, verify-at-fire, writes, fired record — is
  // eventpack.cjs (EVENTPACK_API; School's copy of the shared event-pack engine). This file declares School's
  // facts to it and nothing more.

  // ---- EVENT_PACK_ADAPTER — School's declarations for the shared event engine (eventpack.cjs header).
  // Everything the library must NOT know about this genre, stated as DATA: where the trigger table, armed
  // pointer and fired records live; where a pack may WRITE and under which rules; the clock; the LHS
  // aliases; the presence path; the recorder; the warn channel. No applier and no vocabulary code — an
  // event pack exported by MvuStatMenuBuilder runs here with nothing added to this file.
  //
  // ⚠ triggerRoot/armedPath must stay STRING LITERALS right here: the bundle build regexes this
  // object for them, so an indirection (`armedPath: SOME_CONST`) fails the build rather than stamping —
  // the correct direction, but only if you know why. `writes` and `aliases` are read by REQUIRING this
  // module (the export the tests use), so they are plain data of any literal shape. The `*Segs` are
  // derived from the literals BELOW the object, safe because every entry is an arrow evaluated at CALL
  // time.
  //
  // ⚠ getArmed/setArmed are DERIVED from armedPath (P4b — it used to be spelled three times and nothing
  // made the copies agree; mvu-helper writes pack rows and clears the armed slot at paths it learns from
  // the stamped header). The derivation must stay OBSERVATIONALLY IDENTICAL to the closures it replaced,
  // because eventpack.cjs `readyEvent` gates same-reply firing on `adapter.getArmed(sd) === '@' + key`
  // (v1.2.1 NO-DOUBLE-DELIVERY). A getArmed that returned undefined instead of '' on a missing
  // EngineDerived, or that skipped the tuple unwrap, would never match — and every ripe+armed event would
  // double-deliver into one prompt again (live 2026-07-29, twice). Hence: always String, always through
  // `get`, parent created IN PLACE (the turn runner holds the reference), and setVal keyed on the LAST
  // SEGMENT so a fresh write is labelled [v,'EventArmed'] — not [v,'EngineDerived.EventArmed'].
  const EVENT_PACK_ADAPTER = {
    triggerRoot: 'EventPack.triggers',
    armedPath: 'EngineDerived.EventArmed',                           // P4b — the ONE spelling; the build stamps it
    // A fired row is marked by the LIBRARY at EventPack.fired.<key> — beside the trigger table, in the
    // root the installer owns. This engine declares no path for it: platform bookkeeping never lands in
    // a genre store. WorldRecord.Events stays what it has always been across RPG/Love/School — the
    // narrator's PROSE memory: ground-breaking beats and lore overrides, written by /Intent/recordEvent.
    // WHERE a pack may write, and the RULES (eventpack.cjs applyWrites). This array IS the statement:
    // the pack builder reads it off this export and offers exactly these paths with the card's own Zod
    // fields, and the installer refuses a row naming any other.
    writes: [
      // Series quests. Type=GameEvent is the OWNERSHIP STAMP the narrate quest verbs respect (add/progress/
      // complete skip it); LastUpdated is what DaysSince() reads; Step never regresses (a stale re-fire of
      // leila_1 must not roll leila_2 back, and a double delivery is then harmless); the payout ladder is
      // engine-derived by addQuest/completeQuest and never a pack's to set.
      { path: 'Mainchar.Quests', ownerStamp: 'GrantedBy', fixed: { Type: 'GameEvent' }, stamp: 'LastUpdated',
        monotonic: ['Step'], locked: ['Target', 'Difficulty', 'RewardStat', 'StepMax'] },
      // Identity registries: first capture wins (user 2026-08-12) — the status menu's edit button is the
      // correction path, a later declare only FILLS what the record lacks. Same rule registerWorldRecord
      // applies to the organic /Intent registrations.
      // What {{user}} CARRIES. Declared so a beat can hand him a thing, or take one back, without asking
      // narrate to remember an emit — the errand quests turn on an item changing hands, and that is a
      // structural fact, not an observation. `removable` is the point of it: a gift given away, an item
      // spent, a set a goddess keeps.
      //
      // SAFE TO EXPOSE because of the owner gate, which is not a rule about this path but about who wrote
      // the row. An OFFICIAL row (seeded here in initmvu.json) may name any key, which is how @leila_6 takes
      // back the exact `Pink_Underwear_Set` narrate wrote and never stamped. An INSTALLED pack may name any
      // key nobody has claimed — so a community pack grants a readable `Ruinblade`, not a prefixed
      // `<creator>_<event>_ruinblade` — but may overwrite or destroy only what its own id granted.
      // Qty is deliberately NOT monotonic — an item is spent as well as gained.
      { path: 'Mainchar.Inventory', ownerStamp: 'GrantedBy', removable: true },
      { path: 'WorldRecord.NPCs', ownerStamp: 'GrantedBy', stamp: 'FirstSeen', fillOnly: true },
      { path: 'WorldRecord.Locations', ownerStamp: 'GrantedBy', stamp: 'DiscoveredAt', fillOnly: true },
    ],
    // WHAT a row may PAY when it fires (eventpack.cjs applyRewards). Separate from `writes` because a
    // payout's one rule is a CEILING. Every bound below is the range the engine ALREADY enforces on that
    // field elsewhere, so a reward can never put a value somewhere the rest of the game would not: 0-100
    // for the attribute ladders, -100..100 for M_level (the H scene count's own clamp), a floor of 0 and
    // no ceiling for money (applyMoney's own rule — {{user}} cannot go into debt, but may get rich).
    //
    // `max` is the single-payout ceiling and is per-field where a kind's fields do not share a scale.
    // The attribute ceiling is 10 — ABOVE the 8 the quest ladder pays on completion (QUEST_ATTR.SS), so
    // an event may out-pay the game's own top quest reward on any attribute, and any installed pack may
    // do it, not only this card's rows. That is a deliberate choice (user 2026-09-13), not a derived bound
    // like every other number here: a one-off beat such as @leila_8's night of drilling is allowed to
    // matter more than a completed SS quest. Money's is two months of the default allowance; Salary's is
    // far smaller because it is RECURRING — a one-off that permanently doubles the monthly income is a
    // bigger gift than any single scene should be able to hand out.
    //
    // A reward is a STORY payout, not training: none of this reads or spends Mainchar.LastTrainingWeek,
    // so a blessing never costs a week at the gym.
    rewards: [
      { name: 'stat', path: 'Mainchar', fields: ['Int', 'Str', 'Cha', 'Sta'],
        clamp: { Int: [0, 100], Str: [0, 100], Cha: [0, 100], Sta: [0, 100] }, max: 10 },
      { name: 'money', path: 'Mainchar', fields: ['Money', 'Salary'],
        clamp: { Money: [0, null], Salary: [0, null] }, max: { Money: 50000, Salary: 10000 } },
      // The heroine a beat actually happened to. The row names her, or writes a SELECTOR when the beat is
      // about whoever was brought along and no author could know the name: `Classmate.*.Is_present` pays
      // the one member that field marks, and refuses on nobody or several. Any boolean field works — the
      // library reads the field the row names and knows nothing about what it means. The DESCRIBED half
      // of her lives in the `appearance` kind below: those fields are free text, so a number has nothing
      // to add to them.
      //
      // LEWDNESS AND AFFECTION ARE THE TWO FIELDS WITH A CEILING OF THEIR OWN, 20 each; everything else stays
      // at 8. In-game Lewdness moves only through addLewd, which is sized for a thing that REPEATS (+8 a
      // scene, +1..4 on top for edging) and is shut entirely unless she is Girlfriend /
      // Loyal_Puppy. An event row is one-off, so it is not bound by a per-scene step — 20 lets one beat be
      // worth about two heavy scenes, which is what a blessing should feel like beside a night. Affection's
      // reasons are in its own paragraph below.
      //
      // A REWARD DOES NOT PASS addLewd, deliberately: a declared payout is the genre saying this is
      // allowed, and its ceiling is its whole rule, so a goddess may move a girl the ordinary system
      // would refuse to. That privilege is why the ceiling is not removed — it is the only fence an
      // installed pack meets.
      //
      // AFFECTION IS PAYABLE, AT MOST 20 A BEAT: a classmate series moves the bond on a few of its beats,
      // never on all of them. It bypasses the daily cap the same way Lewdness bypasses addLewd — a declared
      // payout is privileged. It does NOT bypass the stage gate, because
      // nothing here runs tryStageGate: a payout that carries her past 100 promotes her at her next gate
      // touch — a check on her, or the day's swing — and one rung a day stays the rule. A row cannot
      // skip a rung; it can only arrive at one sooner.
      { name: 'heroine', path: 'Classmate', keyed: true,
        fields: ['Sta', 'Int', 'Cha', 'Lewdness', 'M_level', 'Exp_Caress', 'Exp_Oral', 'Exp_Vaginal', 'Exp_Anal', 'Affection'],
        clamp: {
          Sta: [0, 100], Int: [0, 100], Cha: [0, 100], Lewdness: [0, 100], M_level: [-100, 100],
          Exp_Caress: [0, 100], Exp_Oral: [0, 100], Exp_Vaginal: [0, 100], Exp_Anal: [0, 100],
          Affection: [0, 100],
        },
        max: {
          Sta: 8, Int: 8, Cha: 8, Lewdness: 20, M_level: 8,
          Exp_Caress: 8, Exp_Oral: 8, Exp_Vaginal: 8, Exp_Anal: 8,
          Affection: 20,
        } },
      // What a beat can RE-DESCRIBE about her — free prose written over the field, because "C Cup" plus a
      // number is not a value. A goddess who reshapes someone says what she made, in words.
      //
      // Name and FullName are deliberately absent: resolveClassmateKey MATCHES on FullName, so a pack that
      // could rewrite it could detach a heroine from her own record. Location belongs to the location
      // channel, Image to the art pipeline, and Persona is an archetype key the personality system reads,
      // not a description — none of them is prose a scene may invent. The length bound is the longest of
      // these the seed actually carries (Physical_Features, 262) with room to rewrite, which also keeps a
      // pack from parking a paragraph in the save on every fire.
      { name: 'appearance', path: 'Classmate', keyed: true, text: true, maxLength: 400,
        fields: ['Cup_Size', 'Height', 'Body_Measurements', 'Hair_Style', 'Physical_Features'] },
    ],
    nowStamp: (sd) => nowStamp(sd),                                  // the clock every `stamp` field receives
    // Whole GAME-days from a stamp to the day being PLAYED. The HH:MM half goes through civilToGame so a
    // band-4 stamp (civil 00:30 = the previous game-day's small hours) lands on the day it belongs to, and
    // "today" is EngineDerived.DayDate (the civil World.Date before the first day roll) — never the civil
    // date, which during band 4 is already tomorrow. null = not a datetime stamp (the library warns).
    daysSince: (sd, stamp) => {
      const civil = String(stamp).slice(0, 10);
      const g = civilToGame(civil, String(stamp).slice(11, 16));      // null when the stamp carries no HH:MM
      const stampDay = g ? g.gameDate : civil;
      if (dayNum(stampDay) == null) return null;
      return daysBetween(stampDay, playedDay(sd));
    },
    // The WHEN-DSL sugar as DATA: a `*` in the key captures a paren argument or a segment and lands in the
    // path. The pack builder offers these KEYS beside the library's own forms (DaysSince), joined off the
    // running bundle. Every entry is a SPELLING of a path the raw-path read could take as-is; none computes.
    aliases: {
      Date: 'EngineDerived.DayDate',              // day IDENTITY (an event never fires "tomorrow" during band 4); T stays the civil position
      Wkd: 'World.Weekday',
      T: 'World.Time',                            // civil position-in-day (venue-hours semantics); HH:MM compares lexically
      Mode: 'EngineDerived.Mode',
      Loc: 'World.Location',
      Grade: 'EngineDerived.Grade',
      Loop: 'EngineDerived.ArcLoop',
      'MC.*': 'Mainchar.*',
      'Aff(*)': 'Classmate.*.Affection',
      'Stage(*)': 'Classmate.*.RelationshipStage',
      'Trait(*).*': 'Classmate.*.*',
      'Quest(*).Step': 'Mainchar.Quests.*.Step',       // LIVE progress within a day — never a chain's ORDER (that is flag:, the library's marker)
      'SpineDone(*)': 'EventSpine.fired.*.Status',       // the main story's OWN record: SpineDone(Entrance_Ceremony_2026_04_08)=Completed
    },
    presence: 'Classmate.*.Is_present',                              // Present(Name): this path, === true
    sugar: [],                                                       // no COMPUTED form: every School spelling above is an alias
    // ⚠ MANDATORY SYNC with timeLeap (below): the scope VALUES the arc reset distinguishes — the words
    // only, never what they mean. The library stores a row's scope verbatim on its done-marker; timeLeap
    // reads it back and clears every marker that is not 'save'. The pack builder reads this list off the
    // export and offers exactly these, and the installer can report a row naming any other. A value
    // timeLeap matches but this list omits is never OFFERED; a value listed here but not matched recurs
    // next loop silently — hence one spelling each.
    scopes: ['save', 'arc'],
    // WHERE an installed community pack's worldbook entry goes in this card's prompt. mvu-helper writes it
    // onto every pack entry it installs. After the player's line (depth 0), where the narrator plans from —
    // the slot School's own beats use — but at order 750, below Armed_Event (993) and the official
    // Event_Body entries (994): the lorebook drops a lower order first when its budget runs out.
    bodyEntry: { position: 'at_depth_as_system', depth: 0, order: 750 },
    get: (t, d) => get(t, d),                                        // tuple [value,"Label"] unwrap
    getArmed: (sd) => String(get(readAtPath(sd, armedSegs), '')),
    getStepDone: (sd) => String(get(readAtPath(sd, stepDoneSegs), '')),
    setStepDone: (sd, v) => {
      let node = sd;
      for (const seg of stepDoneSegs.slice(0, -1)) node = node[seg] || (node[seg] = {});   // create IN PLACE, never replace
      setVal(node, stepDoneSegs[stepDoneSegs.length - 1], v);
    },
    setArmed: (sd, v) => {
      let node = sd;
      for (const seg of armedSegs.slice(0, -1)) node = node[seg] || (node[seg] = {});   // create IN PLACE, never replace
      setVal(node, armedSegs[armedSegs.length - 1], v);
    },
    warn: (message) => warnRes(message),                             // the library's warn channel (a DaysSince path that resolves to nothing, a missing hook)
  };
  // P4b — derived from the ONE declaration each. Returns undefined the moment a segment is missing or
  // non-traversable, so every caller decides its own empty (getArmed → '', getStepDone → '').
  function readAtPath(root, segs) {
    let node = root || {};
    for (const seg of segs) {
      if (!node || typeof node !== 'object') return undefined;
      node = node[seg];
    }
    return node;
  }
  const armedSegs = EVENT_PACK_ADAPTER.armedPath.split('.');
  // The day-spine STEP CURSOR — declared HERE and deliberately NOT as an adapter path field.
  // The adapter's dotted paths are the PLATFORM contract: mvu-helper reads them off this export to learn
  // where this engine keeps EVENT state it must itself read or write. mvu-helper never touches this
  // cursor — only the engine does, through eventpack's applyStepDone — so declaring it there would
  // publish a path the platform has no use for (its reader takes the fields it knows by name and ignores
  // the rest, so nothing would catch the mistake). Same shelf as
  // BlockReplyCount / ClocklessStreak / DayDate: engine bookkeeping, not a contract surface.
  // getStepDone/setStepDone stay in the adapter because eventpack calls them — they are FUNCTIONS,
  // which the platform's path contract does not describe.
  const STEP_DONE_PATH = 'EngineDerived.LastStepDone';
  const stepDoneSegs = STEP_DONE_PATH.split('.');
  // Thin wrappers keep every call site unchanged. Missing lib (a bake without the eventpack prelude)
  // is surfaced loudly — events silently never firing is exactly the bug class we refuse to hide.
  function scanEvents(statData, log) {
    if (!EVENTPACK_API) { warnRes('eventpack.cjs missing (no require, no __EVENTPACK__ prelude) — events disabled', null); return false; }
    return EVENTPACK_API.scanEvents(statData, log, EVENT_PACK_ADAPTER);
  }
  // SAME-ROUND MISS / LOST — this engine's own verdict. mvu-helper only reports which event's DO body its [PRE]
  // seam injected into THIS reply (ctx.sameRoundEventKey); it never judges whether the beat landed. The player has
  // already read that beat, so when it did not fire there are two outcomes, and neither may read as ordinary:
  //   MISS — the end-of-turn scan ARMED it instead: the same beat replays next reply.
  //   LOST — it is not armed either: nothing records the beat (no fired marker, no writes, no reward) and it plays
  //          again whenever its conditions next hold. Typical cause: [PRE] flagged a one-away event, narrate played
  //          it, and the reply never met the missing condition, so verify-at-fire rejected it at both ends.
  // Judged off the fire result and the armed POINTER after the scan, never off log text. Call it after the scan,
  // on a reply that is not a re-fire; firedKey is the key applyEventFire fired this reply, '' when none fired.
  function noteSameRoundMiss(statData, ctx, log, firedKey, reportedKey) {
    const key = String((ctx && ctx.sameRoundEventKey) || '');
    if (!key || firedKey === key) return false;
    let line;
    if (EVENT_PACK_ADAPTER.getArmed(statData) === '@' + key) {
      line = 'SAME-ROUND MISS @' + key + ' — its body was injected and played this reply, but no /Intent/eventFire for it applied, so it is ARMED instead and the beat replays next reply. Check the play→fire contract for that event.';
    } else {
      line = 'SAME-ROUND LOST @' + key + ' — its body was injected and played this reply, but '
        + (reportedKey === key
          ? 'verify-at-fire REJECTED its /Intent/eventFire: its conditions held neither when this reply began nor after its move, so the [PRE] eventReady flag named a condition the reply never met'
          : 'no /Intent/eventFire for it came')
        + '. It is not armed either, so nothing records the beat the player read, and it plays again whenever its conditions next hold.';
    }
    warnRes(line);
    log.push('⚠ ' + line);
    return true;
  }
  // ARMED LOST — the armed path's twin of SAME-ROUND LOST. An event ARMED when this reply began had its body
  // delivered to narrate by Window A (## EVENTS) as this reply's spine. If it did not fire and the end-of-turn
  // scan no longer names it — disarmed because the reply moved off its conditions, or replaced by another winner
  // — nothing records the beat narrate was ordered to play, and it arms again whenever its conditions next hold.
  // Without this line the only trace is "EVENT ARMED -> …", which reads like an ordinary scan. Still armed means
  // it replays next reply, which is not a loss. startState is resolveTurn's pre-mutation snapshot; firedKey and
  // reportedKey as for noteSameRoundMiss. Call it after the scan, on a reply that is not a re-fire.
  function noteArmedLost(statData, startState, log, firedKey, reportedKey) {
    const key = startState ? EVENT_PACK_ADAPTER.getArmed(startState).replace(/^@/, '') : '';
    if (!key || firedKey === key) return false;
    const nowArmed = EVENT_PACK_ADAPTER.getArmed(statData);
    if (nowArmed === '@' + key) return false;
    const line = 'ARMED LOST @' + key + ' — it was armed when this reply began, so ## EVENTS delivered its body as the reply\'s spine, but '
      + (reportedKey === key ? 'verify-at-fire REJECTED its /Intent/eventFire' : 'no /Intent/eventFire for it came')
      + ', and the end-of-reply scan ' + (nowArmed ? 'armed ' + nowArmed + ' in its place' : 'disarmed it (its conditions no longer hold)')
      + '. Nothing records the beat narrate was ordered to play; it arms again whenever its conditions next hold.';
    warnRes(line);
    log.push('⚠ ' + line);
    return true;
  }
  // The report reaches the library ONE BAND AT A TIME, in band order. The walk is the same as one call (sorted,
  // contiguous, each band opening at .1), but between bands this sees where the cursor stopped — the only moment
  // a band finished and then walked out of is visible — and stamps it into EngineDerived.SpineBandsDone.
  // An unparseable token rides the first band's call, so the library still names it.
  function applyStepDone(statData, reportStr, currentBand, log) {
    if (!EVENTPACK_API) { warnRes('eventpack.cjs missing (no require, no __EVENTPACK__ prelude) — stepDone dropped', null); return false; }
    const byBand = new Map(), unparsed = [];
    for (const raw of String(reportStr).split(',')) {
      const tok = raw.trim();
      if (!tok) continue;
      const m = /^(\d+)\.\d+$/.exec(tok);
      if (!m) { unparsed.push(tok); continue; }
      if (!byBand.has(+m[1])) byBand.set(+m[1], []);
      byBand.get(+m[1]).push(tok);
    }
    const bands = [...byBand.keys()].sort((a, b) => a - b);
    if (!bands.length) return EVENTPACK_API.applyStepDone(statData, reportStr, currentBand, log, EVENT_PACK_ADAPTER);
    byBand.get(bands[0]).push(...unparsed);
    const counts = spineStepCounts(statData);
    const stampDone = () => {
      if (!counts) return;
      const list = [...spineBandsDone(statData, counts)].sort((a, b) => a - b).join(',');
      if (list !== String(get((statData.EngineDerived || {}).SpineBandsDone, ''))) setVal(statData.EngineDerived, 'SpineBandsDone', list);
    };
    stampDone();                                   // a band finished on an earlier reply, before the cursor leaves it
    let moved = false;
    for (const b of bands) {
      if (EVENTPACK_API.applyStepDone(statData, byBand.get(b).join(','), currentBand, log, EVENT_PACK_ADAPTER)) moved = true;
      stampDone();
    }
    return moved;
  }
  // startState: resolveTurn's pre-mutation snapshot, the state this reply began on. The fire passes when the
  // event held there OR after this reply's scene move — so an armed or ripe beat the player walks away from
  // still counts, and a one-away place his move completes still counts.
  function applyEventFire(statData, fireStr, log, startState) {
    if (!EVENTPACK_API) { warnRes('eventpack.cjs missing (no require, no __EVENTPACK__ prelude) — eventFire dropped: ' + fireStr, null); return false; }
    return EVENTPACK_API.applyEventFire(statData, fireStr, log, EVENT_PACK_ADAPTER, startState || null);
  }
  // P8 §6.6 — the EJS1 SWEEP wrapper: the candidate lines the card's [PRE] block injects for PRE to match
  // the user's input against, kept to the needs this reply can meet (canThisReplyMeet). Read-only (no state
  // write). Missing lib ⇒ [] (no candidates, never throws).
  function sweepCandidateLines(statData) {
    if (!EVENTPACK_API || typeof EVENTPACK_API.sweepCandidateLines !== 'function') return [];
    return EVENTPACK_API.sweepCandidateLines(statData, EVENT_PACK_ADAPTER).filter((line) => canThisReplyMeet(sweepNeedToken(line)));
  }
  // v4 same-reply firing — the ZERO-away companion to the sweep above. sweepCandidateLines lists only
  // triggers ONE condition from firing; a trigger whose WHEN already holds is excluded as "ready, not a
  // candidate", so [PRE] could not see a ripe event at all and it could only arrive via arm-now/
  // play-next-reply. Returns the ONE winner scanEvents would arm (never a list — see eventpack's
  // eligibleWinner), or null. Read-only: it OFFERS, RES still arms and still verifies at fire.
  // Missing lib ⇒ null (nothing ready, never throws) — same contract as the sweep's [].
  function readyEvent(statData) {
    if (!EVENTPACK_API || typeof EVENTPACK_API.readyEvent !== 'function') return null;
    return EVENTPACK_API.readyEvent(statData, EVENT_PACK_ADAPTER);
  }
  // SAME-REPLY FIRING — mvu-helper's pickSameRoundEvent hook. After the [PRE] calls, mvu-helper hands this the
  // state those calls read (the base floor) and their outputs (ctx.preOutputs = [{ name, output, appliedOps }]). The key
  // that comes back plays THIS reply (mvu-helper injects its @key body) and returns to resolveTurn as
  // ctx.sameRoundEventKey, where noteSameRoundMiss judges it. mvu-helper reads no field of ours and calls none of
  // the functions above (genre-blind audit, 2026-10-04 — it used to do both). The verdict field is OUR [PRE]
  // contract (output-pre.txt "eventReady"), and the only keys it may name are the ones OUR [PRE] Event_Candidates
  // block offered, on this very state: one condition away (sweepCandidateLines) or ripe now (readyEvent). A key
  // outside that set is stale or invented, and playing it would put a beat in the prose that verify-at-fire then
  // refuses, so it is never handed to narrate. Read-only: it PROPOSES, RES still verifies at fire.
  //
  // A PLACE NEED IS THE ENGINE'S CALL, NOT [PRE]'s. When an offered event waits only on {{user}} reaching a place
  // (`need Loc in {…}` / `need Loc=X`), whether his line gets him there is decided HERE, from [PRE]'s observation
  // "destination" — the Location key of the place his line moves him to this reply, looked up in the location table
  // <Event_Candidates> prints. A small model asked "does his move meet this need?" judged 中庭 (School_Courtyard)
  // to be School_Grounds and played a beat the fire could never back (live 2026-10-05). So a place event plays
  // when the destination meets its need, whether or not [PRE] flagged it, and never when it does not. [PRE]'s
  // eventReady still decides a ripe event (the timing call) and the other needs (an approach, her Affection rising).
  const EVENT_READY_RE = /"eventReady"\s*:\s*"([^"]*)"/;
  const DESTINATION_RE = /"destination"\s*:\s*"([^"]*)"/;
  // The first non-"none" value of a [PRE] field across the calls' outputs — the FIELD decides, not which call carried it.
  function preField(preOutputs, re) {
    for (const o of (Array.isArray(preOutputs) ? preOutputs : [])) {
      const m = re.exec(String((o && o.output) || ''));
      if (!m) continue;
      const v = m[1].trim();
      if (v && v.toLowerCase() !== 'none') return v;
    }
    return '';
  }
  // A sweep line is `<key> · need <token>[ · now <value>]`; its key, and its ONE unmet token.
  const sweepLineKey = (line) => String(line || '').trim().split(' ')[0];
  function sweepNeedToken(line) {
    const m = /^\S+ · need (.*?)(?: · now .*)?$/.exec(String(line || '').trim());
    return m ? m[1] : '';
  }
  // A place need: the token's left-hand side is the scene location (the Loc alias or its raw path).
  function isPlaceNeed(token) {
    const p = token ? EVENTPACK_API.parseToken(token) : null;
    if (!p || (p.kind !== 'in' && p.kind !== 'cmp')) return false;
    return (EVENTPACK_API.expandAlias(p.lhs, EVENT_PACK_ADAPTER) || p.lhs) === EVENT_PACK_ADAPTER.aliases.Loc;
  }
  // A need THIS reply can meet, decided before the narrator writes — the only kinds the sweep offers [PRE]:
  //   a place          the engine checks [PRE]'s "destination" against it (destinationMeets, below)
  //   Present(<girl>)  [PRE] flags it when his line brings her in; the beat it plays puts her there
  //   her Affection    [PRE] flags it when his line acts to raise it; the number is checked when the beat fires
  // Every other need waits on something no line of his moves (the date, the time, the calendar's Mode, a stage,
  // another event's marker, an item…), so a flag on it plays a beat verify-at-fire then refuses, after the prose
  // already showed it. Such an event is not offered one condition away; it plays the reply it is ripe (readyEvent).
  const AFFECTION_PATH = /^Classmate\.[^.]+\.Affection$/;
  function canThisReplyMeet(token) {
    if (isPlaceNeed(token)) return true;
    const p = token ? EVENTPACK_API.parseToken(token) : null;
    if (!p || p.neg) return false;
    if (p.kind === 'present') return true;
    return p.kind === 'cmp' && (p.op === '>=' || p.op === '>')
      && AFFECTION_PATH.test(EVENTPACK_API.expandAlias(p.lhs, EVENT_PACK_ADAPTER) || p.lhs);
  }
  // Does a move to `destination` meet that need? The event grammar decides, on a copy standing at `destination`.
  function destinationMeets(statData, token, destination) {
    if (!destination) return false;
    const at = snapshot(statData);
    if (!at) return false;
    at.World = at.World || {};
    setVal(at.World, 'Location', destination);
    return !!EVENTPACK_API.evalTokens(at, token, EVENT_PACK_ADAPTER);
  }
  // The pure half, for the tests: { key, note } — key '' plays nothing; note is the line worth logging, or ''.
  function sameRoundVerdict(statData, preOutputs) {
    const key = preField(preOutputs, EVENT_READY_RE);
    const destination = preField(preOutputs, DESTINATION_RE);
    const ripe = readyEvent(statData);
    const ripeKey = (ripe && ripe.key) ? String(ripe.key) : '';
    const lines = sweepCandidateLines(statData);
    const notes = [];
    if (key && key === ripeKey) return { key: key, note: '' };
    if (key) {
      const line = lines.find((l) => sweepLineKey(l) === key);   // the whole key, so leila_1 never matches leila_10
      const need = line ? sweepNeedToken(line) : '';
      if (line && !isPlaceNeed(need)) return { key: key, note: '' };
      if (line && destinationMeets(statData, need, destination)) return { key: key, note: '' };
      // An EMPTY offer is a verdict too, never an abstention: with nothing offered, every key is refused.
      notes.push(line
        ? 'eventReady="' + key + '" waits on a place (need ' + need + '), and [PRE] reports destination ' + (destination ? '"' + destination + '"' : 'none') + ', which does not meet it — refused; it plays once he is really there'
        : 'eventReady="' + key + '" is not an event [PRE] was offered this reply' + ((lines.length || ripeKey) ? '' : ' (it was offered none)') + ' — ignored; it plays via the arm on the reply after it truly ripens');
    }
    // The destination's own pick: every offered place event it meets, then the same arbitration the scan uses.
    const met = destination ? lines.filter((l) => { const need = sweepNeedToken(l); return isPlaceNeed(need) && destinationMeets(statData, need, destination); }).map(sweepLineKey) : [];
    if (met.length) {
      const at = snapshot(statData);
      if (at) { at.World = at.World || {}; setVal(at.World, 'Location', destination); }
      const win = at ? EVENTPACK_API.eligibleWinner(at, EVENT_PACK_ADAPTER) : null;
      const pick = (win && met.indexOf(win.key) >= 0) ? win.key : met[0];
      notes.push('[PRE] reports destination "' + destination + '", which meets ' + pick + '\'s place need — it plays this reply');
      return { key: pick, note: notes.join(' · ') };
    }
    // MAKE A DECLINE VISIBLE. A [PRE] that declines every ripe offer reads exactly like a feature that never works.
    if (!key && ripeKey) notes.push('ripe event "' + ripeKey + '" was OFFERED and PRE did not flag it — it arms and plays next reply. Declines here every reply mean same-reply firing is effectively off.');
    return { key: '', note: notes.join(' · ') };
  }
  function pickSameRoundEvent(statData, ctx) {
    const verdict = sameRoundVerdict(statData, ctx && ctx.preOutputs);
    if (verdict.note) notePre(verdict.note);
    return verdict.key;
  }
  // THE H BOUNDARY, OPENED ON THE PRE RAIL — mvu-helper's preVerdictPatch hook. The H rules, the ## INTIMACY panel
  // (her act-gate DCs) and her <Personality_HScene> render from PendingState.IntimacyActive and Is_present when the
  // narrator's prompt is built. [PRE] flags the line that crosses into H (output-pre.txt "hcue") and, while no scene
  // runs, rolls that crossing as ONE PhysicalRequest on a girl whose crossing roll is owed (isCrossingRollOwed: her first
  // H with him). The latch opens here when that check is WON, or with no roll when a girl in the scene has had H with
  // him, so the narrator writes the scene in the reply that shows it; a LOST crossing leaves it shut — she refused, and
  // RES applies the failure like any check's. The check is read from the ops [PRE]'s patch applied
  // (ctx.preOutputs[].appliedOps, mvu-helper's own parse: the ops that landed) and judged by owedCrossingOutcomes.
  // Every heroine [PRE] puts on stage joins the scene the way (2i) joins a heroine an H channel names. With nobody in
  // the scene or on stage there is no one to open it with, so the latch is left to the narrator's "enter".
  const HCUE_RE = /"hcue"\s*:\s*"([^"]*)"/;
  const ON_STAGE_RE = /"onStage"\s*:\s*"([^"]*)"/;
  // The /Intent/check value [PRE]'s patches applied this attempt ('' when none): the last write wins, as it did in state.
  function preAppliedCheck(preOutputs) {
    let value = '';
    for (const o of (Array.isArray(preOutputs) ? preOutputs : [])) {
      for (const op of (Array.isArray(o && o.appliedOps) ? o.appliedOps : [])) {
        if (op && op.path === '/Intent/check/0' && (op.op === 'replace' || op.op === 'add')) value = String(op.value == null ? '' : op.value);
      }
    }
    return value;
  }
  // The pure half, for the tests: { ops, note } — ops [] writes nothing; note is the line worth logging, or ''.
  function hBoundaryVerdict(statData, preOutputs) {
    if (!statData || typeof statData !== 'object') return { ops: [], note: '' };
    if (preField(preOutputs, HCUE_RE).toUpperCase() !== 'H') return { ops: [], note: '' };
    if (get((statData.PendingState || {}).IntimacyActive) === true) return { ops: [], note: '' };   // the scene already runs
    const CM = statData.Classmate || {};
    const isBuilt = (k) => !!(CM[k] && typeof CM[k] === 'object' && String(get(CM[k].Name, '')).trim());
    const joining = preField(preOutputs, ON_STAGE_RE).split(',').map((k) => k.trim())
      .filter((k, i, all) => k && all.indexOf(k) === i && isBuilt(k) && get(CM[k].Is_present, false) !== true);
    const isAnyonePresent = Object.keys(CM).some((k) => isBuilt(k) && get(CM[k].Is_present, false) === true);
    if (!isAnyonePresent && !joining.length) {
      return { ops: [], note: '[PRE] flagged the H boundary (hcue "H") with nobody in the scene or on stage — the latch waits for the narrator\'s /Intent/intimacy "enter"' };
    }
    const appliedCheck = preAppliedCheck(preOutputs);
    const crossing = owedCrossingOutcomes(CM, appliedCheck);
    const crossingKeys = Object.keys(crossing).filter(isBuilt);
    const wonKeys = crossingKeys.filter((k) => isWonOutcome(crossing[k]));
    const verdicts = (keys) => keys.map((k) => k + ' ' + crossing[k]).join(', ');
    const inScene = Object.keys(CM).filter((k) => isBuilt(k) && (get(CM[k].Is_present, false) === true || joining.indexOf(k) >= 0));
    const pastFirstKeys = inScene.filter((k) => !isCrossingRollOwed(CM[k]));
    // A PhysicalRequest [PRE] rolled on a girl past her first H with him is an ordinary check here, not her yes.
    const strayKeys = Object.keys(physicalRequestOutcomes(appliedCheck)).filter((k) => isBuilt(k) && !(k in crossing));
    const strayNote = strayKeys.length ? ' (' + strayKeys.join(', ') + ' has had H with him: the PhysicalRequest [PRE] rolled on her is an ordinary check, not the crossing)' : '';
    let opened;
    if (wonKeys.length) opened = 'the crossing PhysicalRequest was WON (' + verdicts(wonKeys) + ')';
    else if (crossingKeys.length) {
      return { ops: [], note: '[PRE] flagged the H boundary (hcue "H") and the crossing PhysicalRequest was LOST (' + verdicts(crossingKeys) + ') — the latch stays shut: she refused' + strayNote };
    } else if (pastFirstKeys.length) opened = pastFirstKeys.join(', ') + ' has had H with him, so no crossing roll is owed' + strayNote;
    else {
      return { ops: [], note: '[PRE] flagged the H boundary (hcue "H") but its patch applied no PhysicalRequest on the crossing — the latch stays shut: her first H with him is rolled first' };
    }
    const loc = String(get((statData.World || {}).Location, ''));
    const ops = [{ op: 'replace', path: '/PendingState/IntimacyActive/0', value: true }];
    for (const k of joining) {
      ops.push({ op: 'replace', path: '/Classmate/' + k + '/Is_present/0', value: true });
      ops.push({ op: 'replace', path: '/Classmate/' + k + '/Location/0', value: loc });
    }
    return { ops, note: '[PRE] flagged the H boundary (hcue "H") and ' + opened + ' — H latch armed for THIS reply, so the H rules and the ## INTIMACY panel load before the narrator writes'
      + (joining.length ? '; ' + joining.join(', ') + ' joined the scene (on stage, @' + loc + ')' : '') };
  }
  function preVerdictPatch(statData, ctx) {
    const verdict = hBoundaryVerdict(statData, ctx && ctx.preOutputs);
    if (verdict.note) notePre(verdict.note);
    return verdict.ops;
  }
  // NEXT UNLOCK — what still stands between a series quest and its next beat, written into the quest
  // record's NextUnlock for the quest card. The card's Objective names the place and the time; it cannot
  // say that the beat also waits on the calendar and on how close she is to {{user}}. This reads both off
  // the next row's own gate, every resolve:
  //   a date floor   DaysSince(…)>=N · Date>=X          → "from <the first game-day it opens>"
  //   a bond floor   Affection>=N · RelationshipStage    → "Affection 30 (now 24)" · "Dating (now Friend)"
  //   anything else  place, time, company, an item       → not said: the Objective already names it
  // Nothing of the first two left → "ready". Series over → ''. A whenAny row is described by its CLOSEST
  // alternative (fewest unmet date and bond tokens, declaration order on a tie). An unmet prereq that is not
  // a date floor means the chain is not at this row, so nothing true can be said → ''.
  // Display only: narrate never sees it (Window A drops GameEvent quests from ## QUESTS), no gate reads it,
  // and it never touches LastUpdated.
  const BOND_PATH = /^Classmate\.[^.]+\.(Affection|RelationshipStage)$/;
  const lhsPath = (lhs) => EVENTPACK_API.expandAlias(lhs, EVENT_PACK_ADAPTER) || lhs;
  // The first game-day an unmet date token opens on, or '' when the token is not a date floor.
  function dateFloorOf(sd, p) {
    if (!p || p.neg || p.kind !== 'cmp' || (p.op !== '>=' && p.op !== '>')) return '';
    const step = p.op === '>' ? 1 : 0;
    if (/^DaysSince\(/i.test(p.lhs) && /^\d+$/.test(p.rhs)) {
      const days = EVENTPACK_API.resolveLHS(sd, p.lhs, EVENT_PACK_ADAPTER);
      return Number.isFinite(days) ? addIso(playedDay(sd), Number(p.rhs) + step - days) : '';
    }
    if (lhsPath(p.lhs) === EVENT_PACK_ADAPTER.aliases.Date && dayNum(p.rhs) != null) return addIso(p.rhs, step);
    return '';
  }
  // "Affection 30 (now 24)" / "Dating (now Friend)" for an unmet bond token, or '' when it is not one.
  function bondTextOf(sd, p) {
    if (!p || p.neg) return '';
    const m = BOND_PATH.exec(lhsPath(p.lhs || ''));
    if (!m) return '';
    const now = EVENTPACK_API.resolveLHS(sd, p.lhs, EVENT_PACK_ADAPTER);
    if (m[1] === 'Affection') {
      if (p.kind !== 'cmp' || (p.op !== '>=' && p.op !== '>') || !/^\d+$/.test(p.rhs)) return '';
      return 'Affection ' + (Number(p.rhs) + (p.op === '>' ? 1 : 0)) + ' (now ' + now + ')';
    }
    const set = p.kind === 'in' ? p.set : (p.kind === 'cmp' && (p.op === '=' || p.op === '==')) ? [p.rhs] : null;
    if (!set || !set.length) return '';
    // The lowest rung the set accepts; off-ladder names rank last, set order breaks a tie.
    const rank = (s) => (INITIATIVE_ORD[s] === undefined ? Infinity : INITIATIVE_ORD[s]);
    const lowest = set.reduce((a, b) => (rank(b) < rank(a) ? b : a));
    return lowest + ' (now ' + now + ')';
  }
  // Unmet tokens of one &-chain, sorted into the date floor, the bond texts and the rest.
  function unlockGaps(sd, chain) {
    const out = { floor: '', bond: [], other: 0 };
    for (const raw of String(chain || '').split('&')) {
      const tok = raw.trim();
      if (!tok || tok === '-' || EVENTPACK_API.evalOne(sd, tok, EVENT_PACK_ADAPTER)) continue;
      const p = EVENTPACK_API.parseToken(tok);
      const floor = dateFloorOf(sd, p);
      if (floor) { if (floor > out.floor) out.floor = floor; continue; }
      const bond = bondTextOf(sd, p);
      if (bond) out.bond.push(bond);
      else out.other++;
    }
    return out;
  }
  function nextUnlockText(sd, row) {
    const pre = unlockGaps(sd, row.prereq);
    if (pre.other) return '';
    const alts = (Array.isArray(row.whenAny) && row.whenAny.length) ? row.whenAny : [row.when];
    const size = (g) => (g.floor ? 1 : 0) + g.bond.length;
    let best = null;
    for (const alt of alts) {
      const g = unlockGaps(sd, alt);
      if (!best || size(g) < size(best)) best = g;
    }
    const floor = [pre.floor, best.floor].sort().pop();
    const parts = (floor ? ['from ' + floor] : []).concat(pre.bond, best.bond);
    return parts.length ? parts.join(' · ') : 'ready';
  }
  // THE SERIES QUEST CARD — the fields of a series quest record the engine keeps, every resolve:
  //   NextUnlock  what the next beat still waits on (above).
  //   Desc        the series' own, when the record has none. A series writes Desc on its first row only, so a
  //               record a later row creates (the player deleted the quest, then the next beat fired) would carry
  //               none for the rest of the series. Filled only when blank, so an edited Desc stays.
  // A series not begun has no record and gets none made: a missing record reads the same either way.
  function refreshSeriesQuestCards(sd, log) {
    if (!EVENTPACK_API) return;                     // scanEvents names the missing library on every resolve
    const table = readAtPath(sd, EVENT_PACK_ADAPTER.triggerRoot.split('.')) || {};
    const quests = (sd.Mainchar || {}).Quests || {};
    const questWriteOf = (row) => ((row.fx || {}).writes || []).find((x) => x && x.path === 'Mainchar.Quests' && x.key);
    const series = new Map();                       // series → { quest, next, desc } — next = its first row not yet fired
    for (const key of Object.keys(table)) {
      const row = table[key];
      if (!row || !row.series) continue;
      const s = series.get(row.series) || { quest: '', next: null, desc: '' };
      const w = questWriteOf(row);
      if (!s.quest && w) s.quest = String(w.key);
      const desc = w && w.set && typeof w.set.Desc === 'string' ? w.set.Desc.trim() : '';
      if (!s.desc && desc) s.desc = desc;
      if (!s.next && !EVENTPACK_API.evalOne(sd, 'flag:' + key, EVENT_PACK_ADAPTER)) s.next = row;
      series.set(row.series, s);
    }
    for (const s of series.values()) {
      const rec = s.quest && quests[s.quest];
      if (!rec || typeof rec !== 'object' || String(get(rec.Type, '')) !== 'GameEvent') continue;   // not begun, or {{user}}'s own quest
      if (s.desc && !String(get(rec.Desc, '')).trim()) {
        rec.Desc = s.desc;
        log.push('QUEST DESC ' + s.quest + " ← the series' own (the record had none)");
      }
      const text = s.next ? nextUnlockText(sd, s.next) : '';
      if (String(get(rec.NextUnlock, '')) === text) continue;
      rec.NextUnlock = text;
      log.push('NEXT UNLOCK ' + s.quest + ' → ' + (text || '(blank)') + (s.next ? '' : ' — every row of the series has fired'));
    }
  }
  // initiative-by-PRE — the INITIATIVE gate (the DETERMINISTIC half of <Initiative_system>): per heroine
  // (present AND absent) freq band · cooldown vs LastInitiative · unlocked types · low-init/estranged holds.
  // PURE derivation from stat_data (no writes). SPLIT decision-from-rendering (2026-08-18): the gate
  // used to exist only inside its rendered prose — eligibility/freqIdx/hold were never DATA a test could
  // assert, so a reworded menu broke tests for nothing while a flipped gate could hide behind stable
  // wording (L6: a guard never seen to fail is not known to be a guard). initiativeGate returns the
  // decision rows; initiativeMenu renders them. KEEP IN SYNC WITH <Initiative_system> [TYPES]/gates.
  const INITIATIVE_FREQ = ['almost never', 'occasional', 'regular', 'frequent+forward'];
  // RelationshipStage → ladder position for the T2-T5 unlocks. Estranged is KNOWN-and-absent BY DESIGN
  // (initiative held, confront/closure overrides only). Any OTHER unlisted value is an UNRECOGNIZED
  // enum — a stage added to the pack without a ladder row here, or a localized/invented value written
  // into the field — and it is surfaced loudly instead of silently riding the estranged hold: the two
  // used to share one `ord === undefined` branch, so every future stage would quietly strip a girl's
  // initiative with no warn anywhere (no-fallback rule: split the log by CAUSE).
  const INITIATIVE_ORD = { Stranger: 0, Acquaintance: 1, Friend: 2, Dating: 3, Friends_With_Benefits: 3, Loyal_Puppy: 3, Girlfriend: 4 };
  // The decision as DATA. Returns [{ key, inScene, stage, hold, types, freqIdx, rare, neverInitiated,
  // wouldAct }] for every NAMED heroine (blank shells never initiate). `types` already includes the
  // conflict overrides; `hold` '' = free to act, else the reason (overrides still ride past it).
  function initiativeGate(statData) {
    const CM = statData.Classmate || {}, W = statData.World || {};
    const V = (t) => (Array.isArray(t) ? t[0] : t);
    const present = [], absent = [];
    for (const k of Object.keys(CM)) {
      const c = CM[k];
      if (!c || typeof c !== 'object') continue;
      (V(c.Is_present) === true ? present : absent).push(k);
    }
    const todayN = dayNum(V(W.Date));
    const rows = [];
    for (const k of present.concat(absent)) {
      const c = CM[k] || {}; if (!String(V(c.Name) || '').trim()) continue;      // blank shells never initiate
      const inScene = present.indexOf(k) >= 0;
      const a = Number(V(c.Affection)) || 0;
      const soc = Number(V(c.Sociability)) || 50;
      const stage = String(V(c.RelationshipStage) || 'Acquaintance');
      const ord = INITIATIVE_ORD[stage];
      const stageUnknown = ord === undefined && stage !== 'Estranged';
      if (stageUnknown) {
        warnRes('INITIATIVE: UNRECOGNIZED RelationshipStage "' + stage + '" on ' + k + ' — not in the INITIATIVE_ORD ladder and not Estranged. Initiative HELD (conflict overrides still apply). Two causes: a NEW stage was added to the pack without adding its ladder row here, or a localized/invented value was written into the enum (i18n rule: English keys only)');
      }
      const kind = Number(V(c.Kindness)) || 50;
      const pride = Number(V(c.Pride)) || 50;
      const hag = Number(V(c.Hagaruro)) || 50;
      const isInConflict = V(c.ConflictActive) === true;
      const over = [];
      // Both conflict overrides are TRAIT-GATED. T6 asks "does anger make HER step forward?" — pride
      // (she will not be slighted) · sociability (she engages rather than withdraws) · Hagaruro (the
      // scorned-schemer axis, the same >60 the rumor sweep reads). A girl under all three answers anger
      // with silence, and silence IS her response — offering her "confront" flattens the cast, since
      // `over` is concatenated AFTER the !hold block and so bypasses every hold below, the conflict one too.
      if (isInConflict) {
        if (pride > 60 || soc > 60 || hag > 60) over.push('T6-confront');
        if (kind > 60 || a >= 60) over.push('T7-apology');
      }
      // SOCIABILITY BANDS — >80 outgoing, 30-80, <30 reserved. The cooldown, the freq eagerness step and the
      // low-init hold all read these two, so one boundary moves every rule that hangs on it.
      const isOutgoing = soc > 80;
      const isReserved = soc < 30;
      // COOLDOWN in whole days from the date of her LastInitiative stamp: outgoing rests 3 days, the middle
      // band 5, reserved 7. Stamped on day D, she is free again from day D+N, whatever the hour, so a full
      // cast of known heroines reaches out a few times a day between them, not every block.
      const restDays = isOutgoing ? 3 : isReserved ? 7 : 5;
      const last = String(V(c.LastInitiative) || '').trim();
      const lastDay = last ? dayNum(last) : null;
      const cool = (lastDay != null && todayN != null && todayN - lastDay < restDays)
        ? 'resting ' + restDays + 'd, free ' + new Date((lastDay + restDays) * 86400000).toISOString().slice(0, 10)
        : '';
      // IN CONFLICT she is offered her T6/T7 overrides and nothing else: a girl in an open rift does not
      // greet, invite or flirt with him as if nothing happened, and the hold names why on PRE's menu.
      const hold = (isReserved && a < 40) ? 'low-init rule'
                 : stageUnknown ? 'UNRECOGNIZED stage "' + stage + '" — held (fix the enum)'
                 : ord === undefined ? 'estranged — confront/closure only'
                 : isInConflict ? 'in conflict'
                 : cool;
      let types = [];
      if (!hold) {
        if (inScene) {
          if (a >= 20) types.push('T1-casual');
          if (a >= 35 && ord >= 1) types.push('T2-activity');
          if (a >= 50 && ord >= 2) types.push('T3-flirt');
          if (a >= 55 && ord >= 2) types.push('T4-emotional');
          if (a >= 60 && ord >= 3) types.push('T5-physical');
        } else if (a >= 45) types.push('T8-offscene');
      }
      types = types.concat(over);
      const wouldAct = inScene ? a >= 20 : a >= 45;
      const freqIdx = Math.max(0, Math.min(3, (a >= 81 ? 3 : a >= 61 ? 2 : a >= 41 ? 1 : 0) + (isOutgoing ? 1 : isReserved ? -1 : 0)));
      rows.push({ key: k, inScene, stage, hold, types, freqIdx, rare: isReserved, neverInitiated: !last, wouldAct });
    }
    return rows;
  }
  // Thin RENDERER over initiativeGate — prose only, zero decisions. Both narrate's ## INITIATIVE and
  // the [PRE] <Initiative_Menu> entry call it LIVE. Returns the newline menu string.
  function initiativeMenu(statData) {
    const holds = [];
    let out = '';
    for (const r of initiativeGate(statData)) {
      if (!r.types.length) { if (r.hold && r.wouldAct) holds.push(r.key + ' (' + r.hold + ')'); continue; }
      out += '· ' + r.key + (r.inScene ? '' : ' (absent)') + ': freq ' + INITIATIVE_FREQ[r.freqIdx] + (r.rare ? ' (rare = write it BIG)' : '') +
        ' | ' + r.types.join(' ') + (r.neverInitiated ? ' | never initiated' : '') + (r.hold ? ' | OVERRIDE only — ' + r.hold : '') + '\n';
    }
    if (holds.length) out += '(hold: ' + holds.join(' · ') + ')\n';
    if (!out) out = '(none eligible — no classmate initiates this reply)\n';
    return out;
  }
  // v4 Next-Block PREVIEW (v1-style flag model): where the manual Next-Block advance WILL land — the
  // new Time (and Date/Weekday/Mode/Label on a day roll) — computed WITHOUT mutating anything. Window A
  // (current_variable_data) calls this when PendingState.BlockDone is set, so narrate WRITES the reply on
  // the advanced clock the SAME turn RES actually commits the advance (no click-time resolve, no
  // 1-reply lag). MIRRORS the day/block math in resolveTurn's (3) advance block — keep the two in sync.
  // Pure read; returns { time, date, weekday, mode, label, dayRoll, timeLeap } (null only if statData is junk).
  function previewNextBlock(statData) {
    if (!statData || typeof statData !== 'object') return null;
    const EngineDerived = statData.EngineDerived || {}, W = statData.World || {};
    const mode = String(get(EngineDerived.Mode, 'SCHOOL'));
    const freeClock = (mode === 'OPEN');
    const time = String(get(W.Time, SCHOOL_BLOCKS[0]));
    const civilIso = String(get(W.Date, '2026-04-08')).slice(0, 10);
    const g = civilToGame(civilIso, time) || { gameDate: civilIso, gameMin: 0, band: 0 };
    // SCHOOL mid-day -> step ONE band, same day. The band is DERIVED from the clock (never indexOf: a
    // drifted 08:20 must land band 0). Mirrors resolveTurn (3c) exactly.
    if (!freeClock && g.band < 3) {
      return { time: SCHOOL_BLOCKS[g.band + 1], date: civilIso,
        weekday: String(get(W.Weekday, '')), mode: mode, label: String(get(EngineDerived.DayLabel, '')),
        dayRoll: false, timeLeap: false };
    }
    // Else DAY ROLL — a SCHOOL day's evening/small hours, or any OPEN day. TODAY is the GAME-DAY
    // (EngineDerived.DayDate), never the civil date — during band 4 the civil date is already tomorrow.
    const todayIso = String(get(EngineDerived.DayDate, civilIso)).slice(0, 10);
    const todayRow = lookupDay(todayIso);
    if (todayRow && todayRow.spine === '@Graduation') {                 // Graduation = arc TIME-LEAP (coarse preview)
      return { time: SCHOOL_BLOCKS[0], date: todayIso, weekday: String(get(W.Weekday, '')),
        mode: mode, label: 'Graduation → a new school year begins', dayRoll: true, timeLeap: true };
    }
    const iso = (todayRow && todayRow.rollTo && todayRow.rollTo !== '+1') ? todayRow.rollTo : addIso(todayIso, 1);
    const wd = WD[new Date(iso + 'T00:00:00Z').getUTCDay()];
    const row = lookupDay(iso);
    const newMode = row ? row.mode : ((wd === 'Sat' || wd === 'Sun') ? 'OPEN' : 'SCHOOL');
    // RESUME RULE (same as settleDay, which RES runs): prose already inside the landed game-day keeps
    // its own clock; otherwise the landed morning start. Window A must not promise a morning the
    // resolver is about to refuse — the FENCE tests hold this pair together.
    const ahead = g.gameDate >= iso;
    return { time: ahead ? time : SCHOOL_BLOCKS[0], date: ahead ? civilIso : iso,
      weekday: ahead ? String(get(W.Weekday, '')) : wd, mode: newMode,
      label: row ? row.label : '', dayRoll: true, timeLeap: false };
  }

  // (v0.42.0 R5: refreshPreStashes is RETIRED with the stashes it refreshed. It was option B's
  //  pre-PRE hook — mvu-helper called it to freshen the stash before the [PRE] entries rendered.
  //  Option C (those entries calling this engine directly) makes the whole round trip unnecessary;
  //  mvu-helper's pre-stash.js is deleted in the same pass.)

  // ---- affection application with the daily cap -----------------------------------
  // DailyAffGain is her NET change today: a capped gain adds to it, and every fall subtracts what it actually
  // took, which is less than its delta when Affection hits the floor at 0. It may go below 0, so a girl hurt
  // earlier in the day can still rise a full DAILY_AFFECTION_CAP above where she began it. settleDay zeroes
  // it for the next game-day, and a stage change zeroes it for the new stage.
  function applyAffection(c, delta) {
    let gained = Number(get(c.DailyAffGain, 0)) || 0;
    const before = Number(get(c.Affection, 0)) || 0;
    if (delta > 0) {                               // the cap only limits gains
      const asked = delta;
      const room = Math.max(0, DAILY_AFFECTION_CAP - gained);
      delta = Math.min(delta, room);
      gained += delta;
      noteCappedGain(c, asked, delta);
    }
    const after = clamp(before + delta, 0, 100);
    if (delta < 0) gained -= Math.max(0, before) - after;   // the -1 just-advanced sentinel reads as 0, so its fall to 0 takes nothing
    setVal(c, 'DailyAffGain', gained);
    setVal(c, 'Affection', after);
    return delta;
  }
  // The log text for a change that went through applyAffection: `asked` is what the source was worth, `paid` what
  // applyAffection returned. Only the daily cap pays less than asked, and then the line says so, so a "+0" after a
  // warm scene names its cause.
  function affectionGainText(asked, paid) {
    return 'Aff ' + (paid >= 0 ? '+' : '') + paid + (paid < asked ? ' (daily cap ' + DAILY_AFFECTION_CAP + ' reached)' : '');
  }

  // THE CAP NOTE — the player's word on what the daily cap took from her on THIS reply. AffectionCapNote holds
  // affectionGainText of the reply's capped gains summed (what they asked, what they paid), so two cut gains on one
  // reply read as one line. It is written only when a capped source asked her for a gain and the cap paid less: a
  // reply that asks her for no capped gain, pays it in full, or only lowers her Affection leaves it ''. The stat box
  // prints it on that reply alone (a "whenSet" field in [Initmvuhelper]), so the next reply's resolve retires it,
  // on its idle path too (retireAffectionCapNotes), and empties the sums.
  let affectionCapSumsOfReply = new Map();
  function noteCappedGain(c, asked, paid) {
    const sums = affectionCapSumsOfReply.get(c) || { asked: 0, paid: 0 };
    sums.asked += asked;
    sums.paid += paid;
    affectionCapSumsOfReply.set(c, sums);
    if (sums.paid < sums.asked) setVal(c, 'AffectionCapNote', affectionGainText(sums.asked, sums.paid));
  }
  function retireAffectionCapNotes(CM) {
    affectionCapSumsOfReply = new Map();
    let isAnyRetired = false;
    for (const key of Object.keys(CM)) {
      const c = CM[key];
      if (c && typeof c === 'object' && String(get(c.AffectionCapNote, ''))) { setVal(c, 'AffectionCapNote', ''); isAnyRetired = true; }
    }
    return isAnyRetired;
  }

  // A STAGE MOVED UP: her daily ledger restarts for the new stage, and the game-day is stamped on PromotedOn so the
  // date-out still grades today as her full day (payDateOut) — the restart would otherwise read as a day she barely
  // had. Every promotion that restarts the ledger comes through here; a demotion does not.
  function restartLedgerOnPromotion(c, sd) {
    setVal(c, 'DailyAffGain', 0);
    setVal(c, 'PromotedOn', playedDay(sd));
  }

  // ---- route gates — run after any affection change to c. Takes sd+log so a ladder
  // advance also records the milestone into her ImportantEvents (update_analysis 5b) — pass them at every call site. ----
  function tryStageGate(c, sd, log) {
    const stage = String(get(c.RelationshipStage, ''));
    const aff = Number(get(c.Affection, 0)) || 0;
    if (CAPS_AT_100.indexOf(stage) >= 0) { if (aff > 100) setVal(c, 'Affection', 100); return null; } // cap, never reset
    if (stage === 'Dating') { if (aff > 100) setVal(c, 'Affection', 100); return null; }  // → Girlfriend needs a CONFESSION check
    if (aff >= 100 && LADDER[stage]) {                                                    // Stranger/Acquaintance/Friend auto-advance
      const next = LADDER[stage];
      setVal(c, 'RelationshipStage', next); setVal(c, 'Affection', -1); restartLedgerOnPromotion(c, sd);   // Aff -1 = FRESHLY-ADVANCED sentinel: below any reachable value (a fall clamps at 0), so -1 ⟺ just advanced (panel banner reads it; first Aff gain lifts her into 0-100)
      pushImportantEvent(c, stage + ' → ' + next, sd, log);                               // route history (v1 parity)
      return stage + ' -> ' + next + ' (Aff reset)';
    }
    return null;
  }

  // ---- MainChar attribute bump — TRAINING (one session of each kind per game-week, paying 1..3) or the CO-ACTIVITY
  // trickle (+1, at most once per stat per game-day: Mainchar.CoActivityStatsToday lists the stats already paid,
  // and the day roll and a time leap clear it). narrate reports Int/Str/Cha (MC_TRAINABLE); a PHYSICAL one (Str),
  // session or co-activity alike, goes to the coin's pick and passes on what that stat has no room for
  // (gainsWithinCap). The result lists only what landed (`gains`). An unknown stat, a repeat co-activity, a kind
  // already trained that week, or a gain with nowhere to land (the stat at 100; for a physical one, Str and Sta both)
  // is a no-op with a reason — and a no-op spends nothing: not the week, not the day's co-activity slot.
  //
  // THE TWO PATHS HOLD SEPARATE BUDGETS ON PURPOSE. Training is the player CHOOSING to spend a block on
  // themselves — study, gym, grooming — so it is the one the weekly limit governs: ONE session OF EACH KIND per
  // school week (Int = study, Str = physical, Cha = grooming), paying the full graded 1..3 into the stat it trains. The trickle is INCIDENTAL, a stat
  // that happened to be exercised by an activity done with someone else, so it keeps its own
  // per-stat-per-day cap and never burns the week's training. Neither reads the other's limit: studying with a
  // classmate on Monday does not cost Friday's gym, and Friday's gym does not use up a jog with her that day. ----
  function bumpMainchar(statData, stat, amount, isCoActivity) {
    const MC = statData.Mainchar;
    if (!MC || typeof MC !== 'object') return { ok: false, reason: 'no Mainchar' };
    if (MC_TRAINABLE.indexOf(stat) < 0) return { ok: false, reason: 'not a stat narrate reports: ' + stat + ' (Int/Str/Cha; a physical session is Str)' };
    if (isCoActivity) {
      const gained = String(get(MC.CoActivityStatsToday, '')).split(',').filter(Boolean);
      if (gained.indexOf(stat) >= 0) return { ok: false, reason: stat + ' already gained today' };
      const day = String(get((statData.EngineDerived || {}).DayDate, '')).slice(0, 10);
      const gains = gainsWithinCap(MC, stat === 'Str' ? physicalPair(pickPhysicalStat(MC, 'day ' + day)) : [stat], 1);   // co-activity trickle is always +1
      if (!gains.length) return { ok: false, reason: nothingToBuild(stat) };
      gained.push(stat); setVal(MC, 'CoActivityStatsToday', gained.join(','));
      for (const g of gains) setVal(MC, g.stat, g.value);
      return { ok: true, gains };
    }
    // ONE session OF EACH KIND per GAME-WEEK, paying its full graded 1..3. The kind is the stat narrate reported
    // (Int / Str / Cha — a physical session is Str wherever the coin lands it), and each kind is stamped with the
    // MONDAY of the week it was spent in: Mainchar.LastTrainingWeek = "Int:2026-04-06,Str:2026-04-06". A stamp
    // expires BY ITSELF: no week-end reset to forget, and a save that skips a settle cannot leak a free session.
    // The week is measured on the game-day (EngineDerived.DayDate), never the civil date — an all-nighter belongs
    // to the day it started, and so to that day's week.
    // An unknown day (junk state) does not BLOCK: the session pays, it just cannot be remembered,
    // because refusing a legitimate session is worse than allowing a second one. A stamp without a kind (a save
    // from before the per-kind rule) blocks nothing, for the same reason.
    const week = weekOf(get((statData.EngineDerived || {}).DayDate, ''));
    const spent = trainingWeeksOf(MC);
    if (week && spent[stat] === week) return { ok: false, reason: 'already trained ' + stat + ' the week of ' + week + ' — one session of each kind per week' };
    amount = clamp(Number(amount) || 0, 1, 3);        // the graded session pays in full
    const gains = gainsWithinCap(MC, stat === 'Str' ? physicalPair(pickPhysicalStat(MC, week)) : [stat], amount);   // the coin meets the state before the gain
    // Nothing to build leaves this kind's week unspent.
    if (!gains.length) return { ok: false, reason: nothingToBuild(stat) + ' (the week stays unspent)' };
    if (week) {
      spent[stat] = week;
      // Only this week's stamps are kept: an older one has already expired, so dropping it changes nothing.
      setVal(MC, 'LastTrainingWeek', MC_TRAINABLE.filter((k) => spent[k] === week).map((k) => k + ':' + week).join(','));
    }
    for (const g of gains) setVal(MC, g.stat, g.value);
    return { ok: true, gains };
  }

  // Mainchar.LastTrainingWeek -> { Int: '2026-04-06', ... }, one Monday per kind of session already spent.
  function trainingWeeksOf(MC) {
    const weeks = {};
    for (const part of String(get(MC.LastTrainingWeek, '')).split(',')) {
      const [kind, week] = part.split(':');
      if (week && MC_TRAINABLE.indexOf(kind) >= 0) weeks[kind] = week.slice(0, 10);
    }
    return weeks;
  }

  // ---- NEGLECT RETALIATION — deterministic; checked on DAY ROLL ----
  // A scorned schemer (Dating+ & Hagaruro>60) ignored >14 days spreads rumors: 5 other classmates lose 20.
  function neglectSweep(statData, log) {
    const CM = statData.Classmate || {}, W = statData.World || {};
    const EngineDerived = statData.EngineDerived || (statData.EngineDerived = {});
    const today = String(get(W.Date, ''));
    const fired = [];
    for (const key of Object.keys(CM)) {
      const c = CM[key]; if (!c || typeof c !== 'object') continue;
      const stage = String(get(c.RelationshipStage, ''));
      const hag = Number(get(c.Hagaruro, 0)) || 0;
      if (NEGLECT_STAGES.indexOf(stage) < 0 || hag <= 60) continue;
      if (daysBetween(get(c.TimeSinceLastSeen, today), today) <= 14) continue;
      const others = Object.keys(CM).filter((k) => k !== key && CM[k] && typeof CM[k] === 'object');
      // DETERMINISTIC shuffle (hashStr, seeded by day+scorned key+index) — same day/scorner → same victims, so a
      // re-fire/swipe/test is idempotent (was Math.random, which broke the "deterministic" contract above · D4).
      for (let i = others.length - 1; i > 0; i--) { const j = hashStr(today + '|' + key + '|' + i) % (i + 1); const t = others[i]; others[i] = others[j]; others[j] = t; }
      const victims = others.slice(0, 5);
      for (const v of victims) setVal(CM[v], 'Affection', Math.max(0, (Number(get(CM[v].Affection, 0)) || 0) - 20));
      setVal(c, 'ConflictActive', true);
      setVal(c, 'TimeSinceLastSeen', today + ' 00:00');   // re-stamp so it can't re-fire until another 14 days
      fired.push(key);
      log.push('NEGLECT: ' + key + ' (scorned schemer) spread rumors → ' + victims.length + ' classmates −20 Aff');
    }
    // NARRATION CUE (story_analysis 4c): expose the swept key(s) so Window A can tell the narrator to WRITE the
    // rumor fallout next reply (whispers / cooled greetings, deniable per her Hag). Cleared by the NEXT resolve.
    if (fired.length) setVal(EngineDerived, 'NeglectFired', fired.join(','));
  }

  // ---- CAST KEY RESOLUTION (Doc/cast-registry-design.md) ------------------------------------------
  // A key is an ADDRESS; FullName is an IDENTITY CLAIM. Collapsing them is what lets one person become two
  // records and two people share one. Both are looked up, every build, and the five outcomes are named.
  const normFullName = (v) => String(v == null ? '' : v).trim().replace(/\s+/g, ' ').toLowerCase();
  // Latin only, because code COMPARES this. A native-script display name and its romanisation are one
  // girl, and only one of the two spellings can be matched against a stored one — so the contract names
  // which, and a name that is not in it is refused rather than coerced. A key is permanent; a coerced key is a bad guess kept forever.
  const FULLNAME_OK = /^[A-Za-z][A-Za-z0-9 .'-]*$/;
  const castMemberBuilt = (CM, k) => !!(CM[k] && typeof CM[k] === 'object' && String(get(CM[k].Name, '')).trim());

  // Row 4's new address, derived by CODE from FullName — never by the model. That is the whole point: the
  // given-name-first question ("夏乃うめ" is written surname-first) becomes one line here instead of a rule
  // narrate has to remember mid-prose. Ume + "Ume Natsuno" -> Ume_Natsuno. A number is the last resort and
  // seeing one in a log means something upstream is wrong.
  function qualifyCastKey(baseKey, fullName, CM) {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    const family = parts.length > 1 ? parts[parts.length - 1].replace(/[^A-Za-z0-9]/g, '') : '';
    const cand = family ? (baseKey + '_' + family) : baseKey;
    if (!CM[cand]) return cand;
    for (let n = 2; n <= 99; n++) { if (!CM[cand + n]) return cand + n; }
    return '';
  }

  // Returns { row, key, other } — `row` is the table in the design doc and every caller logs it by name.
  // A record built before FullName existed reads as INDETERMINATE, and indeterminate resolves to the
  // conservative answer (same person) rather than minting: splitting a live character's state is silent
  // and hard to notice, a missing new one warns and is obvious.
  function resolveCastKey(proposedKey, fullName, CM) {
    const key = String(proposedKey || '').trim();
    const fn = normFullName(fullName);
    const byKey = castMemberBuilt(CM, key) ? key : '';
    let byName = '';
    if (fn) {
      for (const k of Object.keys(CM)) {
        if (k === '$meta' || k === '$key' || k === 'template' || !castMemberBuilt(CM, k)) continue;
        if (normFullName(get(CM[k].FullName, '')) === fn) { byName = k; break; }
      }
    }
    if (!byKey) return byName ? { row: 'renamed', key: byName } : { row: 'new', key: key };
    const heldName = normFullName(get(CM[byKey].FullName, ''));
    if (!heldName || heldName === fn) return { row: 'already', key: byKey };
    if (byName) return { row: 'contradiction', key: '', other: byName };
    return { row: 'collision', key: qualifyCastKey(key, fullName, CM), other: byKey };
  }

  // ---- build a full Classmate record from the AI's compact /Intent/newClassmate object ----
  const CM_LABELS = {
    Name: 'Name', FullName: 'Full Name', Age: 'Age', Gender: 'Gender', Race: 'Race', Occupation: 'Occupation', Identity: 'Identity',
    Height: 'Height', Cup_Size: 'Cup Size', Body_Measurements: 'Measurements', Hair_Style: 'Hair Style',
    Physical_Features: 'Physical Features', Persona: 'Persona', Biography: 'Biography', Secret: 'Secret', Image: 'Image',
    Sta: 'Stamina', Int: 'Intelligence', Cha: 'Charisma', Pride: 'Pride', Morals: 'Morals',
    Elegance: 'Elegance', Sociability: 'Sociability', Kindness: 'Kindness', Hagaruro: 'Hagaruro',
  };
  // The nine that drive every number in the game (DC ladder, initiative gates, H-stage math) …
  const CM_TRAITS = ['Sta', 'Int', 'Cha', 'Pride', 'Morals', 'Elegance', 'Sociability', 'Kindness', 'Hagaruro'];
  // … and her STARTING H submission, the tenth number on her TRAITS line. Not a trait: each H scene's count moves it
  // from here (−100 she rules him … +100 she is his), and her band reads it from her first H scene.
  const CM_M_LEVEL_RANGE = [-100, 100];
  // … and the fields that only ever reach a player's eyes.
  const CM_SOFT = ['Age', 'Gender', 'Race', 'Occupation', 'Identity', 'Height', 'Cup_Size', 'Body_Measurements',
    'Hair_Style', 'Physical_Features', 'Image', 'Biography', 'Secret', 'Hobbies'];
  // Every archetype <Personality_Archetypes> defines — the only values Persona may hold. The personality system
  // reads it (her voice block, PERSONA_SPOT placement), and a value it does not know gives her no voice and no
  // venue, silently, for good. Pinned equal to the entry's @keys and <Classmate_Guide>'s list by test_resolver.
  const PERSONA_ARCHETYPES = ['Bashful_Girl', 'Big_Sister', 'Bookworm', 'Bright', 'Class_Clown', 'Competitive',
    'Delinquent', 'Friendly', 'Glamorous', 'Highborn_Lady', 'Mellow_Girl', 'Otaku', 'Party_Girl', 'Pure_Innocent',
    'Sadistic_Tease', 'Sexy', 'Shy_Girl', 'Tomboy', 'Traditional_Lady', 'Wild_Child', 'Yandere'];

  function buildClassmate(p, statData) {
    const proposed = String((p && (p.key || p.Key)) || '').trim();
    if (!/^[A-Za-z0-9_]+$/.test(proposed)) return { ok: false, reason: 'bad key "' + proposed + '"' };
    const CM = statData.Classmate || (statData.Classmate = {});
    // FullName is MANDATORY and Latin-only, because it is the identity claim the five-row check compares.
    // Refused, never coerced: without it every rebuild of an existing key would read as row 4 and mint a
    // duplicate of a girl who already exists.
    const fullName = String((p && (p.FullName || p.fullName)) || '').trim();
    if (!fullName) return { ok: false, reason: proposed + ' has no FullName (mandatory — it is what tells an existing cast member apart from a new one)' };
    if (!FULLNAME_OK.test(fullName)) return { ok: false, reason: proposed + ' FullName "' + fullName + '" is not Latin script (it is compared against stored names, so it cannot be localized — Name carries the display spelling)' };
    // ALL OR NOTHING — a HALF-BUILT heroine is worse than none. Every field below silently defaults if it is
    // missing (nine traits to 50, Persona to 'Bright', M_level to 0), and a default is indistinguishable from a
    // copied value once it is in state: she plays as an average girl with the wrong archetype and a Neutral H
    // band, forever, and nothing ever says so. The record either carries what drives her or it is refused whole
    // and the reply retries.
    // MECHANICAL ONLY: these are the fields the game does MATH and BEHAVIOUR with. A missing Biography shows up
    // as an empty line a player can see; a missing Kindness shows up as a DC that is quietly wrong.
    const missing = [];
    if (!String((p && p.Name) || '').trim()) missing.push('Name');
    if (!String((p && p.Persona) || '').trim()) missing.push('Persona');
    for (const t of CM_TRAITS.concat('M_level')) {
      const v = (p || {})[t];
      if (v == null || v === '' || !isFinite(Number(v))) missing.push(t);
    }
    if (missing.length) {
      return { ok: false, reason: proposed + ' is INCOMPLETE — missing/unreadable: ' + missing.join(', ') +
        '. Refused whole rather than built with defaults (nine traits would read 50, Persona "Bright" and M_level 0, ' +
        'which is indistinguishable from copied values once it is in state). Her <character> card carries all ' +
        'of them, so the next reply can build her properly.' };
    }
    const persona = String(p.Persona).trim();
    if (PERSONA_ARCHETYPES.indexOf(persona) < 0) {
      return { ok: false, reason: proposed + ' Persona "' + persona + '" is not an archetype — Persona must be one of ' +
        PERSONA_ARCHETYPES.join(', ') + ', spelled exactly. Refused whole, so the next reply can build her with one.' };
    }
    // HER DISPLAY NAME CAME BACK IN THE OTHER SCRIPT. A card prints BOTH spellings (`Mitsuki Tachibana`
    // and `橘美月`) because the prose needs the native one whatever the GUI shows,
    // and <Classmate_Guide> names which half to record from Preferences.Lang. So 'wrong' is not 'non-Latin' —
    // it is 'disagrees with the language this save runs in', which is the only form of the check that is true
    // for an English card AND a Chinese one. Reported, never rewritten: a record in the other script is
    // legible, and an engine that silently swapped halves would hide the prompt that produced it.
    {
      const displayName = String((p && p.Name) || '');
      const lang = String(get(((statData || {}).Preferences || {}).Lang, 'en-US'));
      const hasCjk = /[\u3040-\u30ff\u4e00-\u9fff]/.test(displayName);
      const wantsNative = /^(zh|ja|ko)/i.test(lang);
      if (hasCjk !== wantsNative) {
        noteRes('classmate ' + proposed + ' built with Name "' + displayName + '" in the '
          + (hasCjk ? 'NATIVE' : 'LATIN') + ' script while this save runs ' + lang + ' — her card prints the '
          + (hasCjk ? 'Latin' : 'native') + ' spelling too, and that is the half <Classmate_Guide> asks '
          + 'for on this save; this record will show in a different script from the rest of the cast');
      }
    }
    // SOFT GAPS — prose and display, never math. She builds; the note says what is thin, gated behind the
    // pipeline debug domain because it is a quality report, not an incident.
    {
      const thin = CM_SOFT.filter((k) => !String((p || {})[k] || '').trim());
      if (thin.length) noteRes('classmate ' + proposed + ' built with EMPTY ' + thin.join(', ') +
        ' — copied from her <character> card, so a gap means narrate skipped the line, not that the card lacks it');
    }
    const verdict = resolveCastKey(proposed, fullName, CM);
    if (verdict.row === 'already') return { ok: false, reason: verdict.key + ' already exists' };
    if (verdict.row === 'renamed') return { ok: false, reason: fullName + ' is already built as ' + verdict.key + ' — /Intent/newClassmate proposed the new key "' + proposed + '" for her, which would have split one person across two records' };
    if (verdict.row === 'contradiction') return { ok: false, reason: 'key "' + proposed + '" and FullName "' + fullName + '" name DIFFERENT existing cast members (' + proposed + ' vs ' + verdict.other + ') — refusing rather than guessing which was meant' };
    if (verdict.row === 'collision' && !verdict.key) return { ok: false, reason: 'no free key for ' + fullName + ' — "' + proposed + '" and every qualified form are taken' };
    const key = verdict.key;
    const collisionNote = verdict.row === 'collision'
      ? 'key "' + proposed + '" already belongs to ' + String(get(CM[verdict.other].FullName, '')) + ' — ' + fullName + ' gets ' + key
      : '';
    // A genuinely-built classmate has a non-empty Name. An EMPTY SHELL — produced when a stray
    // /Classmate/<key>/* patch (e.g. Thoughts) in the SAME reply auto-vivifies the record and schema
    // reconciliation back-fills every field as ["",""] — must be FILLED here, not skipped: her profile
    // lives only in the transient /Intent/newClassmate, so a skip consumes and loses it forever.
    const existing = CM[key];   // a SHELL at this point — resolveCastKey already refused a built one
    const W = statData.World || {};
    const now = String(get(W.Date, '')) + ' ' + String(get(W.Time, ''));
    const S = (k, d) => [p[k] != null ? String(p[k]) : d, CM_LABELS[k] || k];
    const N = (k, d) => [clamp(Number(p[k] != null ? p[k] : d) || d, 0, 100), CM_LABELS[k] || k];
    CM[key] = {
      // --- profile (copied verbatim from her <character> card by the AI) ---
      // Age default is 18 — this world is declared all-adult, so a card missing the line must not
      // land a minor in live state. Every shipped Lore card carries an explicit Age, so this default
      // is the floor for a hand-built or malformed one, never the normal path.
      Name: S('Name', key), FullName: S('FullName', ''), Age: S('Age', '18'), Gender: S('Gender', 'Female'), Race: S('Race', 'Human'),
      Occupation: S('Occupation', 'Student'), Identity: S('Identity', 'Classmate'),
      Height: S('Height', ''), Cup_Size: S('Cup_Size', ''), Body_Measurements: S('Body_Measurements', ''),
      Hair_Style: S('Hair_Style', ''), Physical_Features: S('Physical_Features', ''),
      Persona: S('Persona', 'Bright'), Biography: S('Biography', ''), Secret: S('Secret', ''), Image: S('Image', ''),
      // --- 9 traits (copied from her profile's TRAITS line; STATIC) ---
      Sta: N('Sta', 50), Int: N('Int', 50), Cha: N('Cha', 50), Pride: N('Pride', 50), Morals: N('Morals', 50),
      Elegance: N('Elegance', 50), Sociability: N('Sociability', 50), Kindness: N('Kindness', 50), Hagaruro: N('Hagaruro', 50),
      // --- relationship + pulse (runtime defaults) ---
      RelationshipStage: ['Acquaintance', 'Stage'], Affection: [0, 'Affection'], DailyAffGain: [0, 'Daily Gain'], AffectionCapNote: ['', 'Affection Cap Note'], PromotedOn: ['', 'Promoted On'],
      Mood: ['Neutral', 'Mood'], Embarrassment: ['none', 'Embarrassment'], Guilt: ['none', 'Guilt'],
      ConflictActive: [false, 'Conflict'], Is_present: [true, 'Present'],
      // --- NSFW (initial 0 so the menu shows real values, not ???) ---
      Energy: [100, 'Energy'], Arousal: [0, 'Arousal'], Lewdness: [0, 'Lewdness'], ClimaxGauge: [0, 'ClimaxGauge'],
      M_level: [clamp(Number(p.M_level), CM_M_LEVEL_RANGE[0], CM_M_LEVEL_RANGE[1]), 'M_level'],   // her card's starting submission
      Exp_Caress: [0, 'Exp Caress'], Exp_Oral: [0, 'Exp Oral'],
      Exp_Vaginal: [0, 'Exp Vaginal'], Exp_Anal: [0, 'Exp Anal'], H_Count: [0, 'H Count'],
      // Pass 3 H-state (seed so a mid-game-built classmate carries them from turn 1, never lazy-created):
      EdgeStreak: [0, 'EdgeStreak'], HClimaxed: ['', 'HClimaxed'], HView: ['', 'HView'],
      Ahegao: [false, 'Ahegao'], AhegaoPenalty: [false, 'AhegaoPenalty'],
      HPosition: ['', 'HPosition'],   // Pass 4.1 — current H position (panel shows it; narrator greens it once)
      HScene: ['', 'HScene'],         // Pass 4.3 — per-scene growth guard ('yes'/'first' once an act lands) — RES-owned, cleared on latch exit
      HBeatsHers: [0, 'Her Beats'], HBeatsHis: [0, 'His Beats'],   // the scene's submission count (countSubmissionBeat) — RES-owned, cleared at scene end
      // --- containers + util ---
      Hobbies: (p.Hobbies ? { General: { Desc: String(p.Hobbies) } } : {}),
      ImportantEvents: {}, Friends: {}, Belongings: {},
      Location: [String(get(W.Location, 'School_Class11')), 'Location'],
      TimeSinceLastSeen: [now, 'Last Seen'], LastInitiative: ['', 'Last Initiative'], Thoughts: ['', 'Thoughts'],
      Base100: [100, 'Base100'], Base400: [400, 'Base400'],
    };
    // Carry over anything meaningful the shell already held so a build-over-shell never loses ground:
    // the Thoughts line the AI just wrote this reply, and any Affection already accrued.
    if (existing) {
      const t = get(existing.Thoughts, ''); if (t) setVal(CM[key], 'Thoughts', t);
      const aff = Number(get(existing.Affection, 0)) || 0; if (aff > 0) setVal(CM[key], 'Affection', clamp(aff, 0, 100));
    }
    return { ok: true, key: key, filled: !!existing, persona: String(get(CM[key].Persona, '')), note: collisionNote };
  }

  // ---- CALENDAR write (yearschedule) — set the LANDED day's facts on EngineDerived so Window A can surface them
  // (Mode + the day LABEL/CHECK/@SPINE the narrator plays). A listed anchor row wins; an unlisted day falls back
  // to the weekday default (Mon-Fri SCHOOL / Sat-Sun FREE) with no label/check/spine. MODE logs only on change. ----
  // 文化祭 is the one series that runs on records written days earlier: the 出し物 vote (文化祭準備 → d1 builds
  // what won) and d1's own booth result (→ d2 places the class by it). NEITHER is load-bearing — the spine
  // writes out what to do when a record is absent, so no beat can stall — but a missing one means a beat
  // silently lost its input, and that is worth seeing while you read the turn.
  // The two are written by DIFFERENT hands, because they are different kinds of fact. The vote is NARRATE's:
  // the class argued and chose, and only the prose knows what won. The booth result is the ENGINE's: PRE deals
  // a d20 for it and deriveOutcome() owns the word, so RES writes that record itself (recordBoothShowing).
  // ⚠ The vote marker is the LITERAL the prep spine orders narrate to emit; the booth marker is the literal
  // recordBoothShowing writes. Tools/test_resolver.cjs holds each marker to the hand that writes it.
  const FEST_RECORD = { CULTURE: '文化祭: the class is running', 'SCHOOL-FESTIVAL': '文化祭: the booth' };
  // Returns the marker the day WANTED and did not find, or '' when nothing is owed or the log has it.
  // PURE and exported, because the note it feeds cannot be tested: under Node there is no window, so
  // noteRes is a no-op. The DECISION is what has to be right, so the decision is what a test can reach.
  function festivalRecordMissing(statData, spine, check) {
    const need = (spine === '@Cultural_Festival') ? FEST_RECORD[check] : null;
    if (!need) return '';
    const EV = ((statData || {}).WorldRecord || {}).Events || {};
    for (const k of Object.keys(EV)) if (String((EV[k] || {}).summary || '').indexOf(need) >= 0) return '';
    return need;
  }
  // d1's booth showing, WRITTEN DOWN BY RES from the die alone. CULTURE freezes a d20 on DayCheckRoll and
  // that roll IS how the booth did; this record is the only place it survives, because the next day's landing
  // wipes the die with its day. Narrate is not asked for it — the word is not an observation of its own prose,
  // it is the die's, and the engine has held it since PRE dealt it. It also cannot travel through narrate:
  // /Intent/recordEvent carries ONE "scope|summary" per reply, so a ripe event beat on the same day-closing
  // reply takes the slot and the booth's showing is lost with nothing failing anywhere.
  // NO die (PRE never rolled it, or d1 was jumped over) → nothing is written and nothing is invented; the d2
  // note then reports a real forfeit. Keyed by the DAY, so a re-settle overwrites rather than duplicates, and
  // s_-prefixed like every other story record so it can never collide with a trigger key.
  const BOOTH_WORD = { CritSuccess: 'packed out', Success: 'did steady business', Failure: 'stayed quiet', CritFail: 'was a washout' };
  function recordBoothShowing(statData, row, iso, log) {
    if (!row || row.spine !== '@Cultural_Festival' || row.check !== 'CULTURE') return '';
    const r = parseKeyedFields(String(get(((statData || {}).EngineDerived || {}).DayCheckRoll, '')));
    const rawDie = Number(r.rawdie), total = Number(r.total), dc = Number(r.dc);
    if (!Number.isFinite(rawDie) || !Number.isFinite(total) || !Number.isFinite(dc)) return '';
    const outcome = deriveOutcome(rawDie, total, dc);
    const summary = FEST_RECORD['SCHOOL-FESTIVAL'] + ' ' + BOOTH_WORD[outcome] + ' (CULTURE ' + outcome + ')';
    logWorldEvent(statData, 's_booth_' + iso, summary, 'arc', log);
    return summary;
  }
  // ---- VALENTINE'S DAY — WHO GIVES, AND WHAT KIND. Ranked ONCE when the day lands and then HELD, because
  // gifts and ordinary beats move Affection while the day is still running: a list re-derived per reply would
  // hand the closing beat to one girl at lunch and a different one after school. Frozen like DayCheckRoll.
  // SCORE = how far along she is, plus how warm she is: INITIATIVE_ORD (the ONE stage ranking this card has —
  // a second table beside it would be the same concept under two names) plus Affection/100. A stage is worth
  // a full point and warmth orders girls inside it. The SEAMS are continuous: Stranger/Acquaintance/Friend
  // auto-advance at 100, so a Friend tops out at 2.99 and a freshly-advanced Dating girl scores 3.00 — she ranks
  // just above the girl who was one point from becoming her, which is the same seam rule the DC ladder holds.
  // CEILINGS TIE EXACTLY (Dating, Girlfriend and the branches all hold at 100), and two Dating girls
  // at 100 is ordinary in a harem run — so hashStr(date+Key) breaks ties: stable all day, different between
  // years, and never alphabetical, which would hand the same girl the closing beat every February.
  // The -1 freshly-advanced sentinel is clamped to 0 first, or she would tie a Friend at 99.
  // ABSENCE IS NOT A FILTER: the day's own first beat is a note in his shoe locker, so a girl who is not in
  // the scene can still give. A blank shell has nobody to give.
  const VAL_HONMEI = 2.7;        // 本命 — a Friend at Aff 70+, or anyone Dating and above: the confession-proxy gift
  const VAL_TOMO = 2.0;          // 友チョコ — Friend
  const VAL_GIRI = 1.0;          // 義理 — Acquaintance; below this (Stranger) she gives nothing
  const VAL_HONMEI_MAX = 3;      // a late-game roster must not hand out a dozen true-feelings gifts
  function rankValentineGifts(sd, iso) {
    const CM = (sd || {}).Classmate || {};
    const rows = [];
    for (const k of Object.keys(CM)) {
      const c = CM[k];
      if (!c || typeof c !== 'object') continue;
      if (!String(get(c.Name, '')).trim()) continue;              // a blank shell has nobody to give
      const ord = INITIATIVE_ORD[String(get(c.RelationshipStage, ''))];
      if (ord === undefined) continue;                            // unknown stage — initiativeGate already warns
      const aff = Math.min(100, Math.max(0, Number(get(c.Affection, 0)) || 0));
      rows.push({ k: k, score: ord + aff / 100, tie: hashStr(iso + k) });
    }
    rows.sort((a, b) => (b.score - a.score) || (a.tie - b.tie) || (a.k < b.k ? -1 : 1));
    const taken = {}, honmei = [];
    for (const r of rows) {
      if (honmei.length >= VAL_HONMEI_MAX) break;
      if (r.score < VAL_HONMEI) break;                            // rows are sorted, so the first miss ends it
      honmei.push(r); taken[r.k] = 1;
    }
    const tomo = rows.filter((r) => !taken[r.k] && r.score >= VAL_TOMO);   // includes anyone past the 本命 cap
    const giri = rows.filter((r) => !taken[r.k] && r.score >= VAL_GIRI && r.score < VAL_TOMO);
    // THE DAY HAS TWO BEATS WORTH A NAME, so the ranking fills those rather than a count: the biggest gift
    // takes the after-school closer, and the nervous one gets it over with before the bell.
    const close = honmei.length ? honmei[0].k : (tomo.length ? tomo[0].k : '');
    let early = '';
    if (honmei.length > 1) early = honmei[honmei.length - 1].k;
    else if (tomo.length) early = tomo[0].k;
    if (early === close) early = '';                              // one giver cannot hold both beats
    const names = (list) => list.map((r) => r.k).join(',');
    return 'early:' + early + ';close:' + close + ';honmei:' + names(honmei) +
           ';tomo:' + names(tomo) + ';giri:' + giri.length;
  }
  function applyCalendarDay(statData, iso, wd, log) {
    const EngineDerived = statData.EngineDerived || (statData.EngineDerived = {});
    const row = lookupDay(iso);
    const weekend = (wd === 'Sat' || wd === 'Sun');
    const mode = row ? row.mode : (weekend ? 'OPEN' : 'SCHOOL');
    if (String(get(EngineDerived.Mode, 'SCHOOL')) !== mode) { setVal(EngineDerived, 'Mode', mode); log.push('MODE -> ' + mode + ' (' + (row ? row.label : wd) + ')'); }
    setVal(EngineDerived, 'DayDate', iso);                     // the game-day IDENTITY — calendar key for every Day* sibling
    setVal(EngineDerived, 'DayLabel', row ? row.label : '');
    setVal(EngineDerived, 'DayCheck', row ? row.check : (weekend ? 'DATEOUT' : ''));   // unlisted weekend = a date-out day
    setVal(EngineDerived, 'DaySpine', row ? row.spine : '');
    setVal(EngineDerived, 'DayCheckRoll', '');                 // the day's die dies with its day — the landed day rolls afresh, or not at all
    // バレンタイン — rank the class for THIS day as it lands, and blank on every other day so last February's
    // answer can never be read as this one's. Same life as the die above: decided once, held all day.
    setVal(EngineDerived, 'ValentineGifts',
      (row && row.spine === '@Valentines_Day') ? rankValentineGifts(statData, iso) : '');
    // GATED (pipeline debug), never a warn: the day plays correctly either way — this reports a gap in the
    // data, not breakage, and the player must not be told about a channel they cannot act on.
    const festRow = row || {};
    const festMissing = festivalRecordMissing(statData, festRow.spine || '', festRow.check || '');
    if (festMissing) noteRes('文化祭 ' + (festRow.check === 'CULTURE' ? 'd1' : 'd2') + ' opened with no "' + festMissing +
      '" record on the world log — ' + (festRow.check === 'CULTURE'
        ? 'the 出し物 vote never landed (文化祭準備 skipped, or the emit was dropped), so the class opens the spine\'s default stall'
        : 'no CULTURE die was ever dealt on d1, so there is no booth result to record — the closing ceremony has nothing to place this class by and reads it out at the bottom'));
  }

  // ---- SCATTER (update_analysis 5c / story_analysis 1c) — on a block-change / DAY ROLL, re-place every ABSENT heroine
  // at her own plausible spot, so the off-scene roster isn't all frozen at one stale venue (Window-A prints these
  // @locations when {{user}} goes looking for someone). PRESENT heroines are with {{user}} at World.Location → untouched.
  // ENGINE-OWNED, deterministic — NO AI decide (PORT_MAP Cluster 8 1c collapses here): ~1/3 land at her PERSONA spot,
  // the rest spread across the time-slot pool; the pick seeds off date+block+Key (hashStr), so it's stable within a
  // block and reproducible in tests. Venues are <Location_List> Area_Venue tags. ----
  const SLOT_POOL = {
    SCHOOL_AM:    ['School_Classroom', 'School_Library', 'School_Courtyard', 'School_Hallway', 'School_Cafeteria', 'School_Rooftop'],
    SCHOOL_LUNCH: ['School_Cafeteria', 'School_Courtyard', 'School_Rooftop', 'School_Classroom', 'School_Library', 'School_Grounds'],
    AFTERCLASS:   ['School_ClubRoom', 'School_Library', 'School_Grounds', 'School_Gym', 'School_Courtyard', 'School_Rooftop'],
    EVENING:      ['Home_ClassmateRoom', 'Town_Cafe', 'Town_ShoppingStreet', 'Town_FamilyRestaurant', 'Town_Park', 'Home_ClassmateRoom'],
    OPEN:         ['Town_ShoppingMall', 'Town_Cafe', 'Town_Park', 'Town_ShoppingStreet', 'Outskirts_River', 'Town_Arcade', 'Town_Library', 'Home_ClassmateRoom'],
  };
  // persona → [school-time spot, free/evening spot] — the ~1/3 personality-flavored placement (fits her <Personality_Core> cluster).
  const PERSONA_SPOT = {
    Tomboy: ['School_Grounds', 'Town_Park'], Competitive: ['School_Grounds', 'Town_Park'],
    Wild_Child: ['School_Grounds', 'Outskirts_River'], Delinquent: ['School_BackYard', 'Town_Arcade'],
    Big_Sister: ['School_Cafeteria', 'Town_FamilyRestaurant'], Bookworm: ['School_Library', 'Town_Library'],
    Otaku: ['School_ClubRoom', 'Town_Arcade'], Highborn_Lady: ['School_JapaneseRoom', 'Town_Cafe'],
    Traditional_Lady: ['School_JapaneseRoom', 'Town_Cafe'], Party_Girl: ['School_Courtyard', 'Town_ShoppingMall'],
    Class_Clown: ['School_Courtyard', 'Town_Arcade'], Friendly: ['School_Cafeteria', 'Town_Cafe'],
    Glamorous: ['School_Courtyard', 'Town_ShoppingMall'], Sexy: ['School_Courtyard', 'Town_Cafe'],
    Bright: ['School_Courtyard', 'Town_ShoppingStreet'], Shy_Girl: ['School_Library', 'Home_ClassmateRoom'],
    Bashful_Girl: ['School_Infirmary', 'Home_ClassmateRoom'], Mellow_Girl: ['School_Rooftop', 'Home_ClassmateRoom'],
    Pure_Innocent: ['School_Courtyard', 'Home_ClassmateRoom'],
  };
  const venueSlot = (mode, time) => {
    if (mode === 'OPEN') return 'OPEN';   // uncapped day: the open-roam venue pool
    // DERIVED block, never `time === '12:00'` exact-match: with the real clock a lunch scene sits at
    // 12:47, and an exact match would silently fall through to SCHOOL_AM.
    const blk = bandFromTime(time);
    return blk === 1 ? 'SCHOOL_LUNCH' : blk === 2 ? 'AFTERCLASS' : (blk === 3 || blk === 4) ? 'EVENING' : 'SCHOOL_AM';
  };
  // WHERE each absent heroine stands, as a PURE derivation — no writes, no `log`. The venue is a
  // function of (Date, BLOCK, Mode, Persona, Key) alone — the hash keys off the DERIVED block, not the
  // raw clock, so it is STABLE while the clock drifts inside a block and re-rolls only on a block
  // crossing (a raw-clock hash would teleport every absent girl on every minute of drift). Returns
  // [{ key, venue }] for every built, absent heroine.
  function absentPlacements(statData) {
    const CM = statData.Classmate || {}, W = statData.World || {}, EngineDerived = statData.EngineDerived || {};
    const iso = String(get(W.Date, '')).slice(0, 10);
    const time = String(get(W.Time, '07:30'));
    const slot = venueSlot(String(get(EngineDerived.Mode, 'SCHOOL')), time);
    const schoolSlot = (slot === 'SCHOOL_AM' || slot === 'SCHOOL_LUNCH' || slot === 'AFTERCLASS');
    const pool = SLOT_POOL[slot] || SLOT_POOL.SCHOOL_AM;
    const out = [];
    for (const key of Object.keys(CM)) {
      const c = CM[key];
      if (!c || typeof c !== 'object') continue;
      if (get(c.Is_present, false) === true) continue;                 // present = at the scene with {{user}} → don't scatter
      if (!String(get(c.Name, '')).trim()) continue;                   // skip empty shells (never built)
      const h = hashStr(iso + '|B' + bandFromTime(time) + '|' + key);
      const spot = PERSONA_SPOT[String(get(c.Persona, ''))];
      out.push({ key, venue: (spot && h % 3 === 0) ? spot[schoolSlot ? 0 : 1] : pool[h % pool.length], slot });
    }
    return out;
  }

  // ---- PRE-ASSEMBLY PATCH (PRE_Call_Revisit P1) -----------------------------------
  // The engine's OWN patch, applied by mvu-helper on the PRE rail BEFORE any model runs this turn.
  // Genre-neutral name on purpose: the platform calls `preAssemblyPatch` without knowing what a
  // School turn puts in it (L1) — today, only the absent-heroine scatter.
  //
  // WHY IT LEFT RES (I4). `scatterAbsent` was RES's only ABSOLUTE + UNINFORMED Classmate write: it
  // overwrote Location without reading what was there, which was correct while RES was the sole
  // writer and became a hazard the moment PRE could write state too — a sim's Location "never stuck"
  // because end-of-turn RES stamped over it. Running the same derivation FIRST inverts that: every
  // model write this turn lands after it and survives the turn. This is the ownership migration I4
  // predicted — the RES half retires rather than learning to defer.
  //
  // ONLY THE DIFFERENCES. An op is emitted solely where the stored Location disagrees with the
  // derivation, so a mid-block re-run (every reply — this runs unconditionally) is an EMPTY patch and
  // the write happens on exactly the replies where the clock moved. That is what replaces RES's
  // "call it inside the advance branch" gating, with no new state field to track.
  //
  // Visibility is unchanged by the move: RES used to scatter at the END of turn N (post-advance), so
  // narrate first saw it in turn N+1. It now runs at turn N+1's assembly instead — the same reply,
  // one stage earlier. Nothing waits a turn (CLAUDE.md same-reply protection).
  function preAssemblyPatch(statData) {
    if (!statData || typeof statData !== 'object') return [];
    const ops = [];
    for (const p of absentPlacements(statData)) {
      const c = statData.Classmate[p.key];
      if (String(get(c.Location, '')) === p.venue) continue;           // already there → no op
      ops.push({ op: 'replace', path: '/Classmate/' + p.key + '/Location/0', value: p.venue });
    }
    return ops;
  }

  // ---- TIME-LEAP (yearschedule ARC BACKBONE) — the Graduation day-end loops the arc. CARRY everything personal
  // (every stat + memory on MainChar and each heroine — nothing here touches them); RESET only the world frame;
  // ArcLoop +1; clear per-arc one-shot event flags (scope 'save' persists) + every heroine's LastInitiative (a
  // new arc's cooldown clock). Quests are NOT cleared (they persist across the leap = once-ever). The AI narrates
  // the in-fiction loop reason (guide / @Graduation spine). ----
  function timeLeap(statData, log) {
    const W = statData.World || (statData.World = {});
    const EngineDerived = statData.EngineDerived || (statData.EngineDerived = {});
    const PendingState = statData.PendingState || (statData.PendingState = {});
    const WorldRecord = statData.WorldRecord || (statData.WorldRecord = {});
    const CM = statData.Classmate || {};
    const loop = (Number(get(EngineDerived.ArcLoop, 1)) || 1) + 1;
    setVal(W, 'Date', '2026-04-08');
    setVal(W, 'Weekday', 'Wed');
    setVal(W, 'Time', SCHOOL_BLOCKS[0]);
    setVal(EngineDerived, 'Grade', 1);
    setVal(EngineDerived, 'BlockReplyCount', 0);
    if (PendingState.BlockDone !== undefined) setVal(PendingState, 'BlockDone', false);
    if (PendingState.DayEndOrderedFor !== undefined) setVal(PendingState, 'DayEndOrderedFor', '');   // pre-leap debt dies with the frame
    setVal(EngineDerived, 'ArcLoop', loop);
    setVal(EngineDerived, 'EventArmed', '');                              // transient per-arc pointer clears (Quests/NPCs/Locations persist as memory)
    applyCalendarDay(statData, '2026-04-08', 'Wed', log);      // day-0 = Entrance Ceremony EVENT
    // A NEW LOOP re-opens the arc's events. The library marks every fired row at EventPack.fired.<key> and
    // stores the row's declared scope there verbatim: 'save' = once ever (the beat does not repeat in a
    // later loop), anything else = this loop only. An UNFIRED row has no marker at all, so a chain {{user}}
    // never reached is untouched here and simply arms again next loop. The main story's own records
    // (EventSpine.fired) carry no scope and are ALWAYS arc: the calendar replays, so the ceremony must be
    // re-runnable — the default here says so. The prose world log clears by the same rule — an arc-scoped
    // memory belongs to the loop that made it.
    for (const [table, dflt] of [[(statData.EventPack || {}).fired, ''], [(statData.EventSpine || {}).fired, 'arc'], [WorldRecord.Events, 'arc']]) {
      if (!table || typeof table !== 'object') continue;
      for (const k of Object.keys(table)) {
        const e = table[k]; if (!e || typeof e !== 'object') continue;
        if (String(get(e.scope, dflt)) !== 'save') delete table[k];
      }
    }
    // per-arc runtime on every heroine resets (bonds/stats/memory CARRY — only arc-scoped clocks clear).
    for (const k of Object.keys(CM)) {
      const c = CM[k]; if (!c || typeof c !== 'object') continue;
      setVal(c, 'LastInitiative', '');                         // cooldown stamp is arc-time → clear (initiative_system)
      setVal(c, 'DailyAffGain', 0);
    }
    if (statData.Mainchar && typeof statData.Mainchar === 'object') {
      setVal(statData.Mainchar, 'CoActivityStatsToday', '');
      setVal(statData.Mainchar, 'QuestStatPointsToday', 0);
      setVal(statData.Mainchar, 'LastTrainingWeek', '');          // arc-time bookkeeping: the calendar restarts on
    }                                                             // 2026-04-08, so a stamp from an earlier loop's
                                                                  // week-of-04-06 would block the new loop's first session
    // A 修学旅行 still being planned does NOT survive the loop. Quests carry across a leap on purpose, but this
    // one is not a memory — it is a week of bookkeeping between a briefing and a trip, and the calendar it
    // spans has just restarted. Left standing, the idempotent seed would find it and never open a clean one,
    // so the next loop's briefing would inherit a card still naming last loop's destination.
    {
      const Q = (statData.Mainchar || {}).Quests;
      if (Q && typeof Q === 'object' && Q[TRIP_QUEST_KEY]) {
        delete Q[TRIP_QUEST_KEY];
        log.push('TRIP QUEST dropped (the arc restarted mid-plan; the new loop briefs its own trip)');
      }
      if (String(get(EngineDerived.TripDestination, '')).trim()) setVal(EngineDerived, 'TripDestination', '');
    }
    log.push('TIME-LEAP → Loop ' + loop + ' · world frame reset to 2026-04-08 (bonds & memory carried)');
  }

  // ---- DAY-END SWING (social_system DAY CHECK + FREE date-out · Cluster 6B) — the ONCE-PER-DAY resolution. On an
  // event tier the AI names "<Key>:<Outcome>" for the SINGLE heroine {{user}} spent the day with — on the DATE
  // tiers the Outcome is narrate's judgment of the day; on a DAY_CHECK tier (ACADEMIC, SPORTS, CULTURE) it is the die PRE dealt, read
  // off EngineDerived.DayCheckRoll, and the token only names the girl; the engine picks the MAGNITUDE from the day's TIER.
  // A DATEOUT day takes no token at all: the engine picks the girls, grades the day and pays it (payDateOut).
  // WHICH DAYS PAY IS THE CALENDAR ROW, NOT THE DAY'S MODE: the tier is EngineDerived.DayCheck (BONDING/SCHOOL-FESTIVAL/
  // CLIMAX/SPORTS/ACADEMIC/CULTURE) and a row of ANY mode may carry one — @Exams, and 2/14 and 3/14 in the years they
  // land on a weekday, are SCHOOL rows that PAY — while an unlisted weekend falls back to the date-out (DATEOUT).
  // BYPASSES the daily cap (raw add, clamp 0-100 — excess clamps), then runs the route
  // gate ONCE (at most one stage advance/day; Dating/Girlfriend/the branches just cap — Dating needs a confession). A day whose
  // DayCheck is '' — an ordinary unlisted school day, or a multi-day SERIES's NON-final day (School Trip d1-3) — has
  // NO tier → the swing is ignored, so a series swing lands only on the days that carry a CHECK. 文化祭 is the one
  // series paying TWICE: CULTURE on d1 (the booth, rolled) and SCHOOL-FESTIVAL on d2 (the day, narrate's judgment). ----
  // ---- CLOCK STATUS (pure read) — the game-coordinate snapshot every consumer shares: Window A's
  // day-end ORDER, block_transition's cue, tests. daysOwed = how many game-days the prose is AHEAD of
  // the settled DayDate; derived on every call from persisted civil World.* + DayDate, never stored.
  function clockStatus(statData) {
    const W = (statData || {}).World || {}, EngineDerived = (statData || {}).EngineDerived || {};
    const civilIso = String(get(W.Date, '')).slice(0, 10);
    const g = civilToGame(civilIso, String(get(W.Time, ''))) || null;
    const dayDate = String(get(EngineDerived.DayDate, '')).slice(0, 10);
    const daysOwed = (g && dayDate) ? daysBetween(dayDate, g.gameDate) : 0;
    return { game: g, dayDate: dayDate, daysOwed: daysOwed,
      orderedFor: String(get(((statData || {}).PendingState || {}).DayEndOrderedFor, '')) };
  }

  // ---- SETTLE ONE GAME-DAY — the ONE day-end path. Voluntary (sceneAdvance / Next-Block), the block
  // cap's final-band advance, and the daysOwed catch-up all run THIS body: pre-roll swing, calendar
  // consult (dated jump / TIME-LEAP / +1), landing rebase, grade, payday, neglect sweep. There is no
  // second, cheaper roll — anything a voluntary advance does, a catch-up close does identically.
  // WHICH DAY THIS ONE ROLLS INTO. Extracted because settleDay needs it TWICE and the two must agree: once
  // to look ahead before the quest sweep, and once to actually land. A second copy of the rollTo rule is
  // exactly the kind of pair that drifts.
  const nextDayIso = (row, todayIso) =>
    ((row && row.rollTo && row.rollTo !== '+1') ? row.rollTo : addIso(todayIso, 1));
  function settleDay(statData, swingStr, log) {
    const W = statData.World || (statData.World = {});
    const EngineDerived = statData.EngineDerived || (statData.EngineDerived = {});
    const PendingState = statData.PendingState || (statData.PendingState = {});
    const CM = statData.Classmate || {};
    // TODAY = the GAME-DAY being closed (DayDate) — never the civil date, which during band 4 is already
    // tomorrow (reading it would fetch the wrong row: wrong jump target, missed TIME-LEAP).
    const todayIso = String(get(EngineDerived.DayDate, String(get(W.Date, '2026-04-08')))).slice(0, 10);
    const todayRow = lookupDay(todayIso);
    // DAY-END SWING — resolve TODAY (pre-roll) NOW, BEFORE the calendar overwrites DayCheck below and
    // BEFORE a TIME-LEAP carries it. On the @Graduation row this is the CLIMAX capstone swing. A DATEOUT day pays
    // itself; every other tier pays the girl narrate's daySwing names. Today's companions close with today.
    const todayCheck = String(get(EngineDerived.DayCheck, '')).trim();
    if (todayCheck === 'DATEOUT') payDateOut(statData, todayIso, swingStr, log);
    else applyDaySwing(statData, todayCheck, swingStr, log);
    setVal(EngineDerived, 'DayCompanions', '');
    // 文化祭 d1 ONLY: write the booth's rolled showing to the world log NOW — after the swing has read the
    // die, before applyCalendarDay below wipes it with the day and then checks d2 for this very record.
    recordBoothShowing(statData, todayRow, todayIso, log);
    // 修学旅行: the briefing day hands its destination to EngineDerived for the week; d4 spends it, so next
    // year's briefing starts blank; and the settle that is about to LAND the trip closes the week-ahead
    // quest, so the sweep below collects it with everything else that finished today.
    stashTripDestination(statData, todayRow, log);
    clearTripDestination(statData, todayRow, log);
    retireTripQuest(statData, lookupDay(nextDayIso(todayRow, todayIso)), log);
    EVENT_PACK_ADAPTER.setStepDone(statData, '');   // the step cursor dies with its day — BEFORE the branch, so a TIME-LEAP clears it too
    if (get((statData.EngineDerived || {}).SpineBandsDone, '')) setVal(statData.EngineDerived, 'SpineBandsDone', '');   // and so do its finished bands
    // THE QUEST SWEEP — ONE rule (D16): any quest whose Status is TERMINAL goes with the day. The quest
    // list is not a history audit; nothing reads a closed quest (## QUESTS skips it, the payout landed, the
    // route-history milestone is on the classmate), so holding it only grows a list {{user}} scrolls past.
    // A closed quest stays visible for the REST of the day it closed on, then goes. Before the branch, so a
    // TIME-LEAP clears it too. EVENT quests included: a finished chain is no longer what keeps itself
    // closed — the library's EventPack.fired marker is. The DAY SIGNPOST is not a second rule: its day is
    // ending, so it is EXPIRED here first — a status WRITE — and then swept by the same rule as everything
    // else. Its outcome is copied into the main story's own durable record before the sweep, because the
    // record is the only place that outcome survives the delete. An unknown/empty Status is never deleted.
    {
      const spQ = (statData.Mainchar || {}).Quests || {};
      const spKey = daySpineKey(statData);
      const signpost = spKey && spQ[spKey] && typeof spQ[spKey] === 'object' && String(get(spQ[spKey].Type, '')) === 'GameEvent' ? spQ[spKey] : null;
      if (signpost && !QUEST_TERMINAL.includes(String(get(signpost.Status, '')))) {
        writeQuestRecord(statData, spKey, { Status: 'Expired' }, 'SIGNPOST expired ', log);
      }
      if (signpost) markSpineDone(statData, spineRecordKey(statData, todayIso), String(get(signpost.Status, '')), log);
      // The objective cursor dies with the record it describes. Left standing it would point at a step
      // of YESTERDAY's spine, and tomorrow's panel would compare against it and either order a refresh
      // that is already correct or stay silent on one that is not.
      if (get((statData.EngineDerived || {}).ObjectiveStep, '')) setVal(statData.EngineDerived, 'ObjectiveStep', '');
      const doneKeys = Object.keys(spQ).filter((k) => {
        const q = spQ[k];
        return q && typeof q === 'object' && QUEST_TERMINAL.includes(String(get(q.Status, '')));
      });
      for (const k of doneKeys) delete spQ[k];
      if (doneKeys.length) log.push('QUESTS cleared (day settled, ' + doneKeys.length + ' closed): ' + doneKeys.join(', '));
    }
    restoreDailyEnergy(statData, log);                         // before the branch, so a TIME-LEAP refills too
    if (todayRow && todayRow.spine === '@Graduation') {
      timeLeap(statData, log);                                 // Graduation day-end = the arc loop
      return;
    }
    const iso = nextDayIso(todayRow, todayIso);
    if (iso !== addIso(todayIso, 1)) {                         // dated break/event JUMP (skipped days are narrated)
      setVal(EngineDerived, 'JumpedFrom', todayIso);           // one-reply cue → Window A ⏭ TIME JUMPED banner
      log.push('BREAK JUMP: ' + todayIso + ' -> ' + iso + ' (' + (todayRow.label || 'break') + ')');
    }
    const wd = WD[new Date(iso + 'T00:00:00Z').getUTCDay()];
    // RESUME RULE — never rewinds, by construction. Prose already inside (or past) the landed game-day
    // keeps its own civil clock (the all-nighter that IS the landed day's small hours); otherwise the
    // scene moves to the landed morning start — which is always a FORWARD move in absolute time.
    const g = civilToGame(String(get(W.Date, '')).slice(0, 10), String(get(W.Time, SCHOOL_BLOCKS[0])));
    if (!g || g.gameDate < iso) {
      setCivilDate(W, iso);
      setVal(W, 'Time', SCHOOL_BLOCKS[0]);
    } else if (g.gameDate === iso) {
      log.push('day-roll kept the clock at ' + get(W.Date, '') + ' ' + get(W.Time, '') + ' — the prose already runs inside ' + iso);
    }
    // (g.gameDate > iso: multi-day lag mid-settle — the clock stays with the prose; the daysOwed catch-up
    // closes the remaining days in the same resolve.)
    applyCalendarDay(statData, iso, wd, log);                  // MODE + DayDate + DayLabel/DayCheck/DaySpine
    setVal(PendingState, 'DayEndOrderedFor', '');              // any settled day retires its order
    const g2 = gradeFromDate(iso);
    if (g2 !== (Number(get(EngineDerived.Grade, 1)) || 1)) { setVal(EngineDerived, 'Grade', g2); log.push('GRADE UP -> ' + g2 + ' (school year)'); }
    // a new game-day → reset every heroine's daily affection cap + MainChar's co-activity and quest-stat caps
    for (const k of Object.keys(CM)) { if (CM[k] && typeof CM[k] === 'object') setVal(CM[k], 'DailyAffGain', 0); }
    if (statData.Mainchar && typeof statData.Mainchar === 'object') {
      setVal(statData.Mainchar, 'CoActivityStatsToday', '');
      setVal(statData.Mainchar, 'QuestStatPointsToday', 0);
    }
    log.push('DAY ROLL -> ' + iso + ' (' + wd + ')');
    // PAYDAY: landing on a Monday pays the weekly wage (default 25000 Ɉ).
    // A break JUMP that skips a Monday skips that pay (those days aren't played) — consistent with the jump.
    if (wd === 'Mon' && statData.Mainchar && typeof statData.Mainchar === 'object') {
      const MC = statData.Mainchar;
      const salary = Number(get(MC.Salary, 25000)) || 25000;
      const money = (Number(get(MC.Money, 0)) || 0) + salary;
      setVal(MC, 'Money', money);
      log.push('PAYDAY (Mon): Money +' + salary + ' -> ' + money);
    }
    neglectSweep(statData, log);               // scorned-schemer rumor sweep (NEGLECT RETALIATION)
  }

  function applyDaySwing(statData, dayCheck, swingStr, log) {
    if (!swingStr) return;
    const parts = String(swingStr).split(':');
    const key = (parts[0] || '').trim();
    let outcome = (parts[1] || '').trim();
    // The tier IS the day's CHECK — Mode carries pacing only. A DATEOUT day never arrives here (settleDay hands it
    // to payDateOut); '' pays nothing (the SERIES-SWING mechanism: non-final event days carry '-').
    const tier = dayCheck;
    if (!tier || !SWING[tier]) { log.push('day-swing ignored (no tier — DayCheck "' + (dayCheck || '-') + '"): ' + swingStr); return; }
    const c = (statData.Classmate || {})[key];
    if (!c || typeof c !== 'object') { log.push('day-swing ignored (no such classmate): ' + swingStr); return; }
    // A ROLLED tier (DAY_CHECK) pays the DIE, never the narrator's word: the four numbers (2k) froze are derived
    // here exactly as Window A derived them, so nothing between the prose and the payout can disagree with the
    // dice. No roll landed all day → the exam never resolved → nothing is paid, and the engine does not invent
    // the result the player was never shown (no fallback to the narrator's word). The token still NAMES the
    // girl — the half only the prose knows.
    if (DAY_CHECK[tier]) {
      const r = parseKeyedFields(String(get(((statData || {}).EngineDerived || {}).DayCheckRoll, '')));
      const rawDie = Number(r.rawdie), total = Number(r.total), dc = Number(r.dc);
      if (!Number.isFinite(rawDie) || !Number.isFinite(total) || !Number.isFinite(dc)) {
        warnRes(tier + ' DAY-CHECK NEVER ROLLED — the day ends with no die dealt for it, so the ' + tier + ' swing is FORFEITED (nothing paid to ' + key + '); the PRE window deals die ⑤ on this day and no roll ever arrived');
        log.push('⚠ day-swing FORFEITED (' + tier + ' never rolled — no die, no verdict, nothing paid): ' + swingStr);
        return;
      }
      const rolled = deriveOutcome(rawDie, total, dc);
      if (outcome && outcome !== rolled) log.push(key + ' day-swing: narrate wrote ' + outcome + ', the die says ' + rolled + ' (RawDie ' + rawDie + ' → ' + total + ' vs DC ' + dc + ') — the die wins');
      outcome = rolled;
    }
    const table = SWING[tier];
    const amt = (table[outcome] !== undefined) ? table[outcome] : table.Success;      // unknown/absent token → Success
    setVal(c, 'Affection', clamp((Number(get(c.Affection, 0)) || 0) + amt, 0, 100));  // BYPASS the daily cap; excess clamps, floor 0
    const adv = tryStageGate(c, statData, log);                                       // ≤1 stage advance/day (records ImportantEvent)
    log.push(key + ' DAY-SWING ' + tier + ' ' + (outcome || '?') + ': Aff ' + (amt >= 0 ? '+' : '') + amt + ' (bypass cap)' + (adv ? ' · STAGE GATE: ' + adv : ''));
  }

  // ---- THE DATE-OUT (a DATEOUT day's end) — PAID BY THE ENGINE, from records only, never narrate's word:
  //   WHO    every classmate POST saw with him in at least DATEOUT_MIN_REPLIES replies today (EngineDerived.DayCompanions,
  //          recordDayCompanions), so two dates in one day both share and a hello in passing does not. A girl still in
  //          a fight when the day closes gets nothing and drops out — the CritFail of this tier.
  //   GRADE  the sharers' average daily ledger (DailyAffGain). A girl promoted today counts as a full day, because
  //          the promotion restarted her ledger (PromotedOn). Full (the daily cap): the engine rolls a d20, and
  //          DATEOUT_CRIT_DC or more is a CritSuccess, anything less a Success. Above 0: Success. 0 or below: Failure.
  //   SPLIT  SWING.DATEOUT[grade] is shared smallest-room-first (shareByRoom), so a girl near 100 takes only what she
  //          can use and the rest goes to the others; points no girl has room for are not paid.
  // The d20 is a hash of the game-day and the arc loop: fixed for that day, so a regenerate cannot re-roll it.
  // A daySwing narrate still sends on this day is ignored, and the log says so.
  const dateOutRoll = (dayIso, arcLoop) => (mixedHash('date-out|' + dayIso + '|' + arcLoop) % 20) + 1;
  // EngineDerived.DayCompanions "Mana:21,Mitsuki:18" → { Mana: 21, Mitsuki: 18 }, in the order they were first seen. An
  // item without a name or a positive count is skipped.
  const parseDayCompanions = (record) => {
    const counts = {};
    for (const item of String(record || '').split(',')) {
      const at = item.lastIndexOf(':');
      const key = (at < 0 ? '' : item.slice(0, at)).trim();
      const n = Number(at < 0 ? NaN : item.slice(at + 1));
      if (key && Number.isFinite(n) && n > 0) counts[key] = n;
    }
    return counts;
  };
  function payDateOut(statData, dayIso, swingStr, log) {
    const CM = statData.Classmate || {};
    const ED = statData.EngineDerived || {};
    if (swingStr) log.push('date-out: narrate\'s daySwing "' + swingStr + '" ignored — the engine pays a DATEOUT day itself');
    const replies = parseDayCompanions(get(ED.DayCompanions, ''));
    const known = Object.keys(replies).filter((k) => CM[k] && typeof CM[k] === 'object');
    if (!known.length) { log.push('DATE-OUT ' + dayIso + ': no companion on record — POST named nobody with him today, so no swing'); return; }
    const sharers = [];
    for (const k of known) {
      if (replies[k] < DATEOUT_MIN_REPLIES) {
        log.push('DATE-OUT ' + dayIso + ': ' + k + ' was with him ' + replies[k] + ' repl' + (replies[k] === 1 ? 'y' : 'ies') +
                 ' — under ' + DATEOUT_MIN_REPLIES + ', no share');
      } else if (get(CM[k].ConflictActive, false) === true) {
        log.push('DATE-OUT ' + dayIso + ': ' + k + ' is in a fight as the day closes — no share (CritFail)');
      } else sharers.push(k);
    }
    if (!sharers.length) return;
    const promotedToday = sharers.filter((k) => String(get(CM[k].PromotedOn, '')) === dayIso);
    const ledgerOf = (k) => (promotedToday.indexOf(k) >= 0 ? DAILY_AFFECTION_CAP : Number(get(CM[k].DailyAffGain, 0)) || 0);
    const ledger = sharers.reduce((sum, k) => sum + ledgerOf(k), 0) / sharers.length;
    const isFullDay = ledger >= DAILY_AFFECTION_CAP;
    let grade, rollNote = '';
    if (isFullDay) {
      const roll = dateOutRoll(dayIso, Number(get(ED.ArcLoop, 1)) || 1);
      grade = roll >= DATEOUT_CRIT_DC ? 'CritSuccess' : 'Success';
      rollNote = ', rolled ' + roll + ' vs DC ' + DATEOUT_CRIT_DC;
    } else {
      grade = ledger > 0 ? 'Success' : 'Failure';
    }
    const gradeNote = (sharers.length > 1 ? 'average ledger ' : 'ledger ') + Math.round(ledger * 10) / 10 + (isFullDay ? ' (full)' : '') +
      (promotedToday.length ? ' — ' + promotedToday.join(', ') + ' promoted today, counted full' : '') + rollNote;
    const pot = SWING.DATEOUT[grade];
    const room = (k) => 100 - Math.max(0, Number(get(CM[k].Affection, 0)) || 0);
    const shares = shareByRoom(pot, sharers.map((k) => ({ key: k, room: room(k) })));
    let paid = 0;
    const parts = shares.map((s) => {
      const c = CM[s.key];
      if (!s.amount) return s.key + ' +0 (no room)';
      setVal(c, 'Affection', clamp(Math.max(0, Number(get(c.Affection, 0)) || 0) + s.amount, 0, 100));   // BYPASS the daily cap
      paid += s.amount;
      const adv = tryStageGate(c, statData, log);
      return s.key + ' +' + s.amount + (adv ? ' · STAGE GATE: ' + adv : '');
    });
    log.push('DATE-OUT ' + dayIso + ' ' + grade + ' (' + gradeNote + '): +' + pot + (sharers.length > 1 ? ' shared — ' : ' — ') + parts.join(', ') +
             (paid < pot ? ' · ' + (pot - paid) + ' unpaid, no room left' : '') + ' (bypass cap)');
  }
  // THE SMALLEST-ROOM-FIRST SPLIT — shares `pot` whole points among girls who can each take at most `room`. In order of
  // room, smallest first, each girl gets her fair share of what is left or her room, whichever is less, so what a
  // nearly-full girl cannot use rolls on to the next; a remainder lands on the girls with the most room. Returns
  // [{ key, amount }] in the order given. Points no girl has room for are not handed out.
  function shareByRoom(pot, girls) {
    const order = girls.slice().sort((a, b) => (a.room - b.room) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    const amounts = {};
    let left = pot;
    order.forEach((g, i) => {
      const amount = Math.max(0, Math.min(Math.floor(left / (order.length - i)), g.room));
      amounts[g.key] = amount;
      left -= amount;
    });
    return girls.map((g) => ({ key: g.key, amount: amounts[g.key] }));
  }

  // ---- 7c REGISTRIES (WorldRecord.NPCs / .Locations) — the SHARED write-plumbing designed alongside 6C. NPCs =
  // crossover / background-NPC memory (a divine OUTSIDER like Leila is registered here, NOT built as a Classmate);
  // Locations = a DISCOVERED-VENUE LOG (an event/story reveals a spot → record label/note/when, distinct from
  // World.Location = current position). Idempotent: a re-fire never clobbers an existing entry. ----
  const nowStamp = (sd) => String(get((sd.World || {}).Date, '')) + ' ' + String(get((sd.World || {}).Time, ''));
  // ---- ImportantEvents (per-heroine milestone MEMORY · update_analysis 5b · v1 parity) — append {Desc,TimeStamp}
  // on any RelationshipStage change (advance / confession / demotion / walk-off), keeping the newest 10 (FIFO
  // oldest-out). BARE record<seqKey→object> (RES mutates directly, like the WorldRecord registries). Deterministic —
  // NO AI channel; the Desc IS the transition. Reused by every stage-write site so route history is never lost. ----
  function pushImportantEvent(c, desc, sd, log) {
    if (!c || typeof c !== 'object' || !desc) return;
    let ie = c.ImportantEvents;
    if (!ie || typeof ie !== 'object' || Array.isArray(ie)) ie = c.ImportantEvents = {};
    const seqOf = (k) => parseInt(String(k).replace(/^e/, ''), 10) || 0;
    const next = Object.keys(ie).reduce((m, k) => Math.max(m, seqOf(k)), 0) + 1;
    ie['e' + next] = { Desc: String(desc), TimeStamp: (sd ? nowStamp(sd) : '') };
    const keys = Object.keys(ie).sort((a, b) => seqOf(a) - seqOf(b));
    while (keys.length > 10) delete ie[keys.shift()];                                     // FIFO: drop the oldest
    if (log) log.push('ImportantEvent [' + (get(c.Name) || '?') + '] ' + desc);
  }
  // ---- POST-owned record channels (PRE_Call_Revisit P7) --------------------------------------
  // These two appliers are MODULE-LEVEL because they now have TWO callers: resolvePostRelay (the
  // live path — POST records what the prose did, mvu-helper's turn-runner relays it here on the
  // RES2 fire) and resolveTurn's unit-test path (ctx-less tests exercise the same math directly
  // through resolvePostRelay). Narrate-time traffic on these channels is RETIRED — resolveTurn's
  // old (2c)/(2e) sites now warn and drop, they never call these.

  // /Intent/relationship = "<action>:<key>[:<amount>]", ','-joined (grammar A). POST is the writer.
  // Rank order + the per-girl coherence guard are UNCHANGED from the narrate era — they exist for
  // items INSIDE one list ("conflict:Mitsuki, strain:Mitsuki:20"), and POST writes lists too.
  // `diceVerdict` = { key, act, verdict } of the girl whose H act was ruled on this reply ('agreed' = it proceeded, past
  // its gate or with none owed; 'declined' = its gate failed), or null. That verdict settles the boundary, so a conflict
  // on her is dropped either way: her refusal inside an agreed act is the scene's heat, and a declined act is already
  // settled by its gate (she said not yet, nothing changed), never a fight. Strain still applies (POST records it only
  // for physical hurt or a rough act she did not enjoy).
  function applyRelationshipItems(statData, relStr, log, diceVerdict) {
    const CM = statData.Classmate || {};
    const relItems = relStr.split(',').map((s) => s.trim()).filter(Boolean).map((one, at) => {
      const parts = one.split(':');                // "<action>:<key>[:<amount>]" — neither ever contains ':' or ','
      return { one: one, action: (parts[0] || '').trim(), key: (parts[1] || '').trim(), arg: (parts[2] || '').trim(), at: at };
    }).filter((item) => {
      if (!diceVerdict || item.action !== 'conflict' || item.key !== diceVerdict.key) return true;
      log.push(item.key + ' conflict DROPPED — ' + (diceVerdict.verdict === 'agreed'
        ? 'her ' + diceVerdict.act + ' went ahead this reply, past its gate or with none owed (an agreed act is her consent)'
        : 'her ' + diceVerdict.act + ' gate failed this reply: she declined that act and the gate settled it (a declined act is not a fight)'));
      return false;
    });
    // COHERENCE GUARD, per TARGET. Two heroines in one list are independent, so "conflict:Mitsuki,
    // reconcile:Iori" is an ordinary two-girl beat and must NOT trip this. Within one girl, though, two
    // actions that write the SAME field opposite ways (or two that both move her stage) mean the
    // recorder's judgement for this beat is incoherent — and applying whichever half sorts first would
    // invent a state nobody wrote, which is precisely the silent wrongness this rewrite exists to end.
    // So drop that girl's actions ENTIRELY and say so loudly; the others still apply.
    const contradicted = {};
    for (const item of relItems) {
      if (contradicted[item.key]) continue;
      const acts = relItems.filter((i) => i.key === item.key).map((i) => i.action);
      const on = acts.filter((a) => REL_CONFLICT_ON.indexOf(a) >= 0).length;
      const off = acts.filter((a) => REL_CONFLICT_OFF.indexOf(a) >= 0).length;
      const stageMoves = acts.filter((a) => REL_STRUCTURAL.indexOf(a) >= 0).length;
      const clash = (on && off) ? 'it both SETS and CLEARS ConflictActive'
                  : (stageMoves > 1) ? 'two stage moves in one beat' : '';
      if (!clash) continue;
      contradicted[item.key] = true;
      warnRes('RELATIONSHIP CONTRADICTION on ' + item.key + ' — ' + clash + ' ("' + acts.join('" + "') +
              '"); every action for ' + item.key + ' is DROPPED this reply (applying half of a contradictory pair would invent a state the recorder never wrote)');
      log.push('⚠ relationship contradiction on ' + item.key + ' (' + acts.join(' + ') + ') — all dropped');
    }
    const relRank = (a) => (REL_RANK[a] === undefined ? 9 : REL_RANK[a]);
    const relSorted = relItems.filter((i) => !contradicted[i.key])
                              .sort((a, b) => (relRank(a.action) - relRank(b.action)) || (a.at - b.at));
    for (const item of relSorted) {
      const one = item.one, action = item.action, key = item.key, arg = item.arg;
      const c = CM[key];
      if (c) {
        const stage = String(get(c.RelationshipStage, ''));
        if (action === 'demote' || action === 'betray') {
          const prev = STAGE_PREV[stage] || 'Estranged';
          setVal(c, 'RelationshipStage', prev);
          setVal(c, 'Affection', 0); setVal(c, 'DailyAffGain', 0);
          setVal(c, 'ConflictActive', true); setMood(c, 'Angry', log, action);
          if (action === 'betray') setVal(c, 'Lewdness', 0);
          pushImportantEvent(c, stage + ' → ' + prev + ' (' + action + ')', statData, log);
          log.push(key + ' ' + action.toUpperCase() + ': ' + stage + ' -> ' + prev + ' (Aff→0' + (action === 'betray' ? ', Lewd→0' : '') + ', conflict)');
        } else if (action === 'conflict') {
          setVal(c, 'ConflictActive', true); setMood(c, 'Angry', log, 'conflict');
          log.push(key + ' CONFLICT set');
        } else if (action === 'reconcile') {
          setVal(c, 'ConflictActive', false); setMood(c, 'Happy', log, 'reconcile');
          log.push(key + ' RECONCILED (conflict cleared, no Aff bonus)');
        } else if (action === 'walkoff') {
          if (stage === 'Stranger') { setVal(c, 'RelationshipStage', 'Acquaintance'); pushImportantEvent(c, 'Stranger → Acquaintance (walked off)', statData, log); }
          applyAffection(c, -2); setVal(c, 'ConflictActive', false);
          log.push(key + ' walked off (−2 Aff' + (stage === 'Stranger' ? ', Stranger→Acquaintance' : '') + ')');
          leaveScene(statData, [key], 'walked off', log);   // a failed-scene exit = she LEAVES
        } else if (action === 'strain') {
          // AFFECTION FALL — a fade, NOT a full demotion (that's `demote`/`betray`)
          // and NOT a fight flag (that's `conflict`); it rides ALONGSIDE those, which is why this channel is a
          // list. The recorder names a GRADE, this prices it from STRAIN_DELTA. applyAffection floors at 0
          // and takes the fall back off her daily gain.
          //
          // An unrecognised grade is DROPPED, loudly, and nothing else in the list is disturbed. Guessing a
          // magnitude from a word nobody defined is how an unrolled channel invents a number again — and a
          // recorder still emitting the retired `strain:<Key>:15` form lands here, so the warn names both the
          // value it got and the words it accepts.
          const grade = String(arg || '');
          if (!Object.prototype.hasOwnProperty.call(STRAIN_DELTA, grade)) {
            warnRes('STRAIN grade "' + grade + '" on ' + key + ' is not one of ' + Object.keys(STRAIN_DELTA).join('/') +
                    ' — the fall is DROPPED this reply (a number here is the retired 5-20 form; strain names the size of the wound in a word now)');
            log.push('⚠ ' + key + ' STRAIN dropped — unknown grade "' + grade + '"');
            continue;
          }
          const d = applyAffection(c, STRAIN_DELTA[grade]);
          log.push(key + ' STRAIN ' + grade + ': Aff ' + d + ' (fall)');
        } else if (action === 'fwb') {
          // RETIRED FROM THIS CHANNEL (v0.53.0). The FWB opt-in is PRE's decision now and rides its own
          // /Intent/fwb path — see (2d). Named explicitly rather than falling into the UNKNOWN branch below
          // so an old save, or a model still working from a cached prompt, gets a warn that says WHERE the
          // channel went instead of "bad action".
          warnRes('RELATIONSHIP fwb IS RETIRED — "' + one + '" — the FWB opt-in moved to PRE and its own ' +
                  '/Intent/fwb path (keyed "target:<Key>;rawdie:N;dc:N;aff:N") in v0.53.0; nobody ' +
                  'rolls or declares it on this channel. This item is SKIPPED (nothing applied)');
          log.push('⚠ relationship fwb RETIRED (now PRE-owned /Intent/fwb): ' + one);
        } else {
          // ONE item is bad, not the whole channel — the rest of the list still applies. warnRes because a
          // dropped rupture is a lost story consequence: silent in the log, the state just quietly disagrees
          // with the prose the player already read.
          warnRes('RELATIONSHIP ACTION UNKNOWN — "' + one + '" (expected <action>:<Key>[:<amt>] with action = ' +
                  'demote|betray|conflict|reconcile|walkoff|strain, \',\'-joined for several); this item is SKIPPED');
          log.push('⚠ relationship ignored (bad action): ' + one);
        }
      } else {
        warnRes('RELATIONSHIP TARGET UNKNOWN — "' + one + '" names no classmate; this item is SKIPPED');
        log.push('⚠ relationship ignored (no such classmate): ' + one);
      }
    }
  }

  // /Intent/initiative = "<Key>:<T#>", ','-joined. POST is the writer: it records each of PRE's picks the
  // reply showed her doing, and never a girl PRE did not pick (a T6/T7 the narrator fires on its own costs
  // her no cooldown). Stamps LastInitiative = the CURRENT game-time (the cooldown clock) and nothing else:
  // an arrival is the narrator's /Intent/arrive, so a third piece is refused with a warn and the stamp still
  // lands. ⚠ P7 ordering residue, accepted: on a day-end reply RES1's advance has ALREADY run
  // when this applies, so the stamp reads the advanced clock; when that advance rolled the date, her cooldown
  // counts from the new day and runs one day longer. Recorded, not patched (hard-cutoff doctrine).
  function applyInitiativeItems(statData, initStr, log) {
    const CM = statData.Classmate || {};
    const W = statData.World || {};
    const nowStamp = String(get(W.Date, '')) + ' ' + String(get(W.Time, ''));
    for (const seg of initStr.split(',')) {
      const p = seg.trim().split(':');
      const key = (p[0] || '').trim();
      if (!key) continue;
      const c = CM[key];
      if (!c || typeof c !== 'object') { log.push('initiative ignored (no such classmate): ' + seg.trim()); continue; }
      setVal(c, 'LastInitiative', nowStamp);
      let msg = key + ' initiative ' + ((p[1] || '').trim() || '?') + ': LastInitiative -> ' + nowStamp;
      const extra = p.slice(2).join(':').trim();
      if (extra) {
        warnRes('INITIATIVE ":' + extra + '" IGNORED — the stamp is "<Key>:<T#>" and nothing more. An arrival is the ' +
                'narrator\'s /Intent/arrive, so POST writing ":enter" means its prompt is stale. Stamp applied, ' +
                'presence NOT changed: ' + seg.trim());
        msg += ' · ":' + extra + '" ignored (presence is /Intent/arrive)';
      }
      log.push(msg);
    }
  }

  // FILL-MISSING, never overwrite (user, 2026-08-12): a present field is FIRST-CAPTURE-WINS forever — the
  // stat menu's edit button is the correction path, not a louder later declare. A re-declare may only FILL a
  // field the record does not have yet (an invented venue whose first emit forgot `hours` heals on the next
  // visit). Serves exactly Locations + NPCs — Events deliberately do NOT route here (logWorldEvent): an
  // event's summary is prose that legitimately changes, so its path overwrites.
  function registerWorldRecord(sd, bucket, key, obj, log) {
    if (!key) return;
    const WorldRecord = sd.WorldRecord || (sd.WorldRecord = {});
    const B = WorldRecord[bucket] || (WorldRecord[bucket] = {});
    if (B[key] && typeof B[key] === 'object') {
      const rec = B[key], filled = [];
      for (const f of Object.keys(obj)) {
        const has = rec[f] !== undefined && rec[f] !== null && String(rec[f]) !== '';
        const incoming = obj[f] !== undefined && obj[f] !== null && String(obj[f]) !== '';
        if (!has && incoming) { rec[f] = obj[f]; filled.push(f); }
      }
      log.push(bucket + ' ' + key + (filled.length ? ' filled missing: ' + filled.join('/') : ' already registered'));
      return;
    }
    B[key] = obj;
    log.push(bucket + ' registered: ' + key);
  }
  // WORLD LOG (WorldRecord.Events.<key>) — the significant-event MEMORY, and PROSE ONLY: { summary, time,
  // scope }. The narrator writes it through /Intent/recordEvent when a beat is ground-breaking or overrides
  // a lorebook fact; Window-A surfaces every summary-bearing entry back to narrate. No mechanism reads it —
  // an event pack marks its fired rows in its own root (EventPack.fired), so a player pruning this log can
  // never un-fire an event. scope 'arc' (cleared on TIME-LEAP) = this-loop memory · 'save' = permanent.
  function logWorldEvent(sd, key, summary, scope, log) {
    const WorldRecord = sd.WorldRecord || (sd.WorldRecord = {});
    const EV = WorldRecord.Events || (WorldRecord.Events = {});
    // 'arc' is SCHOOL's scope default and belongs here, not in the neutral lib (P9 §5a.10) — eventpack
    // passes scope through untouched and never interprets it. An empty/absent scope lands on 'arc'.
    // ⚠ 'save' is the ONE value matched; every other string is 'arc'. EVENT_PACK_ADAPTER.scopes declares exactly
    // these two for the stamp — keep them in step, a value matched here and absent there is never offered.
    const rec = { summary: String(summary || ''), time: nowStamp(sd), scope: (scope === 'save' ? 'save' : 'arc') };
    EV[key] = rec;
    log.push('WORLD LOG ' + key + ' (' + rec.scope + '): ' + (rec.summary || '(no summary)'));
  }
  // ORGANIC record (/Intent/recordEvent) — the narrator flags a significant / lore-OVERRIDING story event. AI supplies
  // "scope|summary" (scope arc|save; summary = free text, may itself contain '|'). RES keys it `s_<hash>` — the s_
  // prefix GUARANTEES no collision with a trigger key (so it can never falsely gate scanEvents). Not a fired trigger
  // → no state flag (organic entries aren't scanned; they're memory only).
  function recordEvent(sd, str, log) {
    const i = String(str).indexOf('|');
    const scope = (i < 0 ? 'arc' : String(str).slice(0, i).trim());
    const summary = (i < 0 ? String(str) : String(str).slice(i + 1)).trim();
    if (!summary) { log.push('recordEvent ignored (no summary): ' + str); return; }
    const key = 's_' + hashStr(summary + '|' + nowStamp(sd)).toString(36);
    logWorldEvent(sd, key, summary, scope, log);
  }
  // ORGANIC record (/Intent/recordNPC) — a recurring NON-classmate character (rival/teacher/family; a HEROINE uses
  // newClassmate). AI supplies "Key|Name|Relationship". Rides the shared NPCs registry (idempotent — never clobbers).
  function recordNPC(sd, str, log) {
    const p = String(str).split('|');
    const key = (p[0] || '').trim();
    if (!/^[A-Za-z0-9_]+$/.test(key)) { log.push('recordNPC ignored (bad key): ' + str); return; }
    registerWorldRecord(sd, 'NPCs', key, { Name: (p[1] || key).trim(), Rel: p.slice(2).join('|').trim(), FirstSeen: nowStamp(sd) }, log);
  }

  // ---- 7b RECORDER CHANNELS (update_analysis 5b/5c/5d · v1 parity) — the economy + memory writes the narrator
  // declares. MONEY = signed delta (RES owns the floor). FRIENDS = the heroine↔heroine web (MUTUAL when both are
  // roster girls; RES auto-scores new "10" / +5 per repeat / cap 100 — Mood is the narrator's judgment). RECORD =
  // ONE generic channel: a profile-field REVEAL (Identity/Occupation/… tuple fields → setVal keeps the label) OR a
  // keyed-collection add/remove (Belongings/Inventory/Skills/Hobbies bare records; val "0" removes). ----
  function applyMoney(sd, str, log) {
    const delta = parseInt(String(str).replace(/[^0-9-]/g, ''), 10);
    if (isNaN(delta) || delta === 0) { log.push('money ignored (bad/zero delta): ' + str); return; }
    const MC = sd.Mainchar || (sd.Mainchar = {});
    const next = Math.max(0, (Number(get(MC.Money, 0)) || 0) + delta);                    // floor 0 (can't go into debt)
    setVal(MC, 'Money', next);
    log.push('MONEY ' + (delta >= 0 ? '+' : '') + delta + ' -> ' + next);
  }
  function applyFriends(sd, str, log) {
    const p = String(str).split(':').map((s) => s.trim());
    const a = p[0], b = p[1], moodA = p[2] || 'Neutral', moodB = p[3] || moodA;
    const CM = sd.Classmate || {};
    if (!a || !b) { log.push('friends ignored (need two keys): ' + str); return; }
    const write = (owner, other, mood) => {                                              // one side of the mutual web
      const c = CM[owner]; if (!c || typeof c !== 'object') return false;
      let fr = c.Friends; if (!fr || typeof fr !== 'object' || Array.isArray(fr)) fr = c.Friends = {};
      const prev = (fr[other] && typeof fr[other] === 'object') ? fr[other] : null;
      const score = prev ? Math.min(100, (Number(prev.FriendshipScore) || 10) + 5) : 10;  // new "10" · +5/repeat · cap 100
      fr[other] = { Name: (CM[other] && String(get(CM[other].Name, ''))) || other, FriendshipScore: String(score), Mood: mood };
      return true;
    };
    const okA = write(a, b, moodA);
    const okB = (CM[b] && typeof CM[b] === 'object') ? write(b, a, moodB) : false;        // MUTUAL only if b is a roster girl (else a-side tracks the NPC)
    if (!okA) { log.push('friends ignored (no such classmate ' + a + '): ' + str); return; }
    log.push('FRIENDS ' + a + '<->' + b + ' (mutual=' + (okA && okB) + ')');
  }
  const REVEAL_FIELDS = ['Identity', 'Occupation', 'Mental_state', 'Hair_Style', 'Physical_Features', 'Biography', 'Secret'];  // tuple fields (never Name/Age/core stats)
  const RECORD_COLLECTIONS = ['Belongings', 'Inventory', 'Skills', 'Hobbies'];            // bare keyed records
  // MainChar's skills ("Mainchar:Skills:<Name>[:<val>]") are POST-owned: POST reads the finished page for a skill of his
  // that was named and records it, and resolvePostRelay applies it. Every other record stays narrate's, applied at RES1.
  const isSkillRecord = (str) => { const p = String(str).split(':'); return (p[0] || '').trim() === 'Mainchar' && (p[1] || '').trim() === 'Skills'; };
  function applyRecord(sd, str, log) {
    const parts = String(str).split(':');
    const owner = (parts[0] || '').trim();
    const bucket = (parts[1] || '').trim();
    const target = owner === 'Mainchar' ? (sd.Mainchar || {}) : (sd.Classmate || {})[owner];
    if (!target || typeof target !== 'object') { log.push('record ignored (no owner ' + owner + '): ' + str); return; }
    if (REVEAL_FIELDS.indexOf(bucket) >= 0) {                                             // profile FIELD reveal (tuple → setVal keeps label)
      const value = parts.slice(2).join(':').trim();
      if (!value) { log.push('record ignored (no value): ' + str); return; }
      setVal(target, bucket, value);
      log.push('REVEAL [' + owner + '] ' + bucket + ' -> ' + value.slice(0, 40));
    } else if (RECORD_COLLECTIONS.indexOf(bucket) >= 0) {                                 // keyed collection add / remove (bare record)
      const name = (parts[2] || '').trim();
      const val = parts.slice(3).join(':').trim();
      if (!name) { log.push('record ignored (no item name): ' + str); return; }
      let coll = target[bucket]; if (!coll || typeof coll !== 'object' || Array.isArray(coll)) coll = target[bucket] = {};
      if (val === '0' || val === '-' || val.toLowerCase() === 'remove') { delete coll[name]; log.push('RECORD [' + owner + '] ' + bucket + ' -' + name); }
      else { coll[name] = (bucket === 'Belongings' || bucket === 'Inventory') ? { Qty: 1, Desc: val } : { Desc: val }; log.push('RECORD [' + owner + '] ' + bucket + ' +' + name); }
    } else {
      log.push('record ignored (unknown bucket ' + bucket + '): ' + str);
    }
  }

  // ---- 7b QUESTS (quest-revisit) — /Intent/quest = "<verb>:<...>". TWO ROUTES on one channel:
  //   MAIN (day-spine SIGNPOST): engine-seeded (ensureDaySignpost), narrate PROGRESSES it via the emit
  //     PAIRED with /Intent/stepDone; the keyed fence exception in the verbs below is what lets that
  //     through. It NEVER pays — the day's payout is daySwing.
  //   AD-HOC (PlayerQuest): narrate creates it with ONE graded judgment (Difficulty) + ONE objective;
  //     the engine owns the counter (Step/StepMax off the QUEST_STEPS ladder) and every payout number.
  //     ONLY this route pays (Affection to Target + optional attribute grant — the ONLY path that can
  //     raise STA; C/B inside the daily cap, A/S/SS bypass it, still stage-gated).
  // OWNERSHIP FENCE: Type=='GameEvent' (EventPack series + the signpost) is never touched by the player
  // verbs — EXCEPT today's signpost key, which accepts progress/complete (record writes, no payout).
  const QUEST_AFF = { C: 12, B: 20, A: 25, S: 40, SS: 60 };       // A/S/SS bypass the daily cap (MAJOR rewards)
  const QUEST_ATTR = { C: 1, B: 2, A: 3, S: 5, SS: 8 };          // absolute attribute grant on completion (v1: C/B +1..3 · A/S/SS +3..8)
  // The most RewardStat may grant him in one game-day, across every quest and stat (Mainchar.QuestStatPointsToday
  // counts it; the day roll and a time leap clear it). Completion is narrate's call and early completion is obeyed,
  // so without a daily ceiling a chain of promises kept on the spot would power-level him.
  const QUEST_STAT_POINTS_PER_DAY = 10;
  const QUEST_BYPASS = { C: false, B: false, A: true, S: true, SS: true };
  const QUEST_TERMINAL = ['Completed', 'Failed', 'Expired'];   // the Status values that close a quest — the settle sweeps exactly these
  const QUEST_STEPS = { C: 3, B: 4, A: 5, S: 8, SS: 10 };        // Difficulty -> StepMax: the ad-hoc pacing ladder — narrate never counts
  // the day-spine's quest key — MUST spell Window A's derivation exactly (its ## DAY OBJECTIVE panel
  // computes the same key from the same field; addQuest keys are [A-Za-z0-9_]+)
  const daySpineKey = (sd) => String(get((sd.EngineDerived || {}).DaySpine, '')).replace(/^@/, '').replace(/[^A-Za-z0-9_]/g, '_');
  // THE MAIN STORY'S OWN DURABLE RECORD — EventSpine.fired.<spine>_<date> = { Status }. A spine day is
  // seeded from the CALENDAR, never from EventPack.triggers, so the library's done-marker never sees it,
  // and the signpost quest it seeds is deleted at the settle. Without this there is nowhere in stat_data
  // that says the Entrance Ceremony happened, and no pack can gate on it. The DATE is in the KEY because a
  // spine name is not one occurrence: @Summer sits on fifteen calendar rows across an arc, @Obon on two a
  // year, and only @Entrance_Ceremony / @Graduation occur once — so one key per NAME could hold neither a
  // date nor an outcome. Underscores throughout: the WHEN-DSL's raw-path read is \w-only per segment, so a
  // hyphenated key would resolve to nothing, silently. ONE field: existence = the day passed, Status = the
  // outcome, and D16's settle is the one place that decides an outcome (Completed or Expired) — this
  // function COPIES it, never judges. Read through the SpineDone(*) alias; timeLeap clears the table.
  const spineRecordKey = (sd, dayIso) => {
    const spine = daySpineKey(sd);
    const iso = String(dayIso || playedDay(sd)).slice(0, 10);
    return (spine && iso) ? spine + '_' + iso.replace(/-/g, '_') : '';
  };
  // First write wins: completeQuest writes Completed the moment narrate reports it (readable the same day),
  // the settle writes whatever terminal Status the signpost carries — so the two sites cannot disagree.
  function markSpineDone(sd, key, status, log) {
    if (!key || !status) return false;
    const root = sd.EventSpine || (sd.EventSpine = {});
    const table = root.fired || (root.fired = {});
    if (table[key] && typeof table[key] === 'object' && String(get(table[key].Status, ''))) return false;
    table[key] = { Status: String(status) };
    log.push('SPINE RECORD ' + key + ' = ' + status);
    return true;
  }
  // ---- ONE WRITER (quest-revisit B5) — every NARRATE-side quest-record write funnels here; the callers
  // differ ONLY in where their fields came from (parsed narrate grammar · state-derived seed), and that
  // difference is fully spent before this call. An event pack's quest write does NOT come here: it goes
  // through the library's applyWrites under EVENT_PACK_ADAPTER.writes, which stamps Type/LastUpdated itself. Owns the shared work once: the field writes, the B7
  // reward composer, the LastUpdated stamp, the log line. Fields are BARE (non-tuple).
  function writeQuestRecord(sd, key, fields, label, log) {
    const MC = sd.Mainchar || (sd.Mainchar = {});
    const Q = MC.Quests || (MC.Quests = {});
    const rec = (Q[key] && typeof Q[key] === 'object') ? Q[key] : (Q[key] = {});
    const changed = [];
    for (const f of Object.keys(fields)) {
      if (fields[f] === undefined) continue;
      rec[f] = fields[f];
      changed.push(f);
    }
    // B7 REWARD DISPLAY COMPOSER — the status menu is a DUMB display bound straight to .Reward, so RES
    // keeps it displayable: a mechanical reward with no prose gets a composed line. Narrate's prose
    // always wins; a non-blank Reward is never overwritten.
    if (!String(get(rec.Reward, '')).trim() && String(get(rec.RewardStat, '')).trim()) {
      rec.Reward = '+' + String(get(rec.RewardStat, '')) + (String(get(rec.Target, '')).trim() ? ' · favors ' + String(get(rec.Target, '')) : '');
      changed.push('Reward(composed)');
    }
    rec.LastUpdated = nowStamp(sd);
    log.push(label + key + ' <- ' + changed.join('/'));
    return rec;
  }
  // ---- DAY SIGNPOST SEED (quest-revisit B1) — the player-visible cursor for a spine day. Deterministic
  // from state, so the ENGINE writes it: visible from reply 1, zero model involvement. Idempotent and
  // re-run every resolve, so a mid-day install still seeds.
  // OBJECTIVE IS DELIBERATELY EMPTY. The engine holds the calendar (day LABEL + spine KEY) but never the
  // step PROSE — that lives in the <Event_Spines> lorebook entry, which narrate reads IN FULL (every band,
  // every numbered step) from its first reply. So the engine states what it knows and stays silent on what
  // it does not: an empty Objective is a STATE Window A can see and ask narrate to fill, while any
  // placeholder string would be indistinguishable from a real objective, would leak to the player, and
  // would archive itself into ProgressSummary as if it were a played beat.
  // Step is NOT stamped either: the schema coerces Step to a number and a "<band>.<step>" string corrupts
  // there ("1.10" -> 1.1). The signpost's position lives in the LastStepDone cursor.
  //
  // THE LIVE STEP — the beat Window A prints as ▶ CURRENT BEAT, and the signpost's receipt while the band
  // still declares it (signpostStepOf). A cursor left in ANOTHER band names no position in this one, so a
  // band opens at .1 rather than counting on from a number that belonged to the band before it. MIRRORS
  // Window A's _step rule: the two must name the same beat, or the engine checks narrate's echo against a
  // step narrate was never shown and tells the player he has already played a beat that never existed.
  const liveStepOf = (cursor, band) => {
    const m = /^(\d+)\.(\d+)$/.exec(String(cursor || ''));
    return (m && +m[1] === Number(band)) ? (m[1] + '.' + (+m[2] + 1)) : (Number(band) + '.1');
  };
  // Whether the cursor has reached `step`: same band, same or a later position. A cursor in another
  // band has not reached it — a band's steps are counted only inside that band.
  const stepReached = (cursor, step) => {
    const c = /^(\d+)\.(\d+)$/.exec(String(cursor || ''));
    const s = /^(\d+)\.(\d+)$/.exec(String(step || ''));
    return Boolean(c && s && c[1] === s[1] && +c[2] >= +s[2]);
  };
  // TODAY'S BODY and what it declares per band ({ band: count }), or null for a day that declares no steps.
  // The body is "<@spine> dN" when the calendar label numbers the day, "<@spine> M/D" when the body is headed
  // by its date, else "<@spine>" — read off the CALENDAR row of the game day (DayDate), never a stored label.
  function spineStepCounts(sd) {
    const ED = sd.EngineDerived || {};
    const spine = String(get(ED.DaySpine, '')).trim();
    if (!spine) return null;
    const iso = String(get(ED.DayDate, '')).slice(0, 10);
    const row = lookupDay(iso);
    const dN = /\bd(\d)\b/.exec(row ? row.label : '');
    const md = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso);
    const keys = [dN ? spine + ' d' + dN[1] : '', md ? spine + ' ' + (+md[1]) + '/' + (+md[2]) : '', spine];
    for (const k of keys) if (k && SPINE_STEPS[k]) return SPINE_STEPS[k];
    return null;
  }
  // The bands whose declared steps have ALL been reported today: the ones the cursor walked out of complete
  // (EngineDerived.SpineBandsDone, stamped by applyStepDone), plus the band the cursor stands in once it has
  // reached that band's last declared step. `cursor` defaults to the stored LastStepDone.
  function spineBandsDone(sd, counts, cursor) {
    const ED = sd.EngineDerived || {};
    const done = new Set(String(get(ED.SpineBandsDone, '')).split(',').map((s) => s.trim()).filter(Boolean).map(Number));
    const at = String(cursor != null ? cursor : get(ED.LastStepDone, ''));
    for (const b of Object.keys(counts || {})) if (stepReached(at, b + '.' + counts[b])) done.add(Number(b));
    return done;
  }
  // Why today's spine is NOT finished, '' when it is. Finished = every band that declares steps had all of them
  // reported. A day that declares none is narrate's to call.
  function spineUnfinished(sd) {
    const counts = spineStepCounts(sd);
    if (!counts) return '';
    const done = spineBandsDone(sd, counts);
    const open = Object.keys(counts).map(Number).filter((b) => counts[b] > 0 && !done.has(b)).sort((a, b) => a - b);
    if (!open.length) return '';
    return open.map((b) => 'band ' + b + ' (' + b + '.1-' + b + '.' + counts[b] + ')').join(', ') + ' not all reported (cursor ' +
      (String(get((sd.EngineDerived || {}).LastStepDone, '')) || 'unset') + ')';
  }
  // Window A's read of the same facts: the body's counts, the finished bands, the bands still open, why the day is
  // unfinished ('' = finished), and the signpost receipts for the band the clock is in — `signpost` (the one the
  // objective must carry now) and `signpostNext` (the one that replaces it once that step is played). null for a
  // day that declares no steps.
  function spineStatus(sd) {
    const counts = spineStepCounts(sd);
    if (!counts) return null;
    const done = spineBandsDone(sd, counts);
    const W = sd.World || {};
    const g = civilToGame(String(get(W.Date, '')).slice(0, 10), String(get(W.Time, SCHOOL_BLOCKS[0])));
    const signpost = g ? signpostStepOf(sd, g.band, get((sd.EngineDerived || {}).LastStepDone, '')) : '';
    return { counts: Object.assign({}, counts), done: [...done].sort((a, b) => a - b),
      open: Object.keys(counts).map(Number).filter((b) => counts[b] > 0 && !done.has(b)).sort((a, b) => a - b),
      unfinished: spineUnfinished(sd), signpost, signpostNext: signpost ? signpostStepAfter(sd, signpost) : '' };
  }
  // THE SIGNPOST STEP — the RECEIPT the day objective carries in `band` with the cursor at `cursor`: the live step
  // while the band still has a declared step left; once the band is played out (every declared step reported, or
  // none declared), the first step of the next band that declares any — the beat {{user}} is heading for; 'end'
  // when no later band declares a step (the objective words the day winding down). A day without declared steps
  // keeps the live step. MIRRORS Window A's _sigStep: both name the same receipt, or the engine checks narrate's
  // echo against a step it was never shown — and a step that does not exist is one narrate will invent.
  function signpostStepOf(sd, band, cursor) {
    const b = Number(band);
    const live = liveStepOf(cursor, b);
    const counts = spineStepCounts(sd);
    if (!counts) return live;
    if ((counts[b] || 0) > 0 && !spineBandsDone(sd, counts, cursor).has(b)) return live;
    const next = [b + 1, b + 2, b + 3].find((x) => x <= 3 && counts[x] > 0);
    return next != null ? next + '.1' : 'end';
  }
  // The receipt that follows `step` once it is played: judged in the step's OWN band, so a next-band step played
  // early (the clock crossed into its band on the same reply) counts on inside that band. 'end' stays 'end'.
  function signpostStepAfter(sd, step) {
    const m = /^(\d+)\.\d+$/.exec(String(step || ''));
    return m ? signpostStepOf(sd, +m[1], step) : String(step || '');
  }
  function ensureDaySignpost(sd, log) {
    const key = daySpineKey(sd);
    if (!key) return;
    const Q = (sd.Mainchar || {}).Quests || {};
    const held = Q[key];
    if (held && typeof held === 'object') {
      // AN AD-HOC QUEST KEYED LIKE A SPINE SQUATS ON THE SIGNPOST. addQuest refuses to overwrite a
      // GameEvent, but the reverse order has no such fence: a PlayerQuest added on an ordinary day under
      // 'Summer' or 'Exams' is still sitting there when that spine day lands, the seed below never runs,
      // and the day opens with no cursor at all. Nothing is overwritten — the player's own record wins —
      // but the day SAYS why its signpost is missing instead of leaving it to be found in the prose.
      // Logged once: this runs three times per resolve.
      if (String(get(held.Type, '')) !== 'GameEvent') {
        const line = 'DAY SIGNPOST BLOCKED — Mainchar.Quests.' + key + ' is a ' + (String(get(held.Type, '')) || 'typeless') +
          ' record, not this day\'s signpost, so ' + key + ' opens with no cursor. An ad-hoc quest key must never match a @spine name';
        if (!log.some((l) => String(l).indexOf('DAY SIGNPOST BLOCKED') >= 0)) { log.push(line); warnRes(line); }
      }
      return;
    }
    // A 修学旅行 day carries WHERE on its own card, because the quest that collected it is gone by then.
    const tripDest = (key === 'School_Trip') ? String(get((sd.EngineDerived || {}).TripDestination, '')).trim() : '';
    return writeQuestRecord(sd, key, {
      Type: 'GameEvent',
      Title: String(get((sd.EngineDerived || {}).DayLabel, '')).trim() || key,
      Desc: tripDest || undefined,
      Objective: '',
      Status: 'On-going',
    }, 'SIGNPOST + ', log);
  }
  // ---- THE SCHOOL-TRIP QUEST — the record that carries the destination from the briefing to the trip a
  // week later. ENGINE-OWNED END TO END, because carrying it is bookkeeping and nothing else: RES opens it
  // the moment 修学旅行事前指導 lands, and closes it when d4 settles. Narrate's ONE act is naming the place,
  // which only the prose can know — it fills the Objective with a single progress: emit and touches nothing
  // else. It rides Mainchar.Quests rather than the world log for three reasons: /Intent/quest is the one
  // narrate channel no event body spends (the world-log slot is spent 210 times across the 21 of them, and
  // a beat ripening that evening would simply take it), a non-terminal quest survives every settle in
  // between, and the player can SEE the trip coming in his own ledger all week.
  // Idempotent and re-run every resolve, exactly like the day signpost beside it, so a mid-day install
  // still seeds. NO StepMax: this is a note the player carries, not a ladder, so the panel prints no rung
  // count and progress: never trips the at-the-final-step warning.
  const TRIP_QUEST_KEY = 'school_trip';
  function ensureTripQuest(sd, log) {
    if (String(get(((sd || {}).EngineDerived || {}).DaySpine, '')) !== '@School_Trip_Prep') return;
    const MC = sd.Mainchar || (sd.Mainchar = {});
    const Q = MC.Quests || (MC.Quests = {});
    if (Q[TRIP_QUEST_KEY] && typeof Q[TRIP_QUEST_KEY] === 'object') return;
    return writeQuestRecord(sd, TRIP_QUEST_KEY, {
      Type: 'PlayerQuest',
      Title: '修学旅行 School Trip',
      Desc: 'The year travels for four days. The briefing names where.',
      Objective: '',                                  // DELIBERATELY EMPTY — the destination is narrate's to supply
      Difficulty: 'C',
      Step: 1,
      Status: 'On-going',
      GrantedBy: 'Official.Card',
    }, 'TRIP QUEST + ', log);
  }
  // ...and HANDED OVER when the briefing day settles: the destination moves onto EngineDerived, where it
  // survives the week without a card of its own, and the quest is removed the moment the trip starts.
  // The quest cannot simply stay: the status menu is a DUMB display bound to the whole of Mainchar.Quests,
  // so it would sit beside the day signpost for all four days saying the same trip twice (Window A does
  // filter GameEvent rows out of ## QUESTS, which is why this only ever showed on the player's side).
  // Removed, not Completed: a Completed row is hidden from narrate but still drawn on that menu until the
  // next settle sweeps it, which is the whole of d1.
  function stashTripDestination(sd, row, log) {
    if (!row || row.spine !== '@School_Trip_Prep') return '';
    const q = ((sd.Mainchar || {}).Quests || {})[TRIP_QUEST_KEY];
    const dest = String(get((q || {}).Objective, '')).trim();
    if (!dest) return '';                                   // narrate never named one; d1 names its own and says so
    setVal(sd.EngineDerived || (sd.EngineDerived = {}), 'TripDestination', dest);
    log.push('TRIP DESTINATION kept for the week: ' + dest);
    return dest;
  }
  // CLOSED THE WAY EVERY OTHER QUEST IS: a TERMINAL status, collected by the one sweep in settleDay. No
  // bespoke delete — a record that disappears by its own private route is a record nothing else can be
  // trusted to collect if that route is ever missed.
  // Called on the settle that is ABOUT to land the trip, so the sweep a few lines below takes it in the
  // SAME settle: closing it once the trip day is already live would miss that sweep and leave it drawn on
  // the status menu beside the day signpost for the whole of d1 (the menu is a dumb display bound to the
  // whole of Mainchar.Quests — it shows Completed rows too, and it does not filter GameEvent as Window A does).
  function retireTripQuest(sd, landingRow, log) {
    if (!landingRow || landingRow.spine !== '@School_Trip') return false;
    const q = ((sd.Mainchar || {}).Quests || {})[TRIP_QUEST_KEY];
    if (!q || typeof q !== 'object') return false;
    if (QUEST_TERMINAL.indexOf(String(get(q.Status, ''))) >= 0) return false;
    writeQuestRecord(sd, TRIP_QUEST_KEY, { Status: 'Completed' }, 'TRIP QUEST done (the trip starts tomorrow) ', log);
    return true;
  }
  // The destination is spent when the last day settles (d4 is the one 修学旅行 row carrying BONDING), so next
  // year's briefing cannot inherit this year's answer.
  function clearTripDestination(sd, row, log) {
    if (!row || row.spine !== '@School_Trip' || row.check !== 'BONDING') return false;
    if (!String(get(((sd.EngineDerived) || {}).TripDestination, '')).trim()) return false;
    setVal(sd.EngineDerived, 'TripDestination', '');
    log.push('TRIP DESTINATION cleared (the trip is over)');
    return true;
  }
  // "key:Title|Desc|Objective(step 1)|Target|Difficulty[|RewardStat][|Reward prose]" — the AD-HOC create.
  // Narrate makes ONE grading judgment (Difficulty) and names ONE objective (step 1); Desc is the fixed
  // whole-quest summary that never changes. StepMax/Step and every payout number are engine-derived.
  function addQuest(sd, str, log) {
    const ci = String(str).indexOf(':');
    const key = (ci < 0 ? String(str) : String(str).slice(0, ci)).trim();
    if (!/^[A-Za-z0-9_]+$/.test(key)) { log.push('quest add ignored (bad key): ' + str); return; }
    const Q = (sd.Mainchar || {}).Quests || {};
    if (Q[key] && String(get(Q[key].Type, '')) === 'GameEvent') { log.push('quest add SKIPPED (GameEvent key, engine-owned): ' + key); return; }
    const f = (ci < 0 ? '' : String(str).slice(ci + 1)).split('|').map((s) => s.trim());
    // TITLE IS MANDATORY. The quest card's headline binds straight to .Title (the dumb display, 2b), so
    // a record without one is a quest the player can neither see nor name. Refused WHOLE, never
    // key-as-title: a substitute would hide from narrate that its emit came up short, and the next
    // one would be short too. The log names the key so the reader sees which add died.
    if (!f[0]) { log.push('quest add REFUSED (no Title — the first field is mandatory): ' + key); return; }
    let diff = (f[4] || '').toUpperCase();
    if (!QUEST_STEPS[diff]) {                                     // B8: loud, never a silent default
      log.push('quest add: Difficulty "' + (f[4] || '') + '" is not C/B/A/S/SS — defaulted to C');
      diff = 'C';
    }
    const rewardStat = (f[5] && ['Int', 'Str', 'Cha', 'Sta'].indexOf(f[5]) >= 0) ? f[5] : undefined;
    if (f[5] && !rewardStat) log.push('quest add: RewardStat "' + f[5] + '" is not Int/Str/Cha/Sta — dropped');
    writeQuestRecord(sd, key, {
      Type: 'PlayerQuest',
      Title: f[0],
      Desc: f[1] || undefined,
      Objective: f[2] || undefined,
      Target: f[3] || undefined,
      Difficulty: diff,
      RewardStat: rewardStat,
      Reward: f[6] || undefined,
      Step: 1,
      StepMax: QUEST_STEPS[diff],
      Status: 'On-going',
    }, 'QUEST + ', log);
  }
  // progress:<key>:<next objective> — narrate reports "this step FINISHED; here is the next goal".
  // WHETHER a step finished is narrate's judgment by design: the objective is prose, and only a prose
  // reader can tell that "take Nana home" was met by walking her to her train. The ENGINE owns the
  // counter — Step++ here, clamped at StepMax — so it can never desync, skip, or run backwards.
  // The finished objective is archived into ProgressSummary. Signpost: objective swap ONLY (its position
  // is the LastStepDone cursor, not the ladder).
  function progressQuest(sd, key, nextObjective, log) {
    const q = ((sd.Mainchar || {}).Quests || {})[key];
    if (!q || typeof q !== 'object') { log.push('quest progress ignored (no such quest): ' + key); return; }
    const finished = String(get(q.Objective, '')).trim();
    if (String(get(q.Type, '')) === 'GameEvent') {
      if (key !== daySpineKey(sd)) { log.push('quest progress SKIPPED (GameEvent, engine-owned): ' + key); return; }   // fence — keyed exception (B2)
      // STEP ECHO — the objective may open with the step id narrate READ to write it ("0.4:Attend the
      // ceremony"). It is an OBSERVATION of which spine step it copied, never a verdict, and it is
      // stripped here so it never reaches the player's objective text. resolveTurn cross-checks it
      // against the cursor AFTER stepDone lands (a mis-read is otherwise invisible until someone reads
      // the prose). Optional by design: a model that omits it still writes a valid objective.
      // 'end' is the receipt for an objective that words the day winding down (no later band declares a step).
      const echo = /^(\d+\.\d+|end)\s*:\s*([\s\S]*)$/.exec(String(nextObjective || ''));
      const text = echo ? echo[2].trim() : nextObjective;
      // A REPEAT IS NOT A HANDOVER. Window A tells narrate to send when unsure, so the same objective
      // arrives twice, and archiving then copies the CURRENT text into ProgressSummary and destroys the
      // beat that actually finished (live 2026-08-25 mes6: both fields read "Find your name on the
      // class-assignment lists"). Nothing finished, so nothing is archived — that is what makes the
      // 'send when in doubt' invitation honest.
      const repeat = String(text || '').trim() === finished;
      if (repeat) log.push('SIGNPOST ~ ' + key + ' repeat objective (unchanged) — ProgressSummary kept');
      writeQuestRecord(sd, key, { Objective: text || undefined, ProgressSummary: repeat ? undefined : (finished || undefined) }, 'SIGNPOST ~ ' + (echo ? '(read step ' + echo[1] + ') ' : '(no step echoed) '), log);
      return echo ? echo[1] : '';
    }
    const step = Number(get(q.Step, 1)) || 1;
    const max = Number(get(q.StepMax, 0)) || 0;
    // STEP ECHO, ad-hoc — the same receipt the signpost carries, in THIS ladder's numbering: the rung the
    // NEW objective is for. Stripped so it never reaches the player (the signpost stripped its own and this
    // path did not, so a model carrying the habit across wrote a literal "3:" into the visible objective),
    // and cross-checked so a narrate that has lost count says so instead of the ledger silently disagreeing.
    // GUARDED TWICE, because an objective may LEGITIMATELY open with a number: "10:30 meet her at the gate"
    // is a time, not a rung. So the text after the colon must start with a NON-DIGIT, and the number must
    // fall inside this quest's own ladder (StepMax tops out at 10, exactly where times start to collide).
    const qEcho = /^(\d+)\s*:\s*(\D[\s\S]*)$/.exec(String(nextObjective || ''));
    const echoN = (qEcho && (!max || +qEcho[1] <= max)) ? +qEcho[1] : 0;
    const objText = echoN ? qEcho[2].trim() : nextObjective;
    const wantRung = max ? Math.min(step + 1, max) : step + 1;
    if (echoN && echoN !== wantRung) {
      // Both, exactly as the signpost does: warnRes surfaces it live, log.push puts it in the turn record
      // the tests and the [RES] dump read. A warn that never reaches the log is invisible to both.
      const qMsg = 'QUEST STEP MISMATCH: ' + key + ' objective was written for step ' + echoN + ' but the ladder is at '
        + wantRung + ' — "' + objText + '" describes the wrong rung';
      log.push(qMsg);
      warnRes(qMsg);
    }
    // Same rule as the signpost above: identical text means nothing finished. The ad-hoc ladder is a
    // COUNTER, so a repeat must not advance it either — a silently burnt rung pays the reward early.
    if (String(objText || '').trim() === finished && finished) {
      log.push('QUEST ~ ' + key + ' repeat objective (unchanged) — rung ' + step + ' and ProgressSummary both kept');
      return;
    }
    if (max && step >= max) {                                     // B6 clamp — the counter never passes the ladder
      warnRes('quest ' + key + ' progressed AT its final step ' + step + '/' + max + ' — finish with complete:, not progress: (objective updated, counter clamped)');
      writeQuestRecord(sd, key, { Objective: objText || undefined, ProgressSummary: finished || undefined }, 'QUEST ~ ', log);
      return;
    }
    writeQuestRecord(sd, key, { Step: step + 1, Objective: objText || undefined, ProgressSummary: finished || undefined }, 'QUEST ~ ', log);
  }
  function completeQuest(sd, key, log) {
    const MC = sd.Mainchar || {};
    const q = (MC.Quests || {})[key];
    if (!q || typeof q !== 'object') { log.push('quest complete ignored (no such quest): ' + key); return; }
    if (String(get(q.Type, '')) === 'GameEvent') {
      if (key !== daySpineKey(sd)) { log.push('quest complete SKIPPED (GameEvent, engine-owned): ' + key); return; }  // ownership fence
      // signpost completion — a record write, NEVER a payout (only the ad-hoc route pays; the day pays
      // through daySwing). settleDay deletes the record when the day actually closes.
      if (String(get(q.Status, '')) === 'Completed') { log.push('quest ' + key + ' already completed'); return; }
      writeQuestRecord(sd, key, { Status: 'Completed' }, 'SIGNPOST done ', log);
      markSpineDone(sd, spineRecordKey(sd), 'Completed', log);   // durable — the record above dies at the settle, this does not
      return;
    }
    if (String(get(q.Status, '')) === 'Completed') { log.push('quest ' + key + ' already completed'); return; }                   // idempotent
    const stepNow = Number(get(q.Step, 0)) || 0;
    const stepMax = Number(get(q.StepMax, 0)) || 0;
    if (stepMax && stepNow < stepMax) warnRes('quest ' + key + ' completed EARLY at step ' + stepNow + '/' + stepMax + ' — obeyed (the story ended it; filler steps would bend the prose)');
    if (!String(get(q.Difficulty, '')).trim()) log.push('quest ' + key + ' has no Difficulty — payout uses the C default');       // B8: loud
    const diff = String(get(q.Difficulty, 'C')).toUpperCase();
    const affAmt = QUEST_AFF[diff] != null ? QUEST_AFF[diff] : QUEST_AFF.C;
    const target = String(get(q.Target, '')).trim();
    const c = target ? (sd.Classmate || {})[target] : null;
    if (target && !(c && typeof c === 'object')) warnRes('quest ' + key + ' Target "' + target + '" is not a Classmate — Affection reward skipped (a RewardStat still grants)');   // B8: loud
    if (c && typeof c === 'object' && affAmt) {
      let paid = affAmt;
      if (QUEST_BYPASS[diff]) setVal(c, 'Affection', clamp((Number(get(c.Affection, 0)) || 0) + affAmt, 0, 100));   // A/S/SS bypass the daily cap
      else paid = applyAffection(c, affAmt);                                                                        // C/B daily-capped
      tryStageGate(c, sd, log);                                                                                     // reward still respects the gate
      log.push('quest reward: ' + target + ' ' + affectionGainText(affAmt, paid) + (QUEST_BYPASS[diff] ? ' (bypass)' : ''));
    }
    const stat = String(get(q.RewardStat, '')).trim();
    if (['Int', 'Str', 'Cha', 'Sta'].indexOf(stat) >= 0) {                                                          // attribute grant — Sta included
      const amt = QUEST_ATTR[diff] != null ? QUEST_ATTR[diff] : 1;
      // Two ceilings, the day's first: what is left of today's QUEST_STAT_POINTS_PER_DAY, then 100 on the stat. A Str
      // or Sta grant passes what its stat has no room for to the other of the pair; Int and Cha have no partner, so a
      // grant on a maxed one lands nothing (the player chose that quest).
      const spentToday = Number(get(MC.QuestStatPointsToday, 0)) || 0;
      const dayRoom = Math.max(0, QUEST_STAT_POINTS_PER_DAY - spentToday);
      const isPhysical = PHYSICAL_STATS.indexOf(stat) >= 0;
      const gains = gainsWithinCap(MC, isPhysical ? physicalPair(stat) : [stat], Math.min(amt, dayRoom));
      for (const g of gains) setVal(MC, g.stat, g.value);
      const landed = gains.reduce((n, g) => n + g.amount, 0);
      if (landed) setVal(MC, 'QuestStatPointsToday', spentToday + landed);
      if (!dayRoom) log.push('quest reward: MainChar ' + stat + ' withheld — today\'s ' + QUEST_STAT_POINTS_PER_DAY + ' quest stat points are spent');
      else if (!gains.length) log.push('quest reward: MainChar ' + (isPhysical ? 'Str and Sta are' : stat + ' is') + ' already 100 — nothing to add');
      else log.push('quest reward: MainChar ' + gains.map((g) => g.stat + ' +' + g.amount + ' -> ' + g.value).join(', ')
                    + (landed < amt ? ' (of ' + amt + '; ' + (dayRoom < amt ? 'today\'s quest stat points ran out at ' + QUEST_STAT_POINTS_PER_DAY : '100 is the ceiling') + ')' : ''));
    }
    q.Status = 'Completed';
    q.LastUpdated = nowStamp(sd);
    if (c) pushImportantEvent(c, 'Quest completed: ' + String(get(q.Title, key)), sd, log);                         // milestone (route history)
    log.push('QUEST ' + key + ' COMPLETED (' + diff + ')');
  }
  // Returns { echo, spineComplete }: echo = the STEP ECHO a signpost progress declared (see progressQuest), which
  // resolveTurn cross-checks against the cursor once stepDone has landed; spineComplete = the day signpost's key
  // when this op is its "complete:" — HELD, not applied, because resolveTurn judges it only after this reply's
  // stepDone has moved the cursor (a reply that plays the last step and closes the day in one patch).
  function applyQuest(sd, str, log) {
    const s = String(str);
    const ci = s.indexOf(':');
    const verb = (ci < 0 ? s : s.slice(0, ci)).trim().toLowerCase();
    const arg = ci < 0 ? '' : s.slice(ci + 1);
    if (verb === 'add') addQuest(sd, arg, log);
    else if (verb === 'complete') {
      const key = arg.trim();
      const held = ((sd.Mainchar || {}).Quests || {})[key];
      if (key && key === daySpineKey(sd) && held && typeof held === 'object' && String(get(held.Type, '')) === 'GameEvent') return { echo: '', spineComplete: key };
      completeQuest(sd, key, log);
    }
    else if (verb === 'progress') { const pi = arg.indexOf(':'); return { echo: progressQuest(sd, (pi < 0 ? arg : arg.slice(0, pi)).trim(), (pi < 0 ? '' : arg.slice(pi + 1)).trim(), log) || '', spineComplete: '' }; }
    else log.push('quest ignored (bad verb ' + verb + '): ' + str);
    return { echo: '', spineComplete: '' };
  }

  // ==== CLUSTER 5 — H-SYSTEM (intimacy_system v1). The resolver OWNS the H-math; the narrator declares a compact
  // per-reply /Intent/hact and the entry/exit /Intent/intimacy latch. Pass 1: the IntimacyActive latch + the H-ACT
  // GATE RESULT (§1) + ACT DISCOVERY (§2). Pass 2/2.1: per-reply meters (Energy/Arousal/ClimaxGauge/Exp + sex-builds-arousal).
  // Pass 3 (§7/7b): the CLIMAX (the narrator's ;climax on a sex act whose fill reaches 100 → the release; a fill the prose did not climax
  // holds at 99), the EDGE loop (/Intent/hact ;destim → meter ×0.7, ≥BRINK 75 = one EDGE → EdgeStreak+1 & Energy−5), the EdgeStreak-scaled RELEASE tier (normal/潮吹/OVERWHELMING/SHATTERING),
  // afterglow Arousal SET (user-locked 30-40 / 45-55 / 50-60), and AHEGAO (Energy 0 → mandatory state + not-ready Aff−10).
  // Pass 4.1 (§3): POSITIONS — hactPanel() PRE-RESOLVES each tier's target from her live Exp and his STR (auto-pass Exp≥50 Int /
  // ≥75 Adv · Exp bonus folded into a flat "RawDie≥N" target · ekiben +STR) and the ## INTIMACY panel prints it, so the
  // narrator writes the beat in-sync. It declares /Intent/hact ";pos:<Name>"
  // (+ ";pgate:<die>" only on a ROLLED, non-auto attempt — the RAW die; the engine recomputes the target via
  // positionTier/positionTarget and derives the outcome). RES records HPosition on a reached target / AUTO; a
  // missed one is a FUMBLE (Energy −3, stays basic — NOT a declined act; the sex act still runs).
  // Whether an act takes a gate die at all comes from hactGateOwed(), and its DC from hactGateDc() (HDC block below):
  // hactPanel() prints both and applyHact judges the reported die by them, from the same snapshot — the narrator reports
  // the die it took, never an outcome, and never decides whether to roll
  // (HACT_DIE_REPORT_PLAN; the social check's CHECK DESYNC history is why). ====
  // ---- H CONSTANTS (intimacy_system §4-5; all owned by RES, mirrored NOWHERE — the ## INTIMACY panel reads the values
  // RES writes, never re-computes them). FOREPLAY acts build Arousal (free energy); SEX acts spend Energy + fill the meter + build Arousal
  // (Oral fast, like foreplay; penetration only a little).
  const HEXP = { Kissing: 'Exp_Caress', Breast: 'Exp_Caress', Fingering: 'Exp_Caress', Oral: 'Exp_Oral', Vaginal: 'Exp_Vaginal', Anal: 'Exp_Anal' };
  const HFORE = { Kissing: [15, 20, 30], Breast: [20, 30, 40], Fingering: [20, 30, 40] };   // Arousal gain [gentle,normal,intense] (§4C)
  const HSEX = ['Oral', 'Vaginal', 'Anal'];
  const ACT_BASE = { Oral: 40, Vaginal: 50, Anal: 60 };            // Energy cost base (§4A)
  // ClimaxGauge fill per SEX reply, [gentle, normal, intense] (§4B). Small steps, so she passes through the brink (BRINK..99)
  // on her way up instead of jumping it: the brink is where a climax can be written and where she can be edged (§7, §7b).
  const ORG_GAIN = { Oral: [10, 15, 20], Vaginal: [15, 20, 25], Anal: [15, 20, 25] };
  // A climax happens when the prose shows it: the narrator reports ;climax on that reply's hact, and it counts only when THIS
  // reply's sex act fills her meter to CLIMAX_AT (her meter at the start + the act's fill at the reported pace, kink included).
  // The ## INTIMACY panel prints, per sex act, the paces that get her there from her current meter (hactPanel().girls[k].finish),
  // so the narrator looks up the pace it already reports and never forecasts. BRINK = CLIMAX_AT minus the biggest fill (25):
  // from the brink one push can finish her, and a stop there is an edge (§7b). A fill that falls short stops at CLIMAX_HOLD,
  // so she waits on the brink and any pace finishes her the reply after.
  const BRINK = 75, CLIMAX_AT = 100, CLIMAX_HOLD = 99;
  // §7 the paces that finish her THIS reply from `meter`, per sex act: { Oral: [...], Vaginal: [...], Anal: [...] } (no kink).
  const finishPaces = (meter) => {
    const out = {};
    for (const act of HSEX) out[act] = ['gentle', 'normal', 'intense'].filter((p) => meter + orgGain(act, p) >= CLIMAX_AT);
    return out;
  };
  const HSEX_AR = { Oral: [25, 35, 45], Vaginal: [4, 6, 8], Anal: [3, 5, 7] };   // Arousal build from a SEX act [gentle,normal,intense] (§4C) — Oral warms her like foreplay; penetration builds only a little

  const ENERGY_FLOOR = { Oral: 9, Vaginal: 9, Anal: 13 };
  // The share of the full drain an act costs, applied last (after the floor). Oral is a sex act in every other way —
  // it fills her meter and can bring her to climax — but it spends only a fifth of the energy.
  const ENERGY_SCALE = { Oral: 0.2, Vaginal: 1, Anal: 1 };
  const staRelief = (s) => (s < 20 ? 0 : s < 40 ? 6 : s < 60 ? 15 : s < 80 ? 24 : 30);
  const expRelief = (e) => (e < 25 ? 0 : e < 50 ? 5 : e < 75 ? 11 : e < 100 ? 17 : 22);
  const arousalRelief = (a) => (a < 40 ? 0 : a < 70 ? 5 : 10);
  const paceIdx = (p) => (p === 'gentle' ? 0 : p === 'intense' ? 2 : 1);
  const paceExp = (p) => (p === 'gentle' ? 1 : p === 'intense' ? 3 : 2);
  // The act gate's grade multiplies that reply's Exp gain: a rolled CritSuccess ×3, a rolled Success ×2. A Failure that
  // still proceeds (the LOYAL_PUPPY bypass) and an established act that was never rolled gain the plain pace amount.
  const GATE_EXP_MULTIPLIER = { CritSuccess: 3, Success: 2 };
  const energyCost = (act, sta, expAct, arousal, kinkRelief) => Math.round(ENERGY_SCALE[act] *
    Math.max(ENERGY_FLOOR[act], ACT_BASE[act] - staRelief(sta) - expRelief(expAct) - arousalRelief(arousal) - (kinkRelief || 0)));
  // MainChar pays the same flat cost for every SEX act (Oral, Vaginal or Anal), scaled by his Sta only:
  // 10 at Sta 30, 6 at Sta 50, 3 at Sta 100. Pace, kink, Exp and Arousal do not change it.
  const MAINCHAR_SEX_ENERGY = 10, MAINCHAR_STA_PIVOT = 30;
  const mainCharEnergyCost = (sta) => Math.round(MAINCHAR_SEX_ENERGY * MAINCHAR_STA_PIVOT / Math.max(1, sta));
  const orgGain = (act, pace) => ORG_GAIN[act][paceIdx(pace)];
  const voiceLeaking = (ar, om) => ((ar >= 60 && om >= 40) || ar >= 80 || om >= 70);   // §5 (also read in Window A)
  // ---- PASS 3 constants (§7 climax · §7b edge release). EdgeStreak scales the RELEASE; afterglow Arousal is SET (not
  // subtracted) to a user-locked band midpoint that sits BELOW the 40 arousal-relief line (normal) so she must be re-warmed
  // after every finish. releaseTier maps the streak to name / afterglow-Arousal / M nudge / forced-Ahegao.
  const AUTO_SQUIRT_EDGES = 3;                                                        // an edged release this deep squirts with no die
  const releaseTier = (streak, strongRoll) => {
    if (streak > 4) return { name: 'SHATTERING',    af: 62, m: 2, ahegao: true };   // ≥5 edges — collapses into Ahegao from the release itself
    if (streak > 3) return { name: 'OVERWHELMING',  af: 60, m: 0, ahegao: false };  // 4 edges — LIKELY → Ahegao (energy-driven, handled below)
    if (streak >= AUTO_SQUIRT_EDGES) return { name: 'STRONG(潮吹)', af: 55, m: 0, ahegao: false };  // 3 edges — auto Strong-Orgasm; edged afterglow 55-62
    return strongRoll                                                                 // streak 0-2 → normal, unless the committed 潮吹 roll landed
      ? { name: 'STRONG(潮吹)', af: 50, m: 0, ahegao: false }                          // 潮吹 afterglow 45-55
      : { name: 'normal',       af: 35, m: 0, ahegao: false };                         // normal afterglow 30-40 (below the 40 relief line → re-warm needed)
  };
  // §7b the edged release's Lewd nudge ("she learns to crave denial"), by the edges spent: 0-1 +0 · 2 +2 · 3 +3 · 4 +4 · 5+ +5.
  // Stage-gated like every Lewd rise (addLewd).
  const edgeLewd = (streak) => (streak >= 2 ? Math.min(streak, 5) : 0);
  const SQUIRT_ROLL_STAGES = ['Girlfriend', 'Loyal_Puppy'];                               // the stages whose climax rolls for 潮吹
  // 潮吹 (SQUIRTING) — whether her climax this reply squirts, from her stage, Affection and EdgeStreak as the reply
  // started. The one rule: hactPanel() prints it on her ⚡AT THE BRINK line, so the narrator reads the answer and never
  // judges her stage, and applyHact judges a reported ;strong die by it.
  //   auto — an edged release (EdgeStreak ≥ AUTO_SQUIRT_EDGES) squirts at any stage, with no die;
  //   roll — a Girlfriend or Loyal_Puppy squirts when the die reaches `target`, STRONG_TARGET with floor(Aff/20) taken off;
  //   none — any other stage (Dating and Friends_With_Benefits included) cannot squirt, and a ;strong die is ignored.
  function squirtRule(stage, aff, edge) {
    if ((Number(edge) || 0) >= AUTO_SQUIRT_EDGES) return { mode: 'auto' };
    if (SQUIRT_ROLL_STAGES.indexOf(String(stage || '')) >= 0) return { mode: 'roll', target: HDC.STRONG_TARGET - Math.floor((Number(aff) || 0) / 20) };
    return { mode: 'none' };
  }
  const LEWD_GROWTH_STAGES = ['Girlfriend', 'Friends_With_Benefits', 'Loyal_Puppy'];       // Lewdness RISES only in an established sexual relationship; H before it (Dating and below) does not build drive
  // THE single gate for every Lewdness RISE — per-scene growth, ;kink hit, edged release all route here. A rise is
  // dropped unless she is Girlfriend / Friends_With_Benefits / Loyal_Puppy. Returns the amount actually applied (0 if gated),
  // so callers can log only the real gain. A non-positive delta (a rare reset/fall) is NEVER gated.
  const addLewd = (c, amt) => {
    if (amt > 0 && LEWD_GROWTH_STAGES.indexOf(String(get(c.RelationshipStage, ''))) < 0) return 0;
    setVal(c, 'Lewdness', clamp((Number(get(c.Lewdness, 0)) || 0) + amt, 0, 100));
    return amt;
  };
  // THE H GATE TABLES — their only home. The ## INTIMACY panel prints the numbers hactPanel() returns,
  // and RES judges the narrator's reported dice with the same functions from the same snapshot, so the
  // DC the narrator reads is the DC its die is judged against.
  // The narrator reports the RAW DIE it took (";gate:<die>"), never a verdict — RES derives the
  // outcome from these tables, exactly as the social check derives from PRE's frozen numbers.
  const HDC = {
    HB: { Kissing: 7, Breast: 12, Fingering: 12, Oral: 12, Vaginal: 16, Anal: 18 },
    MADD: { Kissing: [0, 1, 2, 3], Breast: [0, 1, 3, 4], Fingering: [0, 1, 3, 4], Oral: [0, 2, 4, 6], Vaginal: [0, 2, 4, 6], Anal: [3, 5, 7, 9] },
    EXPOF: { Kissing: null, Breast: 'Exp_Caress', Fingering: 'Exp_Caress', Oral: 'Exp_Oral', Vaginal: 'Exp_Vaginal', Anal: 'Exp_Anal' },
    STAGE_H: {                                                    // the stage's ease, per act; a stage not listed adds 0
      Kissing: { Stranger: -1, Acquaintance: -1, Friend: -1, Dating: -7, Friends_With_Benefits: -10, Girlfriend: -10, Loyal_Puppy: -15 },
      Breast: { Stranger: -1, Acquaintance: -1, Friend: -1, Dating: -7, Friends_With_Benefits: -10, Girlfriend: -10, Loyal_Puppy: -15 },
      Fingering: { Stranger: -1, Acquaintance: -1, Friend: -1, Dating: -7, Friends_With_Benefits: -10, Girlfriend: -10, Loyal_Puppy: -15 },
      Oral: { Stranger: -1, Acquaintance: -1, Friend: -1, Dating: -8, Friends_With_Benefits: -10, Girlfriend: -10, Loyal_Puppy: -15 },
      Vaginal: { Stranger: -1, Acquaintance: -1, Friend: -1, Dating: -12, Friends_With_Benefits: -13, Girlfriend: -13, Loyal_Puppy: -15 },
      Anal: { Stranger: -1, Acquaintance: -1, Friend: -1, Dating: -7, Friends_With_Benefits: -14, Girlfriend: -14, Loyal_Puppy: -15 },
    },
    PRIV_PRIVATE: { 'Home_MaincharRoom': 1, 'Home_ClassmateRoom': 1, 'Town_LoveHotel': 1 },
    PRIV_PUBLIC: { 'School_Hallway': 1, 'School_Gate': 1, 'School_Entrance': 1, 'School_Courtyard': 1, 'School_Cafeteria': 1, 'School_Gym': 1,
      'School_Grounds': 1, 'School_Pool': 1, 'School_StaffRoom': 1, 'Town_BusStop': 1, 'Town_Station': 1, 'Town_ShoppingStreet': 1,
      'Town_ShoppingMall': 1, 'Town_Cafe': 1, 'Town_FamilyRestaurant': 1, 'Town_CandyShop': 1, 'Town_Arcade': 1, 'Away_TripDest': 1 },
    PRIV_DC: { PRIVATE: -2, SEMI: 2, PUBLIC: 5 },
    POS_BASE: { Intermediate: 12, Advanced: 16, Ekiben: 18 },     // folded targets: base − expB (− strMod for Ekiben) + privDC, min 1
    STRONG_TARGET: 12,                                            // 潮吹: die + floor(Aff/20) ≥ 12, SQUIRT_ROLL_STAGES only (squirtRule)
  };
  const mBand = (m) => (m < 40 ? 0 : m <= 60 ? 1 : m <= 80 ? 2 : 3);
  const statMod = (v) => Math.floor((Number(v) || 0) / 25);       // Window A's `mod` — CHA folds into the act-gate roll, STR into Ekiben
  // H SUBMISSION — M_level (−100 S … +100 M) is how she answers his lead in sex, and only there: outside H her Persona
  // and traits decide. THE SCENE'S COUNT moves it: every reply with a hact on her is a beat for her (she ends it in a
  // female-led position) or for him (his input dominates her, ;dom), both cancel, and when the scene ends — for any
  // reason — the larger side moves her SCENE_M_STEP (sceneSubmissionShift, closeHeroineScene). The ## INTIMACY panel prints
  // her band with that band's behaviour and position rule (<Intimacy_system> 6). Bands start at ±10, ±30, ±50 and ±90.
  const SCENE_M_STEP = 10;
  const SUBMISSION_BANDS = { M: ['Yielding', 'Submissive', 'Devoted', 'IamYours'], S: ['Leading', 'Assertive', 'Dominant', 'IamQueen'] };
  function submissionBand(mLevel) {
    const m = Number(mLevel) || 0, size = Math.abs(m);
    if (size < 10) return 'Neutral';
    return SUBMISSION_BANDS[m > 0 ? 'M' : 'S'][size >= 90 ? 3 : size >= 50 ? 2 : size >= 30 ? 1 : 0];
  }
  // FEMALE-LED (女主導) positions follow her band: an S-side band takes one herself (WILLING), an M-side band never starts
  // one but takes one he puts her in (ON_ORDER), and a Neutral girl is WILLING only once her Lewdness drive reaches 60.
  const FEMALE_LED_LEWD = 60;
  function femaleLedWillingness(mLevel, lewdness) {
    const band = submissionBand(mLevel);
    if (SUBMISSION_BANDS.S.indexOf(band) >= 0) return 'WILLING';
    if (SUBMISSION_BANDS.M.indexOf(band) >= 0) return 'ON_ORDER';
    return (Number(lewdness) || 0) >= FEMALE_LED_LEWD ? 'WILLING' : 'UNWILLING';
  }
  // HER BEAT is a reply she ends on top: the <H_Position> 女主導 rows that report a ;pos name of their own. A she-pins-him
  // variant reports its base name (Standing, Face-to-face sitting), so it is not one.
  const FEMALE_LED_POSITIONS = ['cowgirl', 'reverse cowgirl', 'spider cowgirl', 'anal reverse cowgirl', 'reverse sitting', 'face-sitting'];
  const isFemaleLedPosition = (name) => FEMALE_LED_POSITIONS.indexOf(String(name || '').trim().toLowerCase()) >= 0;
  // DOMINANT AND IAMQUEEN PUSH BACK — while her Arousal at the START of the reply is above OVERRULE_AROUSAL, his push
  // (;dom) is hers: she overrules him and the beat is hers. Every other band yields to his push. In 💫Ahegao she has no
  // agency to push back, except a Loyal_Puppy (<Intimacy_system> 7).
  const OVERRULE_BANDS = ['Dominant', 'IamQueen'];
  const OVERRULE_AROUSAL = 80, OVERRULE_AROUSAL_COST = 15;
  function overrulesPush(band, arousal, inAhegao, isLoyalPuppy) {
    return OVERRULE_BANDS.indexOf(band) >= 0 && (Number(arousal) || 0) > OVERRULE_AROUSAL && (!inAhegao || !!isLoyalPuppy);
  }
  // THE SCENE'S COUNT → the shift its end applies: more of hers −SCENE_M_STEP (toward S), more of his +SCENE_M_STEP
  // (toward M), a tie 0. Gentle scenes count nothing, so they move nothing.
  function sceneSubmissionShift(hers, his) {
    const h = Number(hers) || 0, m = Number(his) || 0;
    return h > m ? -SCENE_M_STEP : m > h ? SCENE_M_STEP : 0;
  }
  // POSITION 体位 → TIER — the engine half of the h_position.txt catalog (HACT_DIE_REPORT_PLAN B8). The narrator
  // reports ;pos as the ENGLISH name in the catalog's brackets (Missionary, Cowgirl, Folded …), because a word the engine
  // reads must be one fixed spelling: the Japanese terms drift in a Chinese story (騎乗位 is written 騎乘位), and a name
  // the ladder cannot read records no tier. Flavor variants report their base's name; a →Adv variant and an anal one
  // carry their own (Suspended missionary · Anal doggy). Order is load-bearing (Reverse cowgirl and Standing pine must
  // win before Cowgirl and Standing; Face-sitting before sitting). Returns:
  //   'NONPEN' (foreplay, no roll) · 'ORAL' (display-only, no roll) · 'Basic' (AUTO always) ·
  //   'Intermediate' · 'Advanced' · 'Ekiben' · '' (not in the catalog — pgate unjudgeable).
  const POSITION_LADDER = [
    [/\bsumata\b/i, 'NONPEN'],
    [/\bekiben\b/i, 'Ekiben'],
    [/\bfellatio\b|\birrumatio\b|\bcunnilingus\b|\b69\b|\bface-sitting\b/i, 'ORAL'],
    [/\bsuspended\b|\bbridge\b|\bmating press\b|\bspread-leg\b|\bguillotine\b|\by-balance\b|\bstanding pine\b|\bspider\b|\bcannonball\b|\bextreme\b|\brestraint platform\b|\bunderwater\b|\bcrossed-leg\b|\breverse cowgirl\b|\bfolded\b/i, 'Advanced'],
    [/\bcowgirl\b|\bsitting\b|\bside\b|\bstanding\b/i, 'Intermediate'],
    [/\bmissionary\b|\bdoggy\b/i, 'Basic'],
  ];
  function positionTier(name) {
    const n = String(name || '').trim();
    if (!n) return '';
    const rung = POSITION_LADDER.find(([re]) => re.test(n));
    return rung ? rung[1] : '';
  }
  // An anal position names it: "Anal <base>" (Anal doggy, Anal reverse cowgirl) — the +3 target and the Exp_Vaginal lock.
  const isAnalPosition = (name) => /\banal\b/i.test(String(name || ''));
  // B1 SNAPSHOT — taken at the TOP of resolveTurn, before ANY stage mutates state, so the DC RES
  // judges by is the DC the ## INTIMACY panel printed (the panel rendered from exactly this state:
  // PRE patches only Intent.*, which no H formula reads). A same-reply confession moving her stage,
  // or a same-reply scene move re-pricing the venue (INV-4/INV-5), can therefore never re-price a
  // roll the narrator already took against the printed number.
  function buildHactSnapshot(sd) {
    const W = sd.World || {}, ED = sd.EngineDerived || {}, MC = sd.Mainchar || {}, CM = sd.Classmate || {};
    const WR = sd.WorldRecord || {};
    const hh = parseInt(String(get(W.Time, '07:30')).slice(0, 2), 10) || 0;
    const tod = hh >= 5 && hh < 11 ? 'MORNING' : hh >= 11 && hh < 16 ? 'DAY' : hh >= 16 && hh < 19 ? 'AFTERCLASS-EVE' : 'NIGHT';
    const mode = String(get(ED.Mode, 'SCHOOL'));
    const loc = String(get(W.Location, '') || '');
    const regPriv = String(get(((WR.Locations || {})[loc] || {}).Privacy, '') || '').trim().toUpperCase();
    const priv = loc === 'School_Classroom' ? ((mode === 'SCHOOL' && (tod === 'MORNING' || tod === 'DAY')) ? 'PUBLIC' : 'SEMI')
      : loc === 'Away_TripInn' ? (tod === 'NIGHT' ? 'PRIVATE' : 'SEMI')
      : HDC.PRIV_PRIVATE[loc] ? 'PRIVATE' : HDC.PRIV_PUBLIC[loc] ? 'PUBLIC'
      : (regPriv === 'PRIVATE' || regPriv === 'PUBLIC' || regPriv === 'SEMI') ? regPriv : 'SEMI';
    // The ## INTIMACY panel renders only while the latch is on, so a reply that starts with it off was shown no gate line.
    const isIntimacyPanelShown = get((sd.PendingState || {}).IntimacyActive) === true;
    const snap = { loc, priv, privDC: HDC.PRIV_DC[priv], chaMod: statMod(get(MC.Cha, 0)), strMod: statMod(get(MC.Str, 0)), isIntimacyPanelShown, girls: {} };
    // A girl whose crossing PhysicalRequest this reply was WON (her first H with him): that check opened the scene, and it
    // was the roll on the act.
    const crossing = owedCrossingOutcomes(CM, get((sd.Intent || {}).check, ''));
    for (const k of Object.keys(CM)) {
      const c = CM[k]; if (!c || typeof c !== 'object') continue;
      snap.girls[k] = {
        isCrossingWon: isWonOutcome(crossing[k]),
        stage: String(get(c.RelationshipStage, '')), morals: Number(get(c.Morals, 0)) || 0,
        aff: Number(get(c.Affection, 0)) || 0,
        expC: Number(get(c.Exp_Caress, 0)) || 0, expO: Number(get(c.Exp_Oral, 0)) || 0,
        expV: Number(get(c.Exp_Vaginal, 0)) || 0, expA: Number(get(c.Exp_Anal, 0)) || 0,
        meter: Number(get(c.ClimaxGauge, 0)) || 0, mLevel: Number(get(c.M_level, 0)) || 0,
        lewd: Number(get(c.Lewdness, 0)) || 0,
        arousal: Number(get(c.Arousal, 0)) || 0, ahegao: get(c.Ahegao) === true,
        edge: Number(get(c.EdgeStreak, 0)) || 0,
      };
    }
    return snap;
  }
  // Her Exp in one Exp field, as the snapshot froze it (0 for no field).
  function snapshotExp(g, expField) {
    return expField === 'Exp_Caress' ? g.expC : expField === 'Exp_Oral' ? g.expO : expField === 'Exp_Vaginal' ? g.expV : expField === 'Exp_Anal' ? g.expA : 0;
  }
  // B2 the act-gate DC — the one formula; hactPanel() prints it and RES judges by it, from the same snapshot.
  function hactGateDc(snap, key, act) {
    const g = (snap && snap.girls && snap.girls[key]) || null;
    if (!g || !(act in HDC.HB)) return null;
    const expF = HDC.EXPOF[act];
    const exp = snapshotExp(g, expF);
    const tol = (expF && exp >= 30) ? 1 : 0;
    let dc = HDC.HB[act] + HDC.MADD[act][Math.max(0, mBand(g.morals) - tol)]
      + ((HDC.STAGE_H[act] || {})[g.stage] || 0) + snap.privDC;
    if (act === 'Anal' && g.expV < 20) dc += 5;
    return dc;
  }
  // HER FIRST TIME AT AN ACT — the one rule for the act gate (hactGateOwed) and the discovery spike (applyHact): her Exp for
  // the act is 0. Kissing is never a first time (a kiss is not a sex act), and a Loyal_Puppy has no first-time reticence
  // left. Kissing, Breast and Fingering share Exp_Caress, so after any caress a first Breast is not one; a kiss adds to it
  // only inside an H scene (applyHact).
  function isFirstTimeAct(stage, act, exp) {
    return stage !== 'Loyal_Puppy' && !!HEXP[act] && act !== 'Kissing' && (Number(exp) || 0) === 0;
  }
  // B2b WHETHER AN ACT TAKES ITS GATE DIE — the engine's call, never the narrator's: only on her first time at it, and only
  // when the panel was there to price it. An act she has ever done with him never re-gates, wherever it happens; an act
  // riding the reply that arms the latch by the narrator's "enter" lands unrolled, because that reply was shown no gate
  // line; and her act on the reply her crossing PhysicalRequest was won lands unrolled too, because that check was its
  // roll. hactPanel() prints the act's DC when this is true and AUTO when it is not; RES judges the reply by the same
  // call, from the same snapshot.
  function hactGateOwed(snap, key, act) {
    const g = (snap && snap.girls && snap.girls[key]) || null;
    if (!g || !snap.isIntimacyPanelShown || !(act in HDC.HB) || g.isCrossingWon) return false;
    return isFirstTimeAct(g.stage, act, snapshotExp(g, HEXP[act]));
  }
  // B8 the folded position target for a ROLLED tier — null = AUTO / display-only / no roll owed.
  function positionTarget(snap, key, tier, isAnal) {
    const g = (snap && snap.girls && snap.girls[key]) || null;
    if (!g) return null;
    const expB = g.expV >= 50 ? 4 : g.expV >= 30 ? 2 : 0;
    if (tier === 'Intermediate' && g.expV >= 50) return null;      // AUTO thresholds — the panel folds the roll away
    if (tier === 'Advanced' && g.expV >= 75) return null;
    let t;
    if (tier === 'Intermediate') t = Math.max(1, HDC.POS_BASE.Intermediate - expB + snap.privDC);
    else if (tier === 'Advanced') t = Math.max(1, HDC.POS_BASE.Advanced - expB + snap.privDC);
    else if (tier === 'Ekiben') t = Math.max(1, HDC.POS_BASE.Ekiben - expB - snap.strMod + snap.privDC);
    else return null;                                              // Basic / ORAL / NONPEN — never rolled
    return isAnal ? t + 3 : t;
  }
  // THE ## INTIMACY PANEL'S NUMBERS — the panel prints what this returns and computes none of it.
  // { priv, privDC, chaMod, brink, girls: { <Key>: { gate: { <one DC per act in HDC.HB> }, positions:
  // { Intermediate, Advanced, Ekiben }, finish: { <sex act>: [paces that finish her this reply] }, submission: <band>,
  // femaleLed: WILLING | ON_ORDER | UNWILLING, pushBack: null | { overrules, arousal, line }, isCrossingWon } } } — a
  // position is a raw-die target, or 'AUTO' when her experience folds the roll away; submission is submissionBand(),
  // femaleLed is femaleLedWillingness(), pushBack is set only for a band that can overrule his push (overrulesPush);
  // isCrossingWon = her won PhysicalRequest this reply was the roll on her acts (Window A's ## H SCENE OPEN note).
  function hactPanel(statData) {
    const snap = buildHactSnapshot(statData || {});
    const girls = {};
    for (const key of Object.keys(snap.girls)) {
      const gate = {};
      for (const act of Object.keys(HDC.HB)) gate[act] = hactGateOwed(snap, key, act) ? hactGateDc(snap, key, act) : 'AUTO';
      const positions = {};
      for (const tier of ['Intermediate', 'Advanced', 'Ekiben']) {
        const target = positionTarget(snap, key, tier, false);
        positions[tier] = target == null ? 'AUTO' : target;
      }
      const g = snap.girls[key];
      const band = submissionBand(g.mLevel);
      const pushBack = OVERRULE_BANDS.indexOf(band) >= 0
        ? { overrules: overrulesPush(band, g.arousal, g.ahegao, g.stage === 'Loyal_Puppy'), arousal: g.arousal, line: OVERRULE_AROUSAL }
        : null;
      girls[key] = { gate, positions, finish: finishPaces(g.meter), squirt: squirtRule(g.stage, g.aff, g.edge), submission: band, femaleLed: femaleLedWillingness(g.mLevel, g.lewd), pushBack, isCrossingWon: g.isCrossingWon };
    }
    return { priv: snap.priv, privDC: snap.privDC, chaMod: snap.chaMod, brink: BRINK, girls };
  }
  // THE SCENE'S COUNT, one reply. Runs on every hact the engine took (a dropped one excepted), act or not, so an edge, a
  // declined act and a reposition count like any other beat. Her band and Arousal are the START of the reply (the
  // snapshot the panel printed); her position is the END of it. Her beat: she ends on top. His beat: ;dom, his input
  // dominated her. Both cancel at the scene's end. A push she overrules (overrulesPush) is hers alone, and costs her
  // OVERRULE_AROUSAL_COST Arousal after the reply's own gain — unless she came that reply, when her afterglow stands.
  function countSubmissionBeat(sd, key, str, snap, hCountBefore, log) {
    const c = (sd.Classmate || {})[key];
    const g = snap && snap.girls && snap.girls[key];
    if (!c || typeof c !== 'object' || !g) return;
    const dom = String(str).split(';').slice(1).some((p) => p.trim().toLowerCase() === 'dom');
    const band = submissionBand(g.mLevel);
    const pos = String(get(c.HPosition, ''));
    let hers = 0, his = 0, note;
    if (dom && overrulesPush(band, g.arousal, g.ahegao, g.stage === 'Loyal_Puppy')) {
      hers = 1;
      const came = (Number(get(c.H_Count, 0)) || 0) > hCountBefore;
      if (!came) setVal(c, 'Arousal', clamp((Number(get(c.Arousal, 0)) || 0) - OVERRULE_AROUSAL_COST, 0, 100));
      note = band + ' OVERRULED his push (Arousal ' + g.arousal + ' > ' + OVERRULE_AROUSAL + '), hers'
        + (came ? ' · she came, her afterglow stands' : ' · Arousal −' + OVERRULE_AROUSAL_COST);
    } else {
      his = dom ? 1 : 0;
      hers = isFemaleLedPosition(pos) ? 1 : 0;
      note = [dom ? 'his push (;dom)' : '', hers ? 'she ends on top (' + pos + ')' : ''].filter(Boolean).join(' + ')
        + (hers && his ? ', they cancel' : '');
      if (!note) note = 'no beat';
    }
    if (hers) setVal(c, 'HBeatsHers', (Number(get(c.HBeatsHers, 0)) || 0) + 1);
    if (his) setVal(c, 'HBeatsHis', (Number(get(c.HBeatsHis, 0)) || 0) + 1);
    log.push('submission count ' + key + ': ' + note + ' → this scene hers ' + (Number(get(c.HBeatsHers, 0)) || 0)
      + ' · his ' + (Number(get(c.HBeatsHis, 0)) || 0));
  }
  const PRE_DATING = ['Stranger', 'Acquaintance', 'Friend'];                                  // Ahegao not-ready penalty applies below Dating
  // AHEGAO — a sex act on her at Energy 0 (or a SHATTERING release): a MANDATORY state (glassy, involuntary moaning, no
  // agency — the narrator writes it, {{user}}-led only). Her Mood becomes Ahegao and her Embarrassment clears (she is past it);
  // setMood holds every other Mood write while it lasts. It lasts while the sex on her goes on and ends with her afterglow
  // ((0b) in resolveTurn). Her Energy stays 0 until the next day, so a second round brings it straight back.
  // NOT-READY (Lewd<50 AND pre-Dating) → Aff −10 + the COMPLAINT flag, once per scene: the flag stays up until the scene ends.
  function enterAhegao(c, log, who) {
    if (get(c.Ahegao) === true) return;
    setVal(c, 'Ahegao', true); setVal(c, 'Mood', 'Ahegao'); setVal(c, 'Embarrassment', 'none');
    const lewd = Number(get(c.Lewdness, 0)) || 0, stage = String(get(c.RelationshipStage, ''));
    if (lewd < 50 && PRE_DATING.indexOf(stage) >= 0 && get(c.AhegaoPenalty) !== true) {   // §7 readiness penalty, once per scene — she was pushed past ready
      const a0 = Number(get(c.Affection, 0)) || 0;
      applyAffection(c, -10); setVal(c, 'AhegaoPenalty', true);
      log.push('AHEGAO ' + who + ' NOT-READY → Aff −10 (' + a0 + '→' + Math.max(0, a0 - 10) + '), COMPLAINT due (write it)');
    } else {
      log.push('AHEGAO ' + who + ' — mandatory state (glassy, involuntary moans, no agency; {{user}}-led only)');
    }
  }
  // AHEGAO ENDS — her afterglow came down from it ((0b) in resolveTurn), or the scene ended (closeHeroineScene). The Mood
  // it held goes back to Neutral. The COMPLAINT flag is left alone: she can voice it only now, and the scene end clears it.
  function leaveAhegao(c, log, cause) {
    setVal(c, 'Ahegao', false);
    if (String(get(c.Mood, '')) === 'Ahegao') setVal(c, 'Mood', 'Neutral');
    log.push('AHEGAO over for ' + String(get(c.Name, '')) + ' (' + cause + ') — Mood ' + String(get(c.Mood, '')));
  }
  // HER MOOD — every engine write of a heroine's Mood goes through here, except Ahegao's own enter and leave. AHEGAO outranks
  // the rest: while she is in it, a check, a confession, a fight or a first-time act leaves her Mood at Ahegao, so the
  // panel never shows it beside an emotion she cannot have. Returns whether the Mood was written.
  function setMood(c, mood, log, cause) {
    if (get(c.Ahegao) === true) {
      log.push('Mood ' + mood + ' held for ' + String(get(c.Name, '')) + ' (' + cause + ') — she is in AHEGAO; her Mood stays Ahegao until her afterglow');
      return false;
    }
    setVal(c, 'Mood', mood);
    return true;
  }
  // CLIMAX (§7) — fired by applyHact when the narrator reports ;climax on a SEX act and her ClimaxGauge was at BRINK or
  // above as the reply started. Scales by EdgeStreak (§7b RELEASE
  // TIER), SETs the afterglow Arousal, resets the meter+streak, bumps H_Count, drains Energy, and grants the climax Exp bonus
  // (edged +10/15/20 · else first-EVER-climax-of-that-act +10 · else +5, tracked in the hidden HClimaxed string). Returns the
  // tier marker for HView. A shattering release (or Energy→0) tips her into AHEGAO. NB: called AFTER the per-reply act math,
  // so afterglow Arousal OVERWRITES this reply's build and Energy is the act cost PLUS the climax drain.
  function fireClimax(sd, c, act, expField, kv, log, bits) {
    const streak = Number(get(c.EdgeStreak, 0)) || 0;
    const strongRoll = kv._strongOk === true;                                                   // 潮吹 derived by RES from the reported die (die+Aff/20 vs 12, committed checked at derivation)
    const t = releaseTier(streak, strongRoll);
    const eDrop = streak >= 2 ? (5 + 3 * streak) : (strongRoll ? 10 : 5);                        // edged denial strain · 潮吹 −10 · normal −5
    let expBonus;
    if (streak >= 2) expBonus = streak >= 6 ? 20 : streak >= 4 ? 15 : 10;                        // edged Exp bonus by streak band
    else { const done = String(get(c.HClimaxed, '')), mark = act[0]; if (done.indexOf(mark) < 0) { expBonus = 10; setVal(c, 'HClimaxed', done + mark); } else expBonus = 5; }
    setVal(c, 'ClimaxGauge', 0);
    setVal(c, 'H_Count', (Number(get(c.H_Count, 0)) || 0) + 1);
    let eNow = clamp((Number(get(c.Energy, 100)) || 0) - eDrop, 0, 100);
    if (t.ahegao) eNow = 0;                                                                      // SHATTERING collapses regardless of remaining Energy
    setVal(c, 'Energy', eNow);
    if (expField) setVal(c, expField, clamp((Number(get(c[expField], 0)) || 0) + expBonus, 0, 100));
    setVal(c, 'Arousal', t.af);                                                                  // SET, not added — afterglow
    setVal(c, 'EdgeStreak', 0);                                                                  // the release SPENDS the streak
    const lewdGain = edgeLewd(streak) ? addLewd(c, edgeLewd(streak)) : 0;                         // §7b edged "learns to crave denial" — stage-gated (addLewd)
    if (t.m) setVal(c, 'M_level', clamp((Number(get(c.M_level, 0)) || 0) + t.m, -100, 100));
    bits.push('CLIMAX ' + t.name + ' (streak ' + streak + ') → Meter 0 · H#+1 · Energy −' + eDrop + ' · Exp +' + expBonus + ' · afterglow Ar ' + t.af + (lewdGain ? ' · Lewd +' + lewdGain : ''));
    if (eNow === 0) enterAhegao(c, log, '(release)');
    return 'CLIMAX(' + t.name + ') Ar→' + t.af + (eNow === 0 ? ' → AHEGAO' : '') + ' — she came last reply, in the release that reply wrote; write her afterglow now (see <Intimacy_system> 7/7b)';
  }
  // INTIMACY LATCH — "enter[:<Key>]" arms an H scene (PendingState.IntimacyActive → the intimacy_system / h_position /
  // personality_hscene entries un-gate next reply); "exit" ends it through endIntimacyScene. Idempotent.
  function applyIntimacyLatch(sd, str, log) {
    const PendingState = sd.PendingState || (sd.PendingState = {});
    const verb = String(str).split(':')[0].trim().toLowerCase();
    if (verb === 'enter') {
      if (get(PendingState.IntimacyActive) !== true) { setVal(PendingState, 'IntimacyActive', true); log.push('INTIMACY latch ON — H scene armed'); }
    } else if (verb === 'exit' || verb === 'end') {
      const named = (String(str).split(':')[1] || '').trim();
      if (named) log.push('intimacy exit names "' + named + '" — ignored: the scene\'s count decides her M_level, never a word on the exit');
      endIntimacyScene(sd, 'narrate reported the exit', log);
    } else {
      log.push('intimacy ignored (bad verb, use enter|exit): ' + str);
    }
  }
  // END THE H SCENE — the one path every end takes, whoever calls it: narrate's "exit", or the engine on a fact
  // (see (2i-end), (3i) and leaveScene). Every present heroine gets her scene-break and the latch clears. Energy is
  // not touched: what the scene spent stays spent until the day ends (restoreDailyEnergy).
  function endIntimacyScene(sd, cause, log) {
    const PendingState = sd.PendingState || (sd.PendingState = {});
    const was = get(PendingState.IntimacyActive) === true;
    setVal(PendingState, 'IntimacyActive', false);
    const CM = sd.Classmate || {};
    let n = 0;
    for (const k of Object.keys(CM)) {
      const c = CM[k]; if (!c || typeof c !== 'object' || get(c.Is_present) !== true) continue;
      closeHeroineScene(sd, c, log);
      n++;
    }
    if (was) log.push('INTIMACY latch OFF (' + cause + ') — scene-break reset (Arousal/ClimaxGauge/EdgeStreak) on ' + n + ' heroine(s); Energy carries to the end of the day');
  }
  // ONE heroine's scene-break: the POST-H growth (once per scene — HScene is consumed) and the per-scene meter resets.
  // Safe to call twice for the same scene: the second call finds HScene empty and only re-zeroes the meters.
  function closeHeroineScene(sd, c, log) {
    // Pass 4.3 POST-H PER-SCENE GROWTH — the lasting change an encounter leaves (distinct from the per-reply meters, which
    // just reset below). Applied ONCE per scene, ONLY to a heroine an act actually landed on (HScene set in applyHact).
    //   Lewdness +8 (needs Aff≥30 AND a sexual-relationship stage: Girlfriend / FWB / Loyal_Puppy — the universal Lewd gate, addLewd).
    //   M_level moves by THE SCENE'S COUNT (sceneSubmissionShift): more of her beats −10, more of his +10, a tie 0 — the
    //   same whoever ended the scene. Her nine traits, Pride included, never move: the count changes only her H submission.
    //   A 'first' scene also records the first-H milestone event.
    const scene = String(get(c.HScene, ''));
    const hers = Number(get(c.HBeatsHers, 0)) || 0, his = Number(get(c.HBeatsHis, 0)) || 0;
    if (scene) {
      const aff = Number(get(c.Affection, 0)) || 0;
      const g = [];
      if (aff >= 30 && addLewd(c, 8)) g.push('Lewd +8');                                     // needs Aff≥30 AND (inside addLewd) a sexual-relationship stage
      const dM = sceneSubmissionShift(hers, his);
      if (dM) {
        const m1 = clamp((Number(get(c.M_level, 0)) || 0) + dM, -100, 100);
        setVal(c, 'M_level', m1); g.push('M_level ' + (dM > 0 ? '+' : '') + dM + ' (' + submissionBand(m1) + ')');
      }
      setVal(c, 'HScene', '');                                                              // consume the scene guard
      if (scene === 'first') pushImportantEvent(c, 'First H scene', sd, log);
      log.push('POST-H scene [hers ' + hers + ' · his ' + his + (scene === 'first' ? ' · first' : '') + '] ' + String(get(c.Name, '')) + ': '
        + (g.length ? g.join(' · ') : 'no growth (the count tied, and Lewd needs Aff 30+ at a sexual stage)'));
    }
    setVal(c, 'HBeatsHers', 0); setVal(c, 'HBeatsHis', 0);                                  // the count is scene-scoped
    setVal(c, 'Arousal', 0); setVal(c, 'ClimaxGauge', 0); setVal(c, 'EdgeStreak', 0); setVal(c, 'HView', '');
    if (get(c.Ahegao) === true) leaveAhegao(c, log, 'the scene ended');
    setVal(c, 'AhegaoPenalty', false);                                                      // the COMPLAINT flag is scene-scoped (HClimaxed is a LIFETIME record — NOT reset)
    setVal(c, 'HPosition', '');                                                             // Pass 4.1: current position is scene-scoped
  }
  // THE NEW DAY REFILLS ENERGY — MainChar to his Energy_max, every heroine to 100. Called by settleDay once per game-day
  // it closes. A scene's end leaves Energy where the scene put it, so a second scene the same day starts tired.
  function restoreDailyEnergy(sd, log) {
    const refilled = [];
    const MC = sd.Mainchar;
    if (MC && typeof MC === 'object') {
      const max = Number(get(MC.Energy_max, 100)) || 100;
      if ((Number(get(MC.Energy_curr, max)) || 0) < max) { setVal(MC, 'Energy_curr', max); refilled.push('Mainchar'); }
    }
    const CM = sd.Classmate || {};
    for (const k of Object.keys(CM)) {
      const c = CM[k]; if (!c || typeof c !== 'object') continue;
      if ((Number(get(c.Energy, 100)) || 0) < 100) { setVal(c, 'Energy', 100); refilled.push(k); }
    }
    if (refilled.length) log.push('ENERGY refilled (new day): ' + refilled.join(', '));
  }

  // Returns the dice's verdict { act, isAgreed } when a known act was ruled on this reply: isAgreed = it PROCEEDED
  // (passed its gate, or had none to roll); false = its gate FAILED (she declined it). Bad input, a de-stim, a
  // reposition and an unknown act return nothing. resolveTurn stamps the verdict on PendingState.HActVerdict for the
  // relay (resolvePostRelay).
  // A hact the engine refused WHOLE returns HACT_DROPPED — every other return is a beat that happened, and the scene's
  // count (countSubmissionBeat) reads it.
  const HACT_DROPPED = Object.freeze({ dropped: true });
  function applyHact(sd, str, log, ctx, snap) {
    ctx = ctx || {};
    const parts = String(str).split(';').map((s) => s.trim()).filter(Boolean);
    const key = parts[0];
    const kv = {};
    for (let i = 1; i < parts.length; i++) { const ci = parts[i].indexOf(':'); if (ci > 0) kv[parts[i].slice(0, ci).trim().toLowerCase()] = parts[i].slice(ci + 1).trim(); }
    const c = (sd.Classmate || {})[key];
    if (!c || typeof c !== 'object') { log.push('hact ignored (no such heroine): ' + str); return HACT_DROPPED; }
    // ;puppy is not an H flag: the Loyal-Puppy demand is PRE's roll on /Intent/puppy (2l). A narrator that writes it
    // here is told where the roll lives, and the rest of the hact applies.
    if (kv.puppy !== undefined) {
      warnRes('HACT ;puppy:' + kv.puppy + ' IGNORED — the Loyal-Puppy demand is not an H roll: PRE rolls it on /Intent/puppy ' +
              'when {{user}} demands her total submission. The rest of the hact applies: ' + str);
      log.push('hact ;puppy ignored (the Loyal-Puppy demand is PRE\'s /Intent/puppy): ' + str);
    }
    // ── A6 REFUSAL + die parsing — the three roll flags carry a RAW DIE. An outcome WORD is the retired
    // pre-plan form and refuses the WHOLE hact: dropping just the word would let a maybe-failed gate pass.
    for (const flag of ['gate', 'pgate', 'strong']) {
      const v = kv[flag] || '';
      if (!v) continue;
      if (/^(Success|CritSuccess|Failure|CritFail)$/i.test(v)) {
        warnRes('HACT VERDICT WORD REFUSED — ;' + flag + ':' + v + ' is the retired form; the channel carries the RAW DIE now (;' + flag + ':<die>) and RES derives the outcome. Whole hact dropped: ' + str);
        log.push('hact REFUSED (verdict word in ;' + flag + ' — write the raw die: ;' + flag + ':<die>): ' + str);
        return HACT_DROPPED;
      }
      const d = Number(v);
      if (!Number.isInteger(d) || d < 1 || d > 20) {
        log.push('hact REFUSED (;' + flag + ' wants a raw die 1-20, got "' + v + '"): ' + str);
        return HACT_DROPPED;
      }
      kv[flag] = d;
      // §9c receipt verify — same stance as the social check: verify-only, applied anyway, silent with no receipt.
      if (Array.isArray(ctx.dice) && ctx.dice.length && ctx.dice.indexOf(d) === -1) {
        warnRes('HACT DIE NOT FROM POOL ' + key + ' ;' + flag + ':' + d + ' — dealt pool was [' + ctx.dice.join(',') + '] (verify-only)');
        log.push('⚠ HACT DIE NOT FROM POOL ;' + flag + ':' + d + ' — not in dealt [' + ctx.dice.join(',') + '] (applied anyway)');
      }
    }
    // LOYAL_PUPPY BYPASS — a converted heroine is owed no act gate (hactGateOwed), AUTO-PASSES the position gate, and has
    // no first-time DISCOVERY resistance (Emb/Guilt/Arousal-spike). She accepts it mentally, nothing more: the narrator
    // still WRITES the strain (high Arousal, trembling — she pushes through, not unaffected), and Energy 0 still breaks her
    // into Ahegao; the Ahegao not-ready penalty already can't fire for her (not PRE_DATING).
    const isLoyalPuppy = String(get(c.RelationshipStage, '')) === 'Loyal_Puppy';
    const act = kv.act || '';
    const pos = kv.pos || '';       // Pass 4.1 — position performed this reply (tier resolved engine-side via positionTier)
    const pace = (kv.pace === 'gentle' || kv.pace === 'intense') ? kv.pace : 'normal';
    // ── B2/B3 THE ACT GATE — owed only on her first time at the act, while the panel showed (hactGateOwed, the call the
    // panel printed from this snapshot), judged against the DC the panel printed. A die on an act the panel printed AUTO is ignored; an owed act
    // reported with no die is refused whole, because the narrator wrote a first time the dice never ruled on.
    const isGateOwed = !!act && hactGateOwed(snap, key, act);
    let gate = '';
    if (typeof kv.gate === 'number') {
      const dc = act ? hactGateDc(snap, key, act) : null;
      if (dc == null) {
        log.push('hact gate die ' + kv.gate + ' IGNORED (' + (act ? 'unknown act "' + act + '"' : 'no act declared') + ' — no DC to judge against)');
      } else if (!isGateOwed) {
        log.push('hact gate die ' + kv.gate + ' IGNORED (' + act + ' is AUTO for ' + key + ' — '
          + (isLoyalPuppy ? 'a Loyal_Puppy is owed no gate'
            : !(snap && snap.isIntimacyPanelShown) ? 'the latch was off when this reply began, so no gate line priced it'
            : 'not her first time; an act she has done never re-gates') + ')');
      } else {
        const total = kv.gate + (snap ? snap.chaMod : 0);
        gate = kv.gate === 20 ? 'CritSuccess' : (total >= dc ? 'Success' : 'Failure');
        log.push('hact gate ' + act + ' DC ' + dc + ': die ' + kv.gate + '+' + (snap ? snap.chaMod : 0) + '=' + total + ' → ' + gate + (kv.gate === 20 ? ' (raw 20)' : ''));
      }
    } else if (isGateOwed) {
      warnRes('HACT GATE DIE MISSING — ' + key + ' ' + act + ' is her first time: the panel priced it (DC ' + hactGateDc(snap, key, act) +
              ') and the act takes ;gate:<die>. Whole hact dropped: ' + str);
      log.push('hact REFUSED (' + act + ' is ' + key + '\'s first time — the panel priced it; write ;gate:<die>): ' + str);
      return HACT_DROPPED;
    }
    // ── B8 derive the POSITION-GATE outcome — tier from the engine's 体位 ladder, target from the snapshot.
    let pgate = '';
    if (typeof kv.pgate === 'number') {
      const tier = positionTier(pos);
      if (!pos) log.push('hact pgate die ' + kv.pgate + ' IGNORED (no ;pos declared — nothing to judge)');
      else if (tier === '') log.push('hact pgate die ' + kv.pgate + ' IGNORED (position "' + pos + '" is not a <H_Position> catalog name — ;pos takes the ENGLISH name in its brackets, e.g. Cowgirl; tier unknown, the position still records)');
      else {
        const target = positionTarget(snap, key, tier, isAnalPosition(pos));
        if (target == null) log.push('hact pgate die ' + kv.pgate + ' IGNORED (' + pos + ' resolves ' + (tier === 'ORAL' ? 'ORAL display-only' : tier === 'NONPEN' ? 'non-penetrative' : tier + ' AUTO') + ' — the panel offered no roll there)');
        else {
          pgate = kv.pgate >= target ? 'Success' : 'Failure';
          log.push('hact pgate ' + pos + ' (' + tier + ') target ' + target + ': raw ' + kv.pgate + ' → ' + pgate);
        }
      }
    }
    // ── B9 潮吹 die → a boolean, consumed at climax time (fireClimax). Judged by squirtRule from the snapshot the panel
    // printed, so a same-reply stage or Affection change never re-prices the roll the narrator took.
    if (typeof kv.strong === 'number') {
      const g = (snap && snap.girls && snap.girls[key]) || null;
      const squirt = g ? squirtRule(g.stage, g.aff, g.edge)
        : squirtRule(String(get(c.RelationshipStage, '')), 0, Number(get(c.EdgeStreak, 0)) || 0);
      if (squirt.mode === 'none') {
        warnRes('HACT ;strong:' + kv.strong + ' on ' + key + ' at stage ' + (g ? g.stage : String(get(c.RelationshipStage, ''))) + ' — her ## INTIMACY panel gives her no 潮吹 roll at that stage, so the panel was misread. Ignored');
        log.push('hact strong die ' + kv.strong + ' IGNORED (her panel gives her no 潮吹 roll — Girlfriend and Loyal_Puppy only)');
      } else if (squirt.mode === 'auto') {
        log.push('hact strong die ' + kv.strong + ' not needed (her edged release squirts with no die)');
      } else {
        kv._strongOk = kv.strong >= squirt.target;
        log.push('hact strong 潮吹 RawDie≥' + squirt.target + ' (' + HDC.STRONG_TARGET + ' minus Aff/20): die ' + kv.strong + ' → ' + (kv._strongOk ? 'landed' : 'missed'));
      }
    }
    const destim = parts.slice(1).some((p) => p.toLowerCase() === 'destim');   // Pass 3 §7b bare ;destim token = back off the edge
    const climaxReported = parts.slice(1).some((p) => p.toLowerCase() === 'climax');   // bare ;climax token = her orgasm is on the page this reply — an observation; the engine decides whether it counts (§7)
    const kink = parts.slice(1).some((p) => p.toLowerCase() === 'kink');       // Pass 4.5 bare ;kink token = this beat HITS her <Personality_HScene> KINK (narrator-judged; pairs with a green in-prose turn-on span)
    if (destim) {                                                              // DE-STIM / EDGE — meter ×0.7; ≥BRINK = one EDGE (streak+1, Energy−5)
      const m0 = Number(get(c.ClimaxGauge, 0)) || 0, m1 = Math.round(m0 * 0.7);
      setVal(c, 'ClimaxGauge', clamp(m1, 0, 100));
      if (m0 >= BRINK) {
        const es = (Number(get(c.EdgeStreak, 0)) || 0) + 1; setVal(c, 'EdgeStreak', es);
        setVal(c, 'Energy', clamp((Number(get(c.Energy, 100)) || 0) - 5, 0, 100));
        setVal(c, 'HView', 'EDGED (streak ' + es + ') Meter ' + m0 + '→' + m1 + ' — build her back; the denied release scales by streak (§7b)');
        log.push('hact ' + key + ' EDGE (streak ' + es + ') — Meter ' + m0 + '→' + m1 + ' · Energy −5 (denial strain)');
      } else {
        setVal(c, 'HView', '');
        log.push('hact ' + key + ' de-stim — Meter ' + m0 + '→' + m1 + ' (no edge, meter <' + BRINK + ')');
      }
      if (climaxReported) log.push('hact ' + key + ' ;climax ignored — a ;destim reply backs her off the brink, it never climaxes');
      return;
    }
    if (isLoyalPuppy && pgate === 'Failure') {
      log.push('hact ' + key + ' LOYAL_PUPPY bypass — position auto-pass (derived Failure overridden; still write the strain)');
    }
    if (gate === 'Failure') { log.push('hact ' + key + ' ' + act + ' gate FAILURE — she declines this act (no state change)'); return { act: act, isAgreed: false }; }
    // the act PROCEEDS (gate Success/CritSuccess, or no gate owed).
    // An H gate has no crit fail: a raw 1 is compared like any die, so an act whose DC the lowest roll clears always proceeds.
    // §3 POSITION (Pass 4.1) — the position DC is its OWN check (target recomputed engine-side), NOT the act gate.
    // A FAILURE is a FUMBLE (Energy −3, she stays in / falls back to basic, the sex act STILL proceeds).
    // Success / AUTO (no rolled target) records her new position; the narrator GREEN-highlights it once on change.
    if (pos) {
      if (pgate === 'Failure' && !isLoyalPuppy) {                   // LOYAL_PUPPY bypass: a converted heroine auto-holds any position (no fumble)
        setVal(c, 'Energy', clamp((Number(get(c.Energy, 100)) || 0) - 3, 0, 100));       // fumble strain (do NOT advance HPosition — stays basic)
        log.push('hact ' + key + ' POSITION ' + pos + ' ' + pgate + ' — fumble (Energy −3, stays basic); do NOT write it as landing');
      } else {
        const prevPos = String(get(c.HPosition, ''));
        setVal(c, 'HPosition', pos);
        if (pos !== prevPos) log.push('hact ' + key + ' POSITION → ' + pos + ' (green-highlight once)');
      }
    }
    if (!act) { log.push('hact ' + key + ' reposition only' + (pos ? ' → ' + pos : '') + ' (no act this reply — meters idle)'); return; }
    // → §4 per-reply act math
    const expField = HEXP[act];
    const morals = Number(get(c.Morals, 50)) || 0;
    const firstTime = isFirstTimeAct(String(get(c.RelationshipStage, '')), act, get(c[expField], 0));   // the gate's rule too (a Loyal_Puppy has no reticence left)
    const arousal0 = Number(get(c.Arousal, 0)) || 0;
    const meterAtStart = Number(get(c.ClimaxGauge, 0)) || 0;                            // §7 named in a refused ;climax's log line
    // Pass 4.3 — was she a TOTAL virgin ENTERING this act (before the Exp/H_Count bumps below)? sets HScene='first' → the first-H milestone event + log tag on exit.
    const wasVirgin = (Number(get(c.H_Count, 0)) || 0) === 0 && !String(get(c.HClimaxed, ''))
      && !(Number(get(c.Exp_Caress, 0)) || 0) && !(Number(get(c.Exp_Oral, 0)) || 0)
      && !(Number(get(c.Exp_Vaginal, 0)) || 0) && !(Number(get(c.Exp_Anal, 0)) || 0);
    const bits = [];
    if (HSEX.indexOf(act) >= 0) {                                                       // SEX ACT — Energy + ClimaxGauge + a small Arousal build
      // NB: cost + meter read arousal0 (her warmth GOING IN), so this reply's Arousal build only helps from NEXT reply — no free ride.
      // §4.5 kink-hit — her body responds eagerly: 2 less drain, above the floor, before the act's scale.
      const hCost = energyCost(act, Number(get(c.Sta, 50)) || 0, Number(get(c[expField], 0)) || 0, arousal0, kink ? 2 : 0);
      setVal(c, 'Energy', clamp((Number(get(c.Energy, 100)) || 0) - hCost, 0, 100));
      const MC = sd.Mainchar || (sd.Mainchar = {});
      const mCost = mainCharEnergyCost(Number(get(MC.Sta, 50)) || 0);
      setVal(MC, 'Energy_curr', clamp((Number(get(MC.Energy_curr, 100)) || 0) - mCost, 0, 100));
      let gain = orgGain(act, pace);
      if (kink) gain = Math.round(gain * 1.2);                                          // §4.5 kink-hit — fills faster
      setVal(c, 'ClimaxGauge', clamp((Number(get(c.ClimaxGauge, 0)) || 0) + gain, 0, 100));
      let arGain = HSEX_AR[act][paceIdx(pace)];                                         // §4C SEX arousal build (penetration fastest); discovery spike (below) stacks on top
      if (kink) arGain = Math.round(arGain * 1.5);                                       // §4.5 kink-hit — heats up faster
      setVal(c, 'Arousal', clamp(arousal0 + arGain, 0, 100));
      bits.push('Energy −' + hCost + '(her)/−' + mCost + '(MC) · Meter +' + gain + ' · Arousal +' + arGain);
    } else if (HFORE[act]) {                                                            // FOREPLAY — Arousal (free)
      let ag = HFORE[act][paceIdx(pace)];
      if (morals > 60 && firstTime) ag = Math.round(ag / 2);                            // §4C Morals>60 halves first-time gains
      if (kink) ag = Math.round(ag * 1.5);                                               // §4.5 kink-hit — heats up faster
      setVal(c, 'Arousal', clamp(arousal0 + ag, 0, 100));
      setVal(c, 'ClimaxGauge', clamp((Number(get(c.ClimaxGauge, 0)) || 0) + 2, 0, 100)); // tiny foreplay trickle
      bits.push('Arousal +' + ag + (morals > 60 && firstTime ? ' (halved)' : '') + ' · Meter +2');
    } else {
      log.push('hact ' + key + ' ' + (act || '?') + ' — unknown act, no meter change'); return;
    }
    // A KISS IS NOT A SEX ACT: it builds her caress experience only inside an H scene. On a reply that began with the latch
    // off (the narrator's own "enter"), a kiss lands its Arousal and leaves Exp_Caress alone, so it never turns her first
    // Breast or Fingering into one she has done.
    const isKissBeforeScene = act === 'Kissing' && !(snap && snap.isIntimacyPanelShown);
    if (expField && isKissBeforeScene) bits.push(expField + ' +0 (a kiss before the H scene opened)');
    if (expField && !isKissBeforeScene) {
      const expMultiplier = GATE_EXP_MULTIPLIER[gate] || 1;
      const expGain = paceExp(pace) * expMultiplier;
      setVal(c, expField, clamp((Number(get(c[expField], 0)) || 0) + expGain, 0, 100));
      bits.push(expField + ' +' + expGain + (expMultiplier > 1 ? ' (' + pace + ' ' + paceExp(pace) + ' ×' + expMultiplier + ' ' + gate + ')' : ''));
    }
    // Pass 4.3 — a real act LANDED → mark the scene active for the POST-H growth bundle (once per scene; 'first' captures a
    // virgin entry, sticky so a later act this scene can't downgrade it). Read + cleared on the latch 'exit'.
    if (!String(get(c.HScene, ''))) setVal(c, 'HScene', wasVirgin ? 'first' : 'yes');
    // §4.5 KINK HIT — the beat matched her <Personality_HScene> KINK (the boosted Arousal/Meter/Energy already landed above). She
    // slowly LEARNS TO CRAVE it: Lewdness +1 once genuinely warmed (arousal0≥40, which self-bounds it to a few per scene) — the second
    // Lewd source besides edged denial (§7b). Lewd gates readiness / female-led willingness / the Loyal-Puppy demand, so serving her fetish is real progression.
    if (kink) {
      bits.push('KINK-HIT');
      if (arousal0 >= 40 && addLewd(c, 1)) bits.push('Lewd +1 (crave)');                          // §4.5 crave nudge — stage-gated (addLewd)
    }
    if (firstTime) {                                                                    // §2 ACT DISCOVERY spike (on top of the normal gains)
      const inAhegao = get(c.Ahegao) === true;                                          // in AHEGAO she is past embarrassment: Emb + Mood hold
      if (!inAhegao) setVal(c, 'Embarrassment', 'high');
      setMood(c, 'Embarrassed', log, 'first ' + act);
      setVal(c, 'Arousal', clamp((Number(get(c.Arousal, 0)) || 0) + 15, 0, 100));
      if (morals > 60) setVal(c, 'Guilt', 'high');
      bits.push('DISCOVERY: ' + (inAhegao ? 'Emb held (Ahegao)' : 'Emb high') + ', Arousal +15' + (morals > 60 ? ', Guilt high' : ''));
    }
    // §7 CLIMAX — the prose wrote her orgasm (;climax) on a SEX act and this reply's fill took her meter to CLIMAX_AT (the panel
    // listed this act + pace): the release lands this reply (EdgeStreak-scaled, afterglow SET). A fill that falls short refuses
    // the ;climax and holds at CLIMAX_HOLD, so she waits on the brink and comes the reply after.
    let climaxMarker = '';
    const isSexAct = HSEX.indexOf(act) >= 0;
    const meterNow = Number(get(c.ClimaxGauge, 0)) || 0;
    if (isSexAct && climaxReported && meterNow >= CLIMAX_AT) climaxMarker = fireClimax(sd, c, act, expField, kv, log, bits);
    else {
      if (climaxReported) log.push('hact ' + key + ' ;climax REFUSED — ' + (isSexAct ? 'Meter ' + meterAtStart + '→' + meterNow + ' this reply, short of ' + CLIMAX_AT + ': ' + act + ' at ' + pace + ' could not finish her this reply' : act + ' is not a sex act: only Oral/Vaginal/Anal fill the meter') + ' (no release applied)');
      if (meterNow > CLIMAX_HOLD) { setVal(c, 'ClimaxGauge', CLIMAX_HOLD); bits.push('Meter held at ' + CLIMAX_HOLD + ' (no ;climax — she is on the brink)'); }
      // §7 AHEGAO — a sex act on her at Energy 0 (drained by this act, or already spent: a second round) → she breaks; the
      // release path handled its own.
      if (isSexAct && (Number(get(c.Energy, 100)) || 0) === 0) enterAhegao(c, log, '(spent)');
    }
    // §5 VOICE-LEAK cue · HView carries this reply's CLIMAX result to the next prompt (the afterglow cue), nothing else.
    const arNow = Number(get(c.Arousal, 0)) || 0, omNow = Number(get(c.ClimaxGauge, 0)) || 0;
    const vl = voiceLeaking(arNow, omNow);
    setVal(c, 'HView', climaxMarker);
    log.push('hact ' + key + ' ' + act + '/' + pace + ': ' + bits.join(' · ') + (vl ? ' · VOICE-LEAK' : ''));
    return { act: act, isAgreed: true };
  }

  // ---- APPLY EVENT FIRE + SCAN EVENTS (Cluster 6C) live in eventpack.cjs (School's copy of the shared engine); the thin wrappers
  // next to EVENT_PACK_ADAPTER (above) delegate with School's declarations. Fire runs the row's writes
  // under the declared rules + world-log (one-shot done-flag) + clears the armed pointer; scan picks the
  // fire-one winner (TIME>TRG · most-specific WHEN · declaration order) into EngineDerived.EventArmed
  // (Window-A surfaces it; <Event_Body> + pack entries gate their bodies on it). ----

  // ---- ARM THE BUILD GATE — the one write behind POST's /Intent/armClassmate, shared by resolveTurn (A) and
  // resolvePostRelay. Consumes the intent either way. A Key that is ALREADY BUILT is refused: POST arms any
  // unbuilt roster girl on stage, and its only guard against a girl who exists is reading the ALREADY BUILT
  // list, so a misread would put a BUILD MODE banner in front of narrate for nobody new — a reply spent
  // printing a trait check for a girl buildClassmate then refuses as 'already exists'. A blank shell (empty
  // Name) is not built and still arms. Returns true when the gate was armed. ----
  function armBuildGate(statData, key, ctx, where, log) {
    const I = statData.Intent || {};
    setVal(I, 'armClassmate', '');
    if (castMemberBuilt(statData.Classmate || {}, key)) {
      log.push('armClassmate refused — ' + key + ' is already built, nothing to build · armClassmate → "" (consumed)');
      warnRes('armClassmate refused: POST armed ' + key + ', who is already built — its 4d rule 2 (the ALREADY BUILT ' +
              'list) was misread. Nothing was armed; the gate is as it was.');
      return false;
    }
    const PendingState = statData.PendingState || (statData.PendingState = {});
    setVal(PendingState, 'AddClassmate', key);
    setVal(PendingState, 'AddClassmateArmedAt', (ctx && ctx.mid != null ? ctx.mid : -1));   // #6: stamp arming msg for the liveness clock
    // Both state writes logged (apple-to-apple): the consume is a real mutation and as visible as the arm.
    log.push('AddClassmate → ' + key + ' (armed next-turn build gate' + where + ') · armClassmate → "" (consumed)');
    return true;
  }

  // ---- the resolver --------------------------------------------------------------
  // Returns { statData, applied, log } — caller persists statData (saveStatData).
  function resolveTurn(statData, ctx) {
    ctx = ctx || {};
    const log = [];
    if (!statData || !statData.Intent) return { statData, applied: false, log: ['no Intent'] };
    const I = statData.Intent;

    const CM = statData.Classmate || {};
    const W = statData.World || {};
    const EngineDerived = statData.EngineDerived || {}, PendingState = statData.PendingState || {};
    const __before = snapshot(statData);   // pre-mutation snapshot → diffed into the <RES_Variable> audit block at exit
    // B1 (HACT_DIE_REPORT_PLAN) — the H-DC inputs frozen BEFORE any stage mutates state, so the DC an H die
    // is judged by is the DC the ## INTIMACY panel printed (INV-4), and a same-reply scene move can never
    // re-price the venue the roll was taken in (INV-5). Cheap (a few scalars per heroine), taken every turn.
    const hactSnap = buildHactSnapshot(statData);

    // (A) LIGHT record-Intent from POST — arm the next-turn classmate-build gate. ORTHOGONAL to the per-turn
    // state math below: POST relays this on a SEPARATE VARIABLE_UPDATE_ENDED (after narrate's decision-Intent
    // has already resolved), so we set the flag + consume the intent HERE and must NOT fall into the heavy math
    // again (re-running it would double-increment BlockReplyCount). RES — not POST — is the authoritative writer of
    // PendingState.AddClassmate, so the flag persists with no race against the resolver's own save.
    let armed = false;
    const _armKey = String(get(I.armClassmate, '')).trim();
    if (_armKey) {
      armBuildGate(statData, _armKey, ctx, '', log);
      armed = true;                                 // armed or refused, the intent was consumed — a state change to persist
    }

    // (A2) NO PHANTOM CAST — ONLY A BUILD MAY CREATE A CAST MEMBER.
    // A stray /Classmate/<key>/* op (a bystander's Thoughts is the type specimen) makes MVU auto-vivify a BLANK
    // record from the template: 61 default fields, an empty Name — and a key that every list in the game then
    // reads as a cast member. POST's roster is one of those lists, which is how ONE stray line makes a real
    // heroine permanently unbuildable: she is in the roster, so POST never arms her, so no banner is ever
    // printed, so the build that would fill her can never be authorised. Live 2026-08-20 (Sui).
    // RES's own channels already refuse an unknown key on their own (each logs 'no such classmate'); this is the
    // same rule applied to the record MVU minted behind narrate's raw patch. Empty Name = never built = not cast.
    // KEPT: a shell whose build is arriving THIS reply — (0) fills it and carries over its Thoughts/Affection.
    // Stateless and idempotent across the 2 fires/turn: a delete removes the key, so it cannot re-trigger.
    {
      const CMrec = statData.Classmate || {};
      const _ncNow = I.newClassmate;
      const _ncKeys = (_ncNow && typeof _ncNow === 'object' && !Array.isArray(_ncNow))
        ? (typeof _ncNow.key === 'string' ? [_ncNow.key] : Object.keys(_ncNow)) : [];
      const orphans = Object.keys(CMrec).filter((k) => k !== '$meta' && k !== '$key' && k !== 'template'
        && CMrec[k] && typeof CMrec[k] === 'object' && !String(get(CMrec[k].Name, '')).trim());
      for (const k of orphans) {
        if (_ncKeys.indexOf(k) !== -1) continue;          // her build is in this very reply → (0) fills the shell
        delete CMrec[k];
        log.push('phantom cast key ' + k + ' (blank record from a stray write) → removed');
        armed = true;
      }
    }

    // IDEMPOTENCY: the per-turn math acts ONLY when the AI left DECISION work in /Intent. The resolver CLEARS
    // Intent at the end, so the extra VARIABLE_UPDATE_ENDED re-fires for the SAME reply see an empty Intent and
    // no-op. This is robust — unlike a message-id guard, which is unreliable here (the stat-menu's
    // resolveCurrentMessageId() is captured per-iframe and gets stuck at 0, which previously blocked every
    // resolution). NOTE: armClassmate (above) is handled separately so an arm-only fire never re-runs this math.
    const checkStr = String(get(I.check, ''));           // raw value; may hold several ,-joined checks this reply
    const checks = checkStr ? checkStr.split(',').map((s) => s.trim()).filter(Boolean) : [];   // independent atomic checks (grammar A: ',' = list)
    const mundStr = String(get(I.mundane, ''));
    const relStr = String(get(I.relationship, ''));
    const fwbStr = String(get(I.fwb, '')).trim();                 // FWB OPT-IN "target:<Key>;rawdie:N;dc:N;aff:N" — PRE-written, PRE-rolled (2j)
    const puppyStr = String(get(I.puppy, '')).trim();             // LOYAL-PUPPY DEMAND "target:<Key>;rawdie:N" — PRE-written, PRE-rolled (2l)
    const dayChkStr = String(get(I.dayCheck, '')).trim();         // DAY-CHECK ROLL "rawdie:N;mod:N;total:N;dc:N" — PRE-written, PRE-rolled, once per day (2k)
    const trainStr = String(get(I.training, ''));                 // MainChar TRAINING intent "<Stat>:<amt>"
    const initStr = String(get(I.initiative, ''));                // PARTNER INITIATIVE fired "<Key>:<T#>, …"
    const locStr = String(get(I.location, '')).trim();            // SCENE MOVE "Area.Venue" (location.txt on-map tag)
    const arriveStr = String(get(I.arrive, '')).trim();           // PRESENCE ENTRY "<Key>,<Key>" — heroines who JOINED the scene this reply
    const presentAtEndStr = String(get(I.presentAtEnd, '')).trim(); // POST-owned PRESENCE REPORT — read here ONLY to warn (refused below)
    const swingStr = String(get(I.daySwing, '')).trim();          // DAY-END SWING "<Key>:<Outcome>" (an EVENT day's tied CHECK; a DATEOUT day pays itself)
    const fireStr = String(get(I.eventFire, '')).trim();          // EVENT FIRE "<key>[:<Outcome>]" — the armed @KEY the narrator just played (event_schedule 6C)
    const recEvtStr = String(get(I.recordEvent, '')).trim();      // WORLD LOG "scope|summary" — an organic significant / lore-override story event
    const recNpcStr = String(get(I.recordNPC, '')).trim();        // NPC REGISTER "Key|Name|Relationship" — a recurring non-classmate character
    const moneyStr = String(get(I.money, '')).trim();            // MONEY "<signed int>" — MainChar spend/earn (update_analysis 5d)
    const friendsStr = String(get(I.friends, '')).trim();        // FRIENDS "<KeyA>:<KeyB>:<MoodA>[:<MoodB>]" — heroine↔heroine web (5b)
    let recordStr = String(get(I.record, '')).trim();            // RECORD "<owner>:<bucket>:<name>[:<val>]" — profile reveal / Belongings·Inventory·Skills·Hobbies (5c/5d); MainChar's Skills are POST-owned (refused below)
    const questStr = String(get(I.quest, '')).trim();            // PLAYER QUEST "<verb>:<...>" — add / progress / complete (update_analysis 5d)
    const intimacyStr = String(get(I.intimacy, '')).trim();      // INTIMACY LATCH "enter[:<Key>]" | "exit" — set/clear PendingState.IntimacyActive (Cluster 5)
    const hactStr = String(get(I.hact, '')).trim();              // H-ACT "<Key>;act:<Act>;gate:<die>;…" — per-reply H beat (Cluster 5 · resolver owns the math AND derives every outcome)
    const sceneClockRaw = String(get(I.sceneClock, '')).trim();  // SCENE CLOCK "HH:MM" civil 24h — where this reply's prose ENDED (stage 3a derives the drift)
    const stepDoneStr = String(get(I.stepDone, '')).trim();      // STEP DONE — the DUMP of spine steps narrate's prose played (stage 3b2 walks the cursor through it)
    // '0'/'false' pass silently: the retired timeElapsed channel taught "0 = no passage", and a model echoing
    // that habit means "clock unchanged" — a benign no-op, not garbage worth a warn.
    const hasSceneClock = !(sceneClockRaw === '' || sceneClockRaw === '0' || sceneClockRaw === 'false');
    // PAST MIDNIGHT — narrate's observation that this reply's prose ran past midnight; it lets a sceneClock earlier
    // than the clock cross into the next civil date (stage 3a). It moves nothing by itself.
    const isPastMidnightReported = get(I.pastMidnight, false) === true;
    const wantsAdvanceIntent = get(I.sceneAdvance, false) === true;
    // MANUAL "Next-Block" — the GUI checkbox writes PendingState.BlockDone=true (a player-set advance REQUEST). It's the
    // player's counterpart to the AI's /Intent/sceneAdvance (esp. on a FREE/EVENT day, which has no block cap). IMMEDIATE
    // model: the checkbox click itself calls __resolveTurn (see wire_resolver's patchImmediateNextBlock), so the clock
    // advances AT CLICK TIME — the NEXT reply's Window A + narration already sit on the new block/day (no story↔menu
    // desync). Because that click-time fire targets the ALREADY-RESOLVED latest message, blockDoneReq must BYPASS the
    // alreadyResolved guard below (a manual advance is a fresh player action, not an Intent re-fire). Then reset the
    // one-shot to false. If the click-time fire is ever missed, the reply's own end-RES still consumes it (fallback).
    const blockDoneReq = get(PendingState.BlockDone, false) === true;
    const nc = I.newClassmate;
    let hasNewCM = nc && typeof nc === 'object' && !Array.isArray(nc) && Object.keys(nc).length > 0;
    // ONCE-PER-(msg,swipe) GUARD (resolvedFor) — the Intent-clear at (5) makes the 2 normal fires/turn idempotent, but a
    // RE-APPLICATION of narrate's <UpdateVariable> (ST-Prompt-Template re-render / a stray re-parse) would re-populate
    // check/mundane and DOUBLE-run the heavy math (double affection, double block-advance). resolvedFor records the
    // (msg,swipe) already resolved → a later fire for the SAME key skips the math; a SWIPE changes the key → resolves
    // fresh. ctx.mid/ctx.swipe come from the handler (unit tests omit them → turnKey null → guard inert, unchanged).
    const turnKey = (ctx.mid != null) ? (String(ctx.mid) + ':' + (ctx.swipe != null ? ctx.swipe : 0)) : null;
    const alreadyResolved = !!(turnKey && String(get(I.resolvedFor, '')) === turnKey);

    // (A3) GATE LIVENESS (Finding #6) — auto-disarm a gate that armClassmate armed but the narrator NEVER consumed
    // (it kept replying without emitting /Intent/newClassmate), so it can't re-prompt a build forever. Purely a
    // function of how many MESSAGES have passed since arming (AddClassmateArmedAt) → idempotent across the 2 fires/turn
    // and a swipe (same ctx.mid), and inert when the handler passes no mid (unit tests). armBuildGate (re)stamps
    // armedAt; a build (section 0) clears it. Runs BEFORE the idempotency gate so a no-decision-Intent turn still ticks.
    if (String(get(PendingState.AddClassmate, '')).trim() && !armed && !hasNewCM && ctx.mid != null) {
      const armedAt = Number(get(PendingState.AddClassmateArmedAt, -1));
      if (armedAt >= 0 && (ctx.mid - armedAt) >= ADD_CLASSMATE_GRACE_MSGS) {
        const _staleKey = String(get(PendingState.AddClassmate, '')).trim();
        setVal(PendingState, 'AddClassmate', '');
        setVal(PendingState, 'AddClassmateArmedAt', -1);
        log.push('AddClassmate gate auto-disarmed for [' + _staleKey + '] — armed at msg ' + armedAt + ', now msg ' + ctx.mid + ' with no build (liveness)');
        armed = true;   // real state change → persist (AddClassmate→false shows in audit; armedAt is diff-skipped)
      }
    }

    // ⚠ THE POST-OWNED CHANNELS ARE REFUSED **HERE**, ABOVE THE IDLE GUARD (P7, v0.55.0) — not at their old
    // (2c)/(2e) sites. Those sit below the guard, and since these channels no longer keep a turn alive, a
    // reply whose ONLY traffic is a retired narrate emit would return "no pending intent" and drop it in
    // TOTAL SILENCE — the precise failure the warn exists to prevent. Diagnostics belong wherever the
    // condition is true, not wherever the apply used to live.
    //
    // Two possible causes, both ending in a DROP, and the wording names both because they need opposite
    // reactions: (a) narrate (or a cached prompt / an old save) still emits it — a contract violation, fix
    // the narrate prompt; (b) a stale re-parse resurrected POST's already-applied ops out of the persisted
    // <POSTUpdateVariable> text — safe, the work landed at the relay. NOT a fallback: the engine never
    // applies narrate-time traffic on a POST-owned channel, whoever wrote it.
    if (relStr) {
      warnRes('RELATIONSHIP CHANNEL IS POST-OWNED (v0.55.0) — traffic arrived at RES1 time: "' + relStr +
              '". DROPPED (nothing applied). Either narrate still emits /Intent/relationship (retired — fix the ' +
              'narrate prompt; POST records this channel from the finished prose now) or a stale re-parse ' +
              'resurrected POST\'s already-applied ops (safe — the work landed at the relay)');
      log.push('⚠ relationship DROPPED (POST-owned channel written at narrate time): ' + relStr);
    }
    if (initStr) {
      warnRes('INITIATIVE CHANNEL IS POST-OWNED (v0.55.0) — traffic arrived at RES1 time: "' + initStr +
              '". DROPPED (nothing applied). Either narrate still emits /Intent/initiative (retired — fix the ' +
              'narrate prompt; POST records the stamp from the finished prose now) or a stale re-parse ' +
              'resurrected POST\'s already-applied ops (safe — the work landed at the relay)');
      log.push('⚠ initiative DROPPED (POST-owned channel written at narrate time): ' + initStr);
    }
    if (presentAtEndStr) {
      warnRes('PRESENCE REPORT IS POST-OWNED — traffic arrived at RES1 time: "' + presentAtEndStr +
              '". DROPPED (nobody leaves on it here). Either narrate emits /Intent/presentAtEnd (it never should — ' +
              'narrate reports arrivals, and who is with him at the end is POST\'s; fix the narrate prompt) or a ' +
              'stale re-parse resurrected POST\'s already-applied op (safe — it ran at the relay)');
      log.push('⚠ presentAtEnd DROPPED (POST-owned channel written at narrate time): ' + presentAtEndStr);
    }
    if (isSkillRecord(recordStr)) {
      warnRes('MAINCHAR\'S SKILL RECORDS ARE POST-OWNED — traffic arrived at RES1 time: "' + recordStr +
              '". DROPPED (nothing recorded). Either narrate still emits /Intent/record "Mainchar:Skills:…" (retired — ' +
              'fix the narrate prompt; POST records his skills from the finished prose now) or a stale re-parse ' +
              'resurrected POST\'s already-applied op (safe — the record landed at the relay)');
      log.push('⚠ skill record DROPPED (POST-owned channel written at narrate time): ' + recordStr);
      recordStr = '';
    }

    // THE GATE IS A NUDGE, NOT A PERMISSION. POST arms a roster heroine it saw on stage; Window A then prints the
    // BUILD MODE banner naming her Key, (A3) auto-disarms an arm nobody builds after ADD_CLASSMATE_GRACE_MSGS
    // replies, and section (0) closes it once every pending entry is handled. A build with nothing armed is the
    // ORDINARY path and is built below, logged by name:
    //   · a predefined heroine built the reply she appears in — her [Character] lore entry carries a NEW HEROINE
    //     note that renders while she is unbuilt, so her card and the order to build arrive together;
    //   · a classmate with no card, built because the player typed [ooc: add classmate <name>] — narrate invents
    //     her profile (<Classmate_Guide>).
    // buildClassmate validates every record either way: FullName mandatory + Latin-only, the nine traits and
    // Name, Persona one of PERSONA_ARCHETYPES, five-row key resolution (an already-built girl resolves to
    // 'already' and no-ops).
    // ARMED = EITHER HALF OF THE PAIR. AddClassmateArmedAt is written ONLY by this engine (arm, build-success,
    // liveness) and every engine-side close sets BOTH to ('', -1) — so a lone clear on the flag with the clock
    // still stamped is a foreign write, not a closed gate.
    const buildArmed = !!String(get(PendingState.AddClassmate, '')).trim()
      || Number(get(PendingState.AddClassmateArmedAt, -1)) >= 0;
    if (hasNewCM && !buildArmed) {
      const keys = (typeof nc.key === 'string') ? [nc.key] : Object.keys(nc);
      log.push('newClassmate built UNARMED (nothing had armed the gate): ' + keys.join(', '));
    }

    // ⚠ EVERY channel THIS ENTRY OWNS is listed here. A new one missing from this line makes a turn that
    // fires ONLY that channel look like an idle turn — it returns "no pending intent" and the work is
    // silently dropped.
    // ⚠ relStr / initStr / presentAtEndStr are DELIBERATELY ABSENT (P7, v0.55.0) — they belong to resolvePostRelay now, and
    // listing them here would be actively harmful: a stale re-parse that resurrects POST's persisted ops
    // would carry resolveTurn PAST this guard and re-run the whole per-turn math (a second block advance,
    // a second day-roll) for channels it then refuses to apply anyway. They are read above ONLY to warn.
    // recordStr stays listed for narrate's records; a MainChar skill record was blanked above, so it never counts here.
    if ((alreadyResolved && !blockDoneReq) || (!checkStr && !mundStr && !fwbStr && !puppyStr && !dayChkStr && !trainStr && !locStr && !arriveStr && !swingStr && !fireStr && !recEvtStr && !recNpcStr && !moneyStr && !friendsStr && !recordStr && !questStr && !intimacyStr && !hactStr && !hasSceneClock && !isPastMidnightReported && !stepDoneStr && !wantsAdvanceIntent && !blockDoneReq && !hasNewCM)) {
      // Even an idle reply (no decision-Intent) re-scans event triggers — a prior reply's day-roll or scene move may
      // have made one eligible — UNLESS this is a pure idempotent re-fire (alreadyResolved), which must stay a no-op.
      // The DAY SIGNPOST seeds here too (quest-revisit B1): a genuinely idle reply must still grow the
      // record, because visible-from-reply-1 cannot depend on narrate emitting anything.
      // ⚠ GUARDED EXACTLY LIKE scanEvents, and for the same reason. "Idempotent" is not the same as
      // "free": on an alreadyResolved RE-FIRE the seed still WRITES and still flips `applied`, and this
      // path must stay a total no-op. Shipped unguarded for one build and cost a live turn — the extra
      // write landed mid-render, ST logged "Timeout waiting for chat to save", the swipe's variables
      // never persisted, and the status-menu iframe was rewritten out of the message (it came back on a
      // reload). A re-fire is by definition a turn whose own resolve already seeded.
      const seeded = alreadyResolved ? false : !!ensureDaySignpost(statData, log);
      const capNotesRetired = alreadyResolved ? false : retireAffectionCapNotes(CM);   // last reply's cap notes are not this one's
      if (!alreadyResolved) ensureTripQuest(statData, log);
      const evArmed = alreadyResolved ? false : scanEvents(statData, log);
      if (!alreadyResolved) noteSameRoundMiss(statData, ctx, log, '', '');
      if (!alreadyResolved) noteArmedLost(statData, __before, log, '', '');
      // (v0.42.0 R5: the idle-path candidate/initiative stash refreshes are GONE with the stashes. They
      //  existed so a load-time / intent-less fire could not leave PRE reading a stale stash — with the
      //  [PRE] entries computing LIVE there is nothing to keep fresh, and an idle turn is now a true
      //  no-op unless an event actually armed. Fewer pointless saves, same PRE data.)
      const changed = armed || evArmed || seeded || capNotesRetired;
      // ⚠ The idle log must never ERASE a refusal (P7). `log` is discarded when nothing applied, which is
      // right for an ordinary quiet turn — but each of these is a real event with a real cause, and
      // reporting it as "no pending intent" would be a log that lies about the one thing you opened it to
      // find out, so their lines are carried through:
      //   a POST-owned channel that arrived here and was DROPPED;
      //   a build-gate refusal (a reply whose only traffic was a copied /Intent/newClassmate consumes it
      //     above and arrives here looking idle);
      //   a same-round beat LOST (played, never fired, not armed — nothing else on this path changes).
      // An ARMED LOST needs no carry: it always comes with the scan moving the pointer, so that log is kept whole.
      const dropped = log.filter((l) => /DROPPED \((POST-owned|build gate)|SAME-ROUND LOST/.test(l));
      const idleLog = [alreadyResolved ? 'already resolved for ' + turnKey : 'no pending intent'].concat(dropped);
      const out = { statData, applied: changed, log: changed ? log : idleLog, resBlock: changed ? buildResBlock(__before, statData) : '' };
      // The bars render even on an idle turn — every reply shows them, the card's greeting included.
      // NOT on the alreadyResolved re-fire: the resolved reply already carries its lead text, which the
      // host leaves as it is when none is returned; a reply regenerated in place (the known resolvedFor
      // gap) shows no bar — the honest, visible symptom that RES did not resolve it, never a bar with a
      // wrong clock.
      if (!alreadyResolved) {
        out.leadText = renderLeadText(statData);
      }
      return out;
    }

    // (0) ADD CLASSMATE — /Intent/newClassmate is a RECORD keyed by heroine Key: { Mana:{key,…}, Iori:{key,…} }.
    // The narrator writes the WHOLE record in ONE op (a sub-key add to /Intent/newClassmate/<Key> is REJECTED by MVU —
    // the record is non-extensible), keyed by Key; RES LOOPS and builds each. Back-compat: a single flat {key,…} object
    // is treated as one entry. buildClassmate skips an already-built heroine. The gate closes once every pending
    // entry is handled (built or already-present); a genuine failure (bad key) leaves it armed to retry.
    if (hasNewCM) {
      const entries = (typeof nc.key === 'string') ? [nc]
                    : Object.keys(nc).map((k) => nc[k]).filter((p) => p && typeof p === 'object');
      let allHandled = true;
      for (const p of entries) {
        const res = buildClassmate(p, statData);
        if (res.ok && res.note) log.push(res.note);
        log.push(res.ok ? (res.filled ? 'filled shell -> ' : 'added classmate ') + res.key + ' (' + res.persona + ')'
                        : 'addClassmate skipped: ' + res.reason);
        if (!res.ok && !/already exists/i.test(res.reason || '')) allHandled = false;
      }
      if (allHandled) { setVal(PendingState, 'AddClassmate', ''); setVal(PendingState, 'AddClassmateArmedAt', -1); }   // built/present → close gate + clear #6 clock
      delete I.newClassmate;                                // transient — consume the whole record
    }

    // (0a) LAST REPLY'S H MARKER RETIRES — HView carries one reply's result (CLIMAX: she came · EDGED: she was denied) to the
    // next prompt only. That reply has now been written, so it clears here; an act below sets this reply's own.
    for (const key of Object.keys(CM)) {
      const c = CM[key];
      if (c && typeof c === 'object' && String(get(c.HView, ''))) setVal(c, 'HView', '');
    }
    // LAST REPLY'S CAP NOTES RETIRE the same way, before any gain below writes this reply's (noteCappedGain).
    retireAffectionCapNotes(CM);

    // (0b) AHEGAO COMES DOWN — Ahegao lasts while the sex on her goes on. The first reply that runs no sex act on her is her
    // afterglow, written while she was still in it, so it ends here: before (1) and the H section, so a confession or a
    // check this reply sets her Mood. Her Energy stays 0, so a second round (a sex act on her, applyHact) brings it back.
    {
      const hactParts = hactStr.split(';').map((part) => part.trim());
      const hactAct = (hactParts.find((part) => /^act:/i.test(part)) || '').slice(4).trim();
      const sexOnKey = HSEX.indexOf(hactAct) >= 0 ? hactParts[0] : '';
      for (const key of Object.keys(CM)) {
        const c = CM[key];
        if (c && typeof c === 'object' && get(c.Ahegao) === true && key !== sexOnKey) leaveAhegao(c, log, 'her afterglow: no sex act on her this reply');
      }
    }

    // (1) SOCIAL CHECK  "target:<Key>;type:<Type>;difficulty:<Tier>;rawdie:N;total:N;dcmod:N;base:N;
    // traitfit:<match|clash|neutral>;hobbyfit:N;dc:N"  (','-join several
    // INDEPENDENT checks in one reply — the PRE call decomposes a compound move into atomic checks and measures
    // each; a dependent chain instead falls out across replies because the fiction gates it). type = one of the
    // 10 channels (TYPE_MOOD); difficulty = the PRE call's Trivial..Extreme rating (STAKES) → it owns the affection
    // magnitude, the type owns only the mood flavor; an omitted/unknown one falls back to Moderate.
    // The OUTCOME is not carried — deriveOutcome() computes it from the three numbers (see the header note there).
    for (const one of checks) {
      const f = parseKeyedFields(one);
      const type = f.type, target = f.target;
      // CASE-FOLDED (v0.56.0) — the keyed format already folds KEYS and now folds `traitfit`'s value, and
      // this one had to join them: since v0.56.0 the tier no longer only picks STAKES, it also picks the
      // TIER_BASE_DC row the reported `base` is checked against. A lowercase "hard" silently becoming
      // Moderate used to cost a stakes band; it would now ALSO rewrite a correct DC of 19 down to 16 and
      // log the model's correct base as the error. Folding is the existing tolerance, not a new fallback.
      const difficulty = DIFFICULTIES.find((d) => d.toLowerCase() === String(f.difficulty || '').trim().toLowerCase()) || DEFAULT_DIFFICULTY;
      const c = CM[target];
      if (!c || !TYPE_MOOD[type] || !STAKES[difficulty]) {
        // ALWAYS logged — never gated on "did we manage to extract a target". A string that parses to
        // nothing at all (a legacy positional check, a mangled field set) yields target === undefined,
        // and the earlier `if (target || type)` guard meant exactly those cases — the most broken ones —
        // dropped in total silence. A discarded check is a lost player action; say so every time.
        // TWO WAYS TO LAND HERE, both IGNORED identically — the split is the LOG's, never the logic's.
        // A PLACEHOLDER is PRE writing "nothing happened" as an op instead of omitting it (output-pre
        // forbids this): no player action existed, so nothing was lost. Anything else may have eaten a
        // real roll. Reading one wording for both told you a check died without telling you whether a
        // player lost one, which is the whole question you ask this line at 2am. Recognising the shape
        // does NOT excuse it: both stay warnings, because both are the model breaking its contract.
        const isPlaceholder = target === 'none' && type === 'none' &&
                              Number(f.rawdie) === 0 && Number(f.total) === 0 && Number(f.dc) === 0;
        if (isPlaceholder) {
          warnRes('CHECK IGNORED (PLACEHOLDER) — PRE wrote an all-"none" tuple instead of omitting the op: "' + one +
                  '". NOTHING WAS LOST — no check fired this reply — but the op should not exist: output-pre says ' +
                  'a check that did not fire is the ABSENCE of the /Intent/check op. Fix the PRE prompt, not the engine');
          log.push('⚠ check ignored (PLACEHOLDER — PRE emitted an all-"none" tuple; no check fired, nothing lost): ' + one);
        } else {
          warnRes('CHECK IGNORED (MALFORMED) — unparseable or unknown type/target: "' + one +
                  '" (expected "target:<Key>;type:<Type>;difficulty:<Tier>;rawdie:N;total:N;dcmod:N;base:N;traitfit:<match|clash|neutral>;hobbyfit:N;dc:N"). A REAL CHECK MAY ' +
                  'HAVE BEEN LOST HERE — if the dice are non-zero, the player made a move that scored nothing');
          log.push('⚠ check ignored (MALFORMED — unparseable or bad type/target; a real check may have been lost): ' + one);
        }
        continue;
      }
      // THE THREE NUMBERS ARE MANDATORY. They used to be optional verify tokens riding along beside a
      // declared verdict; now they ARE the verdict's only source, so a missing or non-numeric one does
      // not mean "skip the verify" — it means this check cannot be resolved at all. Fail LOUDLY and
      // skip it: defaulting the outcome would invent a result the player was never shown, which is
      // exactly the silent-wrongness this rewrite exists to end.
      const rawDie = Number(f.rawdie), total = Number(f.total);
      if (!Number.isFinite(rawDie) || !Number.isFinite(total) || !Number.isFinite(Number(f.dc))) {
        warnRes('CHECK UNRESOLVABLE ' + type + ':' + target + ' — rawdie/total/dc missing or non-numeric in "' + one +
                '"; no outcome can be derived, this check is SKIPPED (nothing applied)');
        log.push('⚠ CHECK UNRESOLVABLE ' + one + ' — missing/non-numeric rawdie/total/dc (skipped)');
        continue;
      }
      // THE DERIVATION FIELDS ARE MANDATORY TOO (v0.56.0) — same cutoff as the three numbers above, and
      // for the same reason. They are not decoration riding beside the DC: they ARE what makes a DC
      // checkable at all, so an absent one does not mean "skip the verify", it means this check's DC
      // rests on nothing and cannot be trusted to score a player's move. No fallback to PRE's own dc —
      // that is the engine covering for the PRE prompt's flaw, and it is exactly how the sign flip
      // survived unseen. `traitfit` must be a WORD we know: without it the ±2 is underivable, and
      // guessing it would re-invent the number we came here to stop trusting.
      if (!Number.isFinite(Number(f.dcmod)) || !Number.isFinite(Number(f.base)) ||
          !Number.isFinite(Number(f.hobbyfit)) || TRAIT_FIT_DELTA[String(f.traitfit || '').trim().toLowerCase()] === undefined) {
        warnRes('CHECK UNRESOLVABLE ' + type + ':' + target + ' — the DC derivation is missing from "' + one +
                '" (need dcmod:N;base:N;traitfit:match|clash|neutral;hobbyfit:N). Its DC cannot be verified, ' +
                'so it is SKIPPED (nothing applied) — a player action scored nothing. Fix the PRE prompt');
        log.push('⚠ CHECK UNRESOLVABLE ' + one + ' — missing dcmod/base/traitfit/hobbyfit (skipped)');
        continue;
      }
      // The engine's DC WINS over PRE's. It is arithmetic on PRE's own frozen inputs, so "winning" is
      // only ever correcting PRE against itself — never overriding a judgement it made. Window A ran
      // this identical rule BEFORE narrate and printed the corrected number, so the prose the player
      // just read already says this DC; agreeing with it here is what keeps prose and state one fact.
      const { dc, notes: dcNotes } = resolveCheckDc(f, difficulty);
      for (const n of dcNotes) {
        warnRes('CHECK DC CORRECTED ' + type + ':' + target + ' — ' + n + '. Resolving on ' + dc +
                '; Window A printed the same corrected number, so the prose matches. Fix the PRE prompt');
        log.push('⚠ CHECK DC CORRECTED ' + one + ' — ' + n + ' (resolved on ' + dc + ')');
      }
      const outcome = deriveOutcome(rawDie, total, dc);
      // ── §9c RECEIPT VERIFY (v0.44.0, and it matters MORE since v0.49.0). ctx.dice = what mvu-helper's
      // dealer actually dealt this generation, across every named pool (LOGIC_ENGINE_PLAN §9c).
      //
      // CHECK DESYNC used to sit here as its sibling: it re-derived the outcome from these numbers and
      // warned when the AI's DECLARED verdict contradicted them. That check is GONE because its subject
      // is gone — the AI no longer declares a verdict, deriveOutcome() above owns it, so there is nothing
      // left that could disagree. (It earned its retirement loudly: in its final live gate it fired on 4
      // of 9 checks, every one of them a "Success" the numbers refused.)
      //
      // This receipt is the half that survives, and its stakes ROSE when the verdict fell: the die used to
      // be one input to a verdict the AI stated, and is now the sole thing that DECIDES the verdict. An
      // invented die is internally consistent by construction — no arithmetic check can ever catch it —
      // so this pool-membership test is the only thing standing between a fabricated number and a real
      // affection swing. VALUE-level only in v1: full ①-position enforcement needs the slot-binding design
      // (H gates legitimately consume dice before a check), recorded in §9c as deferred.
      // Still VERIFY-ONLY — there is no second die to fall back on and Math.random is banned in this
      // engine, so RES cannot re-roll; it can only tell you. ctx.dice absent/null (EJS fallback rolled
      // inline, non-hosted card, unit tests, old mvu-helper) ⇒ silently skipped, NOT a warn: a missing
      // receipt is the documented no-receipt path, not an anomaly worth console noise.
      if (Array.isArray(ctx.dice) && ctx.dice.length && ctx.dice.indexOf(rawDie) === -1) {
        warnRes('CHECK DIE NOT FROM POOL ' + type + ':' + target + ' used RawDie ' + rawDie +
                ' but the dealt pool was [' + ctx.dice.join(',') + '] — the die was invented, and it is what set this outcome (verify-only)');
        log.push('⚠ CHECK DIE NOT FROM POOL ' + one + ' — RawDie ' + rawDie + ' not in dealt [' + ctx.dice.join(',') + '] (applied anyway)');
      }
      // Confess is the confession — he asks her to be his girlfriend. A WON one (Success/CritSuccess) makes a Dating
      // girl a Girlfriend, and is an FWB girl's consent to become one; Affection RESETS at the new stage. At any other
      // stage it is a warm beat that applies the tier's swing. It is the ONLY check that promotes: a promotion rides on
      // one observable act, so a won EmotionalRequest (a promise, a hard truth) at Dating stays a warm beat.
      if (type === 'Confess' && (outcome === 'Success' || outcome === 'CritSuccess')) {
        const stage = String(get(c.RelationshipStage, ''));
        if (stage === 'Dating' || stage === 'Friends_With_Benefits') {
          setVal(c, 'RelationshipStage', 'Girlfriend');
          setVal(c, 'Affection', -1);                            // -1 = FRESHLY-ADVANCED sentinel (see tryStageGate ladder)
          restartLedgerOnPromotion(c, statData);
          pushImportantEvent(c, stage + ' → Girlfriend (confession)', statData, log);
          log.push(target + ' confession accepted: ' + stage + ' -> Girlfriend (Aff reset)');
        } else {
          const d = applyAffection(c, STAKES[difficulty][outcome]);
          log.push(target + ' Confess/' + difficulty + ' ' + outcome + ' landed warmly (no gate at ' + stage + '): ' + affectionGainText(STAKES[difficulty][outcome], d));
        }
        setMood(c, TYPE_MOOD.Confess[outcome], log, 'Confess ' + outcome);
        continue;
      }
      // Repair is the RECONCILIATION check: a WON one (Success/CritSuccess) clears an active ConflictActive AND lands
      // the tier's warm swing (an apology that reaches her). A LOST one falls through to the generic path — the tier
      // penalty applies (the apology flops) and an Extreme crit-fail can still ignite a fresh fight, same as any
      // overreach. Distinct from /Intent/relationship "reconcile" (a narrator flat-clear, no roll, no swing).
      if (type === 'Repair' && (outcome === 'Success' || outcome === 'CritSuccess')) {
        const d = applyAffection(c, STAKES[difficulty][outcome]);
        const had = get(c.ConflictActive) === true;
        if (had) setVal(c, 'ConflictActive', false);
        setMood(c, TYPE_MOOD.Repair[outcome], log, 'Repair ' + outcome);
        log.push(target + ' Repair/' + difficulty + ' ' + outcome + ': ' + affectionGainText(STAKES[difficulty][outcome], d) + (had ? ' · ConflictActive CLEARED (reconciled)' : ' (nothing to reconcile)'));
        continue;
      }
      const d = applyAffection(c, STAKES[difficulty][outcome]);
      const mood = TYPE_MOOD[type][outcome];
      if (mood) setMood(c, mood, log, type + ' ' + outcome);
      // an EXTREME overreach that CRIT-FAILS detonates: she recoils and it becomes a fight (social_system BOUNDARY).
      // This is the ONLY hard consequence the engine forces on physical/emotional overreach — there is NO stage gate;
      // a stage-forbidden advance is the narrator's call, routed to /Intent/relationship "conflict", not a check.
      let conflicted = false;
      if (difficulty === 'Extreme' && outcome === 'CritFail' && get(c.ConflictActive) !== true) {
        setVal(c, 'ConflictActive', true);
        conflicted = true;
      }
      log.push(target + ' ' + type + '/' + difficulty + ' ' + outcome + ': ' + affectionGainText(STAKES[difficulty][outcome], d) +
               (mood ? ', Mood -> ' + mood : '') + (conflicted ? ', CONFLICT' : ''));
    }

    // (2) MUNDANE BEATS  "Target:Class[:CoStat]", ','-joined when the beat is shared with several girls. The optional
    // 3rd token = the MainChar stat the shared activity trained. Each item pays its own girl, once; a malformed item
    // is warned and pays nothing.
    const mundTargets = [];
    if (mundStr) {
      const paid = new Set();
      for (const raw of mundStr.split(',')) {
        const item = raw.trim();
        if (!item) continue;
        const [target, klass, coStat, ...extra] = item.split(':').map((s) => s.trim());
        if (MUNDANE_DELTA[klass] === undefined || extra.length) {
          warnRes('MUNDANE ITEM MALFORMED — "' + item + '" is not "<Key>:<Class>[:<CoStat>]" (Class = ' +
                  Object.keys(MUNDANE_DELTA).join('|') + '; several girls are ","-joined). Nothing paid for it.');
          log.push('⚠ mundane IGNORED (malformed): ' + item);
          continue;
        }
        mundTargets.push(target);
        const c = CM[target];
        if (paid.has(target)) log.push('mundane ignored (' + target + ' already paid this reply): ' + item);
        else if (!c || typeof c !== 'object') log.push('mundane ignored (no such classmate): ' + item);
        else {
          paid.add(target);
          const d = applyAffection(c, MUNDANE_DELTA[klass]);
          log.push(target + ' mundane ' + klass + ': ' + affectionGainText(MUNDANE_DELTA[klass], d));
        }
        if (coStat) {                                // CO-ACTIVITY TRICKLE: activity maps to a MainChar stat → +1 (max +1 per reported stat per game-day; Str is physical → the coin)
          const r = bumpMainchar(statData, coStat, 1, true);
          if (r.ok) log.push('co-activity: MainChar ' + r.gains[0].stat + ' +1 -> ' + r.gains[0].value
                             + (coStat === 'Str' ? ' (physical — the engine picks Str or Sta; a stat at 100 passes it on)' : ''));
          else if (!/already gained/.test(r.reason)) log.push('co-activity ignored: ' + r.reason);
        }
      }
    }

    // (2b) ROUTE GATES — advance any classmate whose affection just hit a gate
    // ⚠ THE SECOND READER OF /Intent/check. It only needs the target, so it used to pluck position [1]
    // straight out of the raw string — which is precisely why the v0.49.0 keyed rewrite broke it silently:
    // a check still applied its affection, then nobody advanced the stage, because "target:Sui;type" is
    // not a heroine key. Parse it the ONE way the format is defined, never by position.
    const gateKeys = new Set();
    for (const one of checks) gateKeys.add(parseKeyedFields(one).target);
    for (const k of mundTargets) gateKeys.add(k);
    for (const k of gateKeys) {
      const c = CM[k]; if (!c || typeof c !== 'object') continue;
      const adv = tryStageGate(c, statData, log);
      if (adv) log.push(k + ' STAGE GATE: ' + adv);
    }

    // (2c) RELATIONSHIP EVENTS — AI-recognized lifecycle changes.
    //   /Intent/relationship = "<action>:<key>[:<amount>]"  ·  ','-join several (grammar A: ',' = list)
    // actions: demote (story breach), betray (sexual betrayal; also Lewd→0), conflict (set flag), reconcile
    // (apology cleared it), walkoff (failed-scene exit), strain (Aff fall), fwb (intimate-route opt-in).
    // Demotion/betrayal/conflict are STORY-driven.
    //
    // WHY IT IS A LIST (v0.50.0): update_analysis [5c] has always defined actions that legitimately co-occur
    // in ONE beat — a boundary violation is both a rupture (conflict) and an on-screen hurt (strain). This
    // channel was single-valued, so the narrator had nowhere to put the second one and emitted TWO JSONPatch
    // ops on the same path; MVU is last-write-wins, so the first silently vanished. Live 2026-08-09:
    // "conflict:Mitsuki" then "strain:Mitsuki:20" left Affection floored at 0 with ConflictActive FALSE — the
    // mechanically important half was the half that got dropped, and no log anywhere said a thing.
    //
    // Items apply in CANONICAL rank (REL_RANK), never in written order, so the result cannot depend on how the
    // model happened to sequence them. That is not theoretical: a structural action GATES on Affection — fwb
    // demands Aff>80 — so "strain:Sui:10, fwb:Sui:Success" written in that order drops her to 75 first and the
    // arrangement she earned is refused against a threshold she cleared when the beat began. Ranked, the gate
    // reads the Affection the narrator was looking at, and the fall still lands after it. One answer either way.
    // (2c) RELATIONSHIP — POST-OWNED SINCE v0.55.0 (P7). The apply lives in applyRelationshipItems,
    // reached via resolvePostRelay; the refusal + its two-cause warn sit ABOVE the idle guard (see there).
    // Nothing to do here — the letter is kept because PORT_MAP cites it.

    // (2j) FWB OPT-IN — /Intent/fwb, keyed "target:<Key>;rawdie:N;dc:N;aff:N" (','-join several, grammar A).
    // PRE ROLLS IT AND WRITES THE NUMBERS; RES derives the verdict. The letter is out of sequence because the
    // labels are STABLE IDS cited from PORT_MAP, not an ordering — this block must run AFTER (2c), so a
    // demote/betray landing in the same reply has already moved her stage and voids the proposal (she was just
    // betrayed; an FWB arrangement on top of that is not a beat, it is two minds).
    //
    // WHY THE NUMBERS AND NOT A VERDICT (the §4.1 disease, last site). Narrate used to read the panel's Morals
    // DC, consume a pool die and declare `fwb:<Key>:Success` on /Intent/relationship — an AI-written verdict
    // gating a STAGE CHANGE, the exact anti-pattern the check move existed to kill. Now the die decides and
    // nothing can disagree with it. Raw 20 auto-accepts and raw 1 auto-refuses (the crit rule the narrator
    // prompt already stated); otherwise rawdie >= dc. There is no modifier — this is a flat Morals roll, so
    // unlike /Intent/check there is no `total` to carry.
    //
    // ★ THE GATE INPUTS ARE FROZEN, AND THAT IS HALF THE POINT OF THIS CHANNEL. `aff` is the Affection PRE
    // RATED AGAINST, not a live re-read. RES used to re-read c.Affection here and gate on `aff > 80` — but (1)
    // social checks call applyAffection EARLIER IN THE SAME PASS, so a Flirt landing this reply could push her
    // 79 → 85 and grant an arrangement the ★ FWB READY panel never offered, or a Failure could drop 82 → 77 and
    // silently refuse one the narrator had already written as accepted. Prose and state disagreed with no warn.
    // This is the same failure class /Intent/check's frozen `total` was adopted to prevent (v0.49.0), and FWB
    // never got the same treatment until now. The player gets the arrangement they were OFFERED.
    // The −20 penalty still applies to the LIVE Affection: the gate is a decision (frozen), the penalty is an
    // effect (current). Stage and ConflictActive stay live reads for the same reason — they are this reply's
    // facts, not the rating PRE made.
    if (fwbStr) {
      for (const one of fwbStr.split(',').map((s) => s.trim()).filter(Boolean)) {
        const f = parseKeyedFields(one);
        const key = f.target;
        const c = CM[key];
        if (!c) {
          warnRes('FWB TARGET UNKNOWN — "' + one + '" names no classmate (expected "target:<Key>;rawdie:N;dc:N;aff:N"); SKIPPED');
          log.push('⚠ fwb ignored (no such classmate): ' + one);
          continue;
        }
        // All three numbers are MANDATORY, exactly as /Intent/check's are: they ARE the verdict's only source,
        // so a missing one does not mean "skip the verify", it means this cannot be resolved at all. Defaulting
        // would invent a stage change the player was never shown.
        const rawDie = Number(f.rawdie), dc = Number(f.dc), aff = Number(f.aff);
        if (!Number.isFinite(rawDie) || !Number.isFinite(dc) || !Number.isFinite(aff)) {
          warnRes('FWB UNRESOLVABLE on ' + key + ' — rawdie/dc/aff missing or non-numeric in "' + one +
                  '"; no verdict can be derived, SKIPPED (nothing applied)');
          log.push('⚠ FWB UNRESOLVABLE ' + one + ' — missing/non-numeric rawdie/dc/aff (skipped)');
          continue;
        }
        // §9c receipt — the same guard /Intent/check gets, and it matters for the same reason: the die decides
        // the outcome outright, an invented one is internally consistent, and no arithmetic can catch it.
        // ctx.dice is the UNION of every named pool this generation, so PRE's own pool is covered.
        if (Array.isArray(ctx.dice) && ctx.dice.length && ctx.dice.indexOf(rawDie) === -1) {
          warnRes('FWB DIE NOT FROM POOL on ' + key + ' used RawDie ' + rawDie + ' but the dealt pool was [' +
                  ctx.dice.join(',') + '] — the die was invented, and it is what set this verdict (verify-only)');
          log.push('⚠ FWB DIE NOT FROM POOL ' + one + ' — RawDie ' + rawDie + ' not in dealt [' + ctx.dice.join(',') + '] (applied anyway)');
        }
        const stage = String(get(c.RelationshipStage, ''));
        const pass = (rawDie === 20) ? true : (rawDie === 1) ? false : (rawDie >= dc);
        if (stage !== 'Friend') {
          log.push(key + ' fwb ignored (must be Friend, is ' + stage + ' — a stage move landed this reply)');
        } else if (aff <= 80) {
          log.push(key + ' fwb ignored (PRE rated Aff ' + aff + ', must be >80)');
        } else if (get(c.ConflictActive, false) === true) {
          log.push(key + ' fwb ignored (she is in CONFLICT this reply — the proposal is void)');
        } else if (pass) {
          setVal(c, 'RelationshipStage', 'Friends_With_Benefits'); restartLedgerOnPromotion(c, statData);
          pushImportantEvent(c, 'Friend → Friends_With_Benefits (炮友/セフレ agreed)', statData, log);
          log.push(key + ' FWB: Friend -> Friends_With_Benefits (RawDie ' + rawDie + ' vs DC ' + dc + ', Aff ' + aff + ' kept)');
        } else {
          // A real cost: she rejected it, and −20 from any Aff drops her out of the >80 band, so it is ONE
          // shot per climb. Applied to the LIVE Affection (see the frozen-inputs note above).
          const d = applyAffection(c, -20);
          log.push(key + ' FWB REFUSED (RawDie ' + rawDie + ' vs DC ' + dc + '): Aff ' + d + ' (−20 — dropped out of the >80 FWB band)');
        }
      }
    }

    // (2k) DAY-CHECK ROLL — /Intent/dayCheck, keyed "rawdie:N;mod:N;total:N;dc:N" (PRE-written, PRE-rolled, ONCE per
    // day). The exam's verdict used to be the narrator's day-end judgment — the §4.1 disease, on the ACADEMIC tier.
    // Now die ⑤ decides: RES freezes the four numbers on EngineDerived.DayCheckRoll and the day-end swing pays
    // deriveOutcome() of them (applyDaySwing). The arithmetic is the engine's, the DC RULE stance: total = rawdie +
    // mod from the FROZEN mod (never a live Int re-read — /Intent/training can move Int this very resolve), dc =
    // DAY_CHECK's constant; a PRE number that disagrees is corrected and logged, never trusted. Window A derived the
    // same numbers the same way before narrate ran, so the word the prose was written to is the word that pays.
    // FIRST ROLL WINS — a second op on a rolled day is ignored, because the prose already wrote to the first. A roll
    // on a day whose tier is not a rolled tier is REFUSED (PRE misread its window); a malformed one freezes nothing
    // and the PRE window, which renders only while the field is empty, asks again next reply.
    if (dayChkStr) {
      const tierToday = String(get(EngineDerived.DayCheck, '')).trim();
      const spec = DAY_CHECK[tierToday];
      const f = parseKeyedFields(dayChkStr);
      const rawDie = Number(f.rawdie), mod = Number(f.mod);
      if (!spec) {
        warnRes('DAY-CHECK ROLL REFUSED — "' + dayChkStr + '" arrived on a day whose tier is "' + (tierToday || '-') +
                '", which is not a rolled tier; nothing is frozen (the PRE window shows its DAY CHECK block only on a rolled day — fix the PRE prompt)');
        log.push('⚠ dayCheck REFUSED (tier "' + (tierToday || '-') + '" is not rolled): ' + dayChkStr);
      } else if (String(get(EngineDerived.DayCheckRoll, '')).trim()) {
        log.push('dayCheck ignored (already rolled today — the first roll wins): ' + dayChkStr);
      } else if (!Number.isInteger(rawDie) || rawDie < 1 || rawDie > 20 || !Number.isFinite(mod) ||
                 !Number.isFinite(Number(f.total)) || !Number.isFinite(Number(f.dc))) {
        warnRes('DAY-CHECK UNRESOLVABLE — "' + dayChkStr + '" needs rawdie:1-20;mod:N;total:N;dc:N, all numeric; nothing is frozen and the PRE window asks again next reply');
        log.push('⚠ DAY-CHECK UNRESOLVABLE ' + dayChkStr + ' — missing/non-numeric field (skipped; asked again)');
      } else {
        const total = rawDie + mod, dc = spec.dc;
        if (Number(f.total) !== total) {
          warnRes('DAY-CHECK TOTAL CORRECTED — PRE wrote total ' + Number(f.total) + ' but RawDie ' + rawDie + ' + mod ' + mod + ' = ' + total + '; resolving on ' + total + ' (Window A printed the same)');
          log.push('⚠ dayCheck total corrected ' + Number(f.total) + ' → ' + total);
        }
        if (Number(f.dc) !== dc) {
          warnRes('DAY-CHECK DC CORRECTED — PRE wrote dc ' + Number(f.dc) + ' but the ' + tierToday + ' DC is ' + dc + '; resolving on ' + dc + ' (Window A printed the same)');
          log.push('⚠ dayCheck dc corrected ' + Number(f.dc) + ' → ' + dc);
        }
        // §9c receipt — the same guard every PRE die gets: the die decides the exam outright, an invented one is
        // internally consistent, and no arithmetic can catch it. Verify-only; Math.random is banned here.
        if (Array.isArray(ctx.dice) && ctx.dice.length && ctx.dice.indexOf(rawDie) === -1) {
          warnRes('DAY-CHECK DIE NOT FROM POOL — RawDie ' + rawDie + ' is not in the dealt pool [' + ctx.dice.join(',') + '] — the die was invented, and it is what set the exam (verify-only)');
          log.push('⚠ DAY-CHECK DIE NOT FROM POOL — RawDie ' + rawDie + ' not in dealt [' + ctx.dice.join(',') + '] (applied anyway)');
        }
        setVal(EngineDerived, 'DayCheckRoll', 'rawdie:' + rawDie + ';mod:' + mod + ';total:' + total + ';dc:' + dc);
        log.push(tierToday + ' DAY-CHECK ROLLED: RawDie ' + rawDie + ' ' + (mod >= 0 ? '+' : '') + mod + ' = ' + total + ' vs DC ' + dc +
                 ' → ' + deriveOutcome(rawDie, total, dc) + ' (frozen for the day; the day-end swing pays it)');
      }
    }

    // (2l) LOYAL-PUPPY DEMAND — /Intent/puppy, keyed "target:<Key>;rawdie:N" (','-join several, grammar A).
    // {{user}} demands her total submission; PRE observes it, rolls one die from its own pool (⑥) and writes the
    // numbers. RES derives the verdict, like the FWB opt-in: the RAW die reaching PUPPY_DEMAND.target converts her
    // to Loyal_Puppy — a SECRET stage, Affection KEPT (devotion, no shy reset). A miss keeps her stage and costs her
    // PUPPY_REFUSAL_LEWDNESS_COST Lewdness. The roll is shown either way (## SOCIAL CHECK RESULT), so the player sees
    // the demand was rolled. Eligibility is a LIVE read
    // of this reply's facts, and runs here, before (2i)'s H beat, so the Lewdness it reads is the one PRE and the
    // panel saw: a Dating or Girlfriend heroine (a Confess landing in (1) leaves her eligible) at PUPPY_DEMAND's floors
    // (isPuppyEligible).
    if (puppyStr) {
      for (const one of puppyStr.split(',').map((s) => s.trim()).filter(Boolean)) {
        const f = parseKeyedFields(one);
        const key = f.target;
        const c = CM[key];
        if (!c) {
          warnRes('PUPPY DEMAND TARGET UNKNOWN — "' + one + '" names no classmate (expected "target:<Key>;rawdie:N"); SKIPPED');
          log.push('⚠ puppy demand ignored (no such classmate): ' + one);
          continue;
        }
        // The die is MANDATORY, as every PRE roll's numbers are: it is the verdict's only source, and a default
        // would invent a stage change the player was never shown.
        const rawDie = Number(f.rawdie);
        if (!Number.isInteger(rawDie) || rawDie < 1 || rawDie > 20) {
          warnRes('PUPPY DEMAND UNRESOLVABLE on ' + key + ' — rawdie missing or not a die 1-20 in "' + one + '"; SKIPPED (nothing applied)');
          log.push('⚠ PUPPY DEMAND UNRESOLVABLE ' + one + ' — rawdie missing or not 1-20 (skipped)');
          continue;
        }
        // §9c receipt — the same guard /Intent/check and /Intent/fwb get: the die decides the verdict outright.
        if (Array.isArray(ctx.dice) && ctx.dice.length && ctx.dice.indexOf(rawDie) === -1) {
          warnRes('PUPPY DEMAND DIE NOT FROM POOL on ' + key + ' used RawDie ' + rawDie + ' but the dealt pool was [' +
                  ctx.dice.join(',') + '] — the die was invented, and it is what set this verdict (verify-only)');
          log.push('⚠ PUPPY DEMAND DIE NOT FROM POOL ' + one + ' — RawDie ' + rawDie + ' not in dealt [' + ctx.dice.join(',') + '] (applied anyway)');
        }
        const stage = String(get(c.RelationshipStage, ''));
        const hag = Number(get(c.Hagaruro, 0)) || 0, lewd = Number(get(c.Lewdness, 0)) || 0, mLevel = Number(get(c.M_level, 0)) || 0;
        if (!isPuppyEligible(stage, hag, mLevel, lewd)) {
          log.push(key + ' puppy demand ignored (not eligible: stage ' + stage + ' Hag ' + hag + ' M ' + mLevel + ' Lewd ' + lewd +
                   ' — needs Dating/Girlfriend, Lewd ≥ ' + PUPPY_DEMAND.minLewdness + ', and Hag ≥ ' + PUPPY_DEMAND.minHagaruro +
                   ' or M ≥ ' + PUPPY_DEMAND.minMLevel + ')');
        } else if (rawDie >= PUPPY_DEMAND.target) {
          setVal(c, 'RelationshipStage', 'Loyal_Puppy'); restartLedgerOnPromotion(c, statData);
          pushImportantEvent(c, stage + ' → Loyal_Puppy (submission)', statData, log);
          log.push(key + ' LOYAL-PUPPY DEMAND: ' + stage + ' -> Loyal_Puppy (RawDie ' + rawDie + ' ≥ ' + PUPPY_DEMAND.target +
                   ', Hag ' + hag + ' M ' + mLevel + ' Lewd ' + lewd + ', Aff kept)');
        } else {
          addLewd(c, -PUPPY_REFUSAL_LEWDNESS_COST);               // a fall is never stage-gated
          log.push(key + ' LOYAL-PUPPY DEMAND refused (RawDie ' + rawDie + ' < ' + PUPPY_DEMAND.target + '): stays ' + stage +
                   ', Lewd ' + lewd + '→' + (Number(get(c.Lewdness, 0)) || 0) + ' (−' + PUPPY_REFUSAL_LEWDNESS_COST + ')');
        }
      }
    }

    // (2d) MAINCHAR TRAINING — /Intent/training = "<Stat>:<amt>" (Int/Str/Cha, +1..3).
    // GROWTH path 1: a session the reply SHOWS him training — one reply is enough. The AI GRADES the effort (a short
    // run 1 · a focused block 2 · an all-day push 3); the resolver pays that grade in full, but only for the FIRST session of
    // its kind in a school week — every later one of that kind that week is refused, with the week named. narrate keeps reporting every
    // session, because it never tracks what was already spent. A physical session (Str) lands in Str or Sta —
    // the engine's coin (pickPhysicalStat); narrate never reports Sta.
    if (trainStr) {
      const [tStat, tAmt] = trainStr.split(':');
      const r = bumpMainchar(statData, tStat, tAmt, false);
      log.push(r.ok ? ('training: MainChar ' + r.gains.map((g) => g.stat + ' +' + g.amount + ' -> ' + g.value).join(', ')
                       + (tStat === 'Str' ? ' (physical session — the engine picks Str or Sta; a stat at 100 passes it on)' : ''))
                    : ('training ignored: ' + r.reason));
    }

    // (2e) PARTNER INITIATIVE — POST-OWNED SINCE v0.55.0 (PRE_Call_Revisit P7). PRE picks who
    // initiates, narrate WRITES the overture, POST confirms whom the prose actually fired and
    // records the stamp; the apply lives in applyInitiativeItems, reached via resolvePostRelay.
    // Its refusal + two-cause warn sit ABOVE the idle guard, with (2c)'s. Nothing to do here — the
    // letter is kept because PORT_MAP cites it.

    // (2e1) PRESENCE ENTRY (update_analysis 5b) — /Intent/arrive = "<Key>,<Key>": heroines who JOINED the scene this
    // reply (she came to him, he went to her, they met as planned). Flip Is_present=true and place her at the scene, so
    // the (2f) group-move carries her, (2g) can verify an event that needs her there, SCATTER (3) stops re-placing her,
    // and the H scene below counts her. Who LEFT is not reported here: POST names who is with him when the reply ends,
    // and the relay takes everyone else out of the scene (settlePresence), so a girl who dropped by and left joins here
    // and leaves there.
    if (arriveStr) {
      for (const seg of arriveStr.split(',')) {
        const key = seg.trim();
        if (!key) continue;
        const c = CM[key];
        if (!c || typeof c !== 'object') { log.push('arrive ignored (no such classmate): ' + key); continue; }
        if (get(c.Is_present, false) === true) { log.push('arrive ignored (' + key + ' already present)'); continue; }
        const loc = String(get(W.Location, ''));
        setVal(c, 'Is_present', true);
        setVal(c, 'Location', loc);
        log.push(key + ' joined the scene (Is_present -> true, @' + loc + ')');
      }
    }

    // (2f) SCENE MOVE (location.txt) — /Intent/location. Writes World.Location AND moves every PRESENT heroine
    // with the scene, so the Window-A roster's @locations stay truthful. Runs AFTER (2e1) so a girl who arrived
    // this reply is present and moves with everyone else. A girl who left before the move rides along too; the relay
    // takes her out of the scene where the move put her, and the next block's SCATTER re-places her.
    //
    // ⚠ World.Location IS A CANONICAL KEY (Area.Venue), not a display name. Three separate consumers EXACT-MATCH
    // it — the ## STATE-GATES-era hours panel, the H-act privacy tier (PRIVATE −2 / SEMI +2 / PUBLIC +5) and
    // EventPack's `Loc=<venue>` triggers — and a value that is not a key silently un-resolves ALL THREE at once,
    // each degrading quietly rather than failing. Live 2026-08-12: every seed shipped prose ("人光學園 一年一班" /
    // "Jinko Academy Class 1-1"), so the homeroom scored SEMI instead of PUBLIC and no `Loc=` trigger could fire.
    // This used to accept any string verbatim ("SOFT map, the constraint is prompt-side") — that is what let the
    // prose in. The map stays soft, but the KEY SHAPE is now enforced here, where the field is written.
    //
    // A listed venue is just its key: "School_Rooftop". A venue the narrator INVENTS registers itself in the SAME
    // emit, once — "Town_Yodobashi;label:ヨドバシカメラ;privacy:SEMI;hours:shops" — and from then on it is a venue
    // like any other, because WorldRecord.Locations is the runtime extension of <Location_List>. `hours` is a
    // CATEGORY, never a clock: the narrator names the bucket, code does the arithmetic (the same split as
    // traitfit → DC and the Hag band → interiority).
    if (locStr) {
      const locFields = parseKeyedFields(locStr);
      const venue = String(locFields.target || '').trim();
      // ONE underscore, venue half CamelCase — enforced, not conventional: the key is used as a PATH SEGMENT
      // (builder flat paths, getvar strings, JSON keys), so it may contain NO separator characters. The old
      // Area.Venue spelling put a dot inside a record key, which every dot-splitting path consumer mis-walked;
      // renamed 2026-08-12 while unreleased. split('_')[0] = the area, unambiguous by this regex.
      if (!/^[A-Z][A-Za-z0-9]*_[A-Z][A-Za-z0-9]*$/.test(venue)) {
        // NO FALLBACK, and deliberately NOT a best-effort write: putting prose into World.Location is precisely
        // the bug above, so a malformed tag leaves the scene where it was rather than poisoning the field. The
        // move is lost and said out loud, which is recoverable; a silently un-resolving location is not.
        warnRes('SCENE MOVE REFUSED — /Intent/location "' + locStr + '" is not an Area_Venue key (e.g. ' +
                'School_Rooftop, Town_Cafe — ONE underscore, venue half CamelCase). World.Location keeps its ' +
                'previous value, so the scene did NOT move. Fix the narrator prompt: this field is a key, and ' +
                'its NAME belongs in the prose');
        log.push('⚠ scene move REFUSED (not an Area_Venue key): ' + locStr);
      } else {
        if (venue === String(get(W.Location, ''))) {
          // Narrate reports where its prose ENDED every reply, like the clock — an observation, never a verdict on
          // whether the scene moved. The comparison is the engine's: the same venue is no move.
          log.push('scene stays at ' + venue + ' (reported, no move)');
        } else {
          setVal(W, 'Location', venue);
          let moved = 0;
          for (const k of Object.keys(CM)) {
            const c = CM[k];
            if (c && typeof c === 'object' && get(c.Is_present, false) === true) { setVal(c, 'Location', venue); moved++; }
          }
          log.push('scene move -> ' + venue + (moved ? ' (+' + moved + ' present heroine' + (moved > 1 ? 's' : '') + ')' : ''));
        }
        // Registration rides along ONLY when the narrator declared something — a listed venue needs no entry, and
        // auto-registering every visited key would fill the player's discovered-venues list with the base map.
        // registerWorldRecord is already idempotent, so a re-declared venue is a no-op rather than a clobber.
        if (locFields.label || locFields.privacy || locFields.hours) {
          registerWorldRecord(statData, 'Locations', venue, {
            Label: locFields.label || '',
            Note: locFields.note || '',
            Privacy: String(locFields.privacy || '').trim().toUpperCase(),
            Hours: String(locFields.hours || '').trim().toLowerCase(),
            DiscoveredAt: nowStamp(statData),
          }, log);
        }
      }
    }

    // (2g) EVENT FIRE (event_schedule · Cluster 6C) — the narrator played the armed @KEY (## EVENTS) and declared
    // /Intent/eventFire. Apply its structural FX (SERIES quest step / ONE-SHOT flag / NPC + discovered-venue
    // registration). Runs AFTER the scene move so the FirstSeen/DiscoveredAt stamps read the final location. The
    // fire is verified on that state OR on the state this reply began on (__before), so a beat delivered at the
    // start of the reply survives his line walking out of its venue. The end-of-turn re-scan below is SKIPPED
    // when one fired, so a chained series step waits a reply (scene breathes).
    let firedThisTurn = false;
    const fireKey = fireStr.split(':')[0].trim();          // the key narrate reported, its outcome suffix dropped
    if (fireStr) firedThisTurn = applyEventFire(statData, fireStr, log, __before);

    // (2h) ORGANIC WORLD-LOG / NPC records — the narrator flags a significant/lore-override story event
    // (/Intent/recordEvent) or introduces a recurring non-classmate character (/Intent/recordNPC). Both land in the
    // shared WorldRecord registries (Events = World Log · NPCs) and surface to narrate via Window-A next reply.
    if (recEvtStr) recordEvent(statData, recEvtStr, log);
    if (recNpcStr) recordNPC(statData, recNpcStr, log);
    if (moneyStr) applyMoney(statData, moneyStr, log);
    if (friendsStr) applyFriends(statData, friendsStr, log);
    if (recordStr) applyRecord(statData, recordStr, log);
    // The signpost must EXIST before a quest op can land on it, or narrate's very first objective
    // write is dropped as "no such quest" and the player's signpost stays blank for an extra reply.
    // Idempotent, so this early call is free; the late one after the advance still seeds a day that
    // ROLLED this reply (settleDay deleted the old record and the calendar moved on).
    ensureDaySignpost(statData, log);
    ensureTripQuest(statData, log);
    // Snapshot the signpost objective BEFORE the quest op lands. Whether THIS turn wrote one is what
    // stamps the cursor below, and it cannot be read off the op alone: a progress: with no step echo
    // writes a perfectly good objective and returns nothing to say so.
    const _spineKeyPre = daySpineKey(statData);
    const _objBefore = _spineKeyPre ? String(get((((statData.Mainchar || {}).Quests || {})[_spineKeyPre] || {}).Objective, '')) : '';
    const questResult = questStr ? applyQuest(statData, questStr, log) : { echo: '', spineComplete: '' };
    const questStepEcho = questResult.echo;

    // (2i) INTIMACY (Cluster 5) — an "enter" first, then the H beat, then an "exit": a reply may open the scene with its
    // first act, and a foreplay act can ride the reply that leaves ("kiss her goodbye and go"), so the act lands before
    // the scene closes. An "exit" in a reply whose SEX act ran is refused: the sex is still going on in that reply, and
    // a climax or his ejaculation is one round, not an end — the scene stays open until {{user}}'s input moves away.
    // A hact outside an armed scene is ignored (the narrator must /Intent/intimacy "enter" to open the H scene).
    //
    // An H channel that NAMES a heroine puts her in the scene: "enter:<Key>" opens the H scene with her, and a hact is an
    // act on her. So a named heroine who is not present joins here, placed as (2e1) places an arrival — at the scene's
    // location, read after (2f) so it is the final one. The inference runs ONE way only: a heroine the H channels do
    // not name is never taken out of the scene. A heroine who walks out after the act is taken out at the relay, on
    // POST's report. The join does not wait on the latch: a hact ignored below still names who the prose has.
    // A <Key> slot takes her Classmate Key (output.txt), so a key that is no Classmate Key (her name in the story's
    // script, say) names nobody: the channel lost its write, and it is warned here, naming who is present. A hact's
    // drop is already logged by applyHact, so only the intimacy channel adds a log line.
    const isClassmateKey = (key) => !!key && !!CM[key] && typeof CM[key] === 'object';
    const joinNamedInH = (channel, key) => {
      if (!key) return;
      if (!isClassmateKey(key)) {
        const present = Object.keys(CM).filter((k) => isClassmateKey(k) && get(CM[k].Is_present, false) === true);
        warnRes(channel.toUpperCase() + ' NAMES NO HEROINE — "' + key + '" is no Classmate Key (present: ' + (present.join(', ') || 'none') +
                '), so ' + (channel === 'hact' ? 'the act did not land (Exp, Arousal and Meter unchanged)' : 'nobody joined the scene by it') +
                '. A <Key> slot takes the word before the bracket on her ## PRESENT line (output.txt)');
        if (channel !== 'hact') log.push('⚠ /Intent/' + channel + ' names "' + key + '", which is no Classmate Key');
        return;
      }
      const c = CM[key];
      if (get(c.Is_present, false) === true) return;
      const loc = String(get(W.Location, ''));
      setVal(c, 'Is_present', true);
      setVal(c, 'Location', loc);
      log.push(key + ' joined the scene (named by /Intent/' + channel + ', Is_present -> true, @' + loc + ')');
    };
    const [latchVerb, latchKey] = intimacyStr.split(':').map((part) => part.trim());
    const isLatchEnter = latchVerb.toLowerCase() === 'enter';
    // A LOST CROSSING KEEPS THE SCENE SHUT: "enter" for a girl whose crossing PhysicalRequest was lost this reply is
    // refused, because she refused him and the dice are her consent. Her hact rides on the latch, so it is ignored with it.
    // She is the girl "enter:<Key>" or the hact names; when neither names a heroine (no key, or a key that is no
    // Classmate Key), any girl whose crossing was lost refuses it. Only a crossing owed counts (owedCrossingOutcomes):
    // for a girl past her first H with him a PhysicalRequest is an ordinary check.
    const crossingNow = owedCrossingOutcomes(CM, checkStr);
    const hactKeyNow = hactStr.split(';')[0].trim();
    const isHeroineNamed = isClassmateKey(latchKey) || isClassmateKey(hactKeyNow);
    const refusedByKey = [latchKey, hactKeyNow].find((k) => k && crossingNow[k] && !isWonOutcome(crossingNow[k]))
      || (!isHeroineNamed ? (Object.keys(crossingNow).find((k) => !isWonOutcome(crossingNow[k])) || '') : '');
    if (intimacyStr && isLatchEnter && refusedByKey) {
      warnRes('INTIMACY ENTER REFUSED — ' + refusedByKey + '\'s crossing PhysicalRequest was ' + crossingNow[refusedByKey] +
              ' this reply: she refused, so the H scene stays shut. The narrator wrote "enter" anyway (output.txt H-LATCH GATE)');
      log.push('intimacy "' + intimacyStr + '" REFUSED — ' + refusedByKey + '\'s crossing PhysicalRequest was ' + crossingNow[refusedByKey] + ' (she refused)');
    } else if (intimacyStr && isLatchEnter) {
      // A panel showing means the scene was open before the narrator wrote (output.txt H-LATCH GATE: /Intent/hact, never
      // "enter"). The enter opens nothing; the act a reply under the panel reports is what it can lose.
      if (hactSnap.isIntimacyPanelShown) {
        warnRes('INTIMACY ENTER ON AN OPEN SCENE — the ## INTIMACY panel was showing this reply, so the H scene was open before ' +
                'the narrator wrote and "enter" has nothing to open. A reply under the panel reports its act as /Intent/hact (output.txt H-LATCH GATE)');
        log.push('intimacy "' + intimacyStr + '" opened nothing — the scene was already open when this reply began');
      }
      if (latchKey) joinNamedInH('intimacy', latchKey);
      else if (!Object.keys(CM).some((k) => CM[k] && typeof CM[k] === 'object' && get(CM[k].Is_present, false) === true)) {
        warnRes('H SCENE ARMED WITH NOBODY PRESENT — /Intent/intimacy "' + intimacyStr + '" names no heroine and none ' +
                'is present: whoever the prose is with, her arrival was never reported (/Intent/arrive). Latch armed ' +
                'as written, presence NOT changed.');
        log.push('⚠ intimacy enter with nobody present (arrival unreported)');
      }
      applyIntimacyLatch(statData, intimacyStr, log);
    }
    let agreedAct = '';
    if (hactStr) {
      const hactKey = hactStr.split(';')[0].trim();
      joinNamedInH('hact', hactKey);
      if (get(PendingState.IntimacyActive) === true) {
        // THE DICE ARE HER CONSENT. Their verdict on her act is stamped "<turn>|<Key>|<Act>|agreed|declined" for this
        // reply's relay, which drops a POST conflict on her either way (applyRelationshipItems). An act that PROCEEDED
        // also ends a fight she was already in: a girl who agrees to an H act is not fighting him.
        const hCountBefore = Number(get((CM[hactKey] || {}).H_Count, 0)) || 0;
        const hactVerdict = applyHact(statData, hactStr, log, ctx, hactSnap);
        if (!(hactVerdict && hactVerdict.dropped)) countSubmissionBeat(statData, hactKey, hactStr, hactSnap, hCountBefore, log);
        if (hactVerdict && !hactVerdict.dropped) {
          setVal(PendingState, 'HActVerdict', (turnKey || '') + '|' + hactKey + '|' + hactVerdict.act + '|' + (hactVerdict.isAgreed ? 'agreed' : 'declined'));
          const girl = CM[hactKey];
          if (hactVerdict.isAgreed) agreedAct = hactVerdict.act;
          if (agreedAct && girl && get(girl.ConflictActive) === true) {
            setVal(girl, 'ConflictActive', false);
            log.push(hactKey + ' CONFLICT cleared — she agreed to ' + agreedAct + ' this reply (the dice are her consent; a girl who agrees to an H act is not in a fight)');
          }
        }
      } else log.push('hact ignored (IntimacyActive is false — emit /Intent/intimacy "enter" first): ' + hactStr);
    }
    // HER WON PhysicalRequest WAS THE ROLL ON HER ACTS this reply (hactGateOwed), and an act lands only through /Intent/hact:
    // with no hact naming her, nothing the prose did to her reached her state. A hact on a key that is no Classmate Key
    // is warned as that (joinNamedInH), its cause, and not again here.
    if (hactSnap.isIntimacyPanelShown && (!hactKeyNow || isClassmateKey(hactKeyNow))) {
      for (const k of Object.keys(hactSnap.girls)) {
        if (!hactSnap.girls[k].isCrossingWon || k === hactKeyNow) continue;
        warnRes('NO H ACT REPORTED ON ' + k + ' — her won PhysicalRequest was the roll on her acts this reply and the ## INTIMACY ' +
                'panel showed, but no /Intent/hact names her: what the prose did to her did not land (Exp, Arousal and Meter unchanged)');
        log.push('⚠ no /Intent/hact on ' + k + ' after her won PhysicalRequest — no act landed on her this reply');
      }
    }
    if (intimacyStr && !isLatchEnter) {
      if (HSEX.indexOf(agreedAct) >= 0) {
        log.push('intimacy "' + intimacyStr + '" REFUSED — a ' + agreedAct + ' act ran this reply, so the sex is still going on; '
          + 'a climax or ejaculation is one round, not an end. The scene stays open until {{user}} moves away from the sex.');
      } else applyIntimacyLatch(statData, intimacyStr, log);
    }

    // (2i-end) THE ENGINE ENDS AN H SCENE ON FACTS — narrate's "exit" (above) is the one judgment; these cannot be wrong.
    // No prose beat is read as an end: a location report or a mundane beat can happen inside a scene.
    //   • HE IS SPENT — a SEX act ran this reply and left MainChar's energy at 0, so there is nothing left to play.
    //     Energy carries over between scenes, so the reply's own act is the test, never his energy alone: a scene he
    //     starts at 0 still gets its free foreplay, and its first sex act is its last.
    // The clock's ends (the day or block moved on) need the drift, so they wait for (3i). SHE LEFT waits for the relay:
    // POST reports who is with him when the reply ends, and leaveScene gives each girl who left her scene-break.
    if (get(PendingState.IntimacyActive) === true && HSEX.indexOf(agreedAct) >= 0
        && (Number(get((statData.Mainchar || {}).Energy_curr, 100)) || 0) <= 0) {
      endIntimacyScene(statData, 'his energy is spent', log);
    }

    // NEGLECT cue consume — the Window A of the reply AFTER the sweep showed it; this resolve retires it
    // (a sweep in THIS resolve's day-roll below re-sets it, so the cue always survives exactly one reply).
    if (String(get(EngineDerived.NeglectFired, ''))) setVal(EngineDerived, 'NeglectFired', '');
    // TIME-JUMP cue consume — same one-reply lifecycle (a break-JUMP in THIS resolve's day-roll below re-sets it).
    if (String(get(EngineDerived.JumpedFrom, ''))) setVal(EngineDerived, 'JumpedFrom', '');

    // (3) TIME / DAY ADVANCE — GAME-TIME MODEL -------------------------------------
    // World.* is the scene's civil clock, prose-driven via /Intent/sceneClock. The game steers by
    // EngineDerived.DayDate + the derived band (civilToGame). SCHOOL day = bands 0-3 with a BLOCK CAP
    // (Sta÷10, min 3) that AUTO-advances: the reply that reaches the cap is the block's last, and its end
    // moves the clock when its own prose did not; OPEN day = uncapped — the day ends via /Intent/sceneAdvance /
    // Next-Block, or the daysOwed catch-up below when the prose has already crossed the 07:30 game boundary.
    const mode = String(get(EngineDerived.Mode, 'SCHOOL'));
    const freeClock = (mode === 'OPEN');
    const sta = Number(get((statData.Mainchar || {}).Sta, 30)) || 30;
    const blockCap = Math.max(3, Math.floor(sta / 10));
    const sessBefore = Number(get(EngineDerived.BlockReplyCount, 0)) || 0;
    let sess = sessBefore + 1;
    // Set by (3a) when the reply turns out to have narrated the block the game already LEFT. It is the
    // civil minute that prose actually ended at; the caption renders it so the reader sees where the
    // WRITTEN scene ended while the cursor holds (transient — this resolve only, no stored field).
    let staleReportMin = null;
    // (3a) CLOCK DRIFT — applied BEFORE any advance decision. The model TRANSCRIBES the civil clock its
    // prose ended at (/Intent/sceneClock "HH:MM", 00:00-23:59) and the code derives the movement. A
    // report EARLIER than the current civil clock is ONE crossed midnight (a clock, not a date — one
    // reply can never cross two) WHEN the reply also reports /Intent/pastMidnight — UNLESS it is the stale
    // echo of the block the game already left, which the GAME-coordinate compare identifies: a genuine
    // small-hours crossing lands LATER in game time than the evening cursor, a stale daytime echo lands
    // EARLIER. Without pastMidnight an earlier report is a SLIP of the prose's clock and is DROPPED: the
    // clock alone cannot tell them apart — 00:30 → "00:20" is the next night on a montage reply and
    // 08:12 → "08:10" a slip (staging rolled a Saturday into Sunday on it), and only the prose knows which.
    // Invalid input is DROPPED loudly. The clock never rewinds.
    let isMidnightCrossed = false;
    const curDateIso = String(get(W.Date, '2026-04-08')).slice(0, 10);
    const gBefore = civilToGame(curDateIso, String(get(W.Time, SCHOOL_BLOCKS[0]))) || { gameDate: curDateIso, gameMin: 0, band: 0 };
    if (hasSceneClock) {
      const targetMin = timeToMin(sceneClockRaw);
      if (targetMin == null || targetMin >= 1440) {
        warnRes('SCENE CLOCK INVALID — /Intent/sceneClock "' + sceneClockRaw + '" (want civil "HH:MM" 00:00-23:59). DROPPED, clock unchanged');
        log.push('⚠ sceneClock DROPPED (invalid): ' + sceneClockRaw);
      } else {
        const curMinRaw = timeToMin(String(get(W.Time, SCHOOL_BLOCKS[0])));
        if (curMinRaw == null) warnRes('CLOCK UNREADABLE — World.Time "' + get(W.Time, '') + '" is not HH:MM; drifting from ' + SCHOOL_BLOCKS[0] + ' instead');
        const curMin = curMinRaw == null ? BLOCK_MINS[0] : curMinRaw;
        if (targetMin === curMin) {
          log.push('sceneClock ' + sceneClockRaw + ' = current clock — no drift');
        } else if (targetMin > curMin) {
          setVal(W, 'Time', minToTime(targetMin));
          log.push('clock ' + minToTime(curMin) + ' -> +' + (targetMin - curMin) + 'min -> ' + sceneClockRaw);
        } else {
          // Report BEHIND the civil cursor. The stale case: the cursor sits EXACTLY on a block start
          // with no reply played in that block yet (BlockReplyCount 0 — an advance put it there, or the
          // last reply's own clock ended on it) AND the report lands EARLIER in GAME time (a daytime echo,
          // not the small hours). Reading that as a crossing would fabricate a whole civil day.
          const onFreshBlockStart = !freeClock && sessBefore === 0 && gBefore.band < 4 && curMin === BLOCK_MINS[gBefore.band];
          if (onFreshBlockStart && gameMinOf(targetMin) < gBefore.gameMin) {
            // This reply did not play the new block: budget not spent (below), caption shows where the
            // prose ACTUALLY ended, cursor holds, and IsClockAheadOfProse keeps its value — a handover
            // this reply ignored is still owed and fires again next reply.
            staleReportMin = targetMin;
            const handoverOwed = get(EngineDerived.IsClockAheadOfProse, false) === true;
            warnRes('SCENE CLOCK BEHIND THE CURSOR — /Intent/sceneClock "' + sceneClockRaw + '" is earlier than World.Time '
              + minToTime(curMin) + ', where the last reply left it. This reply narrated the PREVIOUS block instead of'
              + ' playing on in this one. DROPPED, clock held at ' + minToTime(curMin) + ' (reading it as a midnight crossing'
              + ' would fabricate a civil day). Budget not spent.'
              + (handoverOwed ? ' The handover cue fires again next reply; if it repeats, the cue is not reaching the narrator — check <Block_Transition>' : ''));
            log.push('⚠ sceneClock DROPPED (behind the cursor — prose stayed in the previous block, budget NOT spent): ' + sceneClockRaw);
          } else if (!isPastMidnightReported) {
            // A SLIP, not a night: the reply played this block, so it counts for it; only its clock is refused.
            warnRes('SCENE CLOCK BEHIND THE CLOCK — /Intent/sceneClock "' + sceneClockRaw + '" is earlier than World.Time '
              + minToTime(curMin) + ' and the reply sent no /Intent/pastMidnight, so no night passed: the prose\'s clock'
              + ' slipped back. DROPPED, clock held at ' + minToTime(curMin) + ', no day rolled. The reply still counts for this block.');
            log.push('⚠ sceneClock DROPPED (behind the clock with no pastMidnight — a slip, not a night): ' + sceneClockRaw);
          } else {
            // ONE civil midnight crossed. LOUD ON PURPOSE: a fabricated crossing is PERMANENT (the clock
            // never rewinds), so the inference must never be silent.
            const landedIso = addIso(curDateIso, 1);
            setCivilDate(W, landedIso);
            setVal(W, 'Time', minToTime(targetMin));
            isMidnightCrossed = true;
            log.push('⚠ MIDNIGHT CROSSED (pastMidnight) — sceneClock ' + sceneClockRaw + ' < ' + minToTime(curMin) + ': civil date ' + curDateIso + ' -> ' + landedIso + ', clock ' + sceneClockRaw);
          }
        }
      }
    }
    if (isPastMidnightReported && !isMidnightCrossed) {
      warnRes('PAST MIDNIGHT IGNORED — /Intent/pastMidnight came with ' + (hasSceneClock
        ? 'a /Intent/sceneClock "' + sceneClockRaw + '" that rolled no date' : 'no /Intent/sceneClock')
        + '. A night is crossed by a clock earlier than the current one, sent beside it; nothing rolled');
      log.push('⚠ pastMidnight IGNORED (no clock crossed midnight beside it)');
    }
    // (3p) CLOCK PARKING (ClocklessStreak) — a narrate that stops reporting sceneClock freezes the civil
    // clock, so daysOwed never accrues and an OPEN day can never end — silently, since every other guard
    // keys off a REPORTED time. Count consecutive clockless resolves; warn, never act.
    if (hasSceneClock) {
      if (Number(get(EngineDerived.ClocklessStreak, 0))) setVal(EngineDerived, 'ClocklessStreak', 0);
    } else {
      const streak = (Number(get(EngineDerived.ClocklessStreak, 0)) || 0) + 1;
      setVal(EngineDerived, 'ClocklessStreak', streak);
      if (streak >= 3) warnRes('CLOCK PARKED — ' + streak + ' replies with no /Intent/sceneClock; World.Time frozen at '
        + get(W.Time, '') + '. No midnight can be inferred and an OPEN day can never end without a clock report.'
        + ' Check Window A reaches the narrator; the player escape is the Next-Block button');
    }
    // (3b) a drift that CROSSED a band boundary starts a fresh band at 0, on EVERY mode: the crossing
    // reply spent its prose in the band it left and only ENDS in this one, so the new band has its whole
    // budget ahead of it. On SCHOOL that is the reply budget (and the cap below must not fire on top of a
    // crossing that already advanced us); on OPEN nothing is capped, but the count still means "replies
    // played in THIS band". (The beat pointer's STEP reads the LastStepDone cursor, never this count.)
    // Crossing INTO band 4 is NOT a new band (the evening scene just ran past midnight).
    const gAfterDrift = civilToGame(String(get(W.Date, '')).slice(0, 10), String(get(W.Time, SCHOOL_BLOCKS[0]))) || gBefore;
    // Where this reply's prose ended. (3q) compares the final clock against it: any difference is an
    // advance the prose never reached.
    const proseClock = String(get(W.Date, '')).slice(0, 10) + ' ' + String(get(W.Time, ''));
    if (staleReportMin == null && gAfterDrift.band !== gBefore.band && gAfterDrift.band !== 4) {
      sess = 0;
      log.push('clock crossed band ' + gBefore.band + ' -> ' + gAfterDrift.band + ' (band reply count reset to 0 — this reply played its way in)');
    }
    // A reply that narrated the block we already LEFT did not play THIS block, so it does not spend one
    // of its replies. Left counting, the block cap would advance again off scenes that never happened.
    if (staleReportMin != null) { sess = sessBefore; log.push('block reply NOT counted — this reply played the previous block'); }
    // (3b1) THE LAST REPLY OF A BLOCK STEPS ONCE. On the reply that reaches a SCHOOL block's cap, <Block_Transition>
    // has the prose close the scene, skip to the next block and END there — the conditions below are that order's
    // own (the band and reply count this reply began on, no H scene, no Next-Block pending). A sceneClock past the
    // block start therefore IS the step the order asked for; a sceneAdvance sent with it would step a second
    // time, onto a block nobody played. Dropped, and the clock alone stands: the reply opens the new block as its
    // first. Everywhere else both channels apply as sent — a mid-block reply that plays to 19:30 and sends
    // sceneAdvance still ends the day.
    const isLastReplyOfBlock = !freeClock && gBefore.band <= 2 && sessBefore + 1 >= blockCap && !blockDoneReq
      && get((__before.PendingState || {}).IntimacyActive) !== true;
    const isClockIntoLaterBand = staleReportMin == null && gAfterDrift.gameDate === gBefore.gameDate
      && gAfterDrift.band > gBefore.band && gAfterDrift.band !== 4;
    const isSceneAdvanceDropped = wantsAdvanceIntent && isLastReplyOfBlock && isClockIntoLaterBand;
    const isSceneAdvanceTaken = wantsAdvanceIntent && !isSceneAdvanceDropped;
    if (isSceneAdvanceDropped) {
      warnRes('SCENE ADVANCE DROPPED — the last reply of band ' + gBefore.band + ' reported /Intent/sceneClock "' + sceneClockRaw
        + '", which already moved it into band ' + gAfterDrift.band + '; the sceneAdvance sent with it would skip that band unplayed.'
        + ' Clock kept at ' + get(W.Time, '') + '. On a block\'s last reply the clock IS the step — send sceneClock alone');
      log.push('⚠ sceneAdvance DROPPED (the last reply of band ' + gBefore.band + ' already crossed into band ' + gAfterDrift.band + ' by its own clock)');
    }
    // (3b2) STEP CURSOR — the spine step narrate declared finished. AFTER the drift so the ahead-guard
    // judges against the FINAL band; BEFORE the daysOwed settle so a report on a dying day is stored
    // into that day and cleared with it (never leaked onto the landed one). Band 4 accepts reports
    // (the evening's last steps often land past midnight); the pointer shows no step there anyway.
    // THE STEP NARRATE WAS SHOWN — the signpost receipt Window A's ## DAY OBJECTIVE named when this reply
    // was written (signpostStepOf: the live step, the next band's first step once this band is played out,
    // or 'end'), read off the cursor and the band it rendered from, BEFORE this reply's own report moves
    // the one and its clock moves the other. TWO things are judged against it: the step echo (so narrate
    // is checked against the instruction it was actually given) and the objective cursor (which records
    // the beat the objective DESCRIBES, so Window A can see it go stale).
    const shownStep = signpostStepOf(statData, gBefore.band, get(EngineDerived.LastStepDone, ''));
    if (stepDoneStr) {
      const movedCursor = applyStepDone(statData, stepDoneStr, gAfterDrift.band, log);
      if (movedCursor) log.push('step cursor moved -> ' + String(get(EngineDerived.LastStepDone, '')));
    }
    // (3b2a) A BAND LEFT UNPLAYED — the clock moved on, inside the same game day, from a band whose declared steps
    // were not all reported. Its steps are never shown again (the pointer follows the clock) and the day's
    // "complete:" will be refused. Judged after this reply's own report, so a band played out on the reply that
    // leaves it is not flagged. Observed, never repaired.
    if (staleReportMin == null && gAfterDrift.gameDate === gBefore.gameDate && gAfterDrift.band > gBefore.band && gAfterDrift.band !== 4) {
      const counts = spineStepCounts(statData);
      const done = counts ? spineBandsDone(statData, counts) : null;
      for (let b = gBefore.band; counts && b < gAfterDrift.band; b++) {
        if (!(counts[b] > 0) || done.has(b)) continue;
        const msg = 'BAND ' + b + ' LEFT UNPLAYED — the clock moved on to band ' + gAfterDrift.band + ' before steps ' + b + '.1-' + b + '.' +
          counts[b] + ' of ' + String(get(EngineDerived.DaySpine, '')) + ' were all reported (cursor ' +
          (String(get(EngineDerived.LastStepDone, '')) || 'unset') + '). They are not shown again, and the day will not accept "complete:".';
        warnRes(msg);
        log.push('⚠ ' + msg);
      }
    }
    // STEP-ECHO CROSS-CHECK — narrate opens the objective with the number of the spine step it read to
    // word it (the echo), and Window A decides which step that must be:
    //   • the step it was SHOWN — the objective is blank, stale, or describes a step still being played;
    //   • the NEXT step — on the reply that plays the shown step out, so {{user}} reads his next goal the
    //     moment the reply lands instead of one reply later. Window A asks for exactly that, and the step
    //     report on the same patch is what says the shown step was played out.
    // So the echo fits when it names the shown step, or — only when this reply's report reached the
    // shown step — the receipt that follows it, or the one this reply leaves live (a report that closed
    // more than one step, or a clock that crossed into the next band). Both are signpost receipts, so a
    // played-out band hands on to the next band's first step or 'end', never to a step it does not declare.
    // Anything else points the player's signpost at a beat behind him or one he has not reached. Reported,
    // never repaired: the engine cannot know what the right sentence would be. Judged in the band Window A
    // RENDERED in, never the one this reply's clock reaches — the prompt was built before the prose moved it.
    let describedStep = shownStep;
    {
      const spKeyEcho = daySpineKey(statData);
      const spRecEcho = spKeyEcho ? ((statData.Mainchar || {}).Quests || {})[spKeyEcho] : null;
      if (questStepEcho && spRecEcho) {
        const cursorNow = String(get(EngineDerived.LastStepDone, ''));
        const playedShown = stepReached(cursorNow, shownStep);
        const nextStep = signpostStepAfter(statData, shownStep);
        const leftLive = signpostStepOf(statData, gAfterDrift.band, cursorNow);
        if (questStepEcho === shownStep) {
          log.push('signpost objective written for step ' + questStepEcho + ' (the step it was shown)');
        } else if (playedShown && (questStepEcho === nextStep || questStepEcho === leftLive)) {
          describedStep = questStepEcho;
          log.push('signpost objective written for step ' + questStepEcho + ' (' + (questStepEcho === nextStep ? 'the next step' : 'the step this reply leaves live') + ': this reply played ' + shownStep + ' out)');
        } else {
          const fits = shownStep === 'end'
            ? '"end" (no later band declares a step: the objective words the day winding down)'
            : playedShown
            ? shownStep + ' or, since this reply played it out, ' + (nextStep === leftLive ? nextStep : nextStep + ' or ' + leftLive)
            : shownStep + ' (this reply did not report it played)';
          const msg = 'SIGNPOST STEP MISMATCH: the objective was written for step ' + questStepEcho + ' but the step shown was ' + shownStep + ', so it should name ' + fits + ' — "' + String(get(spRecEcho.Objective, '')) + '" points at the wrong beat';
          log.push(msg);
          warnRes(msg);
        }
      }
    }
    // (3b3) OBJECTIVE CURSOR — which step the signpost objective currently DESCRIBES: the echo when it
    // fit (the check above), otherwise the step narrate was SHOWN. Window A compares it against the signpost
    // receipt and ORDERS a rewrite when they part, so an objective that trails the cursor is rewritten on
    // the next reply. It trails when narrate wrote the shown step and played it out in the same reply,
    // or missed the same-reply rewrite — one reply late, never lost. Stamping the step left live instead
    // would make a trailing objective read as current, and nothing would ever ask for the rewrite.
    {
      const spKeyNow = daySpineKey(statData);
      const objNow = spKeyNow ? String(get((((statData.Mainchar || {}).Quests || {})[spKeyNow] || {}).Objective, '')) : '';
      if (objNow && objNow !== _objBefore) {
        setVal(EngineDerived, 'ObjectiveStep', describedStep);
        log.push('objective cursor -> ' + describedStep);
      }
    }
    // How many game-days the prose has left behind (a time skip, a night past 07:30, a hand-edited date). Read
    // BEFORE (3i): an explicit advance on such a reply closes the day the prose LEFT (the catch-up in (3o)), not
    // today's scene, so it must not end an H scene that is still running.
    const owedAtResolve = daysBetween(String(get(EngineDerived.DayDate, '')).slice(0, 10), gAfterDrift.gameDate);
    const advanceClosesPastDay = owedAtResolve >= 1 && (isSceneAdvanceTaken || blockDoneReq);
    // (3n) THE DAY SIGNPOST's "complete:" — held from the quest stage until this reply's stepDone had moved the
    // cursor, and settled before the catch-up below closes the day. It lands only when the day's spine is really
    // finished: every declared step reported, or the day is over — the prose has already left it, or this reply's
    // own advance rolls it (previewNextBlock, the same pure read of the advance math Window A uses). Otherwise it
    // is refused and the signpost stays open — narrate may still add beats of its own, and the day's end closes it.
    if (questResult.spineComplete) {
      const dayEnds = owedAtResolve >= 1 || ((isSceneAdvanceTaken || blockDoneReq) && (previewNextBlock(statData) || {}).dayRoll === true);
      const why = dayEnds ? '' : spineUnfinished(statData);
      if (why) {
        warnRes('DAY SPINE NOT FINISHED — "complete:' + questResult.spineComplete + '" REFUSED: ' + why +
          '. The day signpost stays open; it can complete once every declared step is reported, and the day\'s end closes it regardless.');
        log.push('⚠ quest complete REFUSED (day spine not finished): ' + questResult.spineComplete + ' — ' + why);
      } else completeQuest(statData, questResult.spineComplete, log);
    }
    // (3i) THE CLOCK ENDS AN H SCENE — before the advance below, so the scene-break lands on the heroines of the scene.
    //   • an EXPLICIT advance (sceneAdvance — he slept, or the day was ended — or the player's Next-Block) moves the
    //     story past the scene.
    //   • the clock crossed into another block with NO act this reply: the story jumped ahead. A reply still playing an
    //     act across a boundary (15:50 → 16:05) is the same scene running on, and keeps it.
    if (get(PendingState.IntimacyActive) === true) {
      if ((isSceneAdvanceTaken || blockDoneReq) && !advanceClosesPastDay) {
        endIntimacyScene(statData, blockDoneReq ? 'the player pressed Next-Block' : 'narrate advanced the story (sceneAdvance)', log);
      } else if (staleReportMin == null && gAfterDrift.band !== gBefore.band && !hactStr) {
        endIntimacyScene(statData, 'the clock moved to another block with no act this reply', log);
      }
    }
    // INTIMACY PROTECTION (story_analysis step 2 · Cluster 5): while the H latch is on, the SCHOOL block-cap
    // AUTO-advance is SUSPENDED. An EXPLICIT advance (narrator sceneAdvance after the exit beat, or the player's
    // Next-Block button) still works; only the silent move is held.
    const hLatched = get(PendingState.IntimacyActive) === true;
    // (3o) daysOwed — THE CATCH-UP. daysOwed = gameDate(World.*) - DayDate: how many game-days the prose is AHEAD
    // of the settled day. The prose is the truth, so every owed day closes in THIS reply through settleDay — the
    // same close an evening advance runs, so paydays, the neglect sweep, the day's spine expiry, quest cleanup and
    // calendar break jumps all happen for the days the prose skipped. Counted in GAME days, so staying up past
    // midnight owes nothing until civil 07:30. Nothing is ordered from narrate: it cannot close a day its prose has
    // already left, and the retired order made it send sceneAdvance, which on a SCHOOL day only stepped TODAY's
    // clock one block and never closed the owed day.
    //   · a daySwing on this reply pays the FIRST day closed — the day the prose was playing. A DATEOUT day needs
    //     none: it pays itself whichever close reaches it (payDateOut).
    //   · an explicit advance on this reply is SPENT on that first close (it ended the day the prose left), so
    //     today is not closed a second time.
    //   · @Graduation stops the loop: the arc reset comes from prose only. Reached with the reply's own advance it
    //     closes like any day; otherwise it keeps its ORDER until narrate sends sceneAdvance.
    let owed = owedAtResolve;
    let catchUpSwing = swingStr;
    let advanceUnspent = isSceneAdvanceTaken || blockDoneReq;
    let daysClosed = 0;
    while (owed >= 1) {
      const dayDateNow = String(get(EngineDerived.DayDate, '')).slice(0, 10);
      const rowNow = lookupDay(dayDateNow);
      const isGraduation = !!(rowNow && rowNow.spine === '@Graduation');
      if (isGraduation && !advanceUnspent) {
        if (String(get(PendingState.DayEndOrderedFor, '')) !== dayDateNow) setVal(PendingState, 'DayEndOrderedFor', dayDateNow);
        log.push('DAY OWED ' + owed + ' — @Graduation: ORDER only, re-fires until narrate emits sceneAdvance (an arc reset never fires off a reported clock)');
        break;
      }
      const tierNow = String(get(EngineDerived.DayCheck, '')).trim();
      if (!catchUpSwing && isSwingNamedByNarrate(tierNow)) log.push('day ' + dayDateNow + ' closes with no daySwing — its ' + tierNow + ' payout is forfeited');
      log.push('DAY OWED ' + owed + ' — the prose has left ' + dayDateNow + ' behind; closing it now');
      settleDay(statData, catchUpSwing, log);
      catchUpSwing = '';
      advanceUnspent = false;
      daysClosed++;
      if (isGraduation) break;                                   // the TIME-LEAP rewound the arc; nothing is owed
      const dayDateAfter = String(get(EngineDerived.DayDate, '')).slice(0, 10);
      if (dayDateAfter <= dayDateNow) {                          // settleDay always moves DayDate forward
        warnRes('DAY CATCH-UP STALLED — closing ' + dayDateNow + ' left DayDate at ' + dayDateAfter + '; the remaining owed days stay open');
        break;
      }
      const gNow = civilToGame(String(get(W.Date, '')).slice(0, 10), String(get(W.Time, SCHOOL_BLOCKS[0]))) || gAfterDrift;
      owed = daysBetween(dayDateAfter, gNow.gameDate);
    }
    if (daysClosed) sess = 0;
    const advanceSpent = daysClosed > 0 && (isSceneAdvanceTaken || blockDoneReq);
    // BlockDone (manual Next-Block) forces an advance just like sceneAdvance — a SCHOOL day steps a band
    // (or day-rolls from the evening), an OPEN day rolls the day. It obeys the same clock.
    const capAdvance = !freeClock && sess >= blockCap && !hLatched;
    if (!freeClock && sess >= blockCap && hLatched && !isSceneAdvanceTaken && !blockDoneReq) log.push('block-cap HELD (IntimacyActive — the H scene runs; cap resumes on exit)');
    const wantsAdvance = !advanceSpent && (isSceneAdvanceTaken || blockDoneReq || capAdvance);
    if (wantsAdvance) {
      if (blockDoneReq) log.push('Next-Block (manual GUI toggle) → consuming BlockDone');
      // (3c) EXPLICIT ADVANCE — the band is DERIVED from the live clock. Bands 0-2 step to the next
      // block start (always ahead of the clock, so this never rewinds); band 3/4 or any OPEN day ends
      // the game-day via settleDay (the ONE roll path: swing, calendar, jump/TIME-LEAP, payday, sweep).
      const gAdv = civilToGame(String(get(W.Date, '')).slice(0, 10), String(get(W.Time, SCHOOL_BLOCKS[0]))) || gAfterDrift;
      if (!freeClock && gAdv.band < 3) {
        setVal(W, 'Time', SCHOOL_BLOCKS[gAdv.band + 1]);
        log.push('block advance -> ' + SCHOOL_BLOCKS[gAdv.band + 1] + ' (' + (blockDoneReq ? 'Next-Block' : isSceneAdvanceTaken ? 'sceneAdvance' : 'block cap ' + sess + '/' + blockCap) + ')');
      } else {
        // ⚠ THE CAP CAN END A DAY NARRATE DID NOT MEAN TO END, and on a SCHOOL day carrying a swing tier
        // that silently costs the player the day's whole payout. The other two roll paths cannot do this:
        // sceneAdvance and Next-Block are DELIBERATE (narrate attaches the swing to the same patch), and
        // the daysOwed catch-up logs every payout it forfeits. Only the cap arrives unannounced.
        // Unreachable until 2026-09-20, when @Exams moved from EVENT to SCHOOL. THREE calendar days are
        // capped AND carry a CHECK: @Exams (ACADEMIC), and 2/14 and 3/14 in the years they land on a
        // weekday (BONDING) — a weekend 2/14 stays OPEN and can never reach here. Verify-only, like every other
        // loss this engine reports: inventing a girl to pay would be worse than saying nothing was paid.
        const capOnly = capAdvance && !isSceneAdvanceTaken && !blockDoneReq;
        const tierNow = String(get(EngineDerived.DayCheck, '')).trim();
        if (capOnly && isSwingNamedByNarrate(tierNow) && !swingStr) {
          warnRes('DAY ENDED ON THE BLOCK CAP — ' + String(get(EngineDerived.DayDate, '')).slice(0, 10) + ' carried the ' +
                  tierNow + ' day-check and narrate never sent /Intent/daySwing, so the payout is FORFEITED. The cap ends ' +
                  'the last band whether or not the prose meant to close the day; on a day that pays, the swing has to ride ' +
                  'the reply the cap lands on. Window A prints that warning from the last band onward');
          log.push('⚠ DAY-END ON CAP — ' + tierNow + ' swing FORFEITED (no daySwing on the reply the cap rolled the day)');
        }
        settleDay(statData, swingStr, log);
      }
      sess = 0;
    }
    setVal(EngineDerived, 'BlockReplyCount', sess);   // counts on OPEN days too — the status row reads it live
    // (3q) HANDOVER FLAG — did an advance above (block cap, sceneAdvance, Next-Block, a day settle, a calendar
    // jump or the TIME-LEAP) leave the clock somewhere this reply's prose never reached? Then the next reply
    // must OPEN there: <Block_Transition> orders the handover and PRE deals no dice. A reply whose own clock
    // carried it into the new block played its way in and owes no handover. A stale report leaves the flag
    // as it was (see (3a)).
    if (staleReportMin == null) {
      const clockNow = String(get(W.Date, '')).slice(0, 10) + ' ' + String(get(W.Time, ''));
      setVal(EngineDerived, 'IsClockAheadOfProse', clockNow !== proseClock);
      if (clockNow !== proseClock) log.push('clock ahead of the prose (' + proseClock + ' -> ' + clockNow + ') — next reply opens there');
    }
    if (blockDoneReq) setVal(PendingState, 'BlockDone', false);             // one-shot: consume the manual Next-Block request
    syncWeather(statData, log);                                             // every clock write is behind this line

    // (4) STAMP last-seen for present heroines -------------------------------------
    const stamp = String(get(W.Date, '')) + ' ' + String(get(W.Time, ''));
    for (const k of Object.keys(CM)) {
      const c = CM[k];
      if (c && typeof c === 'object' && get(c.Is_present, false) === true) setVal(c, 'TimeSinceLastSeen', stamp);
    }

    // DAY SIGNPOST (quest-revisit B1) — seeded AFTER every advance/settle path above, so the record
    // always belongs to the day this reply ENDS on (a settle deletes the old day's, this seeds the new).
    // The TWIN of the pre-applyQuest call: that one guarantees narrate's op has a record to land on,
    // this one covers the day that rolled mid-reply. Idempotent, so whichever fires first wins and the
    // other is a no-op.
    ensureDaySignpost(statData, log);
    ensureTripQuest(statData, log);

    // (4b) EVENT SCAN (event_schedule · Cluster 6C) — arm the fire-one winner for the NEXT reply, reading the final
    // post-advance state (time/date/mode/location just settled above). Skipped when an event fired THIS reply so a
    // chained series step (e.g. leila_1 → leila_2, same venue) waits one reply instead of arming instantly. Who left
    // the scene is settled after this, at the relay, which clears an armed event that no longer holds (disarmStaleEvent).
    if (!firedThisTurn) scanEvents(statData, log);
    if (!alreadyResolved) noteSameRoundMiss(statData, ctx, log, firedThisTurn ? fireKey : '', fireKey);
    if (!alreadyResolved) noteArmedLost(statData, __before, log, firedThisTurn ? fireKey : '', fireKey);
    // The series quest cards (NextUnlock, a missing Desc), read off the same final state the scan just read.
    refreshSeriesQuestCards(statData, log);

    // (5) CLEAR Intent — THIS is the idempotency mechanism (re-fires now see empty Intent → no-op) -----
    setVal(I, 'check', '');
    setVal(I, 'mundane', '');
    setVal(I, 'relationship', '');
    setVal(I, 'fwb', '');
    setVal(I, 'puppy', '');
    setVal(I, 'dayCheck', '');
    setVal(I, 'training', '');
    setVal(I, 'initiative', '');
    setVal(I, 'location', '');
    setVal(I, 'arrive', '');
    setVal(I, 'presentAtEnd', '');
    setVal(I, 'daySwing', '');
    setVal(I, 'eventFire', '');
    setVal(I, 'recordEvent', '');
    setVal(I, 'recordNPC', '');
    setVal(I, 'money', '');
    setVal(I, 'friends', '');
    setVal(I, 'record', '');
    setVal(I, 'quest', '');
    setVal(I, 'intimacy', '');
    setVal(I, 'hact', '');
    setVal(I, 'sceneClock', '');
    setVal(I, 'stepDone', '');
    setVal(I, 'sceneAdvance', false);
    setVal(I, 'pastMidnight', false);
    // STAMP resolvedFor: mark this (msg,swipe) resolved so a re-applied Intent can't re-run the math (see guard above).
    // Excluded from the <RES_Variable> diff (diffOps skips the whole /Intent namespace), so it never shows in the audit.
    if (turnKey) setVal(I, 'resolvedFor', turnKey);

    const leadText = renderLeadText(statData, staleReportMin);
    log.push('caption ' + leadText.split('\n')[0]);
    return { statData, applied: true, log, resBlock: buildResBlock(__before, statData), leadText };
  }

  // SHE LEFT — the one path out of the scene, whoever reports it: POST's end-of-reply report (settlePresence) or a
  // walk-off (applyRelationshipItems). Is_present goes false where she stands, and the next block's SCATTER re-places
  // her. In a running H scene each girl who left takes her scene-break (the act that landed on her this reply included
  // — applyHact never asks where she is), and when nobody stays the scene is over: it ends while they still count as
  // present, so the end's count names them. `cause` names the reporter in the log. Returns the Keys that left; a girl
  // already absent is not one.
  function leaveScene(statData, keys, cause, log) {
    const CM = statData.Classmate || {};
    const isPresent = (k) => CM[k] && typeof CM[k] === 'object' && get(CM[k].Is_present, false) === true;
    const left = keys.filter(isPresent);
    for (const k of left) log.push(k + ' left the scene (' + cause + ', Is_present -> false)');
    if (left.length && get((statData.PendingState || {}).IntimacyActive) === true) {
      if (Object.keys(CM).some((k) => isPresent(k) && !left.includes(k))) {
        for (const k of left) closeHeroineScene(statData, CM[k], log);
        log.push('INTIMACY scene-break for who left: ' + left.join(', '));
      } else endIntimacyScene(statData, 'everyone in the scene left', log);
    }
    for (const k of left) setVal(CM[k], 'Is_present', false);
    return left;
  }

  // PRESENCE AT THE END (POST 7c) — POST read the finished prose and named who is with MainChar when it ends ("none" =
  // nobody). That report decides who LEFT: every present heroine POST did not see leaves the scene here (leaveScene),
  // whether she walked out mid-reply or in its last line. Arrivals stay the narrator's (/Intent/arrive), applied at
  // RES1 where the scene move and a same-reply event need them, so a heroine POST saw who is not present changes
  // nothing and is warned about with both possible causes, because they need opposite fixes: the narrator did not
  // report the arrival, or POST misread the prose. Returns the classmates POST saw, for recordDayCompanions.
  function settlePresence(statData, reportStr, log) {
    const CM = statData.Classmate || {};
    const isMember = (k) => k !== '$meta' && k !== '$key' && k !== 'template' && CM[k] && typeof CM[k] === 'object';
    const reported = reportStr.toLowerCase() === 'none' ? [] : reportStr.split(',').map((k) => k.trim()).filter(Boolean);
    const unknown = reported.filter((k) => !isMember(k));
    const seen = reported.filter((k) => isMember(k));
    const present = Object.keys(CM).filter((k) => isMember(k) && get(CM[k].Is_present, false) === true);
    const missedArrivals = seen.filter((k) => !present.includes(k));
    if (unknown.length) log.push('presentAtEnd ignored (no such classmate): ' + unknown.join(', '));
    if (missedArrivals.length) {
      warnRes('PRESENCE MISMATCH (MISSED ARRIVAL) — POST saw ' + missedArrivals.join(', ') + ' with him when the reply ' +
              'ended, but Is_present=false. Either the narrator did not report /Intent/arrive, or POST misread the ' +
              'prose. Nothing changed.');
    }
    const left = leaveScene(statData, present.filter((k) => !seen.includes(k)), 'POST did not see her with him at the end', log);
    log.push('presence settled: POST saw [' + (seen.join(', ') || 'nobody') + '] · state had [' + (present.join(', ') || 'nobody') + ']' +
             (left.length ? ' — left: ' + left.join(', ') : '') + (missedArrivals.length ? ' — MISSED ARRIVAL' : ''));
    return seen;
  }

  // AN ARMED EVENT WHOSE GIRL LEFT AT THE RELAY — RES1's end-of-turn scan (4b) armed next reply's event while every
  // girl who left here still counted as present, and Window A delivers the armed event as it stands. So once someone
  // has left at the relay, an armed event that no longer wins the scan is cleared, never replaced: a reply that fired
  // an event leaves its chained step to the next reply's scan, which arms whatever holds then.
  function disarmStaleEvent(statData, leftKeys, log) {
    if (!EVENTPACK_API) return;                                   // events are off; scanEvents warns every reply
    const armed = EVENT_PACK_ADAPTER.getArmed(statData);
    if (!armed) return;
    const win = EVENTPACK_API.eligibleWinner(statData, EVENT_PACK_ADAPTER);
    if (win && '@' + win.key === armed) return;
    EVENT_PACK_ADAPTER.setArmed(statData, '');
    log.push('EVENT DISARMED ' + armed + ' — once ' + leftKeys.join(', ') + ' left the scene it is no longer the event the scan arms; the next scan arms whatever holds then');
  }

  // TODAY'S COMPANIONS — every classmate POST saw with him today and in how many replies, "Mana:21,Mitsuki:18", which
  // the date-out reads (payDateOut). POST's report, never the narrator's presence: it is read off the finished prose
  // every reply, so counting it asks nothing new of anyone. A reply POST saw nobody in counts nothing. A reply whose
  // prose ended before the clock the engine moved it to (IsClockAheadOfProse: a day closed under it) describes the
  // day before, so it counts nothing either. settleDay clears the record with the day.
  function recordDayCompanions(statData, seen, log) {
    if (!seen.length) return;
    const ED = statData.EngineDerived || (statData.EngineDerived = {});
    if (get(ED.IsClockAheadOfProse, false) === true) {
      log.push('companions not counted — this reply\'s prose ended before the clock moved on: ' + seen.join(', '));
      return;
    }
    const counts = parseDayCompanions(get(ED.DayCompanions, ''));
    for (const k of seen) counts[k] = (counts[k] || 0) + 1;
    const record = Object.keys(counts).map((k) => k + ':' + counts[k]).join(',');
    setVal(ED, 'DayCompanions', record);
    log.push('companions today: ' + record);
  }

  // ---- resolvePostRelay (PRE_Call_Revisit P7) — the POST-owned record channels' ONLY live apply path.
  //
  // WHY A SECOND ENTRY AND NOT A resolveTurn RE-RUN: mvu-helper's turn-runner DEDUPES the RES2 fire
  // (POST's Mvu.parseMessage relay) by turnKey — resolveTurn never runs on it, and MUST not: the host
  // cannot know an arbitrary engine's resolveTurn is re-entrant, and this one deliberately is not
  // (resolvedFor). The turn-runner instead feature-detects THIS export and calls it on exactly that
  // deduped fire. No export → the relay stays skipped and the intents resolve at the NEXT turn's RES1
  // — which is the pre-P7 armClassmate behaviour, kept readable in (A), not a fallback built here.
  //
  // THE ONCE-GUARD (postResolvedFor) mirrors resolvedFor and exists for the same enemy: POST's
  // <POSTUpdateVariable> block persists in the message text, so a stray re-parse can re-populate these
  // channels and re-fire the relay. Non-idempotent work (strain re-falls, LastInitiative re-stamps)
  // must not run twice for one (msg,swipe). ctx-less callers (unit tests) get a null turnKey → guard
  // inert, same convention as resolveTurn's.
  //
  // Scope is EXACTLY the §5.2b scope fence: armClassmate (idempotent, applied in the same reply) + relationship +
  // initiative + the presence report + a MainChar skill record (isSkillRecord), and the HActVerdict stamp RES1 left
  // for it. Every other channel a relay fire carries — a record of any other owner or bucket included — is LEFT IN
  // PLACE untouched: it is not this entry's to consume, and the next RES1 must still see it.
  function resolvePostRelay(statData, ctx) {
    ctx = ctx || {};
    const log = [];
    const I = statData.Intent || {};
    const PendingState = statData.PendingState || {};
    const turnKey = (ctx.mid != null) ? (String(ctx.mid) + ':' + (ctx.swipe != null ? ctx.swipe : 0)) : null;
    if (turnKey && String(get(I.postResolvedFor, '')) === turnKey) {
      return { statData, applied: false, log: ['post-relay already resolved for ' + turnKey], resBlock: '' };
    }
    const relStr = String(get(I.relationship, '')).trim();
    const initStr = String(get(I.initiative, '')).trim();
    const _relayArmKey = String(get(I.armClassmate, '')).trim();   // the KEY POST resolved, not a flag
    const armReq = !!_relayArmKey;
    const presentAtEndStr = String(get(I.presentAtEnd, '')).trim();
    const recordStr = String(get(I.record, '')).trim();
    const skillStr = isSkillRecord(recordStr) ? recordStr : '';
    if (recordStr && !skillStr) log.push('record "' + recordStr + '" left for the next RES1 — the relay applies only a MainChar skill record');
    if (!relStr && !initStr && !armReq && !presentAtEndStr && !skillStr) {
      return { statData, applied: false, log: ['no POST-owned intent pending (no presentAtEnd either — nobody leaves the scene on POST\'s report this reply)'].concat(log), resBlock: '' };
    }
    const __before = snapshot(statData);
    const CM = statData.Classmate || {};
    const presentKeys = () => Object.keys(CM).filter((k) => CM[k] && typeof CM[k] === 'object' && get(CM[k].Is_present, false) === true);
    const presentBefore = presentKeys();
    if (armReq) armBuildGate(statData, _relayArmKey, ctx, ', at the relay — same reply', log);   // same write + authority as resolveTurn's (A)
    // PendingState.HActVerdict "<turn>|<Key>|<Act>|agreed|declined" — RES1 stamped the dice's verdict on her H act.
    // Only this reply's stamp counts; consumed here either way.
    const verdictStamp = String(get(PendingState.HActVerdict, ''));
    const verdictParts = verdictStamp.split('|');
    const diceVerdict = (verdictStamp && verdictParts[0] === (turnKey || ''))
      ? { key: verdictParts[1], act: verdictParts[2], verdict: verdictParts[3] } : null;
    if (verdictStamp) setVal(PendingState, 'HActVerdict', '');
    if (relStr) { applyRelationshipItems(statData, relStr, log, diceVerdict); setVal(I, 'relationship', ''); }
    if (initStr) { applyInitiativeItems(statData, initStr, log); setVal(I, 'initiative', ''); }
    if (skillStr) { applyRecord(statData, skillStr, log); setVal(I, 'record', ''); }
    if (presentAtEndStr) { recordDayCompanions(statData, settlePresence(statData, presentAtEndStr, log), log); setVal(I, 'presentAtEnd', ''); }
    else log.push('presentAtEnd not reported — nobody leaves the scene on POST\'s report this reply');
    const presentAfter = presentKeys();
    const leftHere = presentBefore.filter((k) => !presentAfter.includes(k));
    if (leftHere.length) disarmStaleEvent(statData, leftHere, log);
    // A relationship item moves Affection and RelationshipStage, which the quest card's NextUnlock line quotes.
    refreshSeriesQuestCards(statData, log);
    if (turnKey) setVal(I, 'postResolvedFor', turnKey);
    return { statData, applied: true, log, resBlock: buildResBlock(__before, statData) };
  }

  // ---- exports: Node (test) + browser (stat_menu.html) ---------------------------
  if (typeof module !== 'undefined' && module.exports) {
    // EVENT_PACK_ADAPTER is the PUBLISHED SURFACE, not a test hook: mvu-helper reads it off the loaded
    // module to know where to write pack rows and what a pack may touch, and MvuStatMenuBuilder reads the
    // same object by running this bundle offline. There is no generated restatement of it anywhere — that
    // is the point: a copy is what could disagree. Runtime callers use the wrappers above, not this.
    module.exports = { ENGINE_VERSION, ENGINE_NAME, ENGINE_TYPE, EVENT_PACK_FORMAT: (EVENTPACK_API && EVENTPACK_API.FORMAT) || null, resolveTurn, resolvePostRelay, i18nLabel, sweepCandidateLines, readyEvent, pickSameRoundEvent, preVerdictPatch, hactPanel, initiativeGate, initiativeMenu, previewNextBlock, spineStatus, preAssemblyPatch, renderLeadText, clockStatus, EVENT_PACK_ADAPTER, __hdc: { HDC, squirtRule, mBand, statMod, positionTier, isAnalPosition, positionTarget, hactGateDc, hactGateOwed, isFirstTimeAct, buildHactSnapshot, submissionBand, femaleLedWillingness, FEMALE_LED_LEWD, SCENE_M_STEP, isFemaleLedPosition, FEMALE_LED_POSITIONS, overrulesPush, OVERRULE_AROUSAL, OVERRULE_AROUSAL_COST, sceneSubmissionShift }, __dayCheck: { DAY_CHECK }, __crossing: { isCrossingRollOwed, owedCrossingOutcomes }, __puppy: { PUPPY_DEMAND, PUPPY_REFUSAL_LEWDNESS_COST, isPuppyEligible }, __sameRound: { sameRoundVerdict }, __fest: { FEST_RECORD, BOOTH_WORD, festivalRecordMissing, recordBoothShowing }, __trip: { TRIP_QUEST_KEY, ensureTripQuest, stashTripDestination, retireTripQuest, clearTripDestination }, __valentine: { rankValentineGifts, VAL_HONMEI, VAL_TOMO, VAL_GIRI, VAL_HONMEI_MAX }, __dateOut: { DATEOUT_CRIT_DC, DATEOUT_MIN_REPLIES, dateOutRoll, shareByRoom, parseDayCompanions },__quest: { writeQuestRecord, daySpineKey, spineRecordKey, markSpineDone, QUEST_STEPS, QUEST_TERMINAL, refreshSeriesQuestCards, nextUnlockText }, __spine: { SPINE_STEPS, spineStepCounts, spineBandsDone, spineUnfinished, signpostStepOf, signpostStepAfter }, __weather: { weatherAt, WEATHER_BY_MONTH, WEATHER_HOLD_PCT }, __training: { pickPhysicalStat, physicalPair, gainsWithinCap, PHYSICAL_STATS }, __classmate: { PERSONA_ARCHETYPES } };   // Node / test (resolvePostRelay = P7 POST-relay record apply · sweepCandidateLines = P8 §6.6 · readyEvent = v4 same-reply zero-away offer · pickSameRoundEvent = mvu-helper's PRE-seam hook, the same-reply pick · preVerdictPatch = the PRE-rail hook after the calls, opens the H latch on [PRE]'s hcue when the crossing PhysicalRequest is won · initiativeMenu = initiative-by-PRE · previewNextBlock = v4 Next-Block flag preview · preAssemblyPatch = P1 PRE-rail scatter · renderLeadText = the engine-authored bars, every reply's leadText · clockStatus = game-coordinate snapshot: daysOwed + band + order stamp, read by Window A / block_transition / tests · EVENT_PACK_ADAPTER = build + drift guard)
  }
  // Browser: register the genre hook the builder's VARIABLE_UPDATE_ENDED handler calls.
  // (Generic builder change: `await window.__resolveTurn?.(statData)` before re-render.)
  if (root && typeof root === 'object') {
    root.resolveTurn = resolveTurn;   // pure fn — the test-shim handler calls this + the stat-menu's LOCAL saveStatData
    root.resolvePostRelay = resolvePostRelay;   // P7 — mvu-helper's turn-runner feature-detects this and calls it on the deduped RES2/POST-relay fire (same-reply record apply)
    root.i18nLabel = i18nLabel;       // display localization for the stat-menu bind loop (wire_resolver routes values through it)
    root.sweepCandidateLines = sweepCandidateLines;   // P8 §6.6 — the card's [PRE] EJS1 block calls this for the candidate list
    root.readyEvent = readyEvent;   // v4 same-reply firing — the same [PRE] EJS1 block calls this for the ZERO-away winner (the sweep omits it by design)
    root.pickSameRoundEvent = pickSameRoundEvent;   // mvu-helper's PRE seam calls this after the [PRE] calls (feature-detected): the event to play THIS reply, or ''
    root.preVerdictPatch = preVerdictPatch;   // mvu-helper calls this on the PRE rail after the [PRE] calls (feature-detected) and applies its ops before narrate's prompt is built: [PRE]'s hcue "H" opens the H latch this reply, on a won crossing PhysicalRequest for her first H with him or with no roll once she has had H with him
    root.initiativeGate = initiativeGate;   // the initiative DECISION as data (initiativeMenu renders it) — assertable, mutation-testable
    root.initiativeMenu = initiativeMenu;   // v4 live-PRE option C — the [PRE] <Initiative_Menu> entry AND narrate's ## INITIATIVE panel both call this LIVE (globalThis.LogicEngine.initiativeMenu)
    root.hactPanel = hactPanel;   // the ## INTIMACY panel prints these numbers (act-gate DCs, position targets, venue tier)
    root.previewNextBlock = previewNextBlock;   // v4 Next-Block flag model — Window A EJS previews the advanced clock when BlockDone is set
    root.preAssemblyPatch = preAssemblyPatch;   // P1 — mvu-helper calls this on the PRE rail (feature-detected) and applies the ops before any model runs; [] on a mid-block reply
    // Gate RES's console trace on mvu-helper's `pipeline` debug domain (the SAME toggle the EJS Window-A
    // trace reads — see current_variable_data.txt). Read off the mvu-helper facade the host injects
    // (MvuHelper.log.domainEnabled) — the worker no longer exposes extension settings. Returns false when
    // the facade is absent (the standalone stat-menu iframe, which is not host-hosted), so the card stays
    // silent and never breaks.
    var pipeDebugOn = function () {
      try {
        var MH = root.MvuHelper || null;
        return !!(MH && MH.log && MH.log.domainEnabled && MH.log.domainEnabled('pipeline'));
      } catch (_e) { return false; }   // EXPECTED: MvuHelper absent (standalone iframe) → debug simply off
    };
    // The engine's stage loggers write through mvu-helper's MvuHelper.log, so every line prints as
    // "[mvu-helper] [engine:game] [RES] …" and obeys the user's debug switches (log.js gates it live on the
    // page). The stage token rides as a sub-tag: '[RES]' becomes child('RES'). Silent when MvuHelper is
    // absent — a card with no mvu-helper has no engine host either.
    // The bare `catch` on each logger guards ONLY the call itself — EXPECTED to be a no-op: a logger
    // cannot log its own failure.
    var stageLog = function (stageTag) {
      var L = root.MvuHelper && root.MvuHelper.log;
      if (!L) return null;
      var stage = String(stageTag || '').replace(/^\[|\]$/g, '');
      return stage ? L.child(stage) : L;
    };
    root.squad = function (stageTag, msg) { try { var L = stageLog(stageTag); if (L) L.domain('pipeline', 'lifecycle', msg); } catch (_e) {} };   // EXPECTED: see above
    root.squadWarn = function (stageTag, msg, err) { try { var L = stageLog(stageTag); if (L) { if (err !== undefined) L.warn(msg, err); else L.warn(msg); } } catch (_e) {} };   // EXPECTED: see above
    root.squadNote = function (stageTag, msg) { try { var L = stageLog(stageTag); if (L && pipeDebugOn()) L.warn(msg); } catch (_e) {} };   // EXPECTED: see above — yellow like a warn, gated like a trace
    root.squadError = function (stageTag, msg, err) { try { var L = stageLog(stageTag); if (L) { if (err !== undefined) L.error(msg, err); else L.error(msg); } } catch (_e) {} };   // EXPECTED: see above
    try { root.squad('[RES]', 'globalLogic loaded — resolveTurn ready'); } catch (_e) {}   // EXPECTED: load-banner log only
    // Latest non-user (AI-reply) index in the live chat = the message a resolution is ABOUT — the correct save
    // target. resolveCurrentMessageId() returns the IFRAME's OWN id (right for a user click, WRONG here: RES runs
    // in an arbitrary menu iframe on an OLD message → its save would pollute that old message). Same target the
    // test-shim (wire_resolver CALL_INJECT) computes. See MvuStatMenuBuilder MAINTENANCE_LOG §5.
    var latestReplyMsgId = function () {
      try {
        var ST = root.SillyTavern || null;
        var chat = ST && ST.getContext && ST.getContext().chat;
        if (chat) { for (var i = chat.length - 1; i >= 0; i--) { if (chat[i] && !chat[i].is_user) return i; } }
      } catch (_e) {}   // EXPECTED: no ST context (standalone card); real-ST getContext() doesn't throw → -1 = no target
      return -1;
    };
    root.__resolveTurn = async function (statData) {
      var _mid = latestReplyMsgId();                         // target reply + once-per-(msg,swipe) resolvedFor key
      var _swipe = 0;
      try { var _c = root.SillyTavern && root.SillyTavern.getContext && root.SillyTavern.getContext().chat; if (_c && _mid >= 0 && _c[_mid] && _c[_mid].swipe_id != null) _swipe = _c[_mid].swipe_id; } catch (_e) {}   // EXPECTED: no swipe context → default swipe 0
      const r = resolveTurn(statData, { mid: _mid >= 0 ? _mid : undefined, swipe: _swipe });
      // Surface RES's per-turn decision log via root.squad (the [RES] stage tag, same as the load banner),
      // so RES is as inspectable as PRE/POST's pipeline logs. r.log is built throughout resolveTurn and
      // was previously discarded here. No-op turns ('no Intent' / idempotent re-fires) return applied:false
      // → stay quiet, so only turns that actually wrote state print.
      try {
        if (r.applied && Array.isArray(r.log) && r.log.length) {
          root.squad('[RES]', r.log.join('  |  '));
        }
      } catch (_e) {}   // EXPECTED: cosmetic decision-log surface only — never blocks the save below
      if (r.applied && typeof root.saveStatData === 'function') {
        await root.saveStatData(r.statData, _mid >= 0 ? _mid : undefined);
      } else if (r.applied) {
        // NOT swallowed: an applied resolve with no reachable saveStatData means the advance is computed but
        // NEVER persisted (the immediate Next-Block click's exact failure until wire_resolver exposes the
        // stat-menu's local saveStatData on window). Surface it loudly so a stuck one-shot isn't a silent mystery.
        (root.squadWarn || function () {})('[RES]', '__resolveTurn: root.saveStatData not a function — advance computed but NOT persisted (Next-Block would appear to do nothing)');
      }
      return r.statData;
    };
  }
})(typeof window !== 'undefined' ? window : null);

