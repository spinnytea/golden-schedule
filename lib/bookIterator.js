/**
 * loop through all the positions in a schedule
 * loop over every match in a book
 * schedule.book[week][time][arena]
 */
'use strict';
const _ = require('lodash');
const debug = require('debug')('golden-schedule:bookIterator');

exports.BookIterator = class BookIterator {
	constructor({ number_of_weeks, number_time_slots_per_week, number_concurrent_games }, { week, time, arena } = {}) {
		this.number_of_weeks = number_of_weeks;
		this.number_time_slots_per_week = number_time_slots_per_week;
		this.number_concurrent_games = number_concurrent_games;

		this.week = week || 0;
		this.time = time || 0;
		this.arena = arena || 0;

		this.done = false;
	}

	get current() {
		if(this.done) return null;
		return _.pick(this, ['week', 'time', 'arena']);
	}
	set current(coords) {
		if(!_.isObject(coords)) {
			debug('coords not provided', arguments);
			throw new Error('coords not provided');
		}
		if(!_.isNumber(coords.week)) {
			debug('invalid coords week', coords);
			throw new Error('invalid coords week');
		}
		if(!_.isNumber(coords.time)) {
			debug('invalid coords time', coords);
			throw new Error('invalid coords time');
		}
		if(!_.isNumber(coords.arena)) {
			debug('invalid coords arena', coords);
			throw new Error('invalid coords arena');
		}

		// apply the values
		this.week = _.clamp(coords.week, 0, this.number_of_weeks-1);
		this.time = _.clamp(coords.time, 0, this.number_time_slots_per_week-1);
		this.arena = _.clamp(coords.arena, 0, this.number_concurrent_games-1);
		this.done = false;
	}

	next() {
		if(!this.done) {
			this.arena++;
			if(this.arena >= this.number_concurrent_games) {
				this.arena = 0;
				this.time++;
			}
			if(this.time >= this.number_time_slots_per_week) {
				this.arena = 0;
				this.time = 0;
				this.week++;
			}
			if(this.week >= this.number_of_weeks) {
				this.arena = 0;
				this.time = 0;
				this.week = 0;
				this.done = true;
			}
		}
		return this.current;
	}

	/**
	 * loop over all remaining slots
	 * call the cb with the coords
	 * if the cb ever returns false (not falsy, false), then exit early
	 */
	forEach(cb) {
		let coords = this.current;
		do {
			if(cb(coords) === false) return;
		} while((coords = this.next()));
	}
};
