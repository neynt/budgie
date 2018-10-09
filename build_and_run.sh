#!/bin/bash

# Greatest hack of all time
if [ ! -e node_modules/@ ]; then
  ln -s .. node_modules/@
fi

(cd static && tsc) &
tsc &
wait

node index.js
