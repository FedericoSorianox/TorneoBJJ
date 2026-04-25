import { BracketGen } from './BracketGen';

describe('BracketGen - generateSingleElimination', () => {

    it('should return empty for 0 athletes', () => {
        expect(BracketGen.generateSingleElimination([])).toEqual([]);
    });

    it('should return 1 match (vs BYE) for 1 athlete', () => {
        const result = BracketGen.generateSingleElimination(['1']);
        expect(result.length).toBe(1);
        expect(result[0].p1).toBe('1');
        expect(result[0].p2).toBe('BYE');
    });

    it('should generate 1 match for 2 athletes (no BYEs)', () => {
        const result = BracketGen.generateSingleElimination(['1', '2']);
        expect(result.length).toBe(1);
        expect(result[0].round).toBe(1);
        expect(result[0].p1).toBe('1');
        expect(result[0].p2).toBe('2');
    });

    it('should generate 2 matches for 3 athletes (1 prelim + 1 final)', () => {
        // prevPow2=2, r1Count=1 → 1 prelim, 1 main match
        const result = BracketGen.generateSingleElimination(['1', '2', '3']);
        expect(result.length).toBe(2);

        const r1 = result.filter(m => m.round === 1);
        const r2 = result.filter(m => m.round === 2);
        expect(r1.length).toBe(1); // 1 prelim
        expect(r2.length).toBe(1); // 1 final

        // Prelim winner goes to final
        expect(r1[0].nextMatchNumber).toBe(r2[0].matchNumber);
    });

    it('should generate 3 matches for 4 athletes (perfect bracket, no prelims)', () => {
        const result = BracketGen.generateSingleElimination(['1', '2', '3', '4']);
        expect(result.length).toBe(3);

        const r1 = result.filter(m => m.round === 1);
        const r2 = result.filter(m => m.round === 2);
        expect(r1.length).toBe(2);
        expect(r2.length).toBe(1);

        // Both R1 matches link to the final
        expect(r1[0].nextMatchNumber).toBe(r2[0].matchNumber);
        expect(r1[1].nextMatchNumber).toBe(r2[0].matchNumber);
    });

    it('should generate 4 matches for 5 athletes (1 prelim in R1)', () => {
        // prevPow2=4, r1Count=1 → 1 prelim at R1, 2 QF at R2, 1 Final at R3
        const result = BracketGen.generateSingleElimination(['1', '2', '3', '4', '5']);
        expect(result.length).toBe(4);

        const r1 = result.filter(m => m.round === 1);
        const r2 = result.filter(m => m.round === 2);
        const r3 = result.filter(m => m.round === 3);
        expect(r1.length).toBe(1);
        expect(r2.length).toBe(2);
        expect(r3.length).toBe(1);

        // Prelim winner advances to one of the R2 matches
        const prelim = r1[0];
        expect(prelim.nextMatchNumber).toBeDefined();
        const targetMainMatch = r2.find(m => m.matchNumber === prelim.nextMatchNumber);
        expect(targetMainMatch).toBeDefined();
    });

    it('should generate 7 matches for 8 athletes (perfect bracket, no prelims)', () => {
        const athletes = Array.from({ length: 8 }, (_, i) => String(i + 1));
        const result = BracketGen.generateSingleElimination(athletes);
        // 4 QF + 2 SF + 1 F = 7
        expect(result.length).toBe(7);
        expect(result.filter(m => m.round === 1).length).toBe(4);
        expect(result.filter(m => m.round === 2).length).toBe(2);
        expect(result.filter(m => m.round === 3).length).toBe(1);
        // No BYEs or TBDs in any slot
        result.filter(m => m.round === 1).forEach(m => {
            expect(m.p1).not.toBe('BYE');
            expect(m.p2).not.toBe('BYE');
        });
    });

    it('should generate 8 matches for 9 athletes (1 prelim in R1)', () => {
        // prevPow2=8, r1Count=1 → 1 prelim + 4 QF + 2 SF + 1 F = 8
        const athletes = Array.from({ length: 9 }, (_, i) => String(i + 1));
        const result = BracketGen.generateSingleElimination(athletes);
        expect(result.length).toBe(8);

        const r1 = result.filter(m => m.round === 1);
        const r2 = result.filter(m => m.round === 2);
        const r3 = result.filter(m => m.round === 3);
        const r4 = result.filter(m => m.round === 4);
        expect(r1.length).toBe(1);  // 1 preliminary
        expect(r2.length).toBe(4);  // QF
        expect(r3.length).toBe(2);  // SF
        expect(r4.length).toBe(1);  // Final

        // No "BYE vs BYE" matches — all R2 slots have real athletes or TBD (prelim winner)
        r2.forEach(m => {
            expect(m.p1 === 'BYE' && m.p2 === 'BYE').toBe(false);
        });
    });

    it('should generate 11 matches for 12 athletes (4 prelims in R1)', () => {
        // prevPow2=8, r1Count=4 → 4 prelims + 4 QF + 2 SF + 1 F = 11
        const athletes = Array.from({ length: 12 }, (_, i) => String(i + 1));
        const result = BracketGen.generateSingleElimination(athletes);
        expect(result.length).toBe(11);

        const r1 = result.filter(m => m.round === 1);
        const r2 = result.filter(m => m.round === 2);
        expect(r1.length).toBe(4);
        expect(r2.length).toBe(4);
    });

    it('should generate 15 matches for 16 athletes (perfect bracket)', () => {
        const athletes = Array.from({ length: 16 }, (_, i) => String(i + 1));
        const result = BracketGen.generateSingleElimination(athletes);
        expect(result.length).toBe(15);
        expect(result.filter(m => m.round === 1).length).toBe(8);
    });

    it('all matches should have valid nextMatchNumber links (except the final)', () => {
        const athletes = Array.from({ length: 9 }, (_, i) => String(i + 1));
        const result = BracketGen.generateSingleElimination(athletes);
        const allMatchNums = new Set(result.map(m => m.matchNumber));
        const final = result.find(m => !m.nextMatchNumber);
        expect(final).toBeDefined();

        result
            .filter(m => m.nextMatchNumber)
            .forEach(m => {
                expect(allMatchNums.has(m.nextMatchNumber!)).toBe(true);
            });
    });
});

describe('BracketGen - generateDoubleElimination', () => {

    it('should include winner and loser bracket matches for 4 athletes', () => {
        const result = BracketGen.generateDoubleElimination(['1', '2', '3', '4']);
        const winner = result.filter(m => m.bracketType === 'Winner');
        const loser  = result.filter(m => m.bracketType === 'Loser');
        expect(winner.length).toBe(3); // 2 SF + 1 F
        expect(loser.length).toBe(1);  // 1 loser match
    });

    it('should include winner and loser bracket matches for 8 athletes', () => {
        const athletes = Array.from({ length: 8 }, (_, i) => String(i + 1));
        const result = BracketGen.generateDoubleElimination(athletes);
        expect(result.filter(m => m.bracketType === 'Winner').length).toBe(7);
        expect(result.filter(m => m.bracketType === 'Loser').length).toBe(3);
    });

    it('should not break for 9 athletes', () => {
        const athletes = Array.from({ length: 9 }, (_, i) => String(i + 1));
        const result = BracketGen.generateDoubleElimination(athletes);
        expect(result.filter(m => m.bracketType === 'Winner').length).toBe(8);
        expect(result.filter(m => m.bracketType === 'Loser').length).toBeGreaterThan(0);
    });
});
