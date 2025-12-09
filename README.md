<!-- UI & layout ideas — used ChatGPT / Gemini to create a mobile-first layout and color palette.
Prompt example: “Suggest a 3-color palette and a minimal mobile-first layout for a time-tracking app.”

Code generation — used ChatGPT to draft activityService.js transaction logic for preventing >1440 minutes.
Prompt example: “Write a Firebase Realtime Database transaction function that adds an activity and ensures totalMinutes <= 1440.”

Copywriting — used an LLM to craft UX microcopy (errors, CTAs).

README & docs — used AI to generate this README template and check instructions.

Google Sign-In popup blocked

Ensure your deployed domain is added to Firebase Authorized domains and OAuth consent is configured.

Assets 404 on GitHub Pages

Check that index.html references local files with relative paths (e.g., ./firebaseInit.js) and that those files are committed.

Concurrent edits lead to wrong totals

Use runTransaction (implemented in activityService.js). Transactions help prevent race conditions when multiple tabs/devices update the same date.

Rules rejecting writes

Use Firebase Rules Simulator in console to debug rules. During dev, you may temporarily use test mode, but lock rules before publishing.
Add screenshots or short GIFs to the assets/ folder and reference them below. Example:

assets/screenshot-1.png (Main app view)

assets/screenshot-2.png (No data view)

assets/screenshot-3.gif (Add activity → Analyse) -->


<!-- https://github.com/BindhuEdara/timeTrackingAppUsingAI -->


