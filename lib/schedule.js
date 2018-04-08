/**
 * This was not written to be generic, it matches our use case exactly.
 * Some things try to be generic, but only when convenient.
 */
'use strict';
const _ = require('lodash');
const debug = require('debug')('golden-schedule:schedule');

exports.TEAM_6_VAL = 6; // team numbers are 1-based
exports.TEAM_6_POS = 5; // arrays of teams are 0-based

exports.Schedule = class Schedule {
	constructor() {
		this.TEAM_6_VAL = exports.TEAM_6_VAL; // HACK just to get around an import
		this.TEAM_6_POS = exports.TEAM_6_POS; // HACK just to get around an import

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

	clone() {
		const schedule = new Schedule();
		schedule.remainingMatches = this.remainingMatches.slice(0);
		schedule.book = _.cloneDeep(this.book); // TODO this breaks references to the original remainingMatches
		return schedule;
	}

	get finished() {
		return !!this.remainingMatches && !this.remainingMatches.length;
	}

	// check all the rules of our schedule, these are all the constraints
	// TODO is it better to keep a 'book of allowable matches' and index into it?
	// - we can update the allowable list whenever we call setMatch
	// - then we can reject the match if it's not available, making setMatch less permissive
	calcAllowableMatches({ week, time }) {
		let pullTeams = [];
		let pullMatches = [];

		// team once per time slot on a given week
		Array.prototype.push.apply(pullTeams, _.chain(this.book[week][time])
			.compact().flatten()
			.uniq()
			.value());

		// team twice per week
		const occured = {};
		_.chain(this.book[week])
			.flatten().compact().flatten()
			.forEach(function (t) {
				if(occured[t]) pullTeams.push(t);
				else occured[t] = true;
			})
			.value();

		// team 6 has only late matches
		if(time === 0) pullTeams.push(exports.TEAM_6_VAL);

		// XXX avoid too many splits
		// - if we have metrics cache
		// - if time === 0 or time === 2
		// - if a team already has 5 splits
		// - if this would create a split
		// - then remove the team
		// ---
		// - sounds like we should just let it happen
		// - and if it does, then treat it as a dead end

		// delayed rematch
		Array.prototype.push.apply(pullMatches, _.chain(this.book)
			.slice(Math.max(0, week - 4), Math.min(week + 5, this.number_of_weeks))
			.flatten().flatten().compact()
			.value());

		pullTeams = _.uniq(pullTeams);
		pullMatches = _.uniq(pullMatches);
		return this.remainingMatches
			.filter((m) => !_.some(pullTeams, (t) => _.includes(m, t)))
			.filter((m) => !_.some(pullMatches, (pm) => _.isEqual(m, pm)));
	}

	setMatch({ week, time, arena }, match) {
		if(!match) {
			debug('match not provided', arguments);
			throw new Error('match not provided');
		}
		if(this.book[week][time][arena]) {
			debug('this spot is already booked', arguments);
			throw new Error('this spot is already booked');
		}
		// TODO allow fuzzy matches
		// - const m = _.find(s.remainingMatches, _.matches([1, 2]));
		// - remove for _.find and _.matches everywhere else
		if(_.indexOf(this.remainingMatches, match) === -1) {
			debug('this match is not available', arguments);
			throw new Error('this match is not available');
		}

		_.pull(this.remainingMatches, match);
		this.book[week][time][arena] = match;
	}

	// XXX this is specifically designed for number_time_slots_per_week === 3
	// TODO instead of calculating metrics in one shot, why not keep track of them as we go
	// - we can update them whenever we do a setMatch
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
			const first = _.compact(_.flatten(week[0]));
			const second = _.compact(_.flatten(week[1]));
			const third = _.compact(_.flatten(week[2]));

			_.intersection(first, second).forEach(function (team) { early[team-1]++; });
			_.intersection(second, third).forEach(function (team) { late[team-1]++; });
			_.intersection(first, third).forEach(function (team) { split[team-1]++; });
		});

		return { early, late, split };
	}

	// XXX this method is implemented exactly for our use case
	prettyPrint(headers, contentType = 'match') {
		let str = '';

		if(!headers || !headers.week || !headers.time || !headers.arena)
			throw new Error('must provide headers for week, time, arena');
		if(headers.week.length !== this.number_of_weeks)
			throw new Error('incorrect number of weeks: expected ' + this.number_of_weeks + ', actual: ' + headers.week.length);
		if(headers.time.length !== this.number_time_slots_per_week)
			throw new Error('incorrect number of times: expected ' + this.number_time_slots_per_week + ', actual: ' + headers.time.length);
		if(headers.arena.length !== this.number_concurrent_games)
			throw new Error('incorrect number of arena: expected ' + this.number_concurrent_games + ', actual: ' + headers.arena.length);

		if(!_.includes(['match', 'availableMatchCount'], contentType))
			throw new Error('invalid contentType', contentType);

		this.book.forEach((week, weekIdx) => {
			const bar = '+--------------------------------------+\n';
			str += bar;
			str += '| ' + _.padEnd(headers.week[weekIdx], 36) + ' |\n';
			str += bar;
			str += '| Time |   A   |   B   |   C   |   D   |\n'; // XXX use arena headers
			str += bar;

			week.forEach((time, timeIdx) => {
				str += '| ' + headers.time[timeIdx] + ' |';

				time.forEach((match, arenaIdx) => {
					str += ' ';
					switch(contentType) {
						case 'match':
							if(match) {
								str += _.padStart(match[0], 2) + '-' + _.padEnd(match[1], 2);
							}
							else {
								str += 'empty';
							}
							break;
						case 'availableMatchCount':
							if(match) {
								str += ' set ';
							}
							else {
								str += _.padStart(this.calcAllowableMatches({ week: weekIdx, time: timeIdx, arena: arenaIdx }).length, 5);
							}
					}
					str += ' |';
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
