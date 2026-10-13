WEDDING INVITATION - Vincensius & Devi
======================================

FOLDER
  index.html      -> all the text (names, date, venues, story, parents' names)
  css/style.css   -> colours, fonts, layout (colours are at the top, in :root)
  js/main.js      -> wedding date for the countdown + list of photo files
  images/         -> put your photos here

RUN ON WAMP
  1. Copy this whole folder to  C:\wamp64\www\wedding   (folder name is up to you)
  2. Start WampServer (icon should be green)
  3. Open  http://localhost/wedding/  in your browser
  After every edit, save the file and refresh the browser (Ctrl+F5).
  Note: it needs internet only for the Google Fonts; otherwise it works offline.

CHANGE PHOTOS
  Save your photos in the images folder with these names:
    groom.jpg, bride.jpg, gallery-1.jpg ... gallery-6.jpg
  Tips: portrait photos for groom/bride (about 900x1200 px), keep each under 400 KB
  (resize with squoosh.app), and use the same extension (.jpg) as in js/main.js.
  To show more gallery photos, add more lines in the PHOTOS list in js/main.js.

CHANGE DETAILS
  Date/countdown : js/main.js  (WEDDING = ...)
  Date text shown: index.html, search "26 December 2026" (hero + two event cards)
  Venues         : index.html, search "Church name" and "Venue name"
  Map buttons    : replace the Google Maps link in each "View map" button with your
                   venue's link (open the venue in Google Maps > Share > Copy link)
  Parents        : index.html, search "Son of" and "Daughter of"
  Story          : index.html, the "Our story" section
  Colours        : css/style.css, first lines (--rose, --sage, --ink ...)

PUBLISH FREE
  Go to app.netlify.com/drop and drag this whole folder onto the page.
