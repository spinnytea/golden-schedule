/**
 * use some kind of graph traversal to search for valid schedules
 */
'use strict';
const _ = require('lodash');

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

		// TODO heuristic function to pick next slot / match
		// - pick slot with most options
		// - pick match with most future options (one lookahead?, two lookahead?)
		// - prune deadEnds

		// TODO how do we remember the decision and move to the next one next time?
		// - order options based on heuristic
		// - if we have an "after this one", start there in the list, sort of like 'indexOf' has a second arg
	}
};
