/**
 * This was not written to be generic, it matches our use case exactly.
 * Some things try to be generic, but only when convenient.
 */
'use strict';
const _ = require('lodash');
const debug = require('debug')('golden-schedule:schedule');
const BookIterator = require('./bookIterator').BookIterator;

exports.TEAM_6_VAL = 6; // team numbers are 1-based
exports.TEAM_6_POS = 5; // arrays of teams are 0-based
exports.DELAY_REMATCH = 4; // floor(weeks / 2); 3 is relaxed, 4 is normal, 5 is super strict

// see scheduleExample.spec.js 'metrics' and 'confirm ideal metrics' for more details
const IDEAL_EARLY = 4; // since team 6 gets none
const IDEAL_LATE = 3; // since team 6 always gets them
const IDEAL_SPLIT = 4; // since team 6 gets none
// TODO make these max values stricter
exports.MAX_EARLY = IDEAL_EARLY;
exports.MAX_LATE = IDEAL_LATE;
exports.MAX_SPLIT = IDEAL_SPLIT;


exports.Schedule = class Schedule {
	constructor() {
		// HACK just to get around an import
		this.TEAM_6_VAL = exports.TEAM_6_VAL;
		this.TEAM_6_POS = exports.TEAM_6_POS;
		this.DELAY_REMATCH = exports.DELAY_REMATCH;
		this.MAX_EARLY = exports.MAX_EARLY;
		this.MAX_LATE = exports.MAX_LATE;
		this.MAX_SPLIT = exports.MAX_SPLIT;

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
		// reverse it just so the searching starts with 1-2
		// reversing is inconsequential
		this.remainingMatches = computeAllMatches(this);
		this.book = createEmptyBook(this);
		return this;
	}

	clone() {
		const schedule = new Schedule();
		schedule.DELAY_REMATCH = this.DELAY_REMATCH;
		schedule.MAX_EARLY = this.MAX_EARLY;
		schedule.MAX_LATE = this.MAX_LATE;
		schedule.MAX_SPLIT = this.MAX_SPLIT;
		schedule.remainingMatches = this.remainingMatches.slice(0);
		schedule.book = _.cloneDeep(this.book); // XXX this breaks references to the original remainingMatches
		return schedule;
	}

	get finished() {
		return !!this.remainingMatches && !this.remainingMatches.length;
	}

	// check all the rules of our schedule, these are all the constraints
	// TODO is it better to keep a 'book of allowable matches' and index into it?
	// - we can update the allowable list whenever we call setMatch
	// - then we can reject the match if it's not available, making setMatch less permissive
	// FIXME what if a match cannot be placed later due to rematch constraints? is that an issue?
	// - you don't have to code it, but at least give it some thought, is it a concern?
	// - heuristic to prioritize new matches? is that even worth the computation? we already block them
	// - if we lower the rematch distance, then the heuristic is more useful and the hard check is less useful
	calcAllowableMatches({ week, time, arena }) {
		if(this.hasMatch({ week, time, arena })) return [];

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

		// delayed rematch
		Array.prototype.push.apply(pullMatches, _.chain(this.book)
			.slice(Math.max(0, week - this.DELAY_REMATCH), Math.min(week + this.DELAY_REMATCH + 1, this.number_of_weeks))
			.flatten().flatten().compact()
			.value());

		pullTeams = _.uniq(pullTeams);
		pullMatches = _.uniq(pullMatches);
		return _.chain(this.remainingMatches)
			.filter((m) => !_.some(pullTeams, (t) => _.includes(m, t)))
			.filter((m) => !_.some(pullMatches, (pm) => _.isEqual(m, pm)))
			// .uniqWith(_.isEqual) // too slow
			.uniqBy((m) => (m[0] + '-' + m[1]))
			.value();
	}

	hasMatch(coords) {
		return !!this.getMatch(coords);
	}

	getMatch({ week, time, arena }) {
		return this.book[week][time][arena];
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
		// XXX allow fuzzy matches
		// - const m = _.find(s.remainingMatches, _.matches([1, 2]));
		// - remove for _.find and _.matches everywhere else
		if(_.indexOf(this.remainingMatches, match) === -1) {
			debug('this match is not available', arguments);
			throw new Error('this match is not available');
		}

		_.pull(this.remainingMatches, match);
		this.book[week][time][arena] = match;
	}

	// this changes the metrics for a given day, so we can't is it to optimize filling in a week
	swapLate(week) {
		if(_.isNumber(week) && week < this.number_of_weeks) {
			const temp = this.book[week][1];
			this.book[week][1] = this.book[week][2];
			this.book[week][2] = temp;
		}
		else if(_.isString(week) && week.length === this.number_of_weeks) {
			week.split('').map((s) => (s === '1')).forEach((s, idx) => {
				if(s) this.swapLate(idx);
			});
		}
	}

	swapTeams(teams) {
		// not all the checks we could need, but some harder to catch ones
		if(teams.length !== this.number_of_teams) throw new Error('wrong number of swaps');
		if(_.uniq(teams).length !== this.number_of_teams) throw new Error('bad swaps, dups');

		// swap teams
		const originalBook = _.cloneDeep(this.book);
		(new BookIterator(this)).forEach((coords) => {
			teams.forEach((dst, srcIdx) => {
				const src = srcIdx+1;
				if(originalBook[coords.week][coords.time][coords.arena][0] === src) this.book[coords.week][coords.time][coords.arena][0] = dst;
				if(originalBook[coords.week][coords.time][coords.arena][1] === src) this.book[coords.week][coords.time][coords.arena][1] = dst;
			});
		});

		// sort matchups
		(new BookIterator(this)).forEach((coords) => {
			this.book[coords.week][coords.time][coords.arena].sort((a, b) => (a-b));
		});
	}

	// XXX this is specifically designed for number_time_slots_per_week === 3
	// XXX are there other stats to check besides timeslots?
	calcMetrics() {
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

		const rematchWeeks = [];
		const rematchCache = {};
		while(rematchWeeks.length < this.number_of_weeks) {
			rematchWeeks.push(0);
		}

		(new BookIterator(this)).forEach((coords) => {
			const m = this.getMatch(coords);
			if(checkRematch(rematchCache, m)) {
				rematchWeeks[coords.week]++;
			}
		});

		return {
			early,
			late,
			split,
			maxEarly: _.max(early),
			maxLate: _.max(_.values(_.omit(late, this.TEAM_6_POS))), // OPTIMIZE max without team 6
			maxSplit: _.max(split),
			rematchWeeks: rematchWeeks,
		};
	}

	// XXX this method is implemented exactly for our use case
	prettyBook(headers, contentType = 'match') {
		let str = '';

		if(!headers || !headers.week || !headers.time || !headers.arena)
			throw new Error('must provide headers for week, time, arena');
		if(headers.week.length !== this.number_of_weeks)
			throw new Error('incorrect number of weeks: expected ' + this.number_of_weeks + ', actual: ' + headers.week.length);
		if(headers.time.length !== this.number_time_slots_per_week)
			throw new Error('incorrect number of times: expected ' + this.number_time_slots_per_week + ', actual: ' + headers.time.length);
		if(headers.arena.length !== this.number_concurrent_games)
			throw new Error('incorrect number of arena: expected ' + this.number_concurrent_games + ', actual: ' + headers.arena.length);

		if(!_.includes(['match', 'availableMatchCount', 'rematch'], contentType))
			throw new Error('invalid contentType', contentType);

		const checkRematchCache = {};
		this.book.forEach((week, weekIdx) => {
			str += '## ' + headers.week[weekIdx] + ' (Week ' + (weekIdx+1) + ')\n\n';

			str += '| Time |   A   |   B   |   C   |   D   |\n'; // XXX use arena headers
			str += '|------|-------|-------|-------|-------|\n';

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
							break;
						case 'rematch':
							if(match && checkRematch(checkRematchCache, match)) {
								str += 'REMAT';
							}
							else if(match) {
								str += '     ';
							}
							else {
								str += '  -  ';
							}
							break;
					}
					str += ' |';
				});

				str += '\n';
			});

			str += '\n';
		});

		return str;
	}

	prettyMetrics() {
		const metrics = this.calcMetrics();
		let str = '';

		str += '| Team  | Early | Late  | Split |\n'; // XXX use arena headers
		str += '|-------|-------|-------|-------|\n';
		str += '|  ' + [
			'MAX',
			metrics.maxEarly,
			metrics.maxLate,
			metrics.maxSplit,
		].map((n) => _.padStart(n, 2)).join('  |   ') + '  |\n';

		for(let t = 0; t < this.number_of_teams; t++) {
			str += '|   ' + [
				t+1,
				metrics.early[t],
				metrics.late[t],
				metrics.split[t],
			].map((n) => _.padStart(n, 2)).join('  |   ') + '  |\n';
		}

		return str;
	}
};

// XXX use TEAMS_PER_GAME, assuming 2 (that's the a/b part)
exports.computeAllMatches = computeAllMatches;
function computeAllMatches({ number_of_teams, number_of_pairing_matches }) {
	const matches = [];

	// for(let a = 1; a <= number_of_teams; a++)
	// 	for(let b = a+1; b <= number_of_teams; b++)
	// for(let a = number_of_teams; a >= 1; a--)
	// 	for(let b = a-1; b >= 1; b--)

	for(let a = 1; a <= number_of_teams; a++)
		for(let b = a+1; b <= number_of_teams; b++) {
			matches.push([a, b]);
			matches.unshift([a, b]);
		}

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

function checkRematch(cache, match) {
	if(match) {
		if(!cache[match[0]]) cache[match[0]] = {};
		if(!cache[match[0]][match[1]]) {
			cache[match[0]][match[1]] = true;
			return false;
		}
		else {
			return true;
		}
	}
}
