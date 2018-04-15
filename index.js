'use strict';
// IDEA are there other was to frame the problem
// IDEA are there other existing solitions out there?
// IDEA are there was to transform an existing schedule?
// - team swapping doesn't rreeaallyy matter, because once you fill in the first time slot of the first week, we've started a path
// - time swapping changes the metrics, so it's not a free transform (it's one of our struggles, actually)
// - FIXME arena swaping: within a given time slot, arena order does not matter
//   - given 4 matches that occur, there are 4! or 24 different ways to arrange them, it's all the same in the end
//   - if we ignore heuristic for a moment, we could make a loop like for(i=0) for(j=i+1) for(k=j+1) for(l=k+1)
//   - maybe heuristic is independent of allowable options, sans the 'no team plays twice in one time slot'
//   - otherwise we need remember 'all the matchups in sorted order' and somehow skip those
//   - which sounds like it would amount to filling them all in anyway and then skipping htem afterwards...
// IDEA try starting with the example solution sans issues
// - so like, teams 1, 2, 11, 12 are the worst offenders, drop all their games and fill in schedule
// - we need to update the graphExpander to skip over matchups that have already been filled in
const _ = require('lodash');
const BookIterator = require('./lib/bookIterator').BookIterator;
const Schedule = require('./lib/schedule').Schedule;
const GraphNode = require('./lib/graphNode').GraphNode;
const SimpleGraphExpander = require('./lib/graphExpander').SimpleGraphExpander;

const schedule = (new Schedule()).init();
const bookIterator = new BookIterator(schedule);
function nextMatch(match) {
	schedule.setMatch(bookIterator.next(), _.find(schedule.remainingMatches, _.matches(match)));
}
// week 1
schedule.setMatch(bookIterator.current, _.find(schedule.remainingMatches, _.matches([1, 2])));
[
	// // week 1
	// [3, 4], [5, 7], [8, 9],
	// [6, 10], [11, 12], [1, 3], [5, 8],
	// [6, 11], [10, 12], [2, 4], [7, 9],
	// // week 2
	// [1, 4], [5, 9], [2, 12], [3, 7],
	// [6, 8], [10, 11], [2, 7], [4, 9],
	// [6, 12], [1, 5], [3, 10], [8, 11],
	// // week 3
	// [1, 7], [4, 8], [2, 10], [3, 5],
	// [6, 9], [1, 11], [8, 12], [7, 10],
	// [9, 12], [2, 6], [4, 5], [3, 11],
	// // week 4
	// [4, 7], [1, 12], [2, 9], [3, 8],
	// [5, 6], [2, 11], [4, 10], [3, 12],
	// [6, 7], [1, 8], [5, 10], [9, 11],
	// // week 5
	// [1, 9], [2, 3], [4, 11], [5, 12],
	// [7, 8], [9, 10], [5, 11], [3, 6],
	// [4, 6], [7, 12], [1, 10], [2, 8],
	// // week 6
	// [], [], [], [],
	// [], [], [], [],
	// [], [], [], [],
	// // week 7
	// [], [], [], [],
	// [], [], [], [],
	// [], [], [], [],
	// // week 8
	// [], [], [], [],
	// [], [], [], [],
	// [], [], [], [],
	// // week 9
	// [], [], [], [],
	// [], [], [], [],
	// [], [], [], [],
	// // week 10
	// [], [], [], [],
	// [], [], [], [],
	// [], [], [], [],
	// // week 11
	// [], [], [], [],
	// [], [], [], [],
	// [], [], [], [],
].forEach(nextMatch);
// const graphExpander = new SimpleGraphExpander(new GraphNode(schedule), bookIterator.next());
const graphExpander = new SimpleGraphExpander(); void(GraphNode);
const relaxRematch = 0;
const relaxSplit = 0;
const relaxOther = 0;
graphExpander.node.schedule.DELAY_REMATCH = Math.max(1, graphExpander.node.schedule.DELAY_REMATCH - relaxRematch);
graphExpander.node.schedule.MAX_EARLY = Math.min(11, graphExpander.node.schedule.MAX_EARLY + relaxOther);
graphExpander.node.schedule.MAX_LATE = Math.min(11, graphExpander.node.schedule.MAX_LATE + relaxOther);
graphExpander.node.schedule.MAX_SPLIT = Math.min(11, graphExpander.node.schedule.MAX_SPLIT + relaxSplit);

console.time('expanding');

graphExpander.doLoop(5000, 100);

console.log(graphExpander.node.schedule.prettyMetrics());
console.log(graphExpander.node.schedule.prettyBook({
	week: ['June 1', 'June 8', 'June 15', 'June 22', 'June 29', 'July 6', 'July 13', 'July 20', 'July 27', 'August 3', 'August 10'],
	time: ['6:30', '7:40', '8:50'],
	arena: ['A', 'B', 'C', 'D'],
}, 'match'));
console.log(graphExpander.getStateStr('final'));

console.timeEnd('expanding');
