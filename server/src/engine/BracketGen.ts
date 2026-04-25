export interface GeneratedMatch {
    matchNumber: number;
    round: number;
    p1: string | 'BYE' | 'TBD';
    p2: string | 'BYE' | 'TBD';
    nextMatchNumber?: number;
    nextMatchPosition?: 'p1' | 'p2';
    loserNextMatchNumber?: number;
    loserNextMatchPosition?: 'p1' | 'p2';
    bracketType?: 'Winner' | 'Loser' | 'Final';
}

export class BracketGen {
    /**
     * Standard BJJ Single Elimination with proper BYE distribution.
     *
     * For n athletes that is NOT a power of 2:
     *   prevPow2 = largest power of 2 <= n
     *   r1Count  = n - prevPow2   → number of preliminary matches
     *   r1Count * 2 athletes fight in Round 1 (preliminaries)
     *   remaining athletes advance directly to Round 2 (main bracket)
     *
     * Example: 9 athletes → prevPow2=8, r1Count=1
     *   Round 1: 1 match (2 athletes fight)
     *   Round 2: 4 matches (1 prelim winner + 7 bye athletes)
     *   Round 3: 2 matches (semifinals)
     *   Round 4: 1 match  (final)
     */
    static generateSingleElimination(athleteIds: string[]): GeneratedMatch[] {
        const n = athleteIds.length;
        if (n === 0) return [];

        // Single athlete: direct winner, no match needed
        if (n === 1) {
            return [{
                matchNumber: 1, round: 1,
                p1: athleteIds[0], p2: 'BYE',
                bracketType: 'Winner'
            }];
        }

        // Largest power of 2 that is <= n
        let prevPow2 = 1;
        while (prevPow2 * 2 <= n) prevPow2 *= 2;

        const r1Count = n - prevPow2; // number of preliminary matches (0 when n is power of 2)

        // First r1Count*2 athletes play preliminaries; the rest get byes
        const prelimPlayers = athleteIds.slice(0, r1Count * 2);
        const byePlayers    = athleteIds.slice(r1Count * 2); // length = prevPow2 - r1Count

        const matches: GeneratedMatch[] = [];
        let matchNum = 1;
        const mainRoundStart = r1Count > 0 ? 2 : 1;

        // ── Phase 1: Preliminary matches (Round 1) ────────────────────────────
        const prelimMatches: GeneratedMatch[] = [];
        for (let i = 0; i < r1Count; i++) {
            prelimMatches.push({
                matchNumber: matchNum++,
                round: 1,
                p1: prelimPlayers[i * 2],
                p2: prelimPlayers[i * 2 + 1],
                bracketType: 'Winner'
            });
        }
        matches.push(...prelimMatches);

        // ── Phase 2: Build main bracket tree (prevPow2 slots) ────────────────
        //
        // Interleave TBD slots and bye athletes so that in Round 2 each
        // prelim winner faces a bye athlete (fairer bracket structure).
        //
        // Layout example (n=12, r1Count=4, byeCount=4):
        //   mainSlots = [TBD, byeA, TBD, byeB, TBD, byeC, TBD, byeD]
        //   R2 matches: TBD vs byeA, TBD vs byeB, TBD vs byeC, TBD vs byeD
        //
        // When r1Count is small relative to prevPow2 the TBDs are spread
        // across the bracket so bye athletes face each other in one half
        // and the prelim survivor(s) face byes in the other (n=9 example):
        //   mainSlots = [TBD, byeA, byeB, byeC, byeD, byeE, byeF, byeG]
        const mainSlots: (string | 'TBD')[] = new Array(prevPow2);

        if (r1Count === 0) {
            // Perfect power-of-2: everyone goes straight in
            for (let i = 0; i < prevPow2; i++) mainSlots[i] = byePlayers[i];
        } else {
            // Distribute TBD positions evenly across the slot array.
            // spacing = prevPow2 / r1Count (how many slots between each TBD)
            const spacing = prevPow2 / r1Count; // always integer because r1Count <= prevPow2/2
            const tdbPositions = new Set<number>();
            for (let i = 0; i < r1Count; i++) {
                // Place TBD at every `spacing` interval, then one slot before the end of that block
                tdbPositions.add(Math.round(i * spacing + spacing - 1));
            }

            let byeIdx = 0;
            for (let i = 0; i < prevPow2; i++) {
                mainSlots[i] = tdbPositions.has(i) ? 'TBD' : byePlayers[byeIdx++];
            }
        }

        // Build hierarchy round-by-round
        const mainHierarchy: GeneratedMatch[][] = [];
        const totalMainRounds = Math.log2(prevPow2);

        // First main round
        const firstMainRound: GeneratedMatch[] = [];
        for (let i = 0; i < mainSlots.length; i += 2) {
            firstMainRound.push({
                matchNumber: matchNum++,
                round: mainRoundStart,
                p1: mainSlots[i],
                p2: mainSlots[i + 1],
                bracketType: 'Winner'
            });
        }
        mainHierarchy.push(firstMainRound);

        // Remaining main rounds
        for (let r = 1; r < totalMainRounds; r++) {
            const prev = mainHierarchy[r - 1];
            const cur: GeneratedMatch[] = [];
            for (let i = 0; i < prev.length; i += 2) {
                cur.push({
                    matchNumber: matchNum++,
                    round: mainRoundStart + r,
                    p1: 'TBD',
                    p2: 'TBD',
                    bracketType: 'Winner'
                });
            }
            mainHierarchy.push(cur);
        }

        for (const round of mainHierarchy) matches.push(...round);

        // ── Phase 3: Wire up nextMatchId links ────────────────────────────────

        // Link prelim matches → their target slot in firstMainRound
        // Each TBD position maps to exactly one prelim match.
        const tdbSlotIndices: number[] = [];
        for (let i = 0; i < mainSlots.length; i++) {
            if (mainSlots[i] === 'TBD') tdbSlotIndices.push(i);
        }

        for (let i = 0; i < prelimMatches.length; i++) {
            const slotIdx = tdbSlotIndices[i];
            const mainMatchIdx = Math.floor(slotIdx / 2);
            const position: 'p1' | 'p2' = slotIdx % 2 === 0 ? 'p1' : 'p2';

            prelimMatches[i].nextMatchNumber = mainHierarchy[0][mainMatchIdx].matchNumber;
            prelimMatches[i].nextMatchPosition = position;
        }

        // Link main bracket rounds to each other
        for (let r = 0; r < mainHierarchy.length - 1; r++) {
            const cur  = mainHierarchy[r];
            const next = mainHierarchy[r + 1];
            for (let i = 0; i < cur.length; i++) {
                cur[i].nextMatchNumber  = next[Math.floor(i / 2)].matchNumber;
                cur[i].nextMatchPosition = i % 2 === 0 ? 'p1' : 'p2';
            }
        }

        return matches;
    }

    /**
     * Double Elimination:
     * Winner bracket (standard single elim) + Loser bracket for R1 losers.
     * This is a "consolation" style DE, standard in BJJ tournaments.
     */
    static generateDoubleElimination(athleteIds: string[]): GeneratedMatch[] {
        const winnerBracket = this.generateSingleElimination(athleteIds);
        if (winnerBracket.length === 0) return [];

        // Collect loser-eligible matches: those that are contested in Round 1
        // (could be round 1 OR round 2 if there are prelims — take the first real contested round)
        const minRound = Math.min(...winnerBracket.map(m => m.round));
        const losersFromFirstRound = winnerBracket.filter(m => m.round === minRound);

        // Build a loser bracket using TBD placeholders
        const loserPlaceholders = losersFromFirstRound.map(() => 'TBD' as const);
        const loserBracket = this.generateSingleElimination(loserPlaceholders as string[]);

        // Offset match numbers so they don't collide
        const maxWinnerMatchNum = Math.max(...winnerBracket.map(m => m.matchNumber));
        loserBracket.forEach(m => {
            m.matchNumber += maxWinnerMatchNum;
            if (m.nextMatchNumber) m.nextMatchNumber += maxWinnerMatchNum;
            m.bracketType = 'Loser';
        });

        // Link Winner R1 losers → Loser Bracket R1 input slots
        const loserR1Matches = loserBracket.filter(m => m.round === Math.min(...loserBracket.map(x => x.round)));

        for (let i = 0; i < loserR1Matches.length; i++) {
            const lMatch = loserR1Matches[i];
            const wMatch1 = losersFromFirstRound[i * 2];
            const wMatch2 = losersFromFirstRound[i * 2 + 1];

            if (wMatch1) {
                wMatch1.loserNextMatchNumber  = lMatch.matchNumber;
                wMatch1.loserNextMatchPosition = 'p1';
            }
            if (wMatch2) {
                wMatch2.loserNextMatchNumber  = lMatch.matchNumber;
                wMatch2.loserNextMatchPosition = 'p2';
            }
        }

        return [...winnerBracket, ...loserBracket];
    }
}
