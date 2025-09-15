#!/bin/bash
set -e

rm -rf out
mkdir -p out

cp index.html out/.
cp -r src out/.
cp -r models out/.

pushd out
