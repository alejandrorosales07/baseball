/* ============================================================
   162-0: BASEBALL'S PERFECT SEASON
   Data layer — decades, era baselines, team rosters, players
   ============================================================
   NOTE ON ACCURACY: Stats represent each player's approximate
   peak/representative performance level during the listed decade,
   compiled for entertainment purposes — not exact single-season
   box scores. This is an independent, fan-made project and is not
   affiliated with MLB or any team.
   ============================================================ */

const ROSTER_SLOTS = [
  { key: "C",  label: "Catcher" },
  { key: "1B", label: "First Base" },
  { key: "2B", label: "Second Base" },
  { key: "3B", label: "Third Base" },
  { key: "SS", label: "Shortstop" },
  { key: "LF", label: "Left Field" },
  { key: "CF", label: "Center Field" },
  { key: "RF", label: "Right Field" },
  { key: "DH", label: "Designated Hitter" },
  { key: "SP", label: "Starting Pitcher" },
  { key: "CL", label: "Closer" },
];

// Which player position-tags are eligible to fill which roster slot.
const SLOT_ELIGIBILITY = {
  C:  ["C"],
  "1B": ["1B"],
  "2B": ["2B"],
  "3B": ["3B"],
  SS: ["SS"],
  LF: ["OF"],
  CF: ["OF"],
  RF: ["OF"],
  DH: ["C", "1B", "2B", "3B", "SS", "OF", "DH"], // any bat can DH
  SP: ["SP"],
  CL: ["RP"],
};

// One decade is drafted per round, each decade used exactly once per game.
const DECADES = [
  "1920s", "1930s", "1940s", "1950s", "1960s",
  "1970s", "1980s", "1990s", "2000s", "2010s", "2020s",
];

/* Era baselines used to normalize raw stats into era-adjusted value.
   Approximate MLB-wide tendencies per decade (grounded in known
   historical trends: 1920s/1930s high-average lively-ball era,
   1960s pitcher-dominant "Year of the Pitcher" trough, 1990s-2000s
   steroid-era power surge, 2010s-2020s high-strikeout/high-power
   "Statcast era"). */
const ERA_BASELINES = {
  "1920s": { avg: .288, hr: 6,  ops: .760, sb: 14, era: 3.90, k9: 3.2, whip: 1.32, sv: 4  },
  "1930s": { avg: .285, hr: 10, ops: .790, sb: 10, era: 4.20, k9: 3.4, whip: 1.36, sv: 5  },
  "1940s": { avg: .265, hr: 9,  ops: .720, sb: 11, era: 3.65, k9: 3.8, whip: 1.30, sv: 6  },
  "1950s": { avg: .260, hr: 17, ops: .740, sb: 7,  era: 3.95, k9: 4.6, whip: 1.30, sv: 9  },
  "1960s": { avg: .248, hr: 16, ops: .700, sb: 12, era: 3.40, k9: 5.6, whip: 1.22, sv: 14 },
  "1970s": { avg: .255, hr: 13, ops: .700, sb: 22, era: 3.65, k9: 4.9, whip: 1.27, sv: 19 },
  "1980s": { avg: .261, hr: 15, ops: .710, sb: 24, era: 3.85, k9: 5.3, whip: 1.30, sv: 24 },
  "1990s": { avg: .267, hr: 22, ops: .755, sb: 16, era: 4.25, k9: 6.1, whip: 1.36, sv: 32 },
  "2000s": { avg: .267, hr: 24, ops: .760, sb: 13, era: 4.35, k9: 6.6, whip: 1.35, sv: 35 },
  "2010s": { avg: .255, hr: 24, ops: .735, sb: 9,  era: 3.95, k9: 8.1, whip: 1.27, sv: 33 },
  "2020s": { avg: .246, hr: 27, ops: .720, sb: 11, era: 4.05, k9: 8.7, whip: 1.24, sv: 32 },
};

/* ----------------------------------------------------------------
   TEAM ROSTERS BY DECADE
   Structure: TEAMS[decade] = { teamName: [ players... ] }
   Player: { name, pos: "C|1B|2B|3B|SS|OF|DH|SP|RP",
             batting: {avg, hr, rbi, ops, sb}  -- for batters
             pitching: {era, w, k9, whip, sv}  -- for pitchers
             note: short flavor fact (optional) }
   ---------------------------------------------------------------- */

const TEAMS = {
  "1920s": {
    "Yankees": [
      { name: "Babe Ruth", pos: "OF", batting: { avg: .355, hr: 41, rbi: 131, ops: 1.164, sb: 10 }, note: "Redefined the home run." },
      { name: "Lou Gehrig", pos: "1B", batting: { avg: .315, hr: 27, rbi: 117, ops: .965, sb: 4 } },
      { name: "Tony Lazzeri", pos: "2B", batting: { avg: .293, hr: 14, rbi: 102, ops: .823, sb: 12 } },
      { name: "Herb Pennock", pos: "SP", pitching: { era: 3.62, w: 19, k9: 2.8, whip: 1.28, sv: 0 } },
    ],
    "Cardinals": [
      { name: "Rogers Hornsby", pos: "2B", batting: { avg: .382, hr: 21, rbi: 100, ops: 1.026, sb: 9 }, note: ".400 in 1924." },
      { name: "Jim Bottomley", pos: "1B", batting: { avg: .310, hr: 17, rbi: 105, ops: .882, sb: 8 } },
      { name: "Chick Hafey", pos: "OF", batting: { avg: .326, hr: 14, rbi: 90, ops: .920, sb: 5 } },
    ],
    "Pirates": [
      { name: "Pie Traynor", pos: "3B", batting: { avg: .320, hr: 5, rbi: 95, ops: .832, sb: 10 } },
      { name: "Max Carey", pos: "OF", batting: { avg: .300, hr: 3, rbi: 60, ops: .770, sb: 49 }, note: "Led NL in steals 10x." },
      { name: "Kiki Cuyler", pos: "OF", batting: { avg: .336, hr: 9, rbi: 90, ops: .885, sb: 24 } },
    ],
    "Senators": [
      { name: "Walter Johnson", pos: "SP", pitching: { era: 3.07, w: 17, k9: 4.0, whip: 1.18, sv: 0 }, note: "The Big Train, late career." },
      { name: "Goose Goslin", pos: "OF", batting: { avg: .334, hr: 14, rbi: 109, ops: .920, sb: 11 } },
      { name: "Joe Judge", pos: "1B", batting: { avg: .314, hr: 5, rbi: 75, ops: .800, sb: 10 } },
    ],
    "Giants": [
      { name: "Frankie Frisch", pos: "2B", batting: { avg: .327, hr: 5, rbi: 77, ops: .820, sb: 23 } },
      { name: "Bill Terry", pos: "1B", batting: { avg: .348, hr: 14, rbi: 107, ops: .950, sb: 5 } },
      { name: "Travis Jackson", pos: "SS", batting: { avg: .300, hr: 10, rbi: 78, ops: .800, sb: 8 } },
    ],
    "Tigers": [
      { name: "Ty Cobb", pos: "OF", batting: { avg: .357, hr: 4, rbi: 90, ops: .920, sb: 24 }, note: "Career .366 hitter." },
      { name: "Harry Heilmann", pos: "OF", batting: { avg: .364, hr: 14, rbi: 115, ops: .995, sb: 8 } },
    ],
    "Athletics": [
      { name: "Al Simmons", pos: "OF", batting: { avg: .365, hr: 19, rbi: 129, ops: 1.024, sb: 6 } },
      { name: "Mickey Cochrane", pos: "C", batting: { avg: .331, hr: 6, rbi: 67, ops: .870, sb: 8 } },
      { name: "Lefty Grove", pos: "SP", pitching: { era: 2.81, w: 20, k9: 5.5, whip: 1.21, sv: 1 } },
      { name: "Eddie Rommel", pos: "RP", pitching: { era: 3.50, w: 8, k9: 2.6, whip: 1.35, sv: 5 }, note: "Knuckleballing fireman, led AL in saves multiple years." },
    ],
  },

  "1930s": {
    "Yankees": [
      { name: "Lou Gehrig", pos: "1B", batting: { avg: .343, hr: 41, rbi: 153, ops: 1.080, sb: 5 } },
      { name: "Joe DiMaggio", pos: "OF", batting: { avg: .346, hr: 32, rbi: 140, ops: 1.026, sb: 4 } },
      { name: "Bill Dickey", pos: "C", batting: { avg: .313, hr: 18, rbi: 105, ops: .885, sb: 2 } },
      { name: "Red Ruffing", pos: "SP", pitching: { era: 3.65, w: 19, k9: 3.4, whip: 1.31, sv: 1 } },
    ],
    "Athletics": [
      { name: "Jimmie Foxx", pos: "1B", batting: { avg: .346, hr: 41, rbi: 147, ops: 1.078, sb: 3 } },
      { name: "Al Simmons", pos: "OF", batting: { avg: .344, hr: 22, rbi: 142, ops: .982, sb: 5 } },
      { name: "Lefty Grove", pos: "SP", pitching: { era: 2.84, w: 24, k9: 5.0, whip: 1.20, sv: 2 } },
    ],
    "Tigers": [
      { name: "Hank Greenberg", pos: "1B", batting: { avg: .327, hr: 38, rbi: 142, ops: 1.022, sb: 4 } },
      { name: "Charlie Gehringer", pos: "2B", batting: { avg: .330, hr: 12, rbi: 96, ops: .885, sb: 9 }, note: "The Mechanical Man." },
      { name: "Mickey Cochrane", pos: "C", batting: { avg: .313, hr: 4, rbi: 56, ops: .790, sb: 6 } },
    ],
    "Cubs": [
      { name: "Gabby Hartnett", pos: "C", batting: { avg: .303, hr: 14, rbi: 85, ops: .855, sb: 2 } },
      { name: "Billy Herman", pos: "2B", batting: { avg: .309, hr: 4, rbi: 62, ops: .770, sb: 9 } },
      { name: "Stan Hack", pos: "3B", batting: { avg: .301, hr: 3, rbi: 60, ops: .780, sb: 14 } },
      { name: "Billy Jurges", pos: "SS", batting: { avg: .280, hr: 5, rbi: 60, ops: .700, sb: 4 } },
      { name: "Mace Brown", pos: "RP", pitching: { era: 3.30, w: 12, k9: 3.5, whip: 1.30, sv: 15 }, note: "Bullpen fireman, late-30s NL saves leader." },
    ],
    "Giants": [
      { name: "Carl Hubbell", pos: "SP", pitching: { era: 2.84, w: 21, k9: 3.7, whip: 1.16, sv: 3 }, note: "Screwball legend." },
      { name: "Mel Ott", pos: "OF", batting: { avg: .310, hr: 33, rbi: 116, ops: .995, sb: 4 } },
      { name: "Bill Terry", pos: "1B", batting: { avg: .341, hr: 12, rbi: 100, ops: .920, sb: 3 } },
    ],
    "Cardinals": [
      { name: "Joe Medwick", pos: "OF", batting: { avg: .337, hr: 19, rbi: 117, ops: .950, sb: 5 }, note: "1937 Triple Crown." },
      { name: "Dizzy Dean", pos: "SP", pitching: { era: 3.02, w: 24, k9: 4.6, whip: 1.20, sv: 3 } },
      { name: "Pepper Martin", pos: "3B", batting: { avg: .310, hr: 7, rbi: 70, ops: .810, sb: 19 } },
    ],
    "Red Sox": [
      { name: "Jimmie Foxx", pos: "1B", batting: { avg: .320, hr: 35, rbi: 130, ops: 1.020, sb: 2 } },
      { name: "Ted Williams", pos: "OF", batting: { avg: .327, hr: 31, rbi: 145, ops: 1.045, sb: 2 }, note: "Rookie debut, 1939." },
    ],
  },

  "1940s": {
    "Red Sox": [
      { name: "Ted Williams", pos: "OF", batting: { avg: .356, hr: 32, rbi: 121, ops: 1.115, sb: 3 }, note: ".406 in 1941." },
      { name: "Bobby Doerr", pos: "2B", batting: { avg: .288, hr: 17, rbi: 99, ops: .830, sb: 3 } },
      { name: "Johnny Pesky", pos: "SS", batting: { avg: .313, hr: 2, rbi: 50, ops: .785, sb: 5 } },
    ],
    "Yankees": [
      { name: "Joe DiMaggio", pos: "OF", batting: { avg: .315, hr: 27, rbi: 110, ops: .950, sb: 2 } },
      { name: "Bill Dickey", pos: "C", batting: { avg: .295, hr: 11, rbi: 70, ops: .820, sb: 1 } },
      { name: "Spud Chandler", pos: "SP", pitching: { era: 2.84, w: 18, k9: 3.5, whip: 1.18, sv: 1 } },
    ],
    "Cardinals": [
      { name: "Stan Musial", pos: "OF", batting: { avg: .346, hr: 19, rbi: 95, ops: .995, sb: 6 } },
      { name: "Marty Marion", pos: "SS", batting: { avg: .267, hr: 5, rbi: 60, ops: .700, sb: 3 } },
      { name: "Mort Cooper", pos: "SP", pitching: { era: 2.70, w: 21, k9: 3.6, whip: 1.18, sv: 1 } },
    ],
    "Tigers": [
      { name: "Hal Newhouser", pos: "SP", pitching: { era: 2.36, w: 26, k9: 5.4, whip: 1.18, sv: 2 }, note: "Back-to-back MVP, '44-'45." },
      { name: "Rudy York", pos: "1B", batting: { avg: .276, hr: 22, rbi: 100, ops: .830, sb: 1 } },
    ],
    "Indians": [
      { name: "Bob Feller", pos: "SP", pitching: { era: 2.61, w: 24, k9: 6.8, whip: 1.18, sv: 1 }, note: "Rapid Robert." },
      { name: "Lou Boudreau", pos: "SS", batting: { avg: .306, hr: 8, rbi: 78, ops: .830, sb: 5 } },
    ],
    "Dodgers": [
      { name: "Jackie Robinson", pos: "2B", batting: { avg: .311, hr: 11, rbi: 70, ops: .858, sb: 27 }, note: "Broke the color line, 1947." },
      { name: "Pee Wee Reese", pos: "SS", batting: { avg: .272, hr: 8, rbi: 65, ops: .740, sb: 14 } },
      { name: "Duke Snider", pos: "OF", batting: { avg: .292, hr: 23, rbi: 92, ops: .870, sb: 8 } },
      { name: "Cookie Lavagetto", pos: "3B", batting: { avg: .275, hr: 6, rbi: 65, ops: .740, sb: 3 } },
      { name: "Hugh Casey", pos: "RP", pitching: { era: 3.15, w: 10, k9: 4.0, whip: 1.25, sv: 13 }, note: "Brooklyn's bullpen ace." },
    ],
    "Pirates": [
      { name: "Ralph Kiner", pos: "OF", batting: { avg: .280, hr: 49, rbi: 118, ops: .980, sb: 1 }, note: "Led NL in HR, '46-'49." },
    ],
  },

  "1950s": {
    "Yankees": [
      { name: "Mickey Mantle", pos: "OF", batting: { avg: .310, hr: 38, rbi: 100, ops: 1.000, sb: 7 } },
      { name: "Yogi Berra", pos: "C", batting: { avg: .285, hr: 27, rbi: 98, ops: .855, sb: 1 } },
      { name: "Whitey Ford", pos: "SP", pitching: { era: 2.75, w: 16, k9: 5.1, whip: 1.18, sv: 1 } },
      { name: "Joe Page", pos: "RP", pitching: { era: 3.40, w: 9, k9: 4.8, whip: 1.35, sv: 17 }, note: "Pioneer of the dedicated relief role." },
    ],
    "Braves": [
      { name: "Hank Aaron", pos: "OF", batting: { avg: .312, hr: 32, rbi: 100, ops: .930, sb: 14 } },
      { name: "Eddie Mathews", pos: "3B", batting: { avg: .280, hr: 38, rbi: 100, ops: .910, sb: 3 } },
      { name: "Warren Spahn", pos: "SP", pitching: { era: 3.05, w: 21, k9: 4.6, whip: 1.20, sv: 2 } },
    ],
    "Giants": [
      { name: "Willie Mays", pos: "OF", batting: { avg: .315, hr: 35, rbi: 99, ops: .980, sb: 20 }, note: "The Catch, 1954." },
      { name: "Monte Irvin", pos: "OF", batting: { avg: .293, hr: 18, rbi: 90, ops: .870, sb: 5 } },
    ],
    "Dodgers": [
      { name: "Duke Snider", pos: "OF", batting: { avg: .300, hr: 38, rbi: 107, ops: .945, sb: 5 } },
      { name: "Roy Campanella", pos: "C", batting: { avg: .276, hr: 31, rbi: 100, ops: .895, sb: 1 } },
      { name: "Don Newcombe", pos: "SP", pitching: { era: 3.20, w: 19, k9: 4.9, whip: 1.21, sv: 2 } },
      { name: "Jackie Robinson", pos: "2B", batting: { avg: .300, hr: 14, rbi: 80, ops: .870, sb: 18 } },
    ],
    "Red Sox": [
      { name: "Ted Williams", pos: "OF", batting: { avg: .345, hr: 30, rbi: 95, ops: 1.080, sb: 1 } },
    ],
    "White Sox": [
      { name: "Nellie Fox", pos: "2B", batting: { avg: .293, hr: 3, rbi: 55, ops: .720, sb: 8 } },
      { name: "Luis Aparicio", pos: "SS", batting: { avg: .266, hr: 3, rbi: 40, ops: .660, sb: 35 } },
    ],
    "Cardinals": [
      { name: "Stan Musial", pos: "1B", batting: { avg: .330, hr: 30, rbi: 105, ops: .990, sb: 3 } },
    ],
  },

  "1960s": {
    "Giants": [
      { name: "Willie Mays", pos: "OF", batting: { avg: .305, hr: 40, rbi: 105, ops: .960, sb: 13 } },
      { name: "Willie McCovey", pos: "1B", batting: { avg: .280, hr: 39, rbi: 100, ops: .940, sb: 1 } },
      { name: "Juan Marichal", pos: "SP", pitching: { era: 2.50, w: 23, k9: 6.0, whip: 1.04, sv: 1 } },
      { name: "Gaylord Perry", pos: "SP", pitching: { era: 2.96, w: 16, k9: 5.7, whip: 1.13, sv: 2 } },
    ],
    "Cardinals": [
      { name: "Bob Gibson", pos: "SP", pitching: { era: 2.45, w: 20, k9: 7.2, whip: 1.05, sv: 1 }, note: "1.12 ERA in 1968." },
      { name: "Lou Brock", pos: "OF", batting: { avg: .293, hr: 9, rbi: 55, ops: .745, sb: 60 } },
      { name: "Curt Flood", pos: "OF", batting: { avg: .293, hr: 5, rbi: 50, ops: .720, sb: 16 } },
    ],
    "Tigers": [
      { name: "Al Kaline", pos: "OF", batting: { avg: .300, hr: 25, rbi: 90, ops: .880, sb: 8 } },
      { name: "Denny McLain", pos: "SP", pitching: { era: 2.71, w: 24, k9: 6.5, whip: 1.04, sv: 1 }, note: "31 wins, 1968." },
    ],
    "Orioles": [
      { name: "Frank Robinson", pos: "OF", batting: { avg: .300, hr: 35, rbi: 100, ops: .965, sb: 9 } },
      { name: "Brooks Robinson", pos: "3B", batting: { avg: .272, hr: 18, rbi: 80, ops: .760, sb: 1 } },
      { name: "Jim Palmer", pos: "SP", pitching: { era: 2.73, w: 16, k9: 5.6, whip: 1.13, sv: 1 } },
      { name: "Andy Etchebarren", pos: "C", batting: { avg: .240, hr: 10, rbi: 45, ops: .660, sb: 1 } },
      { name: "Stu Miller", pos: "RP", pitching: { era: 2.70, w: 8, k9: 5.5, whip: 1.15, sv: 18 } },
    ],
    "Dodgers": [
      { name: "Sandy Koufax", pos: "SP", pitching: { era: 2.19, w: 23, k9: 8.9, whip: 0.95, sv: 1 }, note: "4 no-hitters." },
      { name: "Don Drysdale", pos: "SP", pitching: { era: 2.72, w: 18, k9: 6.5, whip: 1.04, sv: 2 } },
      { name: "Maury Wills", pos: "SS", batting: { avg: .290, hr: 2, rbi: 40, ops: .680, sb: 50 } },
    ],
    "Twins": [
      { name: "Harmon Killebrew", pos: "1B", batting: { avg: .265, hr: 44, rbi: 110, ops: .930, sb: 1 } },
      { name: "Rod Carew", pos: "2B", batting: { avg: .302, hr: 4, rbi: 50, ops: .740, sb: 17 } },
    ],
    "Pirates": [
      { name: "Roberto Clemente", pos: "OF", batting: { avg: .328, hr: 18, rbi: 90, ops: .870, sb: 11 } },
      { name: "Willie Stargell", pos: "OF", batting: { avg: .282, hr: 30, rbi: 95, ops: .920, sb: 2 } },
    ],
  },

  "1970s": {
    "Reds": [
      { name: "Johnny Bench", pos: "C", batting: { avg: .270, hr: 33, rbi: 105, ops: .870, sb: 2 } },
      { name: "Pete Rose", pos: "OF", batting: { avg: .310, hr: 8, rbi: 70, ops: .810, sb: 8 } },
      { name: "Joe Morgan", pos: "2B", batting: { avg: .288, hr: 18, rbi: 75, ops: .900, sb: 50 }, note: "Back-to-back MVP, '75-'76." },
      { name: "Tony Perez", pos: "1B", batting: { avg: .283, hr: 24, rbi: 100, ops: .830, sb: 2 } },
    ],
    "Athletics": [
      { name: "Reggie Jackson", pos: "OF", batting: { avg: .265, hr: 32, rbi: 90, ops: .870, sb: 5 } },
      { name: "Rollie Fingers", pos: "RP", pitching: { era: 2.60, w: 9, k9: 6.5, whip: 1.18, sv: 28 }, note: "Mustache, Hall of Fame slider." },
      { name: "Catfish Hunter", pos: "SP", pitching: { era: 3.05, w: 21, k9: 5.0, whip: 1.10, sv: 1 } },
    ],
    "Phillies": [
      { name: "Mike Schmidt", pos: "3B", batting: { avg: .270, hr: 38, rbi: 100, ops: .920, sb: 10 } },
      { name: "Steve Carlton", pos: "SP", pitching: { era: 3.10, w: 20, k9: 6.8, whip: 1.20, sv: 1 } },
    ],
    "Red Sox": [
      { name: "Carl Yastrzemski", pos: "OF", batting: { avg: .285, hr: 22, rbi: 90, ops: .860, sb: 6 } },
      { name: "Jim Rice", pos: "OF", batting: { avg: .306, hr: 39, rbi: 114, ops: .970, sb: 6 } },
      { name: "Carlton Fisk", pos: "C", batting: { avg: .284, hr: 22, rbi: 75, ops: .850, sb: 4 } },
    ],
    "Royals": [
      { name: "George Brett", pos: "3B", batting: { avg: .312, hr: 13, rbi: 80, ops: .840, sb: 14 } },
      { name: "Amos Otis", pos: "OF", batting: { avg: .280, hr: 12, rbi: 75, ops: .780, sb: 30 } },
    ],
    "Dodgers": [
      { name: "Steve Garvey", pos: "1B", batting: { avg: .301, hr: 21, rbi: 95, ops: .830, sb: 4 } },
      { name: "Don Sutton", pos: "SP", pitching: { era: 3.09, w: 17, k9: 5.9, whip: 1.13, sv: 1 } },
    ],
    "Brewers": [
      { name: "Robin Yount", pos: "SS", batting: { avg: .280, hr: 9, rbi: 60, ops: .740, sb: 12 } },
    ],
  },

  "1980s": {
    "Mets": [
      { name: "Dwight Gooden", pos: "SP", pitching: { era: 2.64, w: 17, k9: 8.5, whip: 1.10, sv: 1 }, note: "Doc, 1985 Cy Young." },
      { name: "Darryl Strawberry", pos: "OF", batting: { avg: .263, hr: 30, rbi: 95, ops: .885, sb: 22 } },
      { name: "Gary Carter", pos: "C", batting: { avg: .270, hr: 22, rbi: 90, ops: .830, sb: 2 } },
    ],
    "Royals": [
      { name: "George Brett", pos: "3B", batting: { avg: .320, hr: 22, rbi: 90, ops: .950, sb: 10 } },
      { name: "Bret Saberhagen", pos: "SP", pitching: { era: 3.05, w: 18, k9: 5.6, whip: 1.10, sv: 1 } },
    ],
    "Red Sox": [
      { name: "Wade Boggs", pos: "3B", batting: { avg: .345, hr: 8, rbi: 75, ops: .900, sb: 2 } },
      { name: "Roger Clemens", pos: "SP", pitching: { era: 2.95, w: 20, k9: 8.2, whip: 1.13, sv: 1 } },
      { name: "Jim Rice", pos: "OF", batting: { avg: .300, hr: 25, rbi: 100, ops: .880, sb: 5 } },
    ],
    "Yankees": [
      { name: "Don Mattingly", pos: "1B", batting: { avg: .323, hr: 23, rbi: 110, ops: .920, sb: 2 } },
      { name: "Dave Winfield", pos: "OF", batting: { avg: .293, hr: 27, rbi: 105, ops: .880, sb: 13 } },
      { name: "Rickey Henderson", pos: "OF", batting: { avg: .288, hr: 16, rbi: 60, ops: .865, sb: 80 }, note: "Single-season steals record, 1982." },
      { name: "Willie Randolph", pos: "2B", batting: { avg: .280, hr: 5, rbi: 50, ops: .740, sb: 20 } },
    ],
    "Cardinals": [
      { name: "Ozzie Smith", pos: "SS", batting: { avg: .270, hr: 2, rbi: 50, ops: .680, sb: 40 }, note: "The Wizard of Oz." },
      { name: "Vince Coleman", pos: "OF", batting: { avg: .280, hr: 3, rbi: 40, ops: .680, sb: 100 } },
    ],
    "Athletics": [
      { name: "Jose Canseco", pos: "OF", batting: { avg: .280, hr: 42, rbi: 124, ops: .950, sb: 15 } },
      { name: "Mark McGwire", pos: "1B", batting: { avg: .260, hr: 38, rbi: 100, ops: .880, sb: 1 } },
      { name: "Dennis Eckersley", pos: "RP", pitching: { era: 2.35, w: 4, k9: 8.5, whip: 0.95, sv: 45 } },
    ],
    "Orioles": [
      { name: "Cal Ripken Jr.", pos: "SS", batting: { avg: .280, hr: 25, rbi: 90, ops: .830, sb: 3 } },
    ],
  },

  "1990s": {
    "Mariners": [
      { name: "Ken Griffey Jr.", pos: "OF", batting: { avg: .295, hr: 45, rbi: 120, ops: .975, sb: 12 }, note: "The Kid." },
      { name: "Randy Johnson", pos: "SP", pitching: { era: 3.00, w: 16, k9: 11.0, whip: 1.10, sv: 1 }, note: "Towering lefty fastball." },
      { name: "Alex Rodriguez", pos: "SS", batting: { avg: .300, hr: 36, rbi: 110, ops: .950, sb: 18 } },
    ],
    "Braves": [
      { name: "Greg Maddux", pos: "SP", pitching: { era: 2.15, w: 19, k9: 6.8, whip: 0.95, sv: 1 }, note: "Four straight Cy Youngs." },
      { name: "Chipper Jones", pos: "3B", batting: { avg: .305, hr: 28, rbi: 95, ops: .920, sb: 12 } },
      { name: "Tom Glavine", pos: "SP", pitching: { era: 3.10, w: 18, k9: 5.5, whip: 1.21, sv: 1 } },
    ],
    "Rockies": [
      { name: "Larry Walker", pos: "OF", batting: { avg: .350, hr: 38, rbi: 110, ops: 1.080, sb: 20 } },
      { name: "Todd Helton", pos: "1B", batting: { avg: .320, hr: 30, rbi: 105, ops: .990, sb: 2 } },
    ],
    "Padres": [
      { name: "Tony Gwynn", pos: "OF", batting: { avg: .350, hr: 8, rbi: 60, ops: .885, sb: 14 }, note: "Eight batting titles." },
    ],
    "Indians": [
      { name: "Manny Ramirez", pos: "OF", batting: { avg: .310, hr: 33, rbi: 110, ops: .985, sb: 3 } },
      { name: "Jim Thome", pos: "1B", batting: { avg: .285, hr: 38, rbi: 105, ops: .985, sb: 3 } },
      { name: "Kenny Lofton", pos: "OF", batting: { avg: .310, hr: 10, rbi: 60, ops: .830, sb: 50 } },
      { name: "Sandy Alomar Jr.", pos: "C", batting: { avg: .280, hr: 14, rbi: 65, ops: .770, sb: 3 } },
      { name: "Carlos Baerga", pos: "2B", batting: { avg: .305, hr: 18, rbi: 85, ops: .830, sb: 8 } },
    ],
    "Cardinals": [
      { name: "Mark McGwire", pos: "1B", batting: { avg: .270, hr: 58, rbi: 130, ops: 1.080, sb: 1 }, note: "70 HR, 1998." },
      { name: "Ozzie Smith", pos: "SS", batting: { avg: .265, hr: 2, rbi: 45, ops: .680, sb: 25 } },
    ],
    "Giants": [
      { name: "Barry Bonds", pos: "OF", batting: { avg: .310, hr: 40, rbi: 105, ops: 1.050, sb: 25 } },
      { name: "Robb Nen", pos: "RP", pitching: { era: 2.95, w: 5, k9: 10.5, whip: 1.15, sv: 40 } },
    ],
  },

  "2000s": {
    "Yankees": [
      { name: "Derek Jeter", pos: "SS", batting: { avg: .317, hr: 16, rbi: 75, ops: .830, sb: 22 } },
      { name: "Mariano Rivera", pos: "RP", pitching: { era: 2.10, w: 4, k9: 8.8, whip: 1.00, sv: 42 }, note: "Cutter, October legend." },
      { name: "Alex Rodriguez", pos: "3B", batting: { avg: .300, hr: 47, rbi: 125, ops: 1.000, sb: 15 } },
    ],
    "Giants": [
      { name: "Barry Bonds", pos: "OF", batting: { avg: .328, hr: 53, rbi: 115, ops: 1.250, sb: 8 }, note: "73 HR, 2001." },
    ],
    "Red Sox": [
      { name: "David Ortiz", pos: "DH", batting: { avg: .300, hr: 42, rbi: 130, ops: 1.000, sb: 1 }, note: "Big Papi." },
      { name: "Manny Ramirez", pos: "OF", batting: { avg: .310, hr: 38, rbi: 115, ops: .995, sb: 2 } },
      { name: "Pedro Martinez", pos: "SP", pitching: { era: 2.20, w: 17, k9: 10.5, whip: 0.90, sv: 1 }, note: "2000: 1.74 ERA league-wide outlier." },
    ],
    "Cardinals": [
      { name: "Albert Pujols", pos: "1B", batting: { avg: .331, hr: 43, rbi: 124, ops: 1.040, sb: 6 } },
      { name: "Chris Carpenter", pos: "SP", pitching: { era: 3.10, w: 18, k9: 7.2, whip: 1.10, sv: 1 } },
    ],
    "Twins": [
      { name: "Joe Mauer", pos: "C", batting: { avg: .327, hr: 10, rbi: 75, ops: .870, sb: 4 } },
      { name: "Johan Santana", pos: "SP", pitching: { era: 2.87, w: 17, k9: 9.5, whip: 1.03, sv: 1 } },
      { name: "Luis Castillo", pos: "2B", batting: { avg: .300, hr: 2, rbi: 40, ops: .720, sb: 35 } },
    ],
    "Diamondbacks": [
      { name: "Randy Johnson", pos: "SP", pitching: { era: 2.60, w: 21, k9: 11.5, whip: 0.97, sv: 1 } },
      { name: "Luis Gonzalez", pos: "OF", batting: { avg: .300, hr: 30, rbi: 100, ops: .920, sb: 7 } },
    ],
    "Tigers": [
      { name: "Miguel Cabrera", pos: "1B", batting: { avg: .320, hr: 34, rbi: 115, ops: .965, sb: 2 } },
    ],
  },

  "2010s": {
    "Angels": [
      { name: "Mike Trout", pos: "OF", batting: { avg: .305, hr: 39, rbi: 90, ops: 1.000, sb: 21 }, note: "Best all-around player of the decade." },
      { name: "Albert Pujols", pos: "1B", batting: { avg: .275, hr: 28, rbi: 95, ops: .830, sb: 2 } },
    ],
    "Dodgers": [
      { name: "Clayton Kershaw", pos: "SP", pitching: { era: 2.31, w: 18, k9: 9.5, whip: 0.95, sv: 1 }, note: "Three Cy Youngs." },
      { name: "Corey Seager", pos: "SS", batting: { avg: .295, hr: 22, rbi: 80, ops: .880, sb: 3 } },
    ],
    "Astros": [
      { name: "Jose Altuve", pos: "2B", batting: { avg: .315, hr: 18, rbi: 75, ops: .865, sb: 33 } },
      { name: "Justin Verlander", pos: "SP", pitching: { era: 3.00, w: 18, k9: 9.8, whip: 1.05, sv: 1 } },
      { name: "Alex Bregman", pos: "3B", batting: { avg: .295, hr: 27, rbi: 90, ops: .900, sb: 5 } },
      { name: "Brian McCann", pos: "C", batting: { avg: .250, hr: 18, rbi: 65, ops: .780, sb: 1 } },
    ],
    "Red Sox": [
      { name: "Mookie Betts", pos: "OF", batting: { avg: .312, hr: 30, rbi: 90, ops: .950, sb: 22 } },
      { name: "David Ortiz", pos: "DH", batting: { avg: .295, hr: 35, rbi: 115, ops: .960, sb: 1 } },
      { name: "Xander Bogaerts", pos: "SS", batting: { avg: .293, hr: 21, rbi: 85, ops: .830, sb: 9 } },
    ],
    "Rockies": [
      { name: "Nolan Arenado", pos: "3B", batting: { avg: .295, hr: 38, rbi: 115, ops: .920, sb: 2 } },
    ],
    "Cubs": [
      { name: "Kris Bryant", pos: "3B", batting: { avg: .280, hr: 31, rbi: 85, ops: .890, sb: 7 } },
      { name: "Anthony Rizzo", pos: "1B", batting: { avg: .280, hr: 28, rbi: 95, ops: .880, sb: 8 } },
      { name: "Jon Lester", pos: "SP", pitching: { era: 3.10, w: 16, k9: 8.6, whip: 1.18, sv: 1 } },
    ],
    "Indians": [
      { name: "Francisco Lindor", pos: "SS", batting: { avg: .290, hr: 25, rbi: 80, ops: .850, sb: 18 } },
      { name: "Corey Kluber", pos: "SP", pitching: { era: 2.85, w: 17, k9: 9.9, whip: 1.02, sv: 1 } },
    ],
    "Yankees": [
      { name: "Aroldis Chapman", pos: "RP", pitching: { era: 2.10, w: 4, k9: 14.0, whip: 0.95, sv: 38 } },
      { name: "Aaron Judge", pos: "OF", batting: { avg: .284, hr: 47, rbi: 105, ops: .980, sb: 5 } },
    ],
  },

  "2020s": {
    "Dodgers": [
      { name: "Mookie Betts", pos: "OF", batting: { avg: .295, hr: 35, rbi: 95, ops: .960, sb: 12 } },
      { name: "Freddie Freeman", pos: "1B", batting: { avg: .320, hr: 27, rbi: 95, ops: .950, sb: 8 } },
      { name: "Shohei Ohtani", pos: "DH", batting: { avg: .305, hr: 48, rbi: 115, ops: 1.020, sb: 38 }, note: "Reached base and pitched like nobody before him." },
      { name: "Yoshinobu Yamamoto", pos: "SP", pitching: { era: 2.90, w: 14, k9: 9.6, whip: 1.05, sv: 1 } },
    ],
    "Braves": [
      { name: "Ronald Acuna Jr.", pos: "OF", batting: { avg: .305, hr: 35, rbi: 95, ops: .990, sb: 60 }, note: "First 40-70 season threat." },
      { name: "Spencer Strider", pos: "SP", pitching: { era: 3.20, w: 16, k9: 13.5, whip: 1.05, sv: 1 } },
      { name: "Austin Riley", pos: "3B", batting: { avg: .290, hr: 38, rbi: 100, ops: .920, sb: 2 } },
    ],
    "Orioles": [
      { name: "Gunnar Henderson", pos: "SS", batting: { avg: .290, hr: 33, rbi: 90, ops: .900, sb: 18 } },
      { name: "Adley Rutschman", pos: "C", batting: { avg: .280, hr: 20, rbi: 80, ops: .830, sb: 3 } },
    ],
    "Yankees": [
      { name: "Aaron Judge", pos: "OF", batting: { avg: .310, hr: 58, rbi: 130, ops: 1.110, sb: 9 }, note: "AL record 62 HR, 2022." },
      { name: "Gerrit Cole", pos: "SP", pitching: { era: 2.95, w: 17, k9: 10.8, whip: 1.00, sv: 1 } },
    ],
    "Astros": [
      { name: "Yordan Alvarez", pos: "DH", batting: { avg: .295, hr: 35, rbi: 100, ops: .980, sb: 1 } },
      { name: "Framber Valdez", pos: "SP", pitching: { era: 2.95, w: 15, k9: 8.5, whip: 1.05, sv: 1 } },
      { name: "Jose Altuve", pos: "2B", batting: { avg: .300, hr: 22, rbi: 80, ops: .870, sb: 15 } },
    ],
    "Padres": [
      { name: "Fernando Tatis Jr.", pos: "SS", batting: { avg: .290, hr: 36, rbi: 95, ops: .970, sb: 25 } },
      { name: "Manny Machado", pos: "3B", batting: { avg: .285, hr: 30, rbi: 95, ops: .870, sb: 6 } },
      { name: "Josh Hader", pos: "RP", pitching: { era: 2.30, w: 3, k9: 13.8, whip: 0.95, sv: 35 } },
    ],
    "Phillies": [
      { name: "Bryce Harper", pos: "1B", batting: { avg: .295, hr: 30, rbi: 90, ops: .950, sb: 10 } },
      { name: "Zack Wheeler", pos: "SP", pitching: { era: 2.85, w: 15, k9: 9.8, whip: 1.00, sv: 1 } },
      { name: "Trea Turner", pos: "SS", batting: { avg: .300, hr: 25, rbi: 85, ops: .880, sb: 30 } },
    ],
  },
};
