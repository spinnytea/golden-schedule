/**
 * This was not written to be generic, it matches our use case exactly.
 * Some things try to be generic, but only when convenient.
 * 
 * NOTE team numbers are 1-based
 */
'use strict';

exports.Schedule = class Schedule {
	constructor() {
		/** the number of teams that need to have schedules */
		this.number_of_teams = 12;
		/** each team will play this many games each week */
		this.number_of_team_games_per_week = 2;
		/** how many times will each team play each other; e.g. how many times will team #8 play team #9 */
		this.number_of_pairing_matches = 2;

		/** games that will occur at once (in a given time slot, on a given day) */
		this.number_concurrent_games = 4;
		/** how many time slots are on a given day */
		this.number_time_slots_per_week = 3;
		/** games are 1v1, so there are only 2 teams playing in a single game */
		this.teams_per_game = 2;

		/** for a fully round robin tournament, we need this long to complete it */
		this.number_of_weeks = 11;

		this.remainingMatches = computeAllMatches(this);
	}
};

// XXX use TEAMS_PER_GAME, assuming 2 (that's the a/b part)
exports.computeAllMatches = computeAllMatches;
function computeAllMatches({ number_of_teams, number_of_pairing_matches }) {
	const matches = [];

	for(let a = 1; a <= number_of_teams; a++)
		for(let b = a+1; b <= number_of_teams; b++)
			for(let rematch = 0; rematch < number_of_pairing_matches; rematch++)
				matches.push([a, b]);

	return matches;
}
