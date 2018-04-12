'use strict';
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

for(let i = 0; i <= 1000; i++) {
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

console.timeEnd('expanding');
