'use strict';
const _ = require('lodash');
const Schedule = require('./lib/schedule').Schedule;

const schedule = new Schedule();
schedule.init();

schedule.setMatch({ week: 10, time: 0, arena: 0 }, _.find(schedule.remainingMatches, _.matches([1, 2])));
schedule.setMatch({ week: 10, time: 0, arena: 1 }, _.find(schedule.remainingMatches, _.matches([3, 4])));
schedule.setMatch({ week: 10, time: 0, arena: 2 }, _.find(schedule.remainingMatches, _.matches([5, 7])));
schedule.setMatch({ week: 10, time: 0, arena: 3 }, _.find(schedule.remainingMatches, _.matches([8, 9])));
schedule.setMatch({ week: 10, time: 1, arena: 0 }, _.find(schedule.remainingMatches, _.matches([6, 10])));
schedule.setMatch({ week: 10, time: 1, arena: 1 }, _.find(schedule.remainingMatches, _.matches([11, 12])));

console.log(schedule.prettyPrint({
	week: ['June 1', 'June 8', 'June 15', 'June 22', 'June 29', 'July 6', 'July 13', 'July 20', 'July 27', 'August 10', 'August 3'],
	time: ['6:30', '7:40', '8:50'],
	arena: ['A', 'B', 'C', 'D'],
}, 'availableMatchCount'));
