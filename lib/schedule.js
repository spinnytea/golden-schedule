/**
 * This was not written to be generic, it matches our use case exactly.
 * Some things try to be generic, but only when convenient.
 * 
 * NOTE team numbers are 1-based
 */
'use strict';

/** the number of teams that need to have schedules */
const NUMBER_OF_TEAMS = 12;
/** each team will play this many games each week */
const NUMBER_OF_TEAM_GAMES_PER_WEEK = 2;
/** how many times will each team play each other; e.g. how many times will team #8 play team #9 */
const NUMBER_OF_PAIRING_MATCHES = 2;

/** games that will occur at once (in a given time slot, on a given day) */
const NUMBER_CONCURRENT_GAMES = 4;
/** how many time slots are on a given day */
const NUMBER_TIME_SLOTS_PER_WEEK = 3;
/** games are 1v1, so there are only 2 teams playing in a single game */
const TEAMS_PER_GAME = 2;

/** for a fully round robin tournament, we need this long to complete it */
const NUMBER_OF_WEEKS = 11;

// TODO checks
// - number of team-slots per week
//   - NUMBER_OF_TEAMS * NUMBER_OF_TEAM_GAMES_PER_WEEK === NUMBER_CONCURRENT_GAMES * NUMBER_TIME_SLOTS_PER_WEEK * TEAMS_PER_GAME
// - total number of matches
//   - (NUMBER_OF_TEAMS choose NUMBER_OF_TEAM_GAMES_PER_WEEK) * NUMBER_OF_PAIRING_MATCHES === NUMBER_CONCURRENT_GAMES * NUMBER_TIME_SLOTS_PER_WEEK * NUMBER_OF_WEEKS

exports.Schedule = class Schedule {
   constructor() {
      this._remainingMatches = computeAllMatches();
   }
}

// XXX use TEAMS_PER_GAME, assuming 2 (that's the a/b part)
function computeAllMatches() {
   var matches = [];

   for(let a = 1; a <= NUMBER_OF_TEAMS; a++)
      for(let b = a+1; b <= NUMBER_OF_TEAMS; b++)
         for(let rematch = 0; rematch < NUMBER_OF_PAIRING_MATCHES; rematch++)
            matches.push([a, b]);

   return matches;
}
