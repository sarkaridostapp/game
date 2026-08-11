/*
 * Auto Driver Playlist — song data
 * ---------------------------------
 * Every track is streamed from YouTube. `yt` is the YouTube video id.
 *
 * To add a song: copy any block below, change the fields, done.
 * Fields:
 *   id     unique slug, used for deep links (?song=<id>)
 *   title  song name
 *   film   movie / album
 *   year   release year
 *   singer playback singers
 *   mood   one of: mast | romantic | dard | bonus
 *   yt     YouTube video id (the bit after ?v= in the URL)
 */

const SONGS = [
  /* ------------------------------------------------------------------ *
   *  MAST MAST — the loud ones. Volume knob dahine taraf.              *
   * ------------------------------------------------------------------ */
  {
    id: 'oonchi-hai-building',
    title: 'Oonchi Hai Building',
    film: 'Judwaa',
    year: 1997,
    singer: 'Abhijeet, Poornima',
    mood: 'mast',
    yt: 'gXd94eYUNZk'
  },
  {
    id: 'jumma-chumma',
    title: 'Jumma Chumma De De',
    film: 'Hum',
    year: 1991,
    singer: 'Sudesh Bhosle, Kavita Krishnamurthy',
    mood: 'mast',
    yt: '-AZJJOmwn5c'
  },
  {
    id: 'tu-cheez-badi',
    title: 'Tu Cheez Badi Hai Mast Mast',
    film: 'Mohra',
    year: 1994,
    singer: 'Udit Narayan, Kavita Krishnamurthy',
    mood: 'mast',
    yt: 'fT4vP4PnLxg'
  },
  {
    id: 'choli-ke-peeche',
    title: 'Choli Ke Peeche Kya Hai',
    film: 'Khalnayak',
    year: 1993,
    singer: 'Alka Yagnik, Ila Arun',
    mood: 'mast',
    yt: 'epYiGd853mQ'
  },
  {
    id: 'ankhiyon-se-goli',
    title: 'Ankhiyon Se Goli Maare',
    film: 'Dulhe Raja',
    year: 1998,
    singer: 'Sonu Nigam, Jaspinder Narula',
    mood: 'mast',
    yt: 'llfkNB3rRTc'
  },
  {
    id: 'didi-tera-devar',
    title: 'Didi Tera Devar Deewana',
    film: 'Hum Aapke Hain Koun..!',
    year: 1994,
    singer: 'Lata Mangeshkar, S. P. Balasubrahmanyam',
    mood: 'mast',
    yt: 'ZqcDGvCM_w0'
  },
  {
    id: 'ole-ole',
    title: 'Ole Ole',
    film: 'Yeh Dillagi',
    year: 1994,
    singer: 'Abhijeet',
    mood: 'mast',
    yt: 'hcCvSmjHwGY'
  },
  {
    id: 'sona-kitna-sona-hai',
    title: 'Sona Kitna Sona Hai',
    film: 'Hero No. 1',
    year: 1997,
    singer: 'Udit Narayan, Poornima',
    mood: 'mast',
    yt: '4mGzU0VbdSU'
  },
  {
    id: 'muqabala',
    title: 'Muqabala Muqabala',
    film: 'Humse Hai Muqabala',
    year: 1994,
    singer: 'Mano, Swarnalatha',
    mood: 'mast',
    yt: 'FQzC23GLptE'
  },
  {
    id: 'urvashi',
    title: 'Urvashi Urvashi',
    film: 'Humse Hai Muqabala',
    year: 1994,
    singer: 'A. R. Rahman, Suresh Peters',
    mood: 'mast',
    yt: 'dkedupX73xs'
  },
  {
    id: 'ruk-ruk-ruk',
    title: 'Ruk Ruk Ruk',
    film: 'Vijaypath',
    year: 1994,
    singer: 'Alisha Chinai',
    mood: 'mast',
    yt: '5pER2p6J-OM'
  },
  {
    id: 'aati-kya-khandala',
    title: 'Aati Kya Khandala',
    film: 'Ghulam',
    year: 1998,
    singer: 'Aamir Khan, Alka Yagnik',
    mood: 'mast',
    yt: 'yIFMTfgJzY0'
  },
  {
    id: 'kisi-disco-mein',
    title: 'Kisi Disco Mein Jaaye',
    film: 'Bade Miyan Chote Miyan',
    year: 1998,
    singer: 'Udit Narayan, Alka Yagnik',
    mood: 'mast',
    yt: 'wfAIdZKs6Ok'
  },
  {
    id: 'dilbar-dilbar',
    title: 'Dilbar Dilbar',
    film: 'Sirf Tum',
    year: 1999,
    singer: 'Alka Yagnik',
    mood: 'mast',
    yt: 'BJrHJoCqJKo'
  },
  {
    id: 'gore-gore-mukhde',
    title: 'Gore Gore Mukhde Pe',
    film: 'Suhaag',
    year: 1994,
    singer: 'Udit Narayan, Alka Yagnik',
    mood: 'mast',
    yt: 'QBMN9Hi2lbk'
  },
  {
    id: 'jhanjhariya',
    title: 'Jhanjhariya Uski Chanak Gayi',
    film: 'Krishna',
    year: 1996,
    singer: 'Abhijeet, Alka Yagnik',
    mood: 'mast',
    yt: 'VqPdRyhbfM8'
  },
  {
    id: 'mehndi-laga-ke-rakhna',
    title: 'Mehndi Laga Ke Rakhna',
    film: 'Dilwale Dulhania Le Jayenge',
    year: 1995,
    singer: 'Lata Mangeshkar, Udit Narayan',
    mood: 'mast',
    yt: '-bNwqXvMuB8'
  },

  /* ------------------------------------------------------------------ *
   *  ROMANTIC — sawaari ke saamne thoda dheema.                        *
   * ------------------------------------------------------------------ */
  {
    id: 'dhak-dhak',
    title: 'Dhak Dhak Karne Laga',
    film: 'Beta',
    year: 1992,
    singer: 'Udit Narayan, Anuradha Paudwal',
    mood: 'romantic',
    yt: 'P7i0Z4yDKNM'
  },
  {
    id: 'chura-ke-dil-mera',
    title: 'Chura Ke Dil Mera',
    film: 'Main Khiladi Tu Anari',
    year: 1994,
    singer: 'Kumar Sanu, Alka Yagnik',
    mood: 'romantic',
    yt: '1eSG6dLiYxY'
  },
  {
    id: 'yeh-kaali-kaali-aankhen',
    title: 'Yeh Kaali Kaali Aankhen',
    film: 'Baazigar',
    year: 1993,
    singer: 'Kumar Sanu, Anu Malik',
    mood: 'romantic',
    yt: '74sgRdJ6OHM'
  },
  {
    id: 'pehla-nasha',
    title: 'Pehla Nasha',
    film: 'Jo Jeeta Wohi Sikandar',
    year: 1992,
    singer: 'Udit Narayan, Sadhana Sargam',
    mood: 'romantic',
    yt: 'SBfPs-PMGTA'
  },
  {
    id: 'tumse-milne-ki-tamanna',
    title: 'Tumse Milne Ki Tamanna Hai',
    film: 'Saajan',
    year: 1991,
    singer: 'S. P. Balasubrahmanyam, Alka Yagnik',
    mood: 'romantic',
    yt: 'Z4TEDNoExk4'
  },

  /* ------------------------------------------------------------------ *
   *  DARD BHARE — raat ke 2 baje, sawaari nahi mili.                   *
   * ------------------------------------------------------------------ */
  {
    id: 'tadap-tadap-ke',
    title: 'Tadap Tadap Ke',
    film: 'Hum Dil De Chuke Sanam',
    year: 1999,
    singer: 'KK, Dominique Cerejo',
    mood: 'dard',
    yt: 'H4YOLNHFx0I'
  },
  {
    id: 'tu-pyar-hai-kisi-aur-ka',
    title: 'Tu Pyar Hai Kisi Aur Ka',
    film: 'Dil Hai Ke Manta Nahin',
    year: 1991,
    singer: 'Kumar Sanu, Anuradha Paudwal',
    mood: 'dard',
    yt: '47DstHmE-bE'
  },
  {
    id: 'jab-koi-baat',
    title: 'Jab Koi Baat Bigad Jaye',
    film: 'Jurm',
    year: 1990,
    singer: 'Kumar Sanu, Sadhana Sargam',
    mood: 'dard',
    yt: 'ln3meCI0LFM'
  },

  /* ------------------------------------------------------------------ *
   *  BONUS — naye zamane ka auto. 90s ke baad wale.                    *
   * ------------------------------------------------------------------ */
  {
    id: 'kajra-re',
    title: 'Kajra Re',
    film: 'Bunty Aur Babli',
    year: 2005,
    singer: 'Alisha Chinai, Shankar Mahadevan, Javed Ali',
    mood: 'bonus',
    yt: '4dsFQFCvVGU'
  },
  {
    id: 'beedi-jalaile',
    title: 'Beedi Jalaile',
    film: 'Omkara',
    year: 2006,
    singer: 'Sukhwinder Singh, Sunidhi Chauhan',
    mood: 'bonus',
    yt: 'XLJCtZK0x5M'
  },
  {
    id: 'munni-badnaam',
    title: 'Munni Badnaam Hui',
    film: 'Dabangg',
    year: 2010,
    singer: 'Mamta Sharma, Aishwarya Nigam',
    mood: 'bonus',
    yt: 'vJV_WSPlK6Q'
  },
  {
    id: 'sheila-ki-jawani',
    title: 'Sheila Ki Jawani',
    film: 'Tees Maar Khan',
    year: 2010,
    singer: 'Sunidhi Chauhan, Vishal Dadlani',
    mood: 'bonus',
    yt: 'ZTmF2v59CtI'
  },
  {
    id: 'chikni-chameli',
    title: 'Chikni Chameli',
    film: 'Agneepath',
    year: 2012,
    singer: 'Shreya Ghoshal',
    mood: 'bonus',
    yt: 'MQM7CNoAsBI'
  },
  {
    id: 'fevicol-se',
    title: 'Fevicol Se',
    film: 'Dabangg 2',
    year: 2012,
    singer: 'Mamta Sharma, Wajid',
    mood: 'bonus',
    yt: 'zE7Pwgl6sLA'
  },
  {
    id: 'lungi-dance',
    title: 'Lungi Dance',
    film: 'Chennai Express',
    year: 2013,
    singer: 'Yo Yo Honey Singh',
    mood: 'bonus',
    yt: '69CEiHfS_mc'
  },
  {
    id: 'saree-ke-fall-sa',
    title: 'Saree Ke Fall Sa',
    film: 'R... Rajkumar',
    year: 2013,
    singer: 'Antara Mitra, Nakash Aziz',
    mood: 'bonus',
    yt: 'EkxOXF9J77w'
  },
  {
    id: 'party-all-night',
    title: 'Party All Night',
    film: 'Boss',
    year: 2013,
    singer: 'Yo Yo Honey Singh',
    mood: 'bonus',
    yt: 'Wd7H311MrWA'
  },
  {
    id: 'balam-pichkari',
    title: 'Balam Pichkari',
    film: 'Yeh Jawaani Hai Deewani',
    year: 2013,
    singer: 'Vishal Dadlani, Shalmali Kholgade',
    mood: 'bonus',
    yt: '0WtRNGubWGA'
  },
  {
    id: 'tune-maari-entriyaan',
    title: 'Tune Maari Entriyaan',
    film: 'Gunday',
    year: 2014,
    singer: 'KK, Neeti Mohan, Vishal Dadlani, Bappi Lahiri',
    mood: 'bonus',
    yt: '2I3NgxDAiqE'
  },
  {
    id: 'laila-main-laila',
    title: 'Laila Main Laila',
    film: 'Raees',
    year: 2017,
    singer: 'Pawni Pandey',
    mood: 'bonus',
    yt: 'wjk7lV4PwAo'
  },
  {
    id: 'aankh-marey',
    title: 'Aankh Marey',
    film: 'Simmba',
    year: 2018,
    singer: 'Neha Kakkar, Mika Singh, Kumar Sanu',
    mood: 'bonus',
    yt: '_KhQT-LGb-4'
  },
  {
    id: 'lollypop-lagelu',
    title: 'Lollypop Lagelu',
    film: 'Bhojpuri Hit',
    year: 2007,
    singer: 'Pawan Singh',
    mood: 'bonus',
    yt: 'FA7fR5omES0'
  }
];

const MOODS = [
  { key: 'all', label: 'Poori Gaadi', hint: 'Saare gaane' },
  { key: 'mast', label: 'Mast Mast', hint: 'Volume full' },
  { key: 'romantic', label: 'Romantic', hint: 'Sawaari ke saamne' },
  { key: 'dard', label: 'Dard Bhare', hint: 'Raat ke 2 baje' },
  { key: 'bonus', label: 'Bonus', hint: '90s ke baad' },
  { key: 'fav', label: 'Pasandeeda', hint: 'Aapke chune hue' }
];
