# calithon2018-layouts
The on-stream graphics used during Calithon 2018.

This is a [NodeCG](http://github.com/nodecg/nodecg) v0.9 bundle. You will need to have NodeCG v0.9 installed to run it.

This bundle is based on SGDQ 2017 layouts.

## Features

This bundle has unique features that does not exist in SGDQ 2017 layouts. First I have backported some of the AGDQ 2018 layouts to this. Due to time constraints, I was not able to recreate this bundle with AGDQ 2018 as the base.
New features include:
- Integration with Google Play Music Desktop Player as the music player
- Integration with Tiltify. The following is integrated with Tiltify:
  - Total Amount Raised
  - Challenges
  - Polls
  - Prizes
  - Milestone
  - Latest Donations

## Requirements
- [NodeCG v0.9.x](https://github.com/nodecg/nodecg/releases)
- [Node.js v7 or greater](https://nodejs.org/)

## Installation
1. Install to `nodecg/bundles/calithon2018-layouts`.
2. Install `bower` if you have not already (`npm install -g bower`)
3. `cd nodecg/bundles/calithon2018-layouts` and run `npm install --production`, then `bower install`
5. Create the configuration file
6. Run the nodecg server: `nodecg start` (or `node index.js` if you don't have nodecg-cli) from the `nodecg` root directory.

Please note that you **must manually run `npm install` for this bundle**.

### Credits
GDQ Layouts by [Support Class](http://supportclass.net/)
