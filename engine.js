/* DryMath engine - honest dehumidifier sizer. Pure logic, no DOM. */
(function (root) {
  'use strict';

  /* AHAM-style capacity table (pints/day at the standard 65 F / 60% RH rating point):
     500 sqft -> 10/12/14/16 pints by condition, +4/5/6/7 per extra 500 sqft. */
  var CONDITIONS = [
    { key: 'slightly', label: 'Slightly damp (musty in humid weather)', base: 10, step: 4 },
    { key: 'very', label: 'Very damp (always musty, damp spots)', base: 12, step: 5 },
    { key: 'wet', label: 'Wet (walls sweat, seepage)', base: 14, step: 6 },
    { key: 'extreme', label: 'Extremely wet (standing water)', base: 16, step: 7 }
  ];

  var SIZE_CLASSES = [20, 22, 30, 35, 40, 50, 70];

  var M2_TO_SQFT = 10.7639;

  function num(x, name, min, max) {
    var v = Number(x);
    if (!isFinite(v) || v < min || v > max) throw new Error(name + ' must be between ' + min + ' and ' + max);
    return v;
  }

  /* Rated capacity assumes 18.3 C. Real basements are colder and compressors lose
     capacity fast; below ~10 C they spend their life defrosting. */
  function tempFactor(tempC) {
    if (tempC >= 18.3) return 1;
    if (tempC <= 10) return 0.5;
    return Math.round((0.5 + (tempC - 10) / 8.3 * 0.5) * 100) / 100;
  }

  function rhBand(rh) {
    if (rh < 30) return { band: 'too dry', note: 'below 30% irritates airways - no dehumidifier needed' };
    if (rh < 45) return { band: 'dry side of fine', note: '30-45% is comfortable and mold-safe' };
    if (rh <= 60) return { band: 'comfort zone', note: '45-60% is the target range' };
    if (rh <= 70) return { band: 'mold risk', note: 'above 60% sustained, mold gets a foothold in weeks' };
    return { band: 'active mold territory', note: 'above 70% mold is not a risk, it is a schedule' };
  }

  function analyze(input) {
    if (!input || typeof input !== 'object') throw new Error('No input');
    var areaM2 = num(input.areaM2, 'Room area', 5, 400);
    var condKey = String(input.condition || '');
    var cond = null;
    CONDITIONS.forEach(function (c) { if (c.key === condKey) cond = c; });
    if (!cond) throw new Error('Pick a dampness condition');
    var tempC = input.tempC == null || input.tempC === '' ? 18 : num(input.tempC, 'Room temperature', 0, 35);
    var rh = input.currentRh == null || input.currentRh === '' ? null : num(input.currentRh, 'Current humidity', 10, 100);
    var laundry = !!input.laundry;

    var sqft = areaM2 * M2_TO_SQFT;
    var units = Math.ceil(sqft / 500);
    if (units > 8) units = 8;
    var needPints = cond.base + cond.step * (units - 1);
    if (laundry) needPints += 4; /* drying a load indoors adds roughly 2 L of water */

    var tf = tempFactor(tempC);
    var ratedNeed = Math.ceil(needPints / tf);

    var sizeClass = null;
    for (var i = 0; i < SIZE_CLASSES.length; i++) {
      if (SIZE_CLASSES[i] >= ratedNeed) { sizeClass = SIZE_CLASSES[i]; break; }
    }
    var oversized = sizeClass === null;
    if (oversized) sizeClass = SIZE_CLASSES[SIZE_CLASSES.length - 1];

    var desiccant = tempC < 10;
    var type = desiccant ? 'desiccant' : 'compressor';

    var liters = Math.round(sizeClass * 0.473 * 10) / 10;

    var rhInfo = rh == null ? null : rhBand(rh);

    var verdict = 'A ' + areaM2 + ' m2 room that is ' + cond.label.toLowerCase().replace(/ \(.*$/, '').toLowerCase() +
      ' needs about ' + needPints + ' pints/day at lab conditions. ' +
      (tf < 1 ? 'At ' + tempC + ' C a compressor unit keeps only ' + Math.round(tf * 100) + '% of its rating, so you need a ' + ratedNeed + '-pint rating - that lands in the ' + sizeClass + '-pint class (~' + liters + ' L/day).'
              : 'That lands in the ' + sizeClass + '-pint class (~' + liters + ' L/day).') +
      (desiccant ? ' Below 10 C, skip compressors entirely - buy a desiccant unit; compressor coils just frost.' : '') +
      (oversized ? ' Even the biggest consumer class is undersized here - run two units or fix the water source first.' : '') +
      (laundry ? ' Indoor laundry drying added 4 pints/day to the ask.' : '');
    if (rhInfo) {
      verdict += ' Your measured ' + rh + '% RH reads "' + rhInfo.band + '" - ' + rhInfo.note + '.';
    }

    return {
      areaM2: areaM2,
      sqft: Math.round(sqft),
      condition: cond.label,
      needPints: needPints,
      tempFactor: tf,
      ratedNeed: ratedNeed,
      sizeClass: sizeClass,
      litersPerDay: liters,
      oversized: oversized,
      type: type,
      desiccant: desiccant,
      laundry: laundry,
      currentRh: rh,
      rhBand: rhInfo ? rhInfo.band : null,
      rhNote: rhInfo ? rhInfo.note : null,
      verdict: verdict
    };
  }

  var api = { analyze: analyze, tempFactor: tempFactor, rhBand: rhBand, CONDITIONS: CONDITIONS, SIZE_CLASSES: SIZE_CLASSES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DryMathEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
