# Moonphase

[![MIT licensed][mit-url-img]][mit-url] [![Build Status][ci-img]][ci] [![codecov.io][cov-img]][cov]

[ci-img]:     https://travis-ci.org/janczer/moonphase.svg
[ci]:         https://travis-ci.org/janczer/moonphase
[cov-img]: https://codecov.io/github/janczer/moonphase/coverage.svg?branch=master
[cov]:        https://codecov.io/github/janczer/moonphase?branch=master
[mit-url-img]: https://img.shields.io/badge/license-MIT-blue.svg
[mit-url]: https://raw.githubusercontent.com/janczer/moonphase/master/LICENSE

Packege MoonPhase allow calculat the phase of Moon, and other related veriables. It's base on [php-moon-phase](https://github.com/janczer/goMoonPhase)

# Usage

Add `moonphase-js` dependency:

```bash
$ yarn add moonphase-js
```

Now you can use it:

```js
// index.js

1 const MoonPhase = require('moonphase-js')
2 
3 const m = new MoonPhase(new Date(2018, 09, 23))
4 
5 console.log((m.illum * 100) + ' %')
```

Run it:

```bash
$ node index.js
96.50252994209721 %
```

# LICENSE

moonphase is released under the MIT License.

## Acknowledgments

This package's code and documentation are very closely derived [php-moon-phase](https://github.com/solarissmoke/php-moon-phase)
PHP class for calculating the phase of the Moon created by Samir Shah.

