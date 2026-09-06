'use strict';

/*! ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 *
 *  # Heart of Bibi                                                                                                                                                                         (℠)
 *
 */ ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Heart of Bibi — aggregator: split modules are wired here and re-exported.
// bibi.js (`import *`) keeps exposing the same 15 names as globals for extensions.

export { Bibi, L, R, I, P, U, D, S, C, O, E, M, X } from './bibi.heart.context.mjs';
export { B } from './bibi.heart.book.mjs';
export { W } from './bibi.heart.wand.mjs';
import './bibi.heart.lifecycle.mjs';
import './bibi.heart.loader.mjs';
import './bibi.heart.reader.mjs';
import './bibi.heart.interface.mjs';
import './bibi.heart.preset.mjs';
import './bibi.heart.uri.mjs';
import './bibi.heart.document.mjs';
import './bibi.heart.settings.mjs';
import './bibi.heart.compass.mjs';
import './bibi.heart.operator.mjs';
import './bibi.heart.events.mjs';
import './bibi.heart.messages.mjs';
import './bibi.heart.extensions.mjs';
