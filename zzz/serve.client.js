import { subscribe } from 'webpack-dev-middleware/client';

subscribe(Payload => {
    if(typeof window !== 'undefined' && Payload.action === 'static-changed' && !window.__bibiDevelopmentReloading) {
        window.__bibiDevelopmentReloading = true;
        window.location.reload();
    }
});
