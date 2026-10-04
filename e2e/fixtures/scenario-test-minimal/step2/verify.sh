#!/bin/sh
# Verify that /tmp/hello.txt contains "Hello OCF!"
if [ -f /tmp/hello.txt ] && grep -q "Hello OCF!" /tmp/hello.txt; then
    echo "Perfect! The file contains the correct text."
    exit 0
else
    echo "The file /tmp/hello.txt should contain 'Hello OCF!'"
    exit 1
fi
