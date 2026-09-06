import sML from 'sml.js'; self.sML = sML;
import { restoreSMLv1Subsystems } from './bibi.heart.context.mjs'; restoreSMLv1Subsystems();
import * as _ from './bibi.heart.js'; for(const m in _) self[m] = _[m];

import './bibi.book.scss';

document.addEventListener('DOMContentLoaded', Bibi.ring);
