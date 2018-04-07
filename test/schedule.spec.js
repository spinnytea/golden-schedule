'use strict';
const expect = require('chai').expect;
const schedule = require('../lib/schedule');

describe('schedule', function () {
   it('Schedule');

   it('computeAllMatches', function () {
      const matches = schedule.computeAllMatches();

      expect(matches.slice(0, 5)).to.deep.equal([
         [1,2], [1,2],
         [1,3], [1,3],
         [1,4],
      ]);
      expect(matches.slice(-5)).to.deep.equal([
         [10,11],
         [10,12], [10,12],
         [11,12], [11,12],
      ]);
   });
});