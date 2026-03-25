// Manum service worker (Manifest V3)
// Handles tab tracking and extension-editor communication

import { startTabTracker } from './tab-tracker.js';

console.debug('[Manum] Service worker started');

// Tab tracking listener must be registered at the top level
// (not inside async callbacks) so it persists across service worker restarts.
startTabTracker();
