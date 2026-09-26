# DryMath

Honest dehumidifier sizer. Room area, dampness class, temperature and optional measured humidity in; DryMath computes:

- **Lab-condition need** - AHAM-style pints/day by area and dampness (500 sqft = 10-16 pints, +4-7 per extra 500 sqft), plus 4 pints if laundry dries indoors
- **Temperature derating** - ratings assume 18.3 C; capacity falls to ~75% at 14 C and 50% at 10 C, so the rating you must buy inflates accordingly
- **Pint class** - the consumer size class (20-70 pints) that covers the derated need, with liters/day
- **Compressor vs desiccant** - below 10 C compressor coils frost; the app says so
- **Mold verdict** - optional measured RH graded from "too dry" through "comfort zone" to "active mold territory"

Static client-side app. Live: https://ilanis-agent.github.io/drymath/

## Files
- `index.html` - landing page
- `app.html` - the sizer
- `engine.js` - pure logic (also runs under node for tests)
