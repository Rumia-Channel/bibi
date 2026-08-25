/*! ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 *
 *  # zzZ..., plays...                                                                                                                                                                      (℠)
 *
 */ ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const zzZ = {};  export default zzZ;

  let { PACKAGE, WEBSITE_ADDRESS, LICENSE_ADDRESS, SRC, SRC_BC, DIST, ARCHIVES, ARCHIVES_TMP, ARCHIVES_TMP_DIST, LOG_CHARM, LOG_HEADER, ARGUMENTS, ENVARS, Composer, Conductor } = zzZ;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import Path from 'node:path';
const resolvePath = (...PathSteps) => Path.resolve(import.meta.dirname, ...PathSteps);

import { readFile } from 'fs/promises';
const importJSON = async (FilePath) => JSON.parse(await readFile(resolvePath(FilePath)));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const CONFIG = (await import('../zzz....config.mjs'))?.default || {};

PACKAGE = await importJSON('../package.json');

// =============================================================================================================================

WEBSITE_ADDRESS = typeof CONFIG.WEBSITE_ADDRESS === 'string' ? CONFIG.WEBSITE_ADDRESS : '';
LICENSE_ADDRESS = typeof CONFIG.LICENSE_ADDRESS === 'string' ? CONFIG.LICENSE_ADDRESS : '';

SRC             = typeof CONFIG.SRC      === 'string' ? CONFIG.SRC      : '__src';       SRC_BC = SRC + '__back-compat';
DIST            = typeof CONFIG.DIST     === 'string' ? CONFIG.DIST     : '__dist';
ARCHIVES        = typeof CONFIG.ARCHIVES === 'string' ? CONFIG.ARCHIVES : '__archives';  ARCHIVES_TMP = ARCHIVES + '/.tmp.';  ARCHIVES_TMP_DIST = ARCHIVES_TMP + '/.dist.';

LOG_CHARM       = typeof CONFIG.LOG_CHARM  === 'string' ? CONFIG.LOG_CHARM  : `/(('_-)`;
LOG_HEADER      = typeof CONFIG.LOG_HEADER === 'string' ? CONFIG.LOG_HEADER : `zzZ: `;

// =============================================================================================================================

ARGUMENTS = (CurrentKey => process.argv.reduce((Args, ProcessArg) => {
    const KeyMatched = (ProcessArg = String(ProcessArg)).match(/^\-+([\w\d_\-:]+)$/);
         if(KeyMatched) Args[CurrentKey = KeyMatched[1]] = true;
    else if(CurrentKey) Args[CurrentKey                ] = ProcessArg, CurrentKey = '';
    return Args;
}, {}))('');

ENVARS = Object.assign(typeof CONFIG.ENVARS === 'object' ? CONFIG.ENVARS : {}, {
    ENV_VERSION:     JSON.stringify(PACKAGE.version),
    ENV_DEVELOPMENT: JSON.stringify(/^development/.test(ARGUMENTS['config-name']))
});

Composer = {};
Conductor = {};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Object.assign(zzZ, { PACKAGE, WEBSITE_ADDRESS, LICENSE_ADDRESS, SRC, SRC_BC, DIST, ARCHIVES, ARCHIVES_TMP, ARCHIVES_TMP_DIST, LOG_CHARM, LOG_HEADER, ARGUMENTS, ENVARS, Composer, Conductor });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
