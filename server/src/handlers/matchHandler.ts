import { Server, Socket } from 'socket.io';
import Match, { IMatchEvent } from '../models/Match';
import Athlete from '../models/Athlete';
import RuleSet from '../models/RuleSet';
import { RulesEngine } from '../engine/RulesEngine';

export const registerMatchHandlers = (io: Server, socket: Socket) => {
    const joinMatch = async (matchId: string) => {
        socket.join(matchId);
        console.log(`Socket ${socket.id} joined match ${matchId}`);
        // Send current state
        try {
            const match = await Match.findById(matchId);
            if (match) {
                socket.emit('match_update', match);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const sendEvent = async (payload: { matchId: string, event: IMatchEvent }) => {
        const { matchId, event } = payload;
        try {
            const match = await Match.findById(matchId).populate('tournamentId'); // We need tournament to get rules? 
            // Actually, ruleSetId is on Tournament.
            // Optimization: Cache rules or fetch.

            if (!match) return;

            // Add to log
            if (event.type === 'undo') {
                // Remove last event
                match.eventLog.pop();
            } else {
                match.eventLog.push(event);
            }

            // Recalculate Score
            // Need to fetch RuleSet. 
            // For MVP, we'll use a standard config or fetch it.
            // match.tournamentId is an ObjectId, populated? 
            // If we populated 'tournamentId', we can access its ruleSetId.
            // Let's assume standard points for now or todo: fetch rules properly.

            // Fetch RuleSet
            // const tournament = await Tournament.findById(match.tournamentId);
            // const ruleSet = await RuleSet.findById(tournament.ruleSetId);

            // Optimization: Just hardcoding IBJJF defaults if not found for speed in this handler, 
            // but ideally we fetch it.
            const defaultPoints = {
                takedown: 2, sweep: 2, kneeOnBelly: 2, guardPass: 3, mount: 4, backTake: 4, advantage: 0, penalty: 0
            };

            const newScore = RulesEngine.calculateScore(match.eventLog, defaultPoints as any);
            match.score = newScore;

            await match.save();

            await match.save();

            // Populate before sending back
            const populatedMatch = await Match.findById(matchId).populate('athlete1Id athlete2Id');

            // Broadcast to room
            io.to(matchId).emit('match_update', populatedMatch);

        } catch (error) {
            console.error(error);
            socket.emit('error', { message: 'Failed to process event' });
        }
    };

    socket.on('join_match', joinMatch);
    socket.on('send_event', sendEvent);

    socket.on('end_match', async ({ matchId, winnerId, method }) => {
        try {
            const match = await Match.findById(matchId);
            if (!match) return;

            match.status = 'Finished';
            match.winnerId = winnerId;
            // match.method = method; // If we add method to schema
            match.save();

            // Update Stats
            if (winnerId) {
                // Determine Points for win (Updated: 100 + 50 for sub)
                const winPoints = 100;
                const submissionBonus = method === 'Submission' ? 50 : 0;
                const totalAward = winPoints + submissionBonus;

                // Match Score (points scored by athlete in match, unrelated to ranking points)
                const pointsInMatch = match.athlete1Id?.toString() === winnerId ? match.score.p1 : match.score.p2;

                await Athlete.findByIdAndUpdate(winnerId, {
                    $inc: {
                        'stats.wins': 1,
                        'stats.submissions': method === 'Submission' ? 1 : 0,
                        'stats.pointsScored': pointsInMatch,
                        'rankingPoints': totalAward,
                        'balance': totalAward
                    }
                });

                const loserId = match.athlete1Id?.toString() === winnerId ? match.athlete2Id : match.athlete1Id;
                if (loserId) {
                    await Athlete.findByIdAndUpdate(loserId, {
                        $inc: { 'stats.losses': 1 }
                    });
                }
            }

            // Advance Bracket Logic
            // Winner Logic
            if (match.nextMatchId && match.nextMatchPosition) {
                const nextMatch = await Match.findById(match.nextMatchId);
                if (nextMatch) {
                    if (match.nextMatchPosition === 'p1') nextMatch.athlete1Id = match.winnerId;
                    else nextMatch.athlete2Id = match.winnerId;
                    await nextMatch.save();
                    io.to(nextMatch._id.toString()).emit('match_update', nextMatch);
                }
            }

            // Loser Logic
            if (match.loserNextMatchId && match.loserNextMatchPosition) {
                const loserId = match.athlete1Id?.toString() === winnerId ? match.athlete2Id : match.athlete1Id;
                if (loserId) {
                    const nextMatch = await Match.findById(match.loserNextMatchId);
                    if (nextMatch) {
                        if (match.loserNextMatchPosition === 'p1') nextMatch.athlete1Id = loserId;
                        else nextMatch.athlete2Id = loserId;
                        await nextMatch.save();
                        io.to(nextMatch._id.toString()).emit('match_update', nextMatch);
                    }
                }
            }

            io.to(matchId).emit('match_update', match);
        } catch (e) {
            console.error(e);
        }
    });

    socket.on('timer_action', ({ matchId, action, timer }) => {
        // Broadcast to everyone else (and sender) in the room
        io.to(matchId).emit('timer_update', { action, timer });
    });

};
