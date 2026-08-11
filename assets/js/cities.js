/*
 * Auto Driver Playlist — cities for the intro screen + background strip.
 * Each skyline is a stylised silhouette (fill: currentColor), not accurate
 * architecture. `RICKSHAW` is the shared auto art used in the intro and the
 * driving background strip.
 */

/* side-view auto rickshaw; wheels are grouped so CSS can spin them */
const RICKSHAW =
  '<svg class="rick" viewBox="0 0 120 82" aria-hidden="true">' +
    '<ellipse class="r-shadow" cx="62" cy="78" rx="52" ry="4"/>' +
    '<circle class="r-puff puff-3" cx="4" cy="58" r="3"/>' +
    '<circle class="r-puff puff-2" cx="4" cy="58" r="4"/>' +
    '<circle class="r-puff puff-1" cx="4" cy="58" r="5"/>' +
    '<path class="r-canopy" d="M30 12c-12 0-21 9-21 21v20h94V37c0-14-9-25-23-25z"/>' +
    '<path class="r-body" d="M9 40h94v18a6 6 0 0 1-6 6H15a6 6 0 0 1-6-6z"/>' +
    '<rect class="r-band" x="9" y="34" width="94" height="9"/>' +
    '<path class="r-glass" d="M86 16c9 2 14 10 14 20H80V16z"/>' +
    '<rect class="r-glass" x="24" y="19" width="44" height="15" rx="3" opacity=".55"/>' +
    '<circle class="r-light" cx="99" cy="47" r="4.5"/>' +
    '<g class="wheel wheel-back">' +
      '<circle class="tyre" cx="30" cy="64" r="11"/><circle class="hub" cx="30" cy="64" r="4"/>' +
      '<rect class="spoke" x="29" y="54" width="2" height="20"/><rect class="spoke" x="20" y="63" width="20" height="2"/>' +
      '<rect class="spoke" x="23.5" y="57.5" width="2" height="13" transform="rotate(45 30 64)"/>' +
      '<rect class="spoke" x="23.5" y="57.5" width="2" height="13" transform="rotate(-45 30 64)"/>' +
    '</g>' +
    '<g class="wheel wheel-front">' +
      '<circle class="tyre" cx="94" cy="64" r="11"/><circle class="hub" cx="94" cy="64" r="4"/>' +
      '<rect class="spoke" x="93" y="54" width="2" height="20"/><rect class="spoke" x="84" y="63" width="20" height="2"/>' +
      '<rect class="spoke" x="87.5" y="57.5" width="2" height="13" transform="rotate(45 94 64)"/>' +
      '<rect class="spoke" x="87.5" y="57.5" width="2" height="13" transform="rotate(-45 94 64)"/>' +
    '</g>' +
  '</svg>';

const CITIES = [
  {
    key: 'mumbai', name: 'Mumbai', greeting: 'Chalo Mumbai!',
    /* Gateway of India arch flanked by high-rises */
    skyline:
      '<rect x="8" y="34" width="20" height="66"/><rect x="30" y="50" width="14" height="50"/>' +
      '<rect x="252" y="24" width="22" height="76"/><rect x="278" y="46" width="14" height="54"/>' +
      '<rect x="120" y="44" width="7" height="56"/><rect x="180" y="44" width="7" height="56"/>' +
      '<path d="M127 100V58h6v-8a20 20 0 0 1 40 0v8h6v42h-14V62h-4a12 12 0 0 0-24 0v38z"/>' +
      '<rect x="60" y="66" width="10" height="34"/><rect x="76" y="58" width="10" height="42"/><rect x="92" y="70" width="9" height="30"/>'
  },
  {
    key: 'delhi', name: 'Delhi', greeting: 'Chalo Dilli!',
    /* India Gate arch + a couple of domes */
    skyline:
      '<path d="M118 100V56h10v-6a22 22 0 0 1 44 0v6h10v44h-16V60a16 16 0 0 0-32 0v40z"/>' +
      '<path d="M40 100V64q0-16 16-16t16 16v36z"/><rect x="52" y="40" width="8" height="12"/>' +
      '<path d="M220 100V68q0-14 14-14t14 14v32z"/><rect x="230" y="46" width="8" height="10"/>' +
      '<rect x="14" y="72" width="12" height="28"/><rect x="266" y="70" width="12" height="30"/>'
  },
  {
    key: 'jaipur', name: 'Jaipur', greeting: 'Padharo Jaipur!',
    /* Hawa Mahal: stepped pyramidal facade with arched windows */
    skyline:
      '<path d="M150 26l70 74H80z"/>' +
      '<rect x="96" y="70" width="108" height="30"/>' +
      '<rect x="110" y="78" width="10" height="22" rx="5"/><rect x="128" y="78" width="10" height="22" rx="5"/>' +
      '<rect x="146" y="78" width="10" height="22" rx="5"/><rect x="164" y="78" width="10" height="22" rx="5"/>' +
      '<rect x="182" y="78" width="10" height="22" rx="5"/>' +
      '<rect x="30" y="62" width="16" height="38"/><rect x="252" y="62" width="16" height="38"/>' +
      '<circle cx="38" cy="58" r="6"/><circle cx="260" cy="58" r="6"/>'
  },
  {
    key: 'kolkata', name: 'Kolkata', greeting: 'Cholo Kolkata!',
    /* Howrah Bridge truss */
    skyline:
      '<rect x="30" y="30" width="10" height="70"/><rect x="260" y="30" width="10" height="70"/>' +
      '<rect x="30" y="72" width="240" height="8"/>' +
      '<path d="M35 30 L150 58 L265 30" fill="none" stroke="currentColor" stroke-width="6"/>' +
      '<path d="M35 72 L60 44 M85 72 L104 46 M150 72 L150 44 M215 72 L196 46 M265 72 L240 44" stroke="currentColor" stroke-width="4" fill="none"/>' +
      '<rect x="150" y="40" width="0" height="0"/>'
  },
  {
    key: 'chennai', name: 'Chennai', greeting: 'Vaanga Chennai!',
    /* Temple gopuram (stepped tower) + lighthouse */
    skyline:
      '<path d="M120 100V44l14-16 14 16v56z"/>' +
      '<rect x="116" y="56" width="56" height="6"/><rect x="112" y="70" width="64" height="6"/><rect x="108" y="84" width="72" height="16"/>' +
      '<rect x="230" y="46" width="14" height="54"/><path d="M228 46l7-12 7 12z"/><rect x="231" y="52" width="12" height="5" opacity=".6"/>' +
      '<rect x="40" y="70" width="12" height="30"/><rect x="58" y="62" width="12" height="38"/>'
  },
  {
    key: 'bangalore', name: 'Bengaluru', greeting: 'Banni Bengaluru!',
    /* Vidhana Soudha-style domed block + glass towers */
    skyline:
      '<rect x="96" y="58" width="108" height="42"/><path d="M130 58q20-26 40 0z"/><rect x="146" y="26" width="8" height="12"/>' +
      '<rect x="104" y="66" width="8" height="34"/><rect x="120" y="66" width="8" height="34"/><rect x="172" y="66" width="8" height="34"/><rect x="188" y="66" width="8" height="34"/>' +
      '<rect x="24" y="30" width="18" height="70"/><rect x="46" y="48" width="12" height="52"/>' +
      '<rect x="250" y="34" width="18" height="66"/><rect x="234" y="52" width="12" height="48"/>'
  },
  {
    key: 'agra', name: 'Agra', greeting: 'Aaiye Agra!',
    /* Taj Mahal: onion dome, plinth, four minarets */
    skyline:
      '<rect x="70" y="74" width="160" height="26"/>' +
      '<rect x="74" y="40" width="9" height="60"/><rect x="217" y="40" width="9" height="60"/>' +
      '<circle cx="78.5" cy="37" r="6"/><circle cx="221.5" cy="37" r="6"/>' +
      '<rect x="96" y="46" width="8" height="54"/><rect x="196" y="46" width="8" height="54"/>' +
      '<path d="M120 74q0-40 30-40t30 40z"/><rect x="146" y="20" width="8" height="16"/>' +
      '<circle cx="150" cy="18" r="4"/>'
  },
  {
    key: 'noida', name: 'Noida', greeting: 'Chalo Noida!',
    /* modern glass-tower cluster */
    skyline:
      '<rect x="20" y="40" width="20" height="60"/><rect x="44" y="24" width="16" height="76"/>' +
      '<rect x="64" y="54" width="18" height="46"/><rect x="98" y="16" width="22" height="84"/>' +
      '<path d="M98 16l11-10 11 10z"/>' +
      '<rect x="126" y="46" width="16" height="54"/><rect x="150" y="34" width="20" height="66"/>' +
      '<rect x="176" y="58" width="16" height="42"/><rect x="200" y="28" width="22" height="72"/>' +
      '<rect x="228" y="50" width="16" height="50"/><rect x="250" y="38" width="20" height="62"/>' +
      '<rect x="150" y="24" width="20" height="4" opacity=".5"/><rect x="200" y="40" width="22" height="4" opacity=".5"/>'
  }
];
