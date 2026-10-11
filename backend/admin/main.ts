import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Admin } from './admin';

// Zoneless (no zone.js), one standalone component, no router and no HttpClient: the smallest Angular there is.
bootstrapApplication(Admin, { providers: [provideBrowserGlobalErrorListeners()] }).catch((err) => console.error(err));
