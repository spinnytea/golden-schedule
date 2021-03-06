/**
 * this is using the reference schedule
 * it's the one that works, but that we were asked to optimize
 */
'use strict';
const _ = require('lodash');
const debug = require('debug')('golden-schedule:scheduleExample');
const expect = require('chai').expect;
const SimpleGraphExpander = require('../lib/graphExpander').SimpleGraphExpander;
const GraphNode = require('../lib/graphNode').GraphNode;
const Schedule = require('../lib/schedule').Schedule;

describe('Graph Expander Example', function () {
	let graphExpander;
	before(function () {
		setupMatches();

		if(debug.enabled) debug(graphExpander.node.schedule.prettyBook({
			week: ['June 1', 'June 8', 'June 15', 'June 22', 'June 29', 'July 6', 'July 13', 'July 20', 'July 27', 'August 3', 'August 10'],
			time: ['6:30', '7:40', '8:50'],
			arena: ['A', 'B', 'C', 'D'],
		}));
	});

	it('check original maxes', function () {
		const exported = require('../lib/schedule').MAX_EARLY;
		expect(initializeSchedule.MAX_EARLY).to.equal(initializeSchedule.number_of_weeks);
		expect((new Schedule()).MAX_EARLY).to.equal(exported);
		expect(initializeSchedule.MAX_EARLY).to.be.gt(exported);
	});

	it('bugfix: tryNext on last', function () {
		expect(graphExpander.finished).to.equal(false);
		expect(graphExpander.coords).to.deep.equal({ week: 10, time: 2, arena: 3 });
		expect(graphExpander.node.schedule.remainingMatches).to.deep.equal([[4, 10]]);
		expect(graphExpander.node.schedule.calcAllowableMatches({ week: 10, time: 2, arena: 3 })).to.deep.equal([[4, 10]]);

		graphExpander.tryNext();

		expect(graphExpander.finished).to.equal(true);
		expect(graphExpander.coords).to.deep.equal({ week: 0, time: 0, arena: 0 });
		expect(graphExpander.node.schedule.remainingMatches).to.deep.equal([]);
	});

	// Pump it full of data
	const initializeSchedule = new Schedule();
	function setupMatches() {
		initializeSchedule.init();
		initializeSchedule.MAX_EARLY = initializeSchedule.number_of_weeks;
		initializeSchedule.MAX_LATE = initializeSchedule.number_of_weeks;
		initializeSchedule.MAX_SPLIT = initializeSchedule.number_of_weeks;

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
		// setMatch(10, 2, 3, [4, 10]);

		graphExpander = new SimpleGraphExpander(new GraphNode(initializeSchedule), { week: 10, time: 2, arena: 3 });
	}
	function setMatch(week, time, arena, match) {
		const coords = { week, time, arena };

		const m = _.find(initializeSchedule.remainingMatches, _.matches(match));
		initializeSchedule.setMatch(coords, m);
	}
});