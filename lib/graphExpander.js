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

exports.GraphExpander = class GraphExpander {
	constructor(node, coords) {
		this.coords = coords || { week: 0, time: 0, arena: 0 }; // coords that need to be filled
		this.node = node || new GraphNode((new Schedule()).init()); // current schedule
	}

	get finished() {
		return this.node.schedule.finished;
	}

	get nexts() {
		if(!this._nexts) {
			const coords = this.coords;
			const schedule = this.node.schedule;
			this._nexts = _.chain(schedule.calcAllowableMatches(coords))
				.map((match) => new GraphNode(schedule, coords, match))
				.filter('notDeadEnd')
				.sortBy('heuristic') // sorted asc, so we can just pop() off nodes as we try them
				.value();
		}
		return this._nexts;
	}

	tryNext() {
		const node = this.nexts.pop();
		if(!node) return null;
		const bookIterator = new BookIterator(node.schedule, this.coords);
		return new GraphExpander(node, bookIterator.next());
	}

	/** for when you want to set some days by hand */
	setNext(m) {
		const coords = this.coords;
		const node = _.remove(this.nexts, function (n) {
			return _.isEqual(n.schedule.book[coords.week][coords.time][coords.arena], m);
		})[0];
		if(!node) return null;
		const bookIterator = new BookIterator(node.schedule, coords);
		return new GraphExpander(node, bookIterator.next());
	}

	getStateStr(name) {
		return name + '\n' + [
			['coords', this.coords],
			['metrics', this.node.schedule.calcMetrics()],
			// ['dead', !this.node.notDeadEnd],
			['heuristic', this.node.heuristic],
			// ['nexts count', this.nexts.length],
			// ['next heuristic', _.chain(this.nexts).map('heuristic').uniq().value()],
		].map(([l, o]) => _.padEnd(l, 10) + ' ' + JSON.stringify(o)).join('\n') + '\n';
	}
};
