import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Site } from './site';

// The public website at `/`. Zoneless and standalone like the admin, no router: one page, anchors for sections.
bootstrapApplication(Site, { providers: [provideBrowserGlobalErrorListeners()] }).catch((err) => console.error(err));
