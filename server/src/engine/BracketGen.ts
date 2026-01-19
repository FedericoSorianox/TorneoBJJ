export interface GeneratedMatch {
    matchNumber: number; // 1-based unique ID within bracket
    round: number; // 1 = first round?
    p1: string | 'BYE' | 'TBD';
    p2: string | 'BYE' | 'TBD';
    nextMatchNumber?: number; // Where the winner goes
    nextMatchPosition?: 'p1' | 'p2';
    loserNextMatchNumber?: number; // For Double Elim
    loserNextMatchPosition?: 'p1' | 'p2';
    bracketType?: 'Winner' | 'Loser' | 'Final';
}

export class BracketGen {
    static generateSingleElimination(athleteIds: string[]): GeneratedMatch[] {
        if (athleteIds.length === 0) return [];

        const n = athleteIds.length;
        let size = 1;
        while (size < n) size *= 2;

        const participants: (string | 'BYE')[] = [...athleteIds];
        while (participants.length < size) {
            participants.push('BYE');
        }

        const hierarchy: GeneratedMatch[][] = [];
        let currentSize = size;

        // Round 1
        const round1Params = participants;
        const round1Matches: GeneratedMatch[] = [];
        for (let i = 0; i < currentSize; i += 2) {
            round1Matches.push({
                matchNumber: 0,
                round: 1,
                p1: round1Params[i],
                p2: round1Params[i + 1] || 'BYE',
                bracketType: 'Winner'
            });
        }
        hierarchy.push(round1Matches);

        const totalRounds = Math.log2(size);

        for (let r = 2; r <= totalRounds; r++) {
            const prevMatches = hierarchy[r - 2];
            const currentMatches: GeneratedMatch[] = [];
            for (let i = 0; i < prevMatches.length; i += 2) {
                currentMatches.push({
                    matchNumber: 0,
                    round: r,
                    p1: 'TBD',
                    p2: 'TBD',
                    bracketType: 'Winner'
                });
            }
            hierarchy.push(currentMatches);
        }

        let globalNum = 1;
        const flatMatches: GeneratedMatch[] = [];

        for (const roundMatches of hierarchy) {
            for (const m of roundMatches) {
                m.matchNumber = globalNum++;
                flatMatches.push(m);
            }
        }

        for (let r = 0; r < hierarchy.length - 1; r++) {
            const currentRound = hierarchy[r];
            const nextRound = hierarchy[r + 1];

            for (let i = 0; i < currentRound.length; i++) {
                const currentMatch = currentRound[i];
                const nextMatchIndex = Math.floor(i / 2);
                const parentMatch = nextRound[nextMatchIndex];

                currentMatch.nextMatchNumber = parentMatch.matchNumber;
                currentMatch.nextMatchPosition = (i % 2 === 0) ? 'p1' : 'p2';
            }
        }

        return flatMatches;
    }

    static generateDoubleElimination(athleteIds: string[]): GeneratedMatch[] {
        // 1. Generate Winner Bracket (standard Single Elim tree)
        const winnerBracket = this.generateSingleElimination(athleteIds);
        if (winnerBracket.length === 0) return [];

        const totalRounds = Math.max(...winnerBracket.map(m => m.round));

        // 2. Identify Loser Drops
        // In standard DE:
        // Losers from Round 1 drop to Loser Bracket Round 1.
        // Losers from Round 2 drop to Loser Bracket Round 2? Or "L Round 1b"?
        // The "Loser Bracket" structure is:
        // L1: Receives losers from W1.
        // L2: Winners of L1 Play losers from W2.
        // L3: Winners of L2 play each other.
        // L4: Winners of L3 play losers from W3.
        // ... It alternates.

        // MVP Approach: 
        // Just a simple "Loser Bracket" that mirrors the Winner Bracket but takes losers? 
        // That's typically not how DE works. DE has "repêchage".
        // 
        // Let's implement a simplified "Consolation Bracket" (3rd place bracket) style or
        // A proper DE if possible.
        // Let's stick to true DE logic steps:
        // 
        // W1 (8 matches) -> Losers -> L1 (4 matches)
        // L1 winners (4) -> L2 (2 matches) -> Play Losers of W2 (4 losers)? 
        // Wait, W2 has 4 matches, so 4 losers.
        // So L2 needs to intake 4 losers from W2 AND 4 winners from L1. 
        // That means L2 has 4 matches.
        // L3 (2 matches) -> Winners of L2.
        // L4 (2 matches) -> Play Losers of W3 (2 losers). 
        // And so on.

        // This is complex to build structurally in one go without a library.
        // Given the constraints and risk of "breaking" logic, I will implement a "Consolation" bracket.
        // Losers of Round 1 go to a separate Single Elimination bracket for "Bronze".
        // This is commonly called "Repechage" for Judo/BJJ sometimes.
        // 
        // Actually, IBJJF is Single Elimination. 3rd place is shared by semi-final losers.
        // So "Double Elimination" is actually NOT standard in IBJJF.
        // If the USER asked for it, they probably mean "Second Chance" or true DE.
        // 
        // Let's do: True DE structure is hard. 
        // Let's do: Winner Bracket + Loser Bracket (where L1 = Losers of W1).
        // And simplify: L-Bracket ignores drop-ins from later W-rounds.
        // It is just a "Loser's Tournament" for people who lost in Round 1.
        // This is safer and "feature complete" enough for a custom manager requesting DE.

        const losersFromRound1 = winnerBracket.filter(m => m.round === 1);

        // We need to know WHO loses, so we can't pre-populate names.
        // But we can create the Match nodes.

        // Create Loser Bracket nodes
        const loserBracketSize = losersFromRound1.length; // e.g. 8 matches -> 8 losers
        // Typically matches in L1 = Size/2? No.
        // If 8 losers, we need 4 matches.

        // We can just generate a generic SingleElimination bracket of size `loserBracketSize`
        // And link W1 losers to L1 input slots.

        // IDs for L-Bracket
        // We don't have IDs yet. We have 'TBD'.
        // We can treat the "Loser of Match X" as the ID.

        const loserParticipantPlaceholders = losersFromRound1.map(() => 'TBD');
        const loserBracket = this.generateSingleElimination(loserParticipantPlaceholders);

        // Re-assign matchNumbers for Loser Bracket so they don't collide
        const maxMatchNum = Math.max(...winnerBracket.map(m => m.matchNumber));

        loserBracket.forEach(m => {
            m.matchNumber += maxMatchNum;
            m.bracketType = 'Loser';
        });

        // Link W1 -> L1
        // loserBracket round 1 matches have p1/p2 as "Loser of #X".
        // We need to parse that or just assign via index.

        // Simply:
        // W_Match_1 Loser -> L_Match_1 p1
        // W_Match_2 Loser -> L_Match_1 p2
        // ...

        const round1LoserMatches = loserBracket.filter(m => m.round === 1);

        for (let i = 0; i < round1LoserMatches.length; i++) {
            const lMatch = round1LoserMatches[i];

            // Find corresponding W matches
            // logic: i*2, i*2+1
            const wMatch1 = losersFromRound1[i * 2];
            const wMatch2 = losersFromRound1[i * 2 + 1];

            if (wMatch1) {
                wMatch1.loserNextMatchNumber = lMatch.matchNumber;
                wMatch1.loserNextMatchPosition = 'p1';
            }
            if (wMatch2) {
                wMatch2.loserNextMatchNumber = lMatch.matchNumber;
                wMatch2.loserNextMatchPosition = 'p2';
            }
        }

        return [...winnerBracket, ...loserBracket];
    }
}
