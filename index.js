// MIT License

// Copyright (c) 2018 Ivan

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const synmonth = 29.53058868  // Synodic month (new Moon to new Moon)

// Astronomical constants
const epoch = 2444238.5       // 1989 January 0.0

//Constants defining the Sun's apparent orbit
const elonge = 278.833540     // Ecliptic longitude of the Sun at epoch 1980.0
const elongp = 282.596403     // Ecliptic longitude of the Sun at perigee
const eccent = 0.016718       // Eccentricity of Earth's orbit
const sunsmax = 1.495985e8    // Sun's angular size, degrees, at semi-major axis distance
const sunangsiz = 0.533128

// Elements of the Moon's orbit, epoch 1980.0
const mmlong = 64.975464      // Moon's mean longitude at the epoch
const mmlongp = 349.383063    // Mean longitude of the perigee at the epoch
const mecc = 0.054900         // Eccentricity of the Moon's orbit
const mangsiz = 0.5181        // Moon's angular size at distance a from Earth
const msmax = 384401          // Semi-major axis of Moon's orbit in km

class MoonPhase {

  // Date
  constructor(date) {
    this._timespace = date.getTime() / 1000
    this._pdata = this.utcToJulian(this._timespace)

    // Calculation of the Sun's position
    const day = this._pdata - epoch // Date within epoch
    const n = this.fixangle((360 / 365.2422) * day)    // Mean anomaly of the Sun
    const m = this.fixangle(n + elonge - elongp)       // Convert from perigee co-ordinates to epoch 1980.0
    let ec = this.kepler(m, eccent)                          // Solve equation of Kepler
    ec = Math.sqrt((1 + eccent) / (1 - eccent)) * Math.tan(ec / 2)
    ec = 2 * this.rad2deg(Math.atan(ec))                     // True anomaly
    const lambdasun = this.fixangle(ec + elongp) // Sun's geocentric ecliptic longitude

    const f = ((1 + eccent * Math.cos(this.deg2rad(ec))) / (1 - eccent * eccent)) // Orbital distance factor
    const sunDist = sunsmax / f       // Distance to Sun in km
    const sunAng = f * sunangsiz // Sun's angular size in degrees

    // Calculation of the Moon's position
    const ml = this.fixangle(13.1763966 * day + mmlong)                     // Moon's mean longitude
    const mm = this.fixangle(ml - 0.1114041 * day - mmlongp)                // Moon's mean anomaly
    const ev = 1.2739 * Math.sin(this.deg2rad(2 * (ml - lambdasun) - mm))       // Evection
    const ae = 0.1858 * Math.sin(this.deg2rad(m))                               // Annual equation
    const a3 = 0.37 * Math.sin(this.deg2rad(m))                                 // Correction term
    const mmP = mm + ev - ae - a3                                     // Corrected anomaly
    const mec = 6.2886 * Math.sin(this.deg2rad(mmP))                            // Correction for the equation of the centre
    const a4 = 0.214 * Math.sin(this.deg2rad(2 * mmP))                          // Another correction term
    const lP = ml + ev + mec - ae + a4                                // Corrected longitude
    const v = 0.6583 * Math.sin(this.deg2rad(2 * (lP - lambdasun)))             // constiation
    const lPP = lP + v // True longitude

    // Calculation of the phase of the Moon
    const moonAge = lPP - lambdasun                                   // Age of the Moon in degrees
    const moonPhase = (1 - Math.cos(this.deg2rad(moonAge))) / 2                 // Phase of the Moon

    // Distance of moon from the centre of the Earth
    const moonDist = (msmax * (1 - mecc * mecc)) / (1 + mecc * Math.cos(this.deg2rad(mmP + mec)))

    const moonDFrac = moonDist / msmax
    const moonAng = mangsiz / moonDFrac // Moon's angular diameter

    // store result
    this._phase = this.fixangle(moonAge) / 360                   // Phase (0 to 1)
    this._illum = moonPhase                                 // Illuminated fraction (0 to 1)
    this._age = synmonth * this.phase                      // Age of moon (days)
    this._dist = moonDist                                   // Distance (kilometres)
    this._angdia = moonAng                                  // Angular diameter (degrees)
    this._sundist = sunDist                                 // Distance to Sun (kilometres)
    this._sunangdia = sunAng                                // Sun's angular diameter (degrees)
    this.phaseHunt()
    this._date = date;
  }

  phaseHunt() {
    const sdate = this.utcToJulian(this._timespace)
    let adate = sdate - 45
    const ats = this._timespace - 86400 * 45
    const t = new Date(ats * 1000)
    // const t = time.Unix(int64(ats), 0)
    const yy = t.getFullYear()
    const mm = t.getMonth()

    let k1 = Math.floor((yy + ((mm - 1) * (1 / 12)) - 1900) * 12.3685)
    let nt1 = this.meanPhase(adate, k1)
    adate = nt1
    let nt2, k2

    while (true) {
      adate += synmonth
      k2 = k1 + 1
      nt2 = this.meanPhase(adate, k2)
      if (Math.abs(nt2 - sdate) < 0.75) {
        nt2 = this.truePhase(k2, 0.0)
      }
      if (nt1 <= sdate && nt2 > sdate) {
        break
      }
      nt1 = nt2
      k1 = k2
    }

    // const data [8]
    const data = []

    data[0] = this.truePhase(k1, 0.0)
    data[1] = this.truePhase(k1, 0.25)
    data[2] = this.truePhase(k1, 0.5)
    data[3] = this.truePhase(k1, 0.75)
    data[4] = this.truePhase(k2, 0.0)
    data[5] = this.truePhase(k2, 0.25)
    data[6] = this.truePhase(k2, 0.5)
    data[7] = this.truePhase(k2, 0.75)
    this._quarters = []
    for (let i = 0; i < 8; i++) {
      this._quarters[i] = (data[i] - 2440587.5) * 86400 // convert to UNIX time
    }
  }

  /**
   Calculates time of the mean new Moon for a given
   base date. This argument K to this function is the
   precomputed synodic month index, given by:
   K = (year - 1900) * 12.3685
   where year is expressed as a year aand fractional year
   */
  meanPhase(sdate, k) {
    // Time in Julian centuries from 1900 January 0.5
    const t = (sdate - 2415020.0) / 36525
    const t2 = t * t
    const t3 = t2 * t

    return 2415020.75933 + synmonth * k +
      0.0001178 * t2 -
      0.000000155 * t3 +
      0.00033 * Math.sin(this.deg2rad(166.56 + 132.87 * t - 0.009173 * t2))
  }

  truePhase(k, phase) {
    k += phase                      // Add phase to new moon time
    const t = k / 1236.85     // Time in Julian centures from 1900 January 0.5
    const t2 = t * t
    const t3 = t2 * t
    let pt = 2415020.75933 + synmonth * k +
      0.0001178 * t2 -
      0.000000155 * t3 +
      0.00033 * Math.sin(this.deg2rad(166.56 + 132.87 * t - 0.009173 * t2))

    const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3           // Sun's mean anomaly
    const mprime = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3     // Moon's mean anomaly
    const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3           // Moon's argument of latitude

    if (phase < 0.01 || Math.abs(phase - 0.5) < 0.01) {
      // Corrections for New and Full Moon
      pt += (0.1734 - 0.000393 * t) * Math.sin(this.deg2rad(m)) +
        0.0021 * Math.sin(this.deg2rad(2 * m)) -
        0.4068 * Math.sin(this.deg2rad(mprime)) +
        0.0161 * Math.sin(this.deg2rad(2 * mprime)) -
        0.0004 * Math.sin(this.deg2rad(3 * mprime)) +
        0.0104 * Math.sin(this.deg2rad(2 * f)) -
        0.0051 * Math.sin(this.deg2rad(m + mprime)) -
        0.0074 * Math.sin(this.deg2rad(m - mprime)) +
        0.0004 * Math.sin(this.deg2rad(2 * f + m)) -
        0.0004 * Math.sin(this.deg2rad(2 * f - m)) -
        0.0006 * Math.sin(this.deg2rad(2 * f + mprime)) +
        0.0010 * Math.sin(this.deg2rad(2 * f - mprime)) +
        0.0005 * Math.sin(this.deg2rad(m + 2 * mprime));
    } else if (Math.abs(phase - 0.25) < 0.01 || Math.abs(phase - 0.75) < 0.01) {
      pt += (0.1721 - 0.0004 * t) * Math.sin(this.deg2rad(m)) +
        0.0021 * Math.sin(this.deg2rad(2 * m)) -
        0.6280 * Math.sin(this.deg2rad(mprime)) +
        0.0089 * Math.sin(this.deg2rad(2 * mprime)) -
        0.0004 * Math.sin(this.deg2rad(3 * mprime)) +
        0.0079 * Math.sin(this.deg2rad(2 * f)) -
        0.0119 * Math.sin(this.deg2rad(m + mprime)) -
        0.0047 * Math.sin(this.deg2rad(m - mprime)) +
        0.0003 * Math.sin(this.deg2rad(2 * f + m)) -
        0.0004 * Math.sin(this.deg2rad(2 * f - m)) -
        0.0006 * Math.sin(this.deg2rad(2 * f + mprime)) +
        0.0021 * Math.sin(this.deg2rad(2 * f - mprime)) +
        0.0003 * Math.sin(this.deg2rad(m + 2 * mprime)) +
        0.0004 * Math.sin(this.deg2rad(m - 2 * mprime)) -
        0.0003 * Math.sin(this.deg2rad(2 * m + mprime));
      if (phase < 0.5) { // First quarter correction
        pt += 0.0028 - 0.0004 * Math.cos(this.deg2rad(m)) + 0.0003 * Math.cos(this.deg2rad(mprime))
      } else {        // Last quarter correction
        pt += -0.0028 + 0.0004 * Math.cos(this.deg2rad(m)) - 0.0003 * Math.cos(this.deg2rad(mprime))
      }
    }

    return pt
  }

  kepler(m, ecc) {
    const epsilon = 0.000001
    m = this.deg2rad(m)
    let e = m
    var delta = e - ecc * Math.sin(e) - m
    e -= delta / (1 - ecc * Math.cos(e))
    while (Math.abs(delta) > epsilon) {
      delta = e - ecc * Math.sin(e) - m
      e -= delta / (1 - ecc * Math.cos(e))
    }
    return e
  }


  utcToJulian(time) {
    return time / 86400 + 2440587.5
  }


  fixangle(a) {
    return (a - 360 * Math.floor(a / 360))
  }


  rad2deg(r) {
    return (r * 180) / Math.PI
  }

  deg2rad(d) {
    return (d * Math.PI) / 180
  }

  get date() {
    return this._date;
  }

  get pdata() {
    return this._pdata;
  }

  get phase() {
    return this._phase;
  }

  get illum() {
    return this._illum;
  }

  get age() {
    return this._age;
  }

  get dist() {
    return this._dist;
  }

  get angdia() {
    return this._angdia;
  }

  get sundist() {
    return this._sundist;
  }

  get sunangdia() {
    return this._sunangdia;
  }

  get newMoon() {
    return this._quarters[0]
  }

  get firstQuarter() {
    return this._quarters[1]
  }

  get fullMoon() {
    return this._quarters[2]
  }

  get lastQuarter() {
    return this._quarters[3]
  }

  get nextNewMoon() {
    return this._quarters[4]
  }

  get nextFirstQuarter() {
    return this._quarters[1]
  }

  get nextFullMoon() {
    return this._quarters[6]
  }

  get nextLastQuarter() {
    return this._quarters[7]
  }

  phaseName() {
    const names = {
      0: "New Moon",
      1: "Waxing Crescent",
      2: "First Quarter",
      3: "Waxing Gibbous",
      4: "Full Moon",
      5: "Waning Gibbous",
      6: "Third Quarter",
      7: "Waning Crescent",
      8: "New Moon",
    }

    const i = Math.floor((this._phase + 0.0625) * 8)
    return names[i]
  }
}

module.exports = MoonPhase;
