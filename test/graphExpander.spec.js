'use strict';
const expect = require('chai').expect;
const graphExpander = require('../lib/graphExpander');

describe('graphExpander', function () {
	describe('SimpleGraphExpander', function () {
		let g;
		beforeEach(function () {
			g = new graphExpander.SimpleGraphExpander();
		});

		it('nexts');

		it('tryNext', function () {
			this.timeout(3000); // tryNext takes a while at first

			g.tryNext().tryNext().tryNext().tryNext();

			expect(g.deadEnd).to.equal(false);
			expect(g.coords).to.deep.equal({ week: 0, time: 1, arena: 0 });
			expect(g.node.schedule.book[0][0]).to.deep.equal([[1, 2], [3, 4], [5, 7], [8, 9]]);
			expect(g.node.schedule.book[0][1]).to.deep.equal([null, null, null, null]);
			expect(g.previous.length).to.equal(4);

			// TODO fake dead ends
		});

		it('setNext', function () {
			this.timeout(3000); // setNext takes a while at first

			// example week 1
			g.setNext([2, 12]).setNext([4, 11]).setNext([7, 8]).setNext([5, 9]);

			expect(g.deadEnd).to.equal(false);
			expect(g.coords).to.deep.equal({ week: 0, time: 1, arena: 0 });
			expect(g.node.schedule.book[0][0]).to.deep.equal([[2, 12], [4, 11], [7, 8], [5, 9]]);
			expect(g.node.schedule.book[0][1]).to.deep.equal([null, null, null, null]);
			expect(g.previous.length).to.equal(4);

			// TODO fake dead ends
		});

		it('goPrevious');

		it('doLoop', function () {
			this.timeout(6000); // tryNext takes a while at first

			g.doLoop(4);

			expect(g.deadEnd).to.equal(false);
			expect(g.coords).to.deep.equal({ week: 0, time: 1, arena: 1 });
			expect(g.node.schedule.book[0][0]).to.deep.equal([[1, 2], [3, 4], [5, 7], [8, 9]]);
			expect(g.node.schedule.book[0][1]).to.deep.equal([[6, 10], null, null, null]);
			expect(g.previous.length).to.equal(5);

			// TODO fake dead ends
		});
	});
});
