/**
 * use some kind of graph traversal to search for valid schedules
 */
'use strict';
const _ = require('lodash');
const BookIterator = require('./bookIterator').BookIterator;

// see scheduleExample.spec.js 'metrics' and 'confirm ideal metrics' for more details
const MAX_SPLITS = 5; // could be 4, relaxed for now TODO try keeping it at 4, does it take longer to find solutions?
// const IDEAL_EARLY = 4; // since team 6 gets none
// const IDEAL_LATE = 3; // since team 6 always gets them

exports.GraphNode = class GraphNode {
	constructor(schedule, coords, match) {
		this.schedule = schedule.clone();
		if(coords && match) {
			this.schedule.setMatch(coords, match);
		}
		this.metrics = this.schedule.metrics();

		// TODO if any spot has zero availableMatches, then it's a dead end
		this.deadEnd = _.max(this.metrics.split) > MAX_SPLITS;

		this.heuristic = calculateHeuristic(schedule, coords);
		if(this.heuristic === 0) this.deadEnd = true;

		// TODO how do we remember the decision and move to the next one next time?
		// - order options based on heuristic
		// - if we have an "after this one", start there in the list, sort of like 'indexOf' has a second arg
	}
};

// TODO heuristic function to pick next slot / match
// - pick slot with most options
// - pick match with most future options (one lookahead?, two lookahead?)
// - do we favor picking spot with "most options" or "least options"
//   - how how do we evaluate "information content"
//   - like, we want to keep our options open
//   - but if a spot only has 1 option, then we should just fill it in now
// - prune deadEnds
// REVIEW tune heuristic, I'm just making stuff up
function calculateHeuristic(schedule, startCoords) {
	if(schedule.deadEnd) return 0;

	const remaining = schedule.remainingMatches.length;
	if(remaining === 0) return 0;

	let allAllowable = 0; // sum of all allowable values
	let hasEmptyZero = false; // there is a spot that isn't filled in and there are no available matches
	let minAllowable = remaining;
	let maxAllowable = 0;

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
	factors.push(allAllowable / remaining / remaining); // remaining is the # of spots left to fill AND the max a spot could be possibly be
	factors.push(maxAllowable / remaining);
	if(minAllowable < 5) factors.push(1); // if there are only a handful left, focus on those
	return _.sum(factors) / factors.length; // average all the factors
}
