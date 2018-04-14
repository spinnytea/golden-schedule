'use strict';
// IDEA are there other was to frame the problem
// IDEA are there other existing solitions out there?
// IDEA are there was to transform an existing schedule?
// - team swapping, time swapping, field swapping; they all have the same metrics
// - how do we change the metrics?
// IDEA try starting with the example solution sans issues
// - so like, teams 1, 2, 11, 12 are the worst offenders, drop all their games and fill in schedule
const GraphExpander = require('./lib/graphExpander').GraphExpander;

let graphExpander = new GraphExpander();
const prevExpanders = [];

console.time('expanding');

// week 1
// graphExpander = graphExpander
// 	.setNext([2, 12]).setNext([4, 11]).setNext([7, 8]).setNext([5, 9]);
// 	.setNext([3, 12]).setNext([4, 10]).setNext([1, 7]).setNext([6, 9])
// 	.setNext([3, 11]).setNext([5, 10]).setNext([1, 2]).setNext([6, 8]);

// the first time slot really doesn't matter
graphExpander = graphExpander.tryNext().tryNext().tryNext().tryNext();

// REVIEW it hangs around "near the end of the week" or "the last time slot of the week"
// - on the #10 or #8 or #6 depending on constraints, but always near the end
// - it's this a common issue in algorithms, spending excessive time in the leaf nodes?
// TODO optimize final week selection independent of main strategy
for(let i = 0; !graphExpander.finished && i <= 1000; i++) {
	if(i % 100 === 0) console.log(graphExpander.getStateStr('iter ' + i));
	prevExpanders.push(graphExpander);
	graphExpander = graphExpander.tryNext();

	if(!graphExpander) {
		prevExpanders.pop();
		graphExpander = prevExpanders.pop();
	}
}

console.log(graphExpander.node.schedule.prettyPrint({
	week: ['June 1', 'June 8', 'June 15', 'June 22', 'June 29', 'July 6', 'July 13', 'July 20', 'July 27', 'August 10', 'August 3'],
	time: ['6:30', '7:40', '8:50'],
	arena: ['A', 'B', 'C', 'D'],
}));

// BUG this can't finish the graph!
// console.log(graphExpander.node.schedule.remainingMatches); // [ [ 4, 12 ] ]
// console.log(graphExpander.node.schedule.calcAllowableMatches({ week: 10, time: 2, arena: 3 })); // [ [ 4, 12 ] ]


console.timeEnd('expanding');
