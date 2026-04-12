# Prevent iOS Input Zoom

## Problem

iOS Safari automatically zooms the viewport when a form input receives focus if its `font-size` is less than 16px. This is designed to aid readability on small screens, but it breaks the native-app feel of a PWA — the page zooms to the input width and stays zoomed after the user leaves the field.

## Solution

A global CSS rule in `frontend/src/app.css` sets `font-size: 1rem` (16px) on all `input`, `select`, and `textarea` elements. Since 1rem equals 16px by default, this meets the iOS threshold without visually enlarging inputs that are already sized appropriately via Tailwind classes.

## Why not `user-scalable=no` in the viewport meta?

- iOS 10+ ignores `user-scalable=no` in Safari for accessibility reasons
- It would disable pinch-to-zoom for users who need it
- The font-size fix addresses the root cause instead of fighting the browser
