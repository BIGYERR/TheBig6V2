import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The generating screen (architecture phase E, step 21), in place of the legacy #screenGenerate markup: the lifting
 * figure and its title. The line under it (#generateSub) is still written by the legacy generateProgram as it builds.
 */
@Component({
  selector: 'ia-generating-screen',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="generate-screen">
    <svg role="status" aria-label="Loading" width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="var(--text)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 18px">
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 11; 0 0" keyTimes="0;0.5;1" dur="1.5s" calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" repeatCount="indefinite"/>
        <line x1="17" y1="8" x2="47" y2="8"/>
        <line x1="18" y1="3.5" x2="18" y2="12.5"/>
        <line x1="46" y1="3.5" x2="46" y2="12.5"/>
        <line x1="21.5" y1="5" x2="21.5" y2="11"/>
        <line x1="42.5" y1="5" x2="42.5" y2="11"/>
        <path d="M32 19 L23 8"/>
        <path d="M32 19 L41 8"/>
        <circle cx="32" cy="14.5" r="3.4"/>
        <line x1="32" y1="18" x2="32" y2="36"/>
      </g>
      <path d="M32 36 L26 46 L24 56">
        <animate attributeName="d" dur="1.5s" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" values="M32 36 L26 46 L24 56; M32 47 L20 49 L24 57; M32 36 L26 46 L24 56" repeatCount="indefinite"/>
      </path>
      <path d="M32 36 L38 46 L40 56">
        <animate attributeName="d" dur="1.5s" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" values="M32 36 L38 46 L40 56; M32 47 L44 49 L40 57; M32 36 L38 46 L40 56" repeatCount="indefinite"/>
      </path>
      <g stroke="none" fill="var(--signal,#CF4E1A)">
        <circle cx="40" cy="24" r="1.3">
          <animate attributeName="cy" dur="1.5s" keyTimes="0;0.5;0.78;1" values="24;24;31;31" repeatCount="indefinite"/>
          <animate attributeName="cx" dur="1.5s" keyTimes="0;0.5;0.78;1" values="40;40;44;44" repeatCount="indefinite"/>
          <animate attributeName="opacity" dur="1.5s" keyTimes="0;0.5;0.6;0.78;1" values="0;0;1;0;0" repeatCount="indefinite"/>
        </circle>
        <circle cx="24" cy="24" r="1.1">
          <animate attributeName="cy" dur="1.5s" keyTimes="0;0.55;0.85;1" values="24;24;30;30" repeatCount="indefinite"/>
          <animate attributeName="cx" dur="1.5s" keyTimes="0;0.55;0.85;1" values="24;24;20;20" repeatCount="indefinite"/>
          <animate attributeName="opacity" dur="1.5s" keyTimes="0;0.55;0.65;0.85;1" values="0;0;1;0;0" repeatCount="indefinite"/>
        </circle>
      </g>
    </svg>
    <div class="generate-title">Building Your Program</div>
    <div class="generate-sub" id="generateSub">Calculating progressions...</div>
  </div>
`,
})
export class GeneratingScreen {
}
