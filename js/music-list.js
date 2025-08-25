// js/music-list.js
// Define the playlist as a GLOBAL so other scripts can use it.
window.allMusic = [
  { "name": "dont let me go (prod. 6tracks)",      "artist": "G Jordan, 6tracks",     "img": "music-1",  "src": "music-1" },
  { "name": "Dreams (prod. Cobra)",                "artist": "G Jordan, Cobra",       "img": "music-2",  "src": "music-2" },
  { "name": "For A While (prod. 6tracks)",         "artist": "G Jordan, 6tracks",     "img": "music-3",  "src": "music-3" },
  { "name": "Go (prod. Cobra)",                    "artist": "G Jordan, Cobra",       "img": "music-4",  "src": "music-4" },
  { "name": "Gotta Go",                            "artist": "G Jordan",              "img": "music-5",  "src": "music-5" },
  { "name": "Her",                                 "artist": "G Jordan",              "img": "music-6",  "src": "music-6" },
  { "name": "Hold You Down",                       "artist": "G Jordan",              "img": "music-7",  "src": "music-7" },
  { "name": "I Love You",                          "artist": "G Jordan",              "img": "music-8",  "src": "music-8" },
  { "name": "Im the Monster (prod. Riddiman)",     "artist": "G Jordan, Riddiman",    "img": "music-9",  "src": "music-9" },
  { "name": "Johnny Nails & G Jordan 2025 (prod. Cobra)",    "artist": "G Jordan, Johnny Naills, Cobra", "img": "music-10", "src": "music-10" },
  { "name": "Living That Dream (prod. Cobra)",     "artist": "G Jordan, Cobra",       "img": "music-11", "src": "music-11" },
  { "name": "Lost Without You (prod. Cobra)",      "artist": "G Jordan, Cobra",       "img": "music-12", "src": "music-12" },
  { "name": "Loving You (prod. 6tracks)",          "artist": "G Jordan, 6tracks",     "img": "music-13", "src": "music-13" },
  { "name": "Thats my baby (prod. Cobra)",         "artist": "G Jordan, Cobra",       "img": "music-14", "src": "music-14" },
  { "name": "The Shadows (prod. Cobra)",           "artist": "G Jordan, Cobra",       "img": "music-15", "src": "music-15" },
  { "name": "Treacherous Behavior",                "artist": "G Jordan",              "img": "music-16", "src": "music-16" },
  { "name": "Trying (prod. greyskies)",            "artist": "G Jordan, greyskies",   "img": "music-17", "src": "music-17" },
  { "name": "Unwanted (prod. Cobra)",              "artist": "G Jordan, Cobra",       "img": "music-18", "src": "music-18" },
  { "name": "What you did to me (prod. 6track)",   "artist": "G Jordan, 6track",      "img": "music-19", "src": "music-19" },
  { "name": "With You (prod. 6tracks)",            "artist": "G Jordan, 6tracks",     "img": "music-20", "src": "music-20" },
  { "name": "You were (prod. HyprWrld)",           "artist": "G Jordan, HyprWrld",    "img": "music-21", "src": "music-21" },
  { "name": "let you know (prod. 6tracks)",        "artist": "G Jordan, 6tracks",     "img": "music-22", "src": "music-22" },
  { "name": "our love her & I (prod. Xlifer)",      "artist": "G Jordan, Xlifer",      "img": "music-23", "src": "music-23" },
  { "name": "she my",                              "artist": "G Jordan, Johnny Nails","img": "music-24", "src": "music-24" }
];

console.log('[music-list] allMusic length =', window.allMusic.length);
// Optional: signal readiness to any listeners
window.dispatchEvent(new Event('musiclist:ready'));