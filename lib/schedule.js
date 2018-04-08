/**
 * This was not written to be generic, it matches our use case exactly.
 * Some things try to be generic, but only when convenient.
 *
 * NOTE team numbers are 1-based
 */
'use strict';
const _ = require('lodash');

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

		/** how many matches do we have left to put on the books */
		this.remainingMatches = null;

		/**
		 * the schedule
		 * `match = book[week][time][arena]`
		 * match being the actualy game being played (e.g. #8 vs #9)
		 */
		this.book = null;
	}

	init() {
		this.remainingMatches = computeAllMatches(this);
		this.book = createEmptyBook(this);
	}

	get finished() {
		return !!this.remainingMatches && !this.remainingMatches.length;
	}

	setMatch({ week, time, arena }, match) {
		if(!match) throw new Error('match not provided');
		if(this.book[week][time][arena]) throw new Error('this spot is already booked');
		// TODO why does exact object matter? why doesn't this fuzzy match? why don't we store matches as a string 6-12?
		if(_.indexOf(this.remainingMatches, match) === -1) throw new Error('this match is not available');

		_.pull(this.remainingMatches, match);
		this.book[week][time][arena] = match;
	}

	// XXX this is specifically designed for number_time_slots_per_week === 3
	metrics() {
		const early = [];
		const late = [];
		const split = [];
		while(early.length < this.number_of_teams) {
			early.push(0);
			late.push(0);
			split.push(0);
		}

		this.book.forEach(function (week) {
			const first = _.flatten(week[0]);
			const second = _.flatten(week[1]);
			const third = _.flatten(week[2]);

			_.intersection(first, second).forEach(function (team) { early[team-1]++; });
			_.intersection(second, third).forEach(function (team) { late[team-1]++; });
			_.intersection(first, third).forEach(function (team) { split[team-1]++; });
		});

		return { early, late, split };
	}

	prettyBook(headers) {
		let str = '';

		if(!headers || !headers.week || !headers.time || !headers.arena)
			throw new Error('must provide headers for week, time, arena');
		if(headers.week.length !== this.number_of_weeks)
			throw new Error('incorrect number of weeks: expected ' + this.number_of_weeks + ', actual: ' + headers.week.length);
		if(headers.time.length !== this.number_time_slots_per_week)
			throw new Error('incorrect number of times: expected ' + this.number_time_slots_per_week + ', actual: ' + headers.time.length);
		if(headers.arena.length !== this.number_concurrent_games)
			throw new Error('incorrect number of arena: expected ' + this.number_concurrent_games + ', actual: ' + headers.arena.length);

		this.book.forEach(function (week, weekIdx) {
			const bar = '+----------------------------------------------+\n';
			str += bar;
			str += '| ' + _.padEnd(headers.week[weekIdx], 44) + ' |\n';
			str += bar;
			str += '| Time |    A    |    B    |    C    |    D    |\n'; // XXX use arena headers
			str += bar;

			week.forEach(function (time, timeIdx) {
				str += '| ' + headers.time[timeIdx] + ' |';

				time.forEach(function (match) {
					if(match) {
						str += ' ';
						str += match.map(function (t) { return _.padStart(t, 2, '0'); }).join(' - ');
						str += ' |';
					}
					else {
						str += '  empty  |';
					}
				});

				str += '\n';
				str += bar;
			});

			str += '\n';
		});

		return str;
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

exports.createEmptyBook = createEmptyBook;
function createEmptyBook({ number_of_weeks, number_time_slots_per_week, number_concurrent_games }) {
	const book = [];

	for(let b = 0; b < number_of_weeks; b++) {
		const week = [];

		for(let t = 0; t < number_time_slots_per_week; t++) {
			const time = [];

			for(let a = 0; a < number_concurrent_games; a++) {
				time.push(null);
			}

			week.push(time);
		}

		book.push(week);
	}

	return book;
}
