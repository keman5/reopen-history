# Settings layout and minimum font size

Goal: keep minimum text size between 13 and 20px and make the extension's settings easier to scan.

Reuse the existing typography preference and live storage updates. Preserve the current white/orange visual style and all existing controls. Group the page into Display (slider, current value, sample text), Actions (right-click menu toggle), and Recovery scope (explanation). Place the save status and local-only note in the footer. Allow sections and controls to grow with the selected text size on narrow screens; never force focus.

1. Update browser checks to require a 20px maximum, live updates, persistence, keyboard control, invalid-value clamping and narrow-screen layout. Confirm the existing 30px implementation fails.
2. Update the slider and clamp to 20px, localize the new section labels and sample text in all 12 locales, and update the font range in documentation.
3. Reorganize settings markup and scoped styles without changing existing recovery behavior or other uncommitted work.
4. Run build.sh locally, run headless Edge native and Safari-fallback checks, inspect desktop/mobile settings screenshots, verify the installed Safari app and clean build caches.
