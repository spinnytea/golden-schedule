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


//
// FIXME this is the final resting place of this file
// - the last go was an iterative "save it as you go" approach
// - it'd run it until i met a milestone, snapshot some of the progress, and run it again
// - i.e. run until week 2 is filled
//        run until all mins are at least 1
//        run until week 5 is filled
//        run until week 6, and min early/split are at least 2
//        run until week 8, all mins are at least 2
//        run until week 10, and min early/split are at least 3
//        relax early -> run until end
//


const schedule = (new Schedule()).init();
const bookIterator = new BookIterator(schedule);
function nextMatch(match) {
	schedule.setMatch(bookIterator.next(), _.find(schedule.remainingMatches, _.matches(match)));
}
// week 1
schedule.setMatch(bookIterator.current, _.find(schedule.remainingMatches, _.matches([1, 2])));
[
	// week 1
	[9, 10], [4, 12], [3, 5],
	[6, 7], [8, 11], [2, 4], [5, 10],
	[6, 8], [7, 11], [1, 12], [3, 9],
	// // week 2
	[4, 9], [5, 11], [1, 7], [2, 8],
	[3, 6], [10, 12], [1, 11], [8, 9],
	[4, 6], [2, 3], [5, 12], [7, 10],
	// week 3
	[1, 5], [2, 9], [7, 12], [3, 11],
	[6, 10], [4, 8], [3, 7], [11, 12],
	[4, 10], [2, 6], [1, 9], [5, 8],
	// week 4
	[5, 9], [4, 7], [3, 10], [8, 12],
	[1, 6], [2, 11], [3, 8], [5, 7],
	[6, 12], [2, 10], [1, 4], [9, 11],
	// week 5
	[10, 11], [1, 8], [3, 12], [2, 7],
	[5, 6], [9, 12], [1, 10], [3, 4],
	[6, 9], [2, 5], [4, 11], [7, 8],
	// week 6
	[7, 9], [8, 10], [1, 3], [2, 12],
	[6, 11], [4, 5], [1, 2], [9, 10],
	[6, 8], [3, 5], [7, 11], [4, 12],
	// week 7
	[2, 3], [4, 9], [1, 11], [5, 10],
	[4, 6], [2, 8], [5, 12], [1, 7],
	[6, 7], [10, 12], [8, 11], [3, 9],
	// week 8
	[2, 9], [4, 8], [5, 11], [7, 10],
	[3, 6], [1, 12], [2, 4], [8, 9],
	[3, 11], [6, 10], [1, 5], [7, 12],
	// week 9
	[8, 12], [2, 11], [4, 10], [3, 7],
	[1, 6], [5, 9], [4, 7], [11, 12],
	[2, 6], [5, 8], [1, 9], [3, 10],
	// week 10
	[9, 12], [4, 11], [1, 8], [5, 7],
	[6, 9], [10, 11], [2, 7], [3, 8],
	[2, 5], [6, 12], [3, 4], [1, 10],
	// week 11
	[9, 11], [4, 5], [1, 3], [8, 10],
	[5, 6], [2, 10], [3, 12], [7, 9],
	[6, 11], [7, 8], [1, 4], [2, 12],
].forEach(nextMatch);
const graphExpander = new SimpleGraphExpander(new GraphNode(schedule), bookIterator.next());
const relaxRematch = 0;
const relaxSplit = 0;
const relaxOther = 1;
graphExpander.node.schedule.DELAY_REMATCH = Math.max(1, graphExpander.node.schedule.DELAY_REMATCH - relaxRematch);
graphExpander.node.schedule.MAX_EARLY = Math.min(11, graphExpander.node.schedule.MAX_EARLY + relaxOther);
graphExpander.node.schedule.MAX_LATE = Math.min(11, graphExpander.node.schedule.MAX_LATE + relaxOther);
graphExpander.node.schedule.MAX_SPLIT = Math.min(11, graphExpander.node.schedule.MAX_SPLIT + relaxSplit);

console.time('expanding');

graphExpander.doLoop(500000, 500);
// graphExpander.doLoop(4000, 50, function () {
// 	const metrics = graphExpander.node.schedule.calcMetrics();
// 	// return metrics.minEarly < 1 || metrics.minLate < 1 || metrics.minSplit < 1;
// 	return !(metrics.maxEarly - metrics.minEarly < 3 &&
// 		metrics.maxLate - metrics.minLate < 3 &&
// 		metrics.maxSplit - metrics.minSplit < 3) ||
// 		metrics.minEarly < 3 || metrics.minLate < 2 || metrics.minSplit < 3 ||
// 		graphExpander.coords.week < 10;
// });

console.log(graphExpander.node.schedule.prettyMetrics());
console.log(graphExpander.node.schedule.prettyBook({
	week: ['June 1', 'June 8', 'June 15', 'June 22', 'June 29', 'July 6', 'July 13', 'July 20', 'July 27', 'August 3', 'August 10'],
	time: ['6:30', '7:40', '8:50'],
	arena: ['A', 'B', 'C', 'D'],
}, 'match'));
console.log(graphExpander.getStateStr('final'));

console.timeEnd('expanding');
