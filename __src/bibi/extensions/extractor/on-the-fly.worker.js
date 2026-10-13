'use strict';

// The vendored ZIP loader forces credentials: omit. Keep authentication policy
// in Bibi rather than modifying its generated bundle or leaking cross-origin cookies.
const Credentials = new URL(self.location.href).searchParams.get('credentials') === 'include' ? 'include' : 'same-origin';
const Fetch = self.fetch.bind(self);
self.fetch = (Input, Options) => Fetch(Input, { ...Options, credentials: Credentials });
self.importScripts(new URL('./on-the-fly.bibi-zip-loader.worker.js', self.location.href).href);
