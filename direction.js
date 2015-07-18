// Display order in the UI. Also, a nice list of all directions.
var in_order = ['n', 'e', 's', 'w', 'u', 'd'];

// Maps direction to its opposite.
var opposite = {
  'n': 's',
  's': 'n',
  'e': 'w',
  'w': 'e',
  'u': 'd',
  'd': 'u'
};

// "x goes ___"
var to_word = {
  'n': 'north',
  's': 'south',
  'e': 'east',
  'w': 'west',
  'u': 'up',
  'd': 'down'
};

// "x creates an exit ___"
var to_the = {
  'n': 'to the north',
  's': 'to the south',
  'e': 'to the east',
  'w': 'to the west',
  'u': 'upwards',
  'd': 'downwards'
};

// "x comes from ___"
var the = {
  'n': 'the north',
  's': 'the south',
  'e': 'the east',
  'w': 'the west',
  'u': 'upwards',
  'd': 'downwards'
};

var direction_dict = {
  'n': 'n',
  'e': 'e',
  'w': 'w',
  's': 's',
  'u': 'u',
  'd': 'd',
  'north': 'n',
  'east': 'e',
  'west': 'w',
  'south': 's',
  'up': 'u',
  'down': 'd',
};

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
