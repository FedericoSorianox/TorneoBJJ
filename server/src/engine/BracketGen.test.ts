
import { BracketGen } from './BracketGen';

describe('BracketGen', () => {
    describe('generateSingleElimination', () => {
        it('should return empty array for 0 athletes', () => {
            const result = BracketGen.generateSingleElimination([]);
            expect(result).toEqual([]);
        });

        it('should generate 1 match for 1 athlete (Direct Winner)', () => {
            const result = BracketGen.generateSingleElimination(['1']);
            // Current logic generates 1 match with p2 undefined.
            // Ideally it should perhaps just return the winner or a specific single match structure.
            // For now, let's verify it produces 1 entry.
            expect(result.length).toBe(1);
            expect(result[0].p1).toBe('1');
            expect(result[0].p2).toBeUndefined(); // Or 'BYE' if we padded? But we didn't pad because size=n=1.
        });

        it('should generate 1 match for 2 athletes', () => {
            const athletes = ['1', '2'];
            const result = BracketGen.generateSingleElimination(athletes);
            expect(result.length).toBe(1);
            expect(result[0].round).toBe(1);
            expect(result[0].p1).toBe('1');
            expect(result[0].p2).toBe('2');
            expect(result[0].bracketType).toBe('Winner');
        });

        it('should generate 3 matches for 4 athletes (Semis + Final)', () => {
            const athletes = ['1', '2', '3', '4'];
            const result = BracketGen.generateSingleElimination(athletes);
            // Round 1: 2 matches. Round 2: 1 match. Total 3.
            expect(result.length).toBe(3);

            const r1 = result.filter(m => m.round === 1);
            const r2 = result.filter(m => m.round === 2);

            expect(r1.length).toBe(2);
            expect(r2.length).toBe(1);

            // Check progression linkage
            const final = r2[0];
            const semi1 = r1[0];
            const semi2 = r1[1];

            expect(semi1.nextMatchNumber).toBe(final.matchNumber);
            expect(semi2.nextMatchNumber).toBe(final.matchNumber);
        });

        it('should handle odd number of athletes (3) with BYE', () => {
            const athletes = ['1', '2', '3'];
            const result = BracketGen.generateSingleElimination(athletes);
            // Size 4. 2 Semis (1 real, 1 BYE), 1 Final.
            expect(result.length).toBe(3);

            const r1 = result.filter(m => m.round === 1);
            expect(r1.length).toBe(2);

            // Check for BYE
            const hasBye = r1.some(m => m.p2 === 'BYE');
            expect(hasBye).toBe(true);
        });

        it('should generate correct structure for 8 athletes', () => {
            const athletes = Array.from({ length: 8 }, (_, i) => String(i + 1));
            const result = BracketGen.generateSingleElimination(athletes);
            // 8 -> 4 QF, 2 SF, 1 F = 7 matches
            expect(result.length).toBe(7);
            expect(result.filter(m => m.round === 1).length).toBe(4);
            expect(result.filter(m => m.round === 2).length).toBe(2);
            expect(result.filter(m => m.round === 3).length).toBe(1);
        });

        it('should generate correct structure for 16 athletes', () => {
            const athletes = Array.from({ length: 16 }, (_, i) => String(i + 1));
            const result = BracketGen.generateSingleElimination(athletes);
            // 16 -> 8 + 4 + 2 + 1 = 15 matches
            expect(result.length).toBe(15);
        });
    });

    describe('generateDoubleElimination', () => {
        // Based on current implementation (Consolation Bracket for R1 losers)

        it('should generate winner and loser bracket matches for 4 athletes', () => {
            const athletes = ['1', '2', '3', '4'];
            const result = BracketGen.generateDoubleElimination(athletes);

            // Winner bracket: 3 matches
            // Loser bracket: Losers from R1 (2 losers). 
            // 2 losers -> Single Elimination of size 2 -> 1 match.
            // Total: 3 + 1 = 4 matches.
            expect(result.length).toBe(4);

            const loserMatches = result.filter(m => m.bracketType === 'Loser');
            expect(loserMatches.length).toBe(1);

            const winnerR1 = result.filter(m => m.bracketType === 'Winner' && m.round === 1);

            // Check linkage
            winnerR1.forEach(m => {
                expect(m.loserNextMatchNumber).toBeDefined();
                expect(m.loserNextMatchNumber).toBe(loserMatches[0].matchNumber);
            });
        });

        it('should generate correct structure for 8 athletes', () => {
            const athletes = Array.from({ length: 8 }, (_, i) => String(i + 1));
            const result = BracketGen.generateDoubleElimination(athletes);

            // Winner bracket: 7 matches (4 R1, 2 R2, 1 R3)
            // Loser bracket input: 4 losers from W-R1.
            // Loser bracket size 4 -> 2 Semis, 1 Final = 3 matches.
            // Total: 7 + 3 = 10 matches.

            expect(result.length).toBe(10);
            expect(result.filter(m => m.bracketType === 'Winner').length).toBe(7);
            expect(result.filter(m => m.bracketType === 'Loser').length).toBe(3);
        });
    });
});
