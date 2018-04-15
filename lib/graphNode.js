/**
 * use some kind of graph traversal to search for valid schedules
 */
'use strict';
const _ = require('lodash');
const debug = require('debug')('golden-schedule:graphNode');
const BookIterator = require('./bookIterator').BookIterator;

exports.GraphNode = class GraphNode {
	constructor(schedule, coords, match) {
		this.schedule = schedule = schedule.clone();
		if(coords && match) {
			this.schedule.setMatch(coords, match);
		}

		this.heuristic = this.calculateHeuristic(coords);
		this.notDeadEnd = (this.heuristic > 0); // TODO rename notDeadEnd
	}

	/**
	 * heuristic function to pick next slot / match
	 * - favor most options (single most)
	 * - favor most future options (average most)
	 * - favor fewest options (single spot with only a few options to try)
	 * - favor min metrics (e.g. max split of 0 is favorable, max split of 3 is not)
	 *
	 * REVIEW tune heuristic, I'm just making stuff up
	 * - do we favor picking spot with "most options" or "least options"
	 *   - how how do we evaluate "information content"
	 *   - like, we want to keep our options open
	 *   - but if a spot only has 1 option, then we should just fill it in now
	 * - does even splits matter? or will it really help in the future?
	 *
	 * @param startCoords: this assumes that you only need to check things on or after the coords, that all previous are filled in
	 */
	calculateHeuristic(startCoords) {
		const schedule = this.schedule;
		// REVIEW it seems that the metrics heuristics are the hardest part to search for
		// - if we remove this 'max' restriction, we can get all the way to week 11
		// - if we relax the max and rematch, we can finish within 200 tries
		const metrics = schedule.calcMetrics();
		if(metrics.maxEarly > schedule.MAX_EARLY) return 0;
		if(metrics.maxLate > schedule.MAX_LATE) return 0;
		if(metrics.maxSplit > schedule.MAX_SPLIT) return 0;

		const remaining = schedule.remainingMatches.length;
		let allAllowable = 0; // sum of all allowable values
		let hasEmptyZero = false; // there is a spot that isn't filled in and there are no available matches
		let minAllowable = remaining;
		let maxAllowable = 0;

		if(debug.endabled) debug('calculateHeuristic', startCoords, (startCoords ? schedule.book[startCoords.week][startCoords.time][startCoords.arena] : undefined));

		const bookIterator = new BookIterator(schedule);
		if(startCoords) bookIterator.current = startCoords;
		bookIterator.forEach(function (coords) {
			const allowableCount = schedule.calcAllowableMatches(coords).length;
			allAllowable += allowableCount;

			if(!schedule.hasMatch(coords)) {
				minAllowable = Math.min(minAllowable, allowableCount);
				maxAllowable = Math.max(maxAllowable, allowableCount);

				if(allowableCount === 0) {
					hasEmptyZero = true;
				}
			}

			// possible exit early
			return !hasEmptyZero;
		});

		if(hasEmptyZero) return 0;

		let factors = []; // all the different things to consider, each should be a scale from 0 to 1
		if(remaining) {
			factors.push(allAllowable / remaining / remaining); // average number of options across all matches (appox)
			factors.push(maxAllowable / remaining); // single match with the most available options
		}
		else {
			factors.push(2);
		}
		factors.push(((schedule.MAX_EARLY - metrics.maxEarly) / schedule.MAX_EARLY)); // minimize early
		factors.push(((schedule.MAX_LATE - metrics.maxLate) / schedule.MAX_LATE)); // minimize late
		factors.push(((schedule.MAX_SPLIT - metrics.maxSplit) / schedule.MAX_SPLIT)); // minimize splits
		if(minAllowable < 5) factors.push(1); // if there are only a handful left, focus on those
		return _.sum(factors); // NOTE heuristic is not between 0 and 1
	}
};
