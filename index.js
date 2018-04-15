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
const SimpleGraphExpander = require('./lib/graphExpander').SimpleGraphExpander;

let graphExpander = new SimpleGraphExpander();
const relaxRematch = 100;
const relaxSplit = 100;
const relaxOther = 100;
graphExpander.node.schedule.DELAY_REMATCH = Math.max(1, graphExpander.node.schedule.DELAY_REMATCH - relaxRematch);
graphExpander.node.schedule.MAX_EARLY = Math.min(11, graphExpander.node.schedule.MAX_EARLY + relaxOther);
graphExpander.node.schedule.MAX_LATE = Math.min(11, graphExpander.node.schedule.MAX_LATE + relaxOther);
graphExpander.node.schedule.MAX_SPLIT = Math.min(11, graphExpander.node.schedule.MAX_SPLIT + relaxSplit);

console.time('expanding');

graphExpander.doLoop(2000, 100);

console.log(graphExpander.getStateStr('final'));
console.log(graphExpander.node.schedule.prettyMetrics());
console.log(graphExpander.node.schedule.prettyBook({
	week: ['June 1', 'June 8', 'June 15', 'June 22', 'June 29', 'July 6', 'July 13', 'July 20', 'July 27', 'August 3', 'August 10'],
	time: ['6:30', '7:40', '8:50'],
	arena: ['A', 'B', 'C', 'D'],
}, 'rematch'));
console.log('remainingMatches', graphExpander.node.schedule.remainingMatches.length < 10 ? graphExpander.node.schedule.remainingMatches : '...many');
console.log('finished', graphExpander.finished);

console.timeEnd('expanding');
