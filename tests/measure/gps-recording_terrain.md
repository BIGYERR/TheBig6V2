# GPS recording: does a map of ground height fix the climb? (measure, on v0.263.0)

The first run on v0.263.0 read 23.3 m of climb where the watch read 15 (`gps-recording_first-run.md`, D296 in
`docs/decisions/gps-recording.md`): the barometer drifted while GPS altitude did not, and neither a wider band nor the
barometer held to GPS altitude read the watch's totals. Mario then asked what open source run trackers could lend; one
of them checks a device's height sensor against a free map of ground height and corrects it. This measure tries that
on the same run, with Mario's yes to the download.

- **The files.** The run's GPX (as in `gps-recording_first-run.md`) and one Copernicus 30 m elevation tile (GLO-30,
  32,057,780 bytes, from the public archive, no account), the one-degree square the run sits in. Neither is committed:
  a track shows where a run starts and ends, and a tile's name shows the square. They sat in the session's scratchpad.
  The watch's laps are COROS's lap data for the run, read through the connector.
- **The reader.** The script reads the tile itself (one image of 32-bit floats in deflated 1024 by 1024 tiles,
  predictor 3, its tiepoint the centre of the first cell) and takes the height under each fix between the four cells
  around it. No package was installed.
- **The script.** `node tests/measure/gps-recording_terrain.mjs <run.gpx> <tile.tif> 4/3,3/0,0/0,3/7,5/0
  690.91,1402.38,2078.06,2773.71,3347.64` printed everything below; nothing was added up by hand.

## Where each stands from Start, in m
- 5 min: barometer 0.5, GPS 2.1, ground 2.5; 10 min: barometer 3.3, GPS 4.1, ground 3.4; 15 min: barometer 4.4, GPS 3.1, ground 0.9; 20 min: barometer 4.8, GPS 3.8, ground 1.4; 25 min: barometer 5.3, GPS 2.0, ground 1.6; 30 min: barometer 7.6, GPS 4.9, ground 2.0; 35 min: barometer 6.3, GPS 1.2, ground 1.0; 40 min: barometer 2.4, GPS -3.7, ground -3.6; 45 min: barometer 6.6, GPS -1.7, ground -1.1; 50 min: barometer 8.7, GPS 0.3, ground 3.0; 55 min: barometer 10.2, GPS 1.2, ground 0.6.
- At the last fix: barometer 9.9, GPS 0.9, ground -0.0.

## Climb on the 2 m turn band, against the watch
- The watch: 15 m up, 10 m down; by lap 4/3, 3/0, 0/0, 3/7, 5/0.
- The barometer drifts 12.3 m an hour against GPS altitude.
- The barometer drifts 11.0 m an hour against the ground under the run.
- The barometer (as built): 23.3 m up, 12.7 m down; by lap 7.3/3.6, 1.8/0.0, 2.5/0.0, 4.4/9.1, 7.3/0.0; off the watch's laps by 13.3 m in all.
- The ground under the run: 112.9 m up, 112.0 m down; by lap 38.5/37.1, 15.4/15.4, 4.5/6.4, 35.2/32.7, 19.3/20.4; off the watch's laps by 199.9 m in all.
- GPS altitude: 100.8 m up, 98.9 m down; by lap 19.3/14.2, 22.9/23.4, 12.4/17.1, 24.4/30.2, 21.7/14.0; off the watch's laps by 174.7 m in all.
- The barometer held to GPS altitude over 5 min: 18.3 m up, 16.1 m down; by lap 7.9/3.5, 0.2/0.0, 0.1/3.2, 3.7/9.4, 6.3/0.0; off the watch's laps by 14.9 m in all.
- The barometer held to the ground over 5 min: 27.5 m up, 22.6 m down; by lap 9.8/3.2, 0.0/5.2, 2.3/4.1, 6.2/10.0, 9.2/0.0; off the watch's laps by 31.0 m in all.
- The barometer held to the ground over 10 min: 24.9 m up, 21.1 m down; by lap 9.2/3.6, 0.2/3.9, 2.1/3.3, 6.2/9.4, 7.2/0.9; off the watch's laps by 26.6 m in all.
- The barometer, its drift against GPS altitude taken out: 13.6 m up, 14.2 m down; by lap 4.0/2.4, 0.3/0.0, 0.1/2.8, 3.8/9.0, 5.5/0.0; off the watch's laps by 9.6 m in all.
- The barometer, its drift against the ground taken out: 14.3 m up, 13.7 m down; by lap 4.0/2.2, 0.4/0.0, 0.4/2.7, 3.8/8.8, 5.7/0.0; off the watch's laps by 9.8 m in all.

## What it shows
- **The map cannot count the climb itself.** Copernicus is a surface model: it holds the tops of trees and roofs, so
  the height under a run along streets jumps up and down, 112.9 m up on the band where the watch counted 15.
- **As a slow reference it agrees with GPS altitude.** Against either, the barometer drifted about the same over the
  hour (11.0 and 12.3 m an hour). The drift is the weather, not the run.
- **Taking the drift out is the best candidate so far.** A straight line fitted over the run to the barometer less its
  reference, then taken off the barometer: 13.6 m up against the watch's 15, and the laps 9.6 m off in all, against
  13.3 as built. GPS altitude does it as well as the map (9.6 against 9.8 m), so the map adds nothing a download would
  pay for.
- **The watch is not the truth for climb either.** It reads the run 5 m higher at the end than at the start; the map
  reads -0.0 and GPS altitude 0.9. With the drift out, the barometer's climb and descent nearly match (13.6 and 14.2),
  as a run that ends at the height it started from should; the watch's 10 m of descent is likely the low one.
- **One flat run.** The climb stays as built (D296). A run with a real hill decides whether the drift line holds when
  the climb is larger than the drift; then coach rules.
