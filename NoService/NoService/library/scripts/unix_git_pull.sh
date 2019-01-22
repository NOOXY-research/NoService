# /bin/#!/usr/bin/env bash
cd $1
git reset --hard
git clean -d -fx .
git pull $2 $3
