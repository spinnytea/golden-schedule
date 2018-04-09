/**
 * use some kind of graph traversal to search for valid schedules
 *
 * TODO save progress
 * TODO load progress
 */
'use strict';
const GraphNode = require('./graphNode').GraphNode;
const Schedule = require('./schedule').Schedule;

exports.GraphExpander = class GraphExpander {
	constructor() {
		this.current = new GraphNode((new Schedule()).init());
	}
};
