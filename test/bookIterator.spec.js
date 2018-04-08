'use strict';
const expect = require('chai').expect;
const BookIterator = require('../lib/bookIterator').BookIterator;

describe('BookIterator', function () {
	let bookIterator;
	beforeEach(function () {
		bookIterator = new BookIterator({ number_of_weeks: 4, number_time_slots_per_week: 3, number_concurrent_games: 2 });
	});

	it('get current', function () {
		expect(bookIterator.current).to.deep.equal({ week: 0, time: 0, arena: 0 });
		expect(bookIterator.current).to.not.equal(bookIterator);
		expect(bookIterator.current).to.deep.equal({ week: 0, time: 0, arena: 0 });
	});

	it('set current', function () {
		expect(bookIterator.current).to.deep.equal({ week: 0, time: 0, arena: 0 });

		bookIterator.current = { week: 1, time: 1, arena: 1 };
		expect(bookIterator.current).to.deep.equal({ week: 1, time: 1, arena: 1 });

		bookIterator.current = { week: -1, time: -1, arena: -1 };
		expect(bookIterator.current).to.deep.equal({ week: 0, time: 0, arena: 0 });

		bookIterator.current = { week: 100, time: 100, arena: 100 };
		expect(bookIterator.current).to.deep.equal({ week: 3, time: 2, arena: 1 });
	});

	it('next', function () {
		expect(bookIterator.current).to.deep.equal({ week: 0, time: 0, arena: 0 });
		expect(bookIterator.next()).to.deep.equal({ week: 0, time: 0, arena: 1 });
		expect(bookIterator.current).to.deep.equal({ week: 0, time: 0, arena: 1 });
		expect(bookIterator.next()).to.deep.equal({ week: 0, time: 1, arena: 0 });
		expect(bookIterator.next()).to.deep.equal({ week: 0, time: 1, arena: 1 });
		expect(bookIterator.next()).to.deep.equal({ week: 0, time: 2, arena: 0 });
		expect(bookIterator.next()).to.deep.equal({ week: 0, time: 2, arena: 1 });
		expect(bookIterator.next()).to.deep.equal({ week: 1, time: 0, arena: 0 });
		expect(bookIterator.current).to.deep.equal({ week: 1, time: 0, arena: 0 });
		for(let i=0; i<6; i++) bookIterator.next();
		expect(bookIterator.current).to.deep.equal({ week: 2, time: 0, arena: 0 });
		for(let i=0; i<6; i++) bookIterator.next();
		expect(bookIterator.current).to.deep.equal({ week: 3, time: 0, arena: 0 });
		for(let i=0; i<5; i++) bookIterator.next();
		expect(bookIterator.current).to.deep.equal({ week: 3, time: 2, arena: 1 });
		expect(bookIterator.next()).to.equal(null);
		expect(bookIterator.next()).to.equal(null);

		expect(bookIterator.week).to.equal(0);
		expect(bookIterator.time).to.equal(0);
		expect(bookIterator.arena).to.equal(0);
		expect(bookIterator.done).to.equal(true);
	});
});