const MoonPhase = require('./index')

test('Should create new instance and return the same date', () => {
  const date = new Date();
  const m = new MoonPhase(date);
  expect(m.date).toBe(date);
});

test('Should be 100% illumination', () => {
  const date = new Date(2018, 9, 25, 4, 52);
  const m = new MoonPhase(date);
  // TODO should be 100
  expect(Math.round(m.illum)).toBe(1);
  expect(m.phaseName()).toBe('Full Moon');
});

test('Should be New Moon', () => {
  const date = new Date(2018, 9, 9, 20, 1);
  const m = new MoonPhase(date);
  expect(m.phaseName()).toBe('New Moon');
});
