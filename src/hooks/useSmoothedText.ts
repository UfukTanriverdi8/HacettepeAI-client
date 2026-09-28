import { useEffect, useState } from 'react'

// Reveals text at a steady rate no matter how unevenly it arrives.
//
// The backend streams a token event per text delta, but they still reach the browser unevenly.
// Since backend 0.6.0 moved its guardrail to async processing, a 2028-character answer arrived
// at ~38 points about 0.3s apart. Before that, sync mode re-bunched the events into 5-11
// network chunks with multi-second gaps. Painting each arrival the moment it lands makes answers
// appear in lumps. Holding the text the server has sent apart from the text on screen and
// closing the gap on a timer makes arrival size invisible to the reader. It smooths jitter
// only: no rate can spread a few characters across a six-second silence.

const TICK_MS = 33
// Characters per tick are proportional to how far behind the screen is, so the reveal sprints
// when a big chunk lands and eases as it catches up. No fixed rate can win: fast enough to
// drain a large chunk overruns the small ones and stutters, slow enough for the small ones is
// still typing long after the answer finished.
//
// Because the backlog decays by a constant fraction per tick, drain time grows only with its
// logarithm: 250 characters clear in 37 ticks (~1.2s) and 1000 in 50 (~1.7s), so one setting
// serves chunks of wildly different sizes. At the async pace of ~60 characters every 0.3s, 10
// settles the screen about 60 characters (a third of a second) behind the server, so the reveal
// never catches up and stalls between arrivals. A much faster divisor would finish each arrival
// early and leave the text sitting still until the next. Math.max(1, ...) is what guarantees it
// reaches the end rather than approaching it forever.
const CATCH_UP_DIVISOR = 10

/**
 * One tick's worth of progress from `current` toward `goal`.
 *
 * Exported for the sake of being checkable without a DOM — this is the only real logic in the
 * module, and `node scripts/check-smoothing.mjs` drives it directly.
 */
export function advance(current: string, goal: string): string {
    if (current === goal) return current
    // A goal that does not extend what is on screen is a replacement rather than more of the
    // same answer — the error event overwriting a partial answer is the case that matters.
    // Animating that diff would be nonsense, so it snaps.
    if (!goal.startsWith(current)) return goal
    const step = Math.max(1, Math.ceil((goal.length - current.length) / CATCH_UP_DIVISOR))
    return goal.slice(0, current.length + step)
}

/**
 * The visible prefix of `target`, advancing toward it a few characters at a time.
 *
 * Text present when the component mounts is shown immediately, which is what separates a
 * streamed answer from every other case without needing a flag: history restored from
 * localStorage, the user's own message and a completed answer all arrive whole, while a
 * streamed answer mounts as a placeholder and grows afterward. Pass '' while the placeholder is
 * up so the first chunk animates in rather than appearing at once.
 */
export function useSmoothedText(target: string): string {
    const [shown, setShown] = useState(target)

    // One timeout that reschedules itself, rather than a standing interval: a message that has
    // caught up holds no timer at all, so a 30-message history costs nothing and only the bubble
    // currently streaming is ticking. The `target` dependency is affordable because React
    // batches every token event parsed from one network chunk into a single render, so this
    // sees the 5-11 chunks rather than the few hundred deltas inside them.
    useEffect(() => {
        if (shown === target) return
        const timer = setTimeout(() => setShown(advance(shown, target)), TICK_MS)
        return () => clearTimeout(timer)
    }, [shown, target])

    return shown
}
