/**
 * this is using the reference schedule
 * it's the one that works, but that we were asked to optimize
 */
'use strict';
const _ = require('lodash');
const debug = require('debug')('golden-schedule:scheduleExample');
const expect = require('chai').expect;
const Schedule = require('../lib/schedule').Schedule;

describe('Schedule Example', function () {
	const schedule = new Schedule();
	before(function () {
		schedule.init();
		setupMatches();

		if(debug.enabled) debug(schedule.prettyBook({
			week: ['June 1', 'June 8', 'June 15', 'June 22', 'June 29', 'July 6', 'July 13', 'July 20', 'July 27', 'August 3', 'August 10'],
			time: ['6:30', '7:40', '8:50'],
			arena: ['A', 'B', 'C', 'D'],
		}));
	});

	it('finished', function () {
		expect(schedule.finished).to.equal(true);
	});

	it('metrics', function () {
		const metrics = schedule.calcMetrics();

		// confirmed: Team 3: Early 5, Late 3 (csv has Early 6, Late 2)
		expect(metrics.early).to.deep.equal([4, 3, 5, 3, 4, 0, 5, 3, 7, 3, 5, 2]);
		expect(metrics.late).to.deep.equal([1, 1, 3, 8, 3, 11, 1, 7, 0, 7, 0, 2]);
		expect(metrics.split).to.deep.equal([6, 7, 3, 0, 4, 0, 5, 1, 4, 1, 6, 7]);

		// each time slot, 4 teams are on the bench
		// each week, 4 teams have an early game, 4 have a split, and 4 have a late
		// (team 6 gave up early/split, so everyone else has more of those and less late games)
		expect(_.sum(metrics.early)).to.equal(4 * schedule.number_of_weeks);
		expect(_.sum(metrics.late)).to.equal(4 * schedule.number_of_weeks);
		expect(_.sum(metrics.split)).to.equal(4 * schedule.number_of_weeks);

		for(let t = 0; t<schedule.number_of_teams; t++) {
			// each week a team plays 2 games
			// so each week, a team has either early OR late OR split
			// so all of them combined is 1 per week
			expect(metrics.early[t] + metrics.late[t] + metrics.split[t]).to.equal(schedule.number_of_weeks);
		}
	});

	it('swapLate', function () {
		const a = [[6, 8], [2, 5], [1, 7], [3, 4]];
		const b = [[6, 12], [5, 9], [7, 11], [4, 10]];
		const s = schedule.clone();

		s.swapLate(10);

		expect(schedule.book[10][1]).to.deep.equal(a);
		expect(schedule.book[10][2]).to.deep.equal(b);
		expect(s.book[10][1]).to.deep.equal(b);
		expect(s.book[10][2]).to.deep.equal(a);

		const metrics = s.calcMetrics();
		expect(metrics.early).to.deep.equal([3, 2, 4, 3, 4, 0, 5, 2, 8, 4, 6, 3]);
		expect(metrics.late).to.deep.equal([1, 1, 3, 8, 3, 11, 1, 7, 0, 7, 0, 2]);
		expect(metrics.split).to.deep.equal([7, 8, 4, 0, 4, 0, 5, 2, 3, 0, 5, 6]);
	});

	it('confirm ideal metrics', function () {
		const metrics = schedule.calcMetrics();

		// since team 6 gets none
		// 44 (total) / 11 (teams)
		const averageEarly = (_.sum(metrics.early) - metrics.early[schedule.TEAM_6_POS]) / (schedule.number_of_teams - 1);
		expect(averageEarly).to.equal(4);

		// since team 6 always gets them
		// 33 (remaining) / 11 (teams)
		const averageLate = (_.sum(metrics.late) - metrics.late[schedule.TEAM_6_POS]) / (schedule.number_of_teams - 1);
		expect(averageLate).to.equal(3);

		// since team 6 gets none
		// 44 (total) / 11 (teams)
		const averageSplit = (_.sum(metrics.split) - metrics.split[schedule.TEAM_6_POS]) / (schedule.number_of_teams - 1);
		expect(averageSplit).to.equal(4);
	});

	describe('try all swaps', function () {
		describe('crunch options', function () {
			let bestName = null;
			let bestMetrics = null;
			let bestMetaMetric = Infinity;
			after(function () {
				console.log('best', bestName, bestMetaMetric, bestMetrics);
			});

			// to enable tests, just set the number of weeks to check
			const weeks = 0; // to really run, set to 11; it takes a while
			const maxIters = Math.pow(2, weeks);
			if(weeks) for(let i = 0; i < maxIters; i++) {
				let name = _.padStart(i.toString(2), 11, 0);
				it.only(name, function () {
					const s = schedule.clone();
					s.swapLate(name);

					const metrics = s.calcMetrics();
					const metaMetric = metrics.maxEarly + metrics.maxLate + metrics.maxSplit;
					// const metaMetric = metrics.maxSplit;
					if(metaMetric < bestMetaMetric) {
						bestName = name;
						bestMetrics = metrics;
						bestMetaMetric = metaMetric;
					}
				});
			}
		});

		// these are swaps from the original example
		describe('saved', function () {
			// coincidentally, this is the best for bestMeta of _.sum(max) and of maxSplit
			it('00100101101', function () {
				const s = schedule.clone();
				s.swapLate('00100101101');
				expect(s.calcMetrics()).to.deep.equal({
					early: [5, 5, 3, 3, 3, 0, 5, 1, 6, 2, 6, 5],
					late: [1, 1, 3, 8, 3, 11, 1, 7, 0, 7, 0, 2],
					split: [5, 5, 5, 0, 5, 0, 5, 3, 5, 2, 5, 4],
					maxEarly: 6, minEarly: 1,
					maxLate: 8, minLate: 0,
					maxSplit: 5, minSplit: 0,
					rematchWeeks: [0, 0, 0, 0, 0, 6, 12, 12, 12, 12, 12],
				});
				s.swapTeams([1, 2, 3, 5, 4, 6, 7, 8, 9, 10, 11, 12]);
				expect(s.calcMetrics()).to.deep.equal({
					early: [5, 5, 3, 3, 3, 0, 5, 1, 6, 2, 6, 5],
					late: [1, 1, 3, 3, 8, 11, 1, 7, 0, 7, 0, 2],
					split: [5, 5, 5, 5, 0, 0, 5, 3, 5, 2, 5, 4],
					maxEarly: 6, minEarly: 1,
					maxLate: 8, minLate: 0,
					maxSplit: 5, minSplit: 0,
					rematchWeeks: [0, 0, 0, 0, 0, 6, 12, 12, 12, 12, 12],
				});

				// console.log(s.prettyMetrics());

				// console.log(s.prettyBook({
				// 	week: ['June 1', 'June 8', 'June 15', 'June 22', 'June 29', 'July 6', 'July 13', 'July 20', 'July 27', 'August 3', 'August 10'],
				// 	time: ['6:30', '7:40', '8:50'],
				// 	arena: ['A', 'B', 'C', 'D'],
				// }));
			});
		});
	});

	// Pump it full of data
	function setupMatches() {
		// June 1
		setMatch(0, 0, 0, [2, 12]);
		setMatch(0, 0, 1, [4, 11]);
		setMatch(0, 0, 2, [7, 8]);
		setMatch(0, 0, 3, [5, 9]);
		setMatch(0, 1, 0, [3, 12]);
		setMatch(0, 1, 1, [4, 10]);
		setMatch(0, 1, 2, [1, 7]);
		setMatch(0, 1, 3, [6, 9]);
		setMatch(0, 2, 0, [3, 11]);
		setMatch(0, 2, 1, [5, 10]);
		setMatch(0, 2, 2, [1, 2]);
		setMatch(0, 2, 3, [6, 8]);
		// June 8
		setMatch(1, 0, 0, [4, 9]);
		setMatch(1, 0, 1, [1, 5]);
		setMatch(1, 0, 2, [2, 11]);
		setMatch(1, 0, 3, [3, 7]);
		setMatch(1, 1, 0, [4, 6]);
		setMatch(1, 1, 1, [1, 12]);
		setMatch(1, 1, 2, [2, 8]);
		setMatch(1, 1, 3, [3, 10]);
		setMatch(1, 2, 0, [6, 7]);
		setMatch(1, 2, 1, [9, 12]);
		setMatch(1, 2, 2, [5, 8]);
		setMatch(1, 2, 3, [10, 11]);
		// June 15
		setMatch(2, 0, 0, [2, 7]);
		setMatch(2, 0, 1, [1, 3]);
		setMatch(2, 0, 2, [9, 11]);
		setMatch(2, 0, 3, [5, 12]);
		setMatch(2, 1, 0, [7, 10]);
		setMatch(2, 1, 1, [3, 6]);
		setMatch(2, 1, 2, [8, 9]);
		setMatch(2, 1, 3, [4, 5]);
		setMatch(2, 2, 0, [1, 10]);
		setMatch(2, 2, 1, [6, 11]);
		setMatch(2, 2, 2, [8, 12]);
		setMatch(2, 2, 3, [2, 4]);
		// June 22
		setMatch(3, 0, 0, [7, 9]);
		setMatch(3, 0, 1, [11, 12]);
		setMatch(3, 0, 2, [1, 8]);
		setMatch(3, 0, 3, [2, 10]);
		setMatch(3, 1, 0, [3, 9]);
		setMatch(3, 1, 1, [5, 11]);
		setMatch(3, 1, 2, [4, 8]);
		setMatch(3, 1, 3, [6, 10]);
		setMatch(3, 2, 0, [2, 3]);
		setMatch(3, 2, 1, [5, 7]);
		setMatch(3, 2, 2, [4, 12]);
		setMatch(3, 2, 3, [1, 6]);
		// June 29
		setMatch(4, 0, 0, [1, 11]);
		setMatch(4, 0, 1, [7, 12]);
		setMatch(4, 0, 2, [3, 5]);
		setMatch(4, 0, 3, [2, 9]);
		setMatch(4, 1, 0, [8, 11]);
		setMatch(4, 1, 1, [4, 7]);
		setMatch(4, 1, 2, [5, 6]);
		setMatch(4, 1, 3, [9, 10]);
		setMatch(4, 2, 0, [3, 8]);
		setMatch(4, 2, 1, [1, 4]);
		setMatch(4, 2, 2, [2, 6]);
		setMatch(4, 2, 3, [10, 12]);
		// July 6
		setMatch(5, 0, 0, [7, 11]);
		setMatch(5, 0, 1, [5, 10]);
		setMatch(5, 0, 2, [1, 9]);
		setMatch(5, 0, 3, [3, 12]);
		setMatch(5, 1, 0, [4, 11]);
		setMatch(5, 1, 1, [8, 10]);
		setMatch(5, 1, 2, [1, 2]);
		setMatch(5, 1, 3, [6, 12]);
		setMatch(5, 2, 0, [3, 4]);
		setMatch(5, 2, 1, [7, 8]);
		setMatch(5, 2, 2, [2, 5]);
		setMatch(5, 2, 3, [6, 9]);
		// July 13
		setMatch(6, 0, 0, [4, 9]);
		setMatch(6, 0, 1, [1, 5]);
		setMatch(6, 0, 2, [2, 11]);
		setMatch(6, 0, 3, [3, 7]);
		setMatch(6, 1, 0, [4, 6]);
		setMatch(6, 1, 1, [1, 12]);
		setMatch(6, 1, 2, [2, 8]);
		setMatch(6, 1, 3, [3, 10]);
		setMatch(6, 2, 0, [6, 7]);
		setMatch(6, 2, 1, [9, 12]);
		setMatch(6, 2, 2, [5, 8]);
		setMatch(6, 2, 3, [10, 11]);
		// July 20
		setMatch(7, 0, 0, [2, 7]);
		setMatch(7, 0, 1, [1, 3]);
		setMatch(7, 0, 2, [9, 11]);
		setMatch(7, 0, 3, [5, 12]);
		setMatch(7, 1, 0, [7, 10]);
		setMatch(7, 1, 1, [3, 6]);
		setMatch(7, 1, 2, [8, 9]);
		setMatch(7, 1, 3, [4, 5]);
		setMatch(7, 2, 0, [1, 10]);
		setMatch(7, 2, 1, [6, 11]);
		setMatch(7, 2, 2, [8, 12]);
		setMatch(7, 2, 3, [2, 4]);
		// July 27
		setMatch(8, 0, 0, [7, 9]);
		setMatch(8, 0, 1, [11, 12]);
		setMatch(8, 0, 2, [1, 8]);
		setMatch(8, 0, 3, [2, 10]);
		setMatch(8, 1, 0, [3, 9]);
		setMatch(8, 1, 1, [5, 11]);
		setMatch(8, 1, 2, [4, 8]);
		setMatch(8, 1, 3, [6, 10]);
		setMatch(8, 2, 0, [2, 3]);
		setMatch(8, 2, 1, [5, 7]);
		setMatch(8, 2, 2, [4, 12]);
		setMatch(8, 2, 3, [1, 6]);
		// August 3
		setMatch(9, 0, 0, [1, 11]);
		setMatch(9, 0, 1, [7, 12]);
		setMatch(9, 0, 2, [3, 5]);
		setMatch(9, 0, 3, [2, 9]);
		setMatch(9, 1, 0, [8, 11]);
		setMatch(9, 1, 1, [4, 7]);
		setMatch(9, 1, 2, [5, 6]);
		setMatch(9, 1, 3, [9, 10]);
		setMatch(9, 2, 0, [3, 8]);
		setMatch(9, 2, 1, [1, 4]);
		setMatch(9, 2, 2, [2, 6]);
		setMatch(9, 2, 3, [10, 12]);
		// August 10
		setMatch(10, 0, 0, [8, 10]);
		setMatch(10, 0, 1, [2, 12]);
		setMatch(10, 0, 2, [1, 9]);
		setMatch(10, 0, 3, [3, 11]);
		setMatch(10, 1, 0, [6, 8]);
		setMatch(10, 1, 1, [2, 5]);
		setMatch(10, 1, 2, [1, 7]);
		setMatch(10, 1, 3, [3, 4]);
		setMatch(10, 2, 0, [6, 12]);
		setMatch(10, 2, 1, [5, 9]);
		setMatch(10, 2, 2, [7, 11]);
		setMatch(10, 2, 3, [4, 10]);
	}
	function setMatch(week, time, arena, match) {
		const coords = { week, time, arena };

		if(debug.enabled) {
			let available = schedule.calcAllowableMatches(coords);
			debug('available matches', coords, available.length);
		}

		const m = _.find(schedule.remainingMatches, _.matches(match));
		schedule.setMatch(coords, m);
	}
});