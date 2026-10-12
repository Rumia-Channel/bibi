export const getHostBookStorageLabel = Settings => {
    const Namespace = Settings['storage-namespace'];
    if(!Namespace) return null;
    if(!Settings['book-key'] || !Settings['content-hash']) throw Object.assign(new Error('storage-namespace requires book-key and content-hash.'), { code: 'INVALID_STORAGE_IDENTITY' });
    return 'Bibi:Biscuit:host:' + JSON.stringify([Namespace, Settings['storage-user'] || '', Settings['book-key'], Settings['content-hash']]);
};
