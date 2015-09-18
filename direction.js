// Display order in the UI. Also, a nice list of all standard directions.
var in_order = ['n', 's', 'e', 'w', 'ne', 'sw', 'nw', 'se', 'u', 'd', 'i', 'o'];

// Pairs of opposite directions.
var pairs = [
  ['n', 's'],
  ['e', 'w'],
  ['ne', 'sw'],
  ['nw', 'se'],
  ['u', 'd'],
  ['i', 'o']
];

// "Alice goes ___"
var to_word = {
  'n': 'north',
  's': 'south',
  'e': 'east',
  'w': 'west',
  'ne': 'northeast',
  'nw': 'northwest',
  'se': 'southeast',
  'sw': 'southwest',
  'u': 'up',
  'd': 'down',
  'i': 'in',
  'o': 'out'
};

// Maps direction to its opposite.
var opposite = {};
pairs.forEach(function(dirs) {
  opposite[dirs[0]] = dirs[1];
  opposite[dirs[1]] = dirs[0];
});

// "x creates an exit ___"
var to_the = {
  'n': 'to the north',
  's': 'to the south',
  'e': 'to the east',
  'w': 'to the west',
  'ne': 'to the northeast',
  'nw': 'to the northwest',
  'se': 'to the southeast',
  'sw': 'to the southwest',
  'u': 'upward',
  'd': 'downward',
  'i': 'inward',
  'o': 'outward'
};

// "x comes from ___"
var the = {
  'n': 'the north',
  's': 'the south',
  'e': 'the east',
  'w': 'the west',
  'ne': 'the northeast',
  'nw': 'the northwest',
  'se': 'the southeast',
  'sw': 'the southwest',
  'u': 'upwards',
  'd': 'downwards',
  'i': 'inward',
  'o': 'outward'
};

var direction_dict = {};
for (dir_code in to_word) {
  direction_dict[dir_code] = dir_code;
  direction_dict[to_word[dir_code]] = dir_code;
}

function parse(msg) {
  if (msg in direction_dict) {
    return direction_dict[msg];
  } else {
    return null;
  }
};

module.exports = {
  in_order: in_order,
  opposite: opposite,
  to_word: to_word,
  to_the: to_the,
  the: the,
  direction_dict: direction_dict,
  parse: parse
}
