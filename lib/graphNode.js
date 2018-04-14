/**
 * use some kind of graph traversal to search for valid schedules
 */
'use strict';
const _ = require('lodash');
const debug = require('debug')('golden-schedule:graphNode');
const BookIterator = require('./bookIterator').BookIterator;

// see scheduleExample.spec.js 'metrics' and 'confirm ideal metrics' for more details
const IDEAL_SPLITS = 4; // since team 6 gets none
const IDEAL_EARLY = 4; // since team 6 gets none
const IDEAL_LATE = 3; // since team 6 always gets them
// TODO make these max values stricter
const MAX_SPLITS = IDEAL_SPLITS + 1;
const MAX_EARLY = IDEAL_EARLY + 1;
const MAX_LATE = IDEAL_LATE + 2;

exports.GraphNode = class GraphNode {
	constructor(schedule, coords, match) {
		this.schedule = schedule = schedule.clone();
		if(coords && match) {
			this.schedule.setMatch(coords, match);
		}
		this.metrics = this.schedule.metrics();

		this.heuristic = calculateHeuristic(schedule, coords);
		this.notDeadEnd = (this.heuristic > 0); // TODO rename notDeadEnd
	}
};

// TODO heuristic function to pick next slot / match
// - pick slot with most options
// - pick match with most future options (one lookahead?, two lookahead?)
// - do we favor picking spot with "most options" or "least options"
//   - how how do we evaluate "information content"
//   - like, we want to keep our options open
//   - but if a spot only has 1 option, then we should just fill it in now
// REVIEW tune heuristic, I'm just making stuff up
function calculateHeuristic(schedule, startCoords) {
	const remaining = schedule.remainingMatches.length;
	if(remaining === 0) return 0;

	// REVIEW it seems that the metrics heuristics are the hardest part to search for
	// - if we remove this 'max' restriction, we can get all the way to week 11
	const metrics = schedule.metrics();
	const currMaxSplit = _.max(metrics.split);
	const currMaxEarly = _.max(metrics.early);
	const currMaxLate = _.max(_.values(_.omit(metrics.late, schedule.TEAM_6_POS))); // OPTIMIZE max without team 6
	if(currMaxSplit > MAX_SPLITS) return 0;
	if(currMaxEarly > MAX_EARLY) return 0;
	if(currMaxLate > MAX_LATE) return 0;

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

	// remaining is the # of spots left to fill AND the max a spot could be possibly be
	let factors = []; // all the different things to consider, each should be a scale from 0 to 1
	factors.push(allAllowable / remaining / remaining); // average number of options across all matches
	factors.push(maxAllowable / remaining); // single match with the most available options
	factors.push(((schedule.number_of_weeks - currMaxSplit) / schedule.number_of_weeks) / 2); // minimize splits
	factors.push(((schedule.number_of_weeks - currMaxEarly) / schedule.number_of_weeks) / 2); // minimize early
	factors.push(((schedule.number_of_weeks - currMaxLate) / schedule.number_of_weeks) / 2); // minimize late
	if(minAllowable < 5) factors.push(1); // if there are only a handful left, focus on those
	if(schedule.finished) factors.push(1);
	return _.sum(factors); // NOTE heuristic is not between 0 and 1
}
