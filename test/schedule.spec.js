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

		it('finished', function () {
			expect(s.finished).to.equal(false);
			s.remainingMatches.splice(0);
			expect(s.finished).to.equal(true);
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