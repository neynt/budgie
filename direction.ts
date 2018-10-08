export type t = string;

// Directions in order they will be displayed to the user.
export const in_order: Array<t> = [
  'n', 's', 'e', 'w', 'ne', 'sw', 'nw', 'se', 'u', 'd', 'i', 'o'
];

// Pairs of opposite directions.
const pairs = [
  ['n', 's'],
  ['e', 'w'],
  ['ne', 'sw'],
  ['nw', 'se'],
  ['u', 'd'],
  ['i', 'o']
];

// Maps direction to its opposite.
const _opposite: {[d: string]: t} = {};
pairs.forEach((dirs) => {
  _opposite[dirs[0]] = dirs[1];
  _opposite[dirs[1]] = dirs[0];
});
export function opposite(d: t): t {
  return _opposite[d];
}

// "Alice goes ___"
const _to_word: {[d: string]: string} = {
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
export function to_word(d: t): string {
  return _to_word[d];
}

// "x creates an exit ___"
const _to_the: {[d: string]: string} = {
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
export function to_the(d: t): string {
  return _to_the[d];
}

// "x comes from ___"
export const _the: {[d: string]: string} = {
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
export function the(d: t): string {
  return _the[d];
}

const direction_dict: {[d: string]: t} = {};
for (const dir_code in to_word) {
  direction_dict[dir_code] = dir_code;
  direction_dict[to_word(dir_code)] = dir_code;
}

export function parse(msg: string): t | null {
  if (msg in direction_dict) {
    return direction_dict[msg];
  } else {
    return null;
  }
};
