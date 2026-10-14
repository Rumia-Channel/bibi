const failure = (code, message) => Object.assign(new Error(message), { code });
const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);

export function getHostNavigationConfig(preset, origin, embedded, trustedPreset) {
    if(!trustedPreset || embedded || preset['use-host-navigation'] !== true || !/^https?:\/\//.test(origin)) return null;
    const endpoint = preset['host-navigation-api'], paths = preset['host-navigation-paths'];
    if(typeof endpoint !== 'string' || !endpoint.startsWith('/') || endpoint.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(endpoint) || !Array.isArray(paths) || !paths.length) return null;
    const url = new URL(endpoint, origin);
    if(url.origin !== origin || !/^https?:$/.test(url.protocol) || url.username || url.password) return null;
    if(paths.some(path => typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(path) || new URL(path, origin).pathname !== path)) return null;
    return { endpoint: url.href, origin, paths: new Set(paths) };
}

export function validateHostNavigation(data, identity, config) {
    if(!isObject(data) || data.schemaVersion !== 1) throw failure('INVALID_NAVIGATION', 'The navigation response has an unsupported format.');
    if(data.bookKey !== identity.bookKey || data.contentHash !== identity.contentHash) throw failure('IDENTITY_MISMATCH', 'The navigation response belongs to another book or file revision.');
    const destination = href => {
        if(typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(href)) throw failure('INVALID_DESTINATION', 'The navigation destination must be an app-local URL.');
        const url = new URL(href, config.origin);
        if(url.origin !== config.origin || !/^https?:$/.test(url.protocol) || url.username || url.password || !config.paths.has(url.pathname)) throw failure('INVALID_DESTINATION', 'The navigation destination is not allowed by this site.');
        return url.pathname + url.search + url.hash;
    };
    const neighbor = value => {
        if(value === null) return null;
        if(!isObject(value) || typeof value.bookKey !== 'string' || !value.bookKey || value.bookKey === identity.bookKey || typeof value.title !== 'string' || !['ready', 'missing-file', 'unsupported-format'].includes(value.status)) throw failure('INVALID_NAVIGATION', 'An adjacent book has an invalid format.');
        if(value.status === 'ready') {
            if(typeof value.contentHash !== 'string' || !value.contentHash) throw failure('INVALID_NAVIGATION', 'The adjacent book has no file identity.');
            return { ...value, href: destination(value.href) };
        }
        if(value.href !== null || value.contentHash !== null && typeof value.contentHash !== 'string') throw failure('INVALID_NAVIGATION', 'An unavailable adjacent book cannot have a destination.');
        return value;
    };
    if(!isObject(data.returnTo) || typeof data.returnTo.label !== 'string') throw failure('INVALID_NAVIGATION', 'The navigation response has no return page.');
    return { ...data, previous: neighbor(data.previous), next: neighbor(data.next), returnTo: { ...data.returnTo, href: destination(data.returnTo.href) } };
}

