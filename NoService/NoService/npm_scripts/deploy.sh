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
rm -R "${INSTALL_DIR}/node_modules/"
echo ""
echo ""
echo "-----------------------------------------------------------"
echo "| WOLA! Succeessfully deployed!                           |"
echo "| For more information go to https://nooxy.org            |"
echo "| In order to use database you might need to install      |"
echo "| \"sqlite3\" or \"mysql\"                                    |"
echo "|                                                         |"
echo "| Type \"node launch.js\" to get started.                   |"
echo "-----------------------------------------------------------"
echo ""
echo "You might need to generate RSA 2048 key if you enable sercure protocol."
echo "> openssl genrsa -des3 -out private.pem 2048"
echo "> openssl rsa -in private.pem -outform PEM -pubout -out public.pem"
echo "> openssl rsa -in private.pem -out private.pem -outform PEM"
echo "Help You Setup?(y/n)"
read yesno

if [ "$yesno" = "y" ]; then
  openssl genrsa -des3 -out private.pem 2048
  openssl rsa -in private.pem -outform PEM -pubout -out public.pem
  openssl rsa -in private.pem -out private.pem -outform PEM
fi

echo "Package \"ws\", \"sqlite3\" are required."
echo "Note that \"sqlite3\" can be switched to other databases."
echo "Install dependencies?(y/n)"

read yesno2
if [ "$yesno2" = "y" ]; then
  npm install ws sqlite3 -save
fi
