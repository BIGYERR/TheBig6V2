# doctrine/

Page-ordered OCR text of the doctrine sources, for the `coach` agent to grep. Gitignored so
GitHub Pages does not publish them; regenerate on a new machine from the source archives:

The "PDFs" in the old Claude project are ZIP archives of OCR pages (`1.jpeg`, `1.txt`, …), not PDFs.
For each archive:

```bash
mkdir -p /tmp/dz && unzip -qo NikeRunClubHalfMarathonTrainingPlanAudioGuidedRuns.pdf -d /tmp/dz/half
: > doctrine/nikerunclubhalfmarathon.txt
for f in $(ls /tmp/dz/half/*.txt | sed 's#.*/##' | sort -n); do
  echo "===== PAGE ${f%.txt} =====" >> doctrine/nikerunclubhalfmarathon.txt
  cat "/tmp/dz/half/$f" >> doctrine/nikerunclubhalfmarathon.txt; echo >> doctrine/nikerunclubhalfmarathon.txt
done
```

Files expected here: `physicaltrainingguide2020.txt`, `nikerunclub5k.txt`, `nikerunclub10k.txt`,
`nikerunclubhalfmarathon.txt`, `nikerunclubmarathon.txt`. Numeric sort on the page filenames matters —
`ls` sorts `10.txt` before `2.txt`.
