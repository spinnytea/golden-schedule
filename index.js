'use strict';
const _ = require('lodash'); void(_);
const BookIterator = require('./lib/bookIterator').BookIterator; void(BookIterator);
const GraphNode = require('./lib/graphNode').GraphNode; void(GraphNode);
const Schedule = require('./lib/schedule').Schedule; void(Schedule);

const schedule = new Schedule();
schedule.init();

console.log(schedule.prettyPrint({
	week: ['June 1', 'June 8', 'June 15', 'June 22', 'June 29', 'July 6', 'July 13', 'July 20', 'July 27', 'August 10', 'August 3'],
	time: ['6:30', '7:40', '8:50'],
	arena: ['A', 'B', 'C', 'D'],
}, 'availableMatchCount'));

let node = new GraphNode(schedule);
console.log(node.metrics);
console.log('deadEnd', node.deadEnd);
console.log('heuristic', node.heuristic);
