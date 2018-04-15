/**
 * use some kind of graph traversal to search for valid schedules
 *
 * TODO save/load progress so we can try other answers
 */
'use strict';
const _ = require('lodash');
const BookIterator = require('./bookIterator').BookIterator;
const GraphNode = require('./graphNode').GraphNode;
const Schedule = require('./schedule').Schedule;

exports.SimpleGraphExpander = class SimpleGraphExpander {
	constructor(node, coords) {
		this.step = 0;
		this.previous = [];
		this.current = coords || { week: 0, time: 0, arena: 0 }; // coords that need to be filled
		this.current.node = node || new GraphNode((new Schedule()).init()); // current schedule
		this.current.nexts = null;
	}
	get deadEnd() { return !this.current; }
	get finished() { return this.deadEnd ? false : this.node.schedule.finished; }

	get coords() { return _.pick(this.current, ['week', 'time', 'arena']); }
	get node() { return _.get(this.current, 'node'); }
	get nexts() {
		if(!this.current.nexts) {
			if(this.deadEnd) {
				this.current.nexts = [];
			}
			else {
				const coords = this.coords;
				const schedule = this.node.schedule;
				this.current.nexts = _.chain(schedule.calcAllowableMatches(coords))
					.map((match) => new GraphNode(schedule, coords, match))
					.filter('notDeadEnd')
					.sortBy('heuristic') // sorted asc, so we can just pop() off nodes as we try them
					.value();
			}
		}
		return this.current.nexts;
	}

	tryNext() {
		if(!this.deadEnd && !this.finished) {
			this.step++;
			this.previous.push(this.current);

			const node = this.nexts.pop();
			if(!node) {
				this.current = null;
			}
			else {
				const bookIterator = new BookIterator(node.schedule, this.coords);
				this.current = bookIterator.next() || { week: 0, time: 0, arena: 0 };
				this.current.node = node;
			}
		}
		return this;
	}

	/** for when you want to set some days by hand */
	setNext(m) {
		if(!this.deadEnd && !this.finished) {
			this.step++;
			this.previous.push(this.current);

			const coords = this.coords;
			const node = _.remove(this.nexts, function (n) {
				return _.isEqual(n.schedule.getMatch(coords), m);
			})[0];

			if(!node) {
				this.current = null;
			}
			else {
				const bookIterator = new BookIterator(node.schedule, coords);
				this.current = bookIterator.next();
				this.current.node = node;
			}
		}
		return this;
	}

	goPrevious() {
		do {
			this.current = this.previous.pop();
		} while(!this.nexts.length);
	}

	doLoop(maxIterations, printRate) {
		for(let i = 0; !this.finished && i <= maxIterations; i++) {
			if(printRate && i % printRate === 0) console.log(this.getStateStr('iter ' + i));
			this.tryNext();

			if(this.deadEnd) this.goPrevious();
		}
	}

	getStateStr(name) {
		return name + '\n' + [
			['step', this.step],
			['coords', this.coords],
			['metrics', this.node ? this.node.schedule.calcMetrics() : null],
			['heuristic', this.node ? this.node.heuristic : null],
			['path dead', this.deadEnd],
			['node dead', this.node ? !this.node.notDeadEnd : null],
			['previous count', this.previous.length],
			['nexts count', this.nexts.length],
			// ['next heuristic', _.chain(this.nexts).map('heuristic').uniq().value()],
		].map(([l, o]) => _.padEnd(l, 10) + ' ' + JSON.stringify(o)).join('\n') + '\n';
	}
};
