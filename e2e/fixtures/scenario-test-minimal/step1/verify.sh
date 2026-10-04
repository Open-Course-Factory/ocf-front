#!/bin/sh
# Verify that /tmp/hello.txt exists
if [ -f /tmp/hello.txt ]; then
    echo "File /tmp/hello.txt exists. Well done!"
    exit 0
else
    echo "File /tmp/hello.txt not found. Please create it."
    exit 1
fi
