/**
 * use some kind of graph traversal to search for valid schedules
 */
'use strict';
const _ = require('lodash');
const debug = require('debug')('golden-schedule:graphNode');
const BookIterator = require('./bookIterator').BookIterator;

// see scheduleExample.spec.js 'metrics' and 'confirm ideal metrics' for more details
const IDEAL_EARLY = 4; // since team 6 gets none
const IDEAL_LATE = 3; // since team 6 always gets them
const IDEAL_SPLIT = 4; // since team 6 gets none
// TODO make these max values stricter
const MAX_EARLY = IDEAL_EARLY + 1;
const MAX_LATE = IDEAL_LATE + 2;
const MAX_SPLIT = IDEAL_SPLIT + 1;

exports.GraphNode = class GraphNode {
	constructor(schedule, coords, match) {
		this.schedule = schedule = schedule.clone();
		if(coords && match) {
			this.schedule.setMatch(coords, match);
		}

		this.heuristic = calculateHeuristic(schedule, coords);
		this.notDeadEnd = (this.heuristic > 0); // TODO rename notDeadEnd
	}
};

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
 */
function calculateHeuristic(schedule, startCoords) {
	// REVIEW it seems that the metrics heuristics are the hardest part to search for
	// - if we remove this 'max' restriction, we can get all the way to week 11
	// - if we relax the max and rematch, we can finish within 200 tries
	const metrics = schedule.calcMetrics();
	if(metrics.maxEarly > MAX_EARLY) return 0;
	if(metrics.maxLate > MAX_LATE) return 0;
	if(metrics.maxSplit > MAX_SPLIT) return 0;

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
	factors.push(((MAX_EARLY - metrics.maxEarly) / MAX_EARLY)); // minimize early
	factors.push(((MAX_LATE - metrics.maxLate) / MAX_LATE)); // minimize late
	factors.push(((MAX_SPLIT - metrics.maxSplit) / MAX_SPLIT)); // minimize splits
	if(minAllowable < 5) factors.push(1); // if there are only a handful left, focus on those
	return _.sum(factors); // NOTE heuristic is not between 0 and 1
}
