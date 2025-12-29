// js/music-list.js

// ✅ Base playlist (never mutate this one)
window.allMusicBase = [
  { name: "Broken Promises", artist: "G Jordan", img: "music-36", src: "music-36" },
  { name: "By My Side", artist: "G Jordan, Cobra", img: "music-35", src: "music-35" },
  { name: "I See You", artist: "G Jordan, Cobra", img: "music-34", src: "music-34" },
  { name: "ILLUSORY", artist: "G Jordan, 6tracks", img: "music-33", src: "music-33" },
  { name: "I Tried", artist: "G Jordan, 6tracks", img: "music-32", src: "music-32" },
  { name: "Stay The Same (prod.Cobra)",               artist: "G Jordan, Cobra",                 img: "music-31", src: "music-31" },
  { name: "Going Out Here (prod.Cobra)",             artist: "G Jordan, Cobra",                 img: "music-30", src: "music-30" },
  { name: "Feels (prod.Cobra)",                      artist: "G Jordan, Cobra",                 img: "music-29", src: "music-29" },
  { name: "Picture Perfect",                         artist: "G Jordan",                        img: "music-28", src: "music-28" },
  { name: "Thats my baby (prod.Cobra)",              artist: "G Jordan, Cobra",                 img: "music-27", src: "music-27" },
  { name: "Treacherous Behavior",                    artist: "G Jordan",                        img: "music-26", src: "music-26" },
  { name: "Feels This Way (prod. Cobra)",            artist: "G Jordan, Cobra",                 img: "music-25", src: "music-25" },
  { name: "Johnny Nails & G Jordan 2025 (prod. Cobra)", artist: "G Jordan, Johnny Nails, Cobra", img: "music-10", src: "music-10" },
  { name: "Im the Monster (prod. Riddiman)",         artist: "G Jordan, Riddiman",              img: "music-9",  src: "music-9"  },
  { name: "Trying (prod. greyskies)",                artist: "G Jordan, greyskies",             img: "music-17", src: "music-17" },
  { name: "The Shadows (prod. Cobra)",               artist: "G Jordan, Cobra",                 img: "music-15", src: "music-15" },
  { name: "Go (prod. Cobra)",                        artist: "G Jordan, Cobra",                 img: "music-4",  src: "music-4"  },
  { name: "Lost Without You (prod. Cobra)",          artist: "G Jordan, Cobra",                 img: "music-12", src: "music-12" },
  { name: "You were (prod. HyprWrld)",               artist: "G Jordan, HyprWrld",              img: "music-21", src: "music-21" },
  { name: "Unwanted (prod. Cobra)",                  artist: "G Jordan, Cobra",                 img: "music-18", src: "music-18" },
  { name: "Gotta Go",                                artist: "G Jordan",                        img: "music-5",  src: "music-5"  },
  { name: "With You (prod. 6tracks)",                artist: "G Jordan, 6tracks",               img: "music-20", src: "music-20" },
  { name: "Treacherous Behavior",                    artist: "G Jordan",                        img: "music-16", src: "music-16" },
  { name: "Loving You (prod. 6tracks)",              artist: "G Jordan, 6tracks",               img: "music-13", src: "music-13" },
  { name: "I Love You",                              artist: "G Jordan",                        img: "music-8",  src: "music-8"  },
  { name: "our love her & I (prod. Xlifer)",         artist: "G Jordan, Xlifer",                img: "music-23", src: "music-23" },
  { name: "Thats my baby (prod. Cobra)",             artist: "G Jordan, Cobra",                 img: "music-14", src: "music-14" },
  { name: "she my",                                  artist: "G Jordan, Johnny Nails",          img: "music-24", src: "music-24" },
  { name: "What you did to me (prod. 6track)",       artist: "G Jordan, 6track",                img: "music-19", src: "music-19" },
  { name: "Hold You Down",                           artist: "G Jordan",                        img: "music-7",  src: "music-7"  },
  { name: "Her",                                     artist: "G Jordan",                        img: "music-6",  src: "music-6"  },
  { name: "Dreams (prod. Cobra)",                    artist: "G Jordan, Cobra",                 img: "music-2",  src: "music-2"  },
  { name: "For A While (prod. 6tracks)",             artist: "G Jordan, 6tracks",               img: "music-3",  src: "music-3"  },
  { name: "dont let me go (prod. 6tracks)",          artist: "G Jordan, 6tracks",               img: "music-1",  src: "music-1"  },
  { name: "let you know (prod. 6tracks)",            artist: "G Jordan, 6tracks",               img: "music-22", src: "music-22" },
  { name: "Living That Dream (prod. Cobra)",         artist: "G Jordan, Cobra",                 img: "music-11", src: "music-11" }
];

// ✅ Working playlist (other scripts can reorder/mutate this one safely)
window.allMusic = window.allMusicBase.map(t => ({ ...t }));

// ✅ helper: restore