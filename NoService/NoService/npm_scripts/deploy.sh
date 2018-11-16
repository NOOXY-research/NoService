# /bin/#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
DIR="${DIR%.bin}noservice/"

INSTALL_DIR="$(pwd)"
if [[ $1 = *[!\ ]* ]]; then
  INSTALL_DIR=$1
fi

echo "Deploying NoService..."
echo "Install directory: $INSTALL_DIR"
echo "NoService root: $DIR"
echo "Copying NoService..."
cp -R "${DIR}NoService/" "$INSTALL_DIR"
echo "Cleaning up unessasary files..."
rm -R "${INSTALL_DIR}/NoService/npm_scripts"
echo ""
echo ""
echo "-----------------------------------------------------------"
echo "| WOLA! Succeessfully deployed!                           |"
echo "| For more information go to https://nooxy.org            |"
echo "| In oreder to use   database you might need to install   |"
echo "| sqlite3 or mysql                                        |"
echo "|                                                         |"
echo "| Type \"node launch.js\" to get started.                   |"
echo "-----------------------------------------------------------"
