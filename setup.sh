#!/bin/bash
cd scratch-vm
echo "installing scratch-vm deps"
npm install
echo "linking scratch-vm to global prefix"
npm link
cd ../scratch-gui
echo "installing scratch-gui deps"
npm install
echo "linking scratch-vm to scratch-gui/node-modules"
npm link scratch-vm