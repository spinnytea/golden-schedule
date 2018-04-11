'use strict';
const GraphExpander = require('./lib/graphExpander').GraphExpander;

let graphExpander = new GraphExpander();
const prevExpanders = [];

console.time('expanding');

for(let i = 0; i < 1001; i++) {
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
