#!/usr/bin/env bash

VITE_HMR_HOST=todo.example.com
export VITE_HMR_HOST

VITE_HMR_CLIENT_PORT=443
export VITE_HMR_CLIENT_PORT

bun run dev:https
