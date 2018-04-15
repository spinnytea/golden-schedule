The Problem
-----------

We have 12 teams; we play two games each night; we play on 4 diamonds; and thru out the season we will play each team twice; we play in 3 times slots each night; 6:30, 7:40, 8:50.

I have attached a copy of last year’s schedule. Plus I have attached how the teams sort out playing two early games, two late games and split; one early and one late.

Also we have one team that travels about 100 miles to play so they have requested all late games (team 6). We travel 40 miles (team 12). One other team travels 60 miles (team 5), and the rest are from Sioux Falls.

As you can see that we (team 12) played the most splits along with team 2, etc.

My question to you; is there a way to get the early, late and splits more even? Except team 6 who plays all late games???


The Solution
------------

Since team 6 is an anomaly, I couldn't think of a way to to build a schedule with math or pure logic. Given the constraints, it's there aren't many ways you can mutate an existing schedule and have it remain valid.

My first thought was to model it as a graphing problem, using rules to determine what could expand and heurstics to optimize the search. I basically ran with this idea to conclusion, taking only a pit stop for option 1.

There are 3 schedules with varying metrics in the dist folder.
1. There's a test (`Schedule Example > try all swaps > crunch options`) that was used to find the 'best matach' give the first example.
1. The main loop can finish an empty schedule when using relaxed constriants. This was a pure depth-first search.
1. Work up to a near-optimal solution with rigours constratings, trial and error, randomness, and milestones. I didn't have perfect heuristics, so I did a combination of breadth-first and depth-first searching, and the depth was mostly manual.


Next Steps
----------

*  Run `try all swaps` against the other two options. Maybe that'll make an improvment.
*  Create a file/format for the schedules, save the 4 schedules into those files for easy loading -> Use the examples in tests -> create a distribution of early/late/split counts (I started playing with charts on google docs)
*  There are a couple of FIXMEs hanging around. Maybe they can offer some performance improvments. (not to mention the TODOs)
*  Many parts of this were coded specifically to the constraints of the problem (e.g. 2 teams per game, 3 time slots). Try relaxing some of those constraints. Maybe the easiest starting points are 3 rematches intead of 2, resulting in a final week that is half capacity. Or varying the number of times/arenas.
*  Try taking an existing schedule, clearing out all the matches for the teams you don't like the metrics of, and try filling it in again. I'm not sure how well this will work, but it's a capability worth testing. (not unlike `swapLate` and `swapTeams`)
*  Try option 2 again, but shuffle the initial remainingMatches. Maybe the randomness will produce better results on average.
