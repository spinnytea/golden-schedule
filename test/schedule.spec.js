'use strict';
const _ = require('lodash');
const expect = require('chai').expect;
const schedule = require('../lib/schedule');

describe('schedule', function () {
	describe('Schedule', function () {
		let s;
		beforeEach(function () {
			s = new schedule.Schedule();
			s.init();
		});
		function setMatch(week, time, arena, match) {
			const m = _.find(s.remainingMatches, _.matches(match));
			s.setMatch({ week, time, arena }, m);
		}

		it('number of team-slots per week', function () {
			const slots_needed = s.number_of_teams * s.number_of_team_games_per_week;
			const available_slots = s.number_concurrent_games * s.number_time_slots_per_week * s.teams_per_game;
			expect(slots_needed).to.equal(available_slots);
			expect(available_slots).to.equal(24);
		});

		it('total number of matches', function () {
			// XXX (NUMBER_OF_TEAMS choose NUMBER_OF_TEAM_GAMES_PER_WEEK)
			const teams_choose_games = s.number_of_teams * (s.number_of_teams - 1) / 2;
			expect(s.number_of_team_games_per_week).to.equal(2);

			const games_needed = teams_choose_games * s.number_of_pairing_matches;
			const available_games = s.number_concurrent_games * s.number_time_slots_per_week * s.number_of_weeks;
			expect(games_needed).to.equal(available_games);
			expect(available_games).to.equal(s.remainingMatches.length);
			expect(available_games).to.equal(132);
		});

		it('total number of matches in the books', function () {
			let chain = _.chain(s.book);
			expect(chain.size().value()).to.equal(s.number_of_weeks);

			chain = chain.flatten();
			expect(chain.size().value()).to.equal(s.number_of_weeks * s.number_time_slots_per_week);

			chain = chain.flatten();
			expect(chain.size().value()).to.equal(s.remainingMatches.length);
		});

		it('clone', function () {
			s.book[0][0][0] = s.remainingMatches.pop();

			const c = s.clone();

			expect(c).to.deep.equal(s);

			c.book[0][0][1] = c.remainingMatches.pop();

			expect(c).to.not.deep.equal(s);
			expect(c.remainingMatches.length).to.equal(s.remainingMatches.length - 1);
			expect(c.book[0][0][0]).to.deep.equal(s.book[0][0][0]);
			expect(c.book[0][0][1]).to.not.deep.equal(s.book[0][0][1]);
		});

		it('finished', function () {
			expect(s.finished).to.equal(false);
			s.remainingMatches.splice(0);
			expect(s.finished).to.equal(true);
		});

		describe('calcAllowableMatches', function () {
			it('empty allows all', function () {
				// we need to use the middle time slot since team 6 isn't allowed there
				const allowable = s.calcAllowableMatches({ week: 0, time: 1, arena: 0 });
				expect(allowable).to.deep.equal(_.uniqWith(s.remainingMatches, _.isEqual));
				expect(allowable.length).to.equal(s.remainingMatches.length / 2);
			});

			it('nothing is allowed if already booked - OR - ignore current booking for allowable calculation');

			it('team once per time slot on a given week', function () {
				setMatch(0, 1, 0, [1, 2]);

				let allowable = s.calcAllowableMatches({ week: 0, time: 1, arena: 2 });
				expect(_.chain(allowable).flatten().uniq().value()).to.have.members([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

				setMatch(0, 1, 1, [3, 4]);

				allowable = s.calcAllowableMatches({ week: 0, time: 1, arena: 2 });
				expect(_.chain(allowable).flatten().uniq().value()).to.have.members([5, 6, 7, 8, 9, 10, 11, 12]);
			});

			it('team twice per week', function () {
				setMatch(0, 0, 0, [1, 2]);
				setMatch(0, 1, 0, [1, 3]);

				let allowable = s.calcAllowableMatches({ week: 0, time: 2, arena: 0 });
				expect(_.chain(allowable).flatten().uniq().value()).to.have.members([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

				setMatch(0, 0, 1, [3, 4]);
				setMatch(0, 1, 1, [2, 4]);

				allowable = s.calcAllowableMatches({ week: 0, time: 2, arena: 0 });
				expect(_.chain(allowable).flatten().uniq().value()).to.have.members([5, 6, 7, 8, 9, 10, 11, 12]);
			});

			it('delayed rematch', function () {
				setMatch(5, 0, 0, [1, 2]);

				expect(s.calcAllowableMatches({ week: 0, time: 2, arena: 0 }).some((a) => _.isEqual(a, [1, 2]))).to.equal(true);
				expect(s.calcAllowableMatches({ week: 1, time: 2, arena: 0 }).some((a) => _.isEqual(a, [1, 2]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 2, time: 2, arena: 0 }).some((a) => _.isEqual(a, [1, 2]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 3, time: 2, arena: 0 }).some((a) => _.isEqual(a, [1, 2]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 4, time: 2, arena: 0 }).some((a) => _.isEqual(a, [1, 2]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 5, time: 2, arena: 0 }).some((a) => _.isEqual(a, [1, 2]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 6, time: 2, arena: 0 }).some((a) => _.isEqual(a, [1, 2]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 7, time: 2, arena: 0 }).some((a) => _.isEqual(a, [1, 2]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 8, time: 2, arena: 0 }).some((a) => _.isEqual(a, [1, 2]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 9, time: 2, arena: 0 }).some((a) => _.isEqual(a, [1, 2]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 10, time: 2, arena: 0 }).some((a) => _.isEqual(a, [1, 2]))).to.equal(true);

				setMatch(0, 0, 0, [3, 4]);

				expect(s.calcAllowableMatches({ week: 0, time: 2, arena: 0 }).some((a) => _.isEqual(a, [3, 4]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 1, time: 2, arena: 0 }).some((a) => _.isEqual(a, [3, 4]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 2, time: 2, arena: 0 }).some((a) => _.isEqual(a, [3, 4]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 3, time: 2, arena: 0 }).some((a) => _.isEqual(a, [3, 4]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 4, time: 2, arena: 0 }).some((a) => _.isEqual(a, [3, 4]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 5, time: 2, arena: 0 }).some((a) => _.isEqual(a, [3, 4]))).to.equal(true);
				expect(s.calcAllowableMatches({ week: 6, time: 2, arena: 0 }).some((a) => _.isEqual(a, [3, 4]))).to.equal(true);
				expect(s.calcAllowableMatches({ week: 7, time: 2, arena: 0 }).some((a) => _.isEqual(a, [3, 4]))).to.equal(true);
				expect(s.calcAllowableMatches({ week: 8, time: 2, arena: 0 }).some((a) => _.isEqual(a, [3, 4]))).to.equal(true);
				expect(s.calcAllowableMatches({ week: 9, time: 2, arena: 0 }).some((a) => _.isEqual(a, [3, 4]))).to.equal(true);
				expect(s.calcAllowableMatches({ week: 10, time: 2, arena: 0 }).some((a) => _.isEqual(a, [3, 4]))).to.equal(true);

				setMatch(10, 0, 0, [5, 6]);

				expect(s.calcAllowableMatches({ week: 0, time: 2, arena: 0 }).some((a) => _.isEqual(a, [5, 6]))).to.equal(true);
				expect(s.calcAllowableMatches({ week: 1, time: 2, arena: 0 }).some((a) => _.isEqual(a, [5, 6]))).to.equal(true);
				expect(s.calcAllowableMatches({ week: 2, time: 2, arena: 0 }).some((a) => _.isEqual(a, [5, 6]))).to.equal(true);
				expect(s.calcAllowableMatches({ week: 3, time: 2, arena: 0 }).some((a) => _.isEqual(a, [5, 6]))).to.equal(true);
				expect(s.calcAllowableMatches({ week: 4, time: 2, arena: 0 }).some((a) => _.isEqual(a, [5, 6]))).to.equal(true);
				expect(s.calcAllowableMatches({ week: 5, time: 2, arena: 0 }).some((a) => _.isEqual(a, [5, 6]))).to.equal(true);
				expect(s.calcAllowableMatches({ week: 6, time: 2, arena: 0 }).some((a) => _.isEqual(a, [5, 6]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 7, time: 2, arena: 0 }).some((a) => _.isEqual(a, [5, 6]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 8, time: 2, arena: 0 }).some((a) => _.isEqual(a, [5, 6]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 9, time: 2, arena: 0 }).some((a) => _.isEqual(a, [5, 6]))).to.equal(false);
				expect(s.calcAllowableMatches({ week: 10, time: 2, arena: 0 }).some((a) => _.isEqual(a, [5, 6]))).to.equal(false);
			});

			it('team 6 has only late matches', function () {
				const allowable = s.calcAllowableMatches({ week: 0, time: 0, arena: 0 });
				expect(_.chain(allowable).flatten().uniq().value()).to.have.members([1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12]);
			});

			it('check for only one match', function () {
				// fill in with example
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
				// setMatch(0, 2, 3, [6, 8]);

				// there is only one option now, all other teams have played
				let allowable = s.calcAllowableMatches({ week: 0, time: 2, arena: 3 });
				expect(allowable).to.deep.equal([[6, 8]]);


				// schedule the last available match on a nearby day
				setMatch(1, 0, 0, [6, 8]);

				// this means there are no available matches for the last slot on this day
				allowable = s.calcAllowableMatches({ week: 0, time: 2, arena: 3 });
				expect(allowable).to.deep.equal([]);
			});
		});

		describe('setMatch', function () {
			it('not provided', function () {
				expect(function () {
					s.setMatch({ week: 0, time: 0, arena: 0 }, undefined);
				}).to.throw('match not provided');
			});

			it('spot already booked', function () {
				const m = _.find(s.remainingMatches, _.matches([1, 2]));
				s.book[0][0][0] = 'something is here';

				expect(function () {
					s.setMatch({ week: 0, time: 0, arena: 0 }, m);
				}).to.throw('this spot is already booked');
			});

			it('match not available', function () {
				expect(function () {
					s.setMatch({ week: 0, time: 0, arena: 0 }, 'strings are not matches');
				}).to.throw('this match is not available');

				expect(function () {
					s.setMatch({ week: 0, time: 0, arena: 0 }, [1, 2]); // must be exact object match (not similar array)
				}).to.throw('this match is not available');
			});

			it('success', function () {
				expect(s.remainingMatches.length).to.equal(132); // all our matches
				expect(s.book[0][0][0]).to.equal(null); // not booked yet

				const m = _.find(s.remainingMatches, _.matches([1, 2]));
				s.setMatch({ week: 0, time: 0, arena: 0 }, m);

				expect(s.remainingMatches.length).to.equal(131); // it's not in the remaining list anymore
				expect(s.book[0][0][0]).to.equal(m); // we set it
				expect(_.find(s.remainingMatches, _.matches([1, 2]))).to.deep.equal([1, 2]); // there is another
				expect(_.find(s.remainingMatches, _.matches([1, 2]))).to.not.equal(m); // it's not the one we already found
			});
		});

		it('metrics', function () {
			expect(s.metrics).to.deep.equal({
				early: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				late: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				split: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			});
			expect(s.metrics.early).to.not.have.property('-1'); // bugfix

			setMatch(0, 0, 0, [1, 2]);
			setMatch(0, 1, 0, [2, 3]);
			setMatch(0, 2, 0, [1, 3]);
			setMatch(0, 2, 1, [4, 5]);

			expect(s.metrics).to.deep.equal({
				early: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				late: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				split: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			});
		});
	});

	it('computeAllMatches', function () {
		const matches = schedule.computeAllMatches({
			number_of_teams: 12,
			number_of_pairing_matches: 2,
		});

		expect(matches.slice(0, 5)).to.deep.equal([
			[1, 2], [1, 2],
			[1, 3], [1, 3],
			[1, 4],
		]);
		expect(matches.slice(-5)).to.deep.equal([
			[10, 11],
			[10, 12], [10, 12],
			[11, 12], [11, 12],
		]);
	});
});