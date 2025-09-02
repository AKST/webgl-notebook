#!/bin/bash
set -e

rm -rf out
mkdir -p out

cp index.html out/.
cp -r math out/.
cp -r common out/.

for e_dir in `find . -type d -maxdepth 1 -name 'example*' | sed 's|^\./||'`; do
  cp -r "${e_dir}" out/.
done

pushd out
