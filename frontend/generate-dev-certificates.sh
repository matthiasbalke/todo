#!/usr/bin/env zsh

mkcert -key-file .certs/key.pem -cert-file .certs/cert.pem localhost 127.0.0.1 localhost todo.example.com
