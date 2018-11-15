'use strict';

// Install or update the service worker (i.e. web app)
//
// The service worker will be responsible to cache all relevant files to use
// the site offline, receive push notifications and sync the data with the server.
navigator.serviceWorker.register('/serviceWorker.js').then(function(serviceWorkerRegistration) {
    let isInitialInstallation = navigator.serviceWorker.controller === null;

    // A pending update was found
    //
    // If there was found an update which still needs to be activated
    // dispatch the "pwa:update" event.
    if (serviceWorkerRegistration.waiting) {
        window.dispatchEvent(new CustomEvent('pwa:update', {
            detail: serviceWorkerRegistration.waiting
        }));
    }

    // When there's a new version of the service worker (i.e. the web app)
    // the "updatefound" event will be fired
    //
    // In here we should show the user a notification, that a new version
    // has been installed and is ready to use.
    serviceWorkerRegistration.addEventListener('updatefound', function() {
        let updatedServiceWorker = this.installing;

        updatedServiceWorker.addEventListener('statechange', function() {
            // The initial service worker has been installed and activated
            if (this.state == 'activated' && isInitialInstallation) {
                console.log('The service worker has been installed');

                window.dispatchEvent(new CustomEvent('pwa:installed'));
            }

            // A new version has been downloaded and installed
            //
            // Even though the new version has been installed, it is not active yet.
            // This means, the user can still use the old/current version. So here
            // we should show the user an option to activate the new version.
            // This state will also be triggered on the initial installation,
            // so we have to check navigator.serviceWorker.controller for any old
            // service worker, to make sure it was a real update.
            if (this.state == 'installed' && !isInitialInstallation) {
                console.log('An update has been installed');

                window.dispatchEvent(new CustomEvent('pwa:update', {
                    detail: updatedServiceWorker
                }));
            }

            // The new version has been activated and is ready to use
            //
            // This state will also be triggered on the initial installation,
            // so we have to check navigator.serviceWorker.controller for any old
            // service worker, to make sure it was a real update.
            if (this.state == 'activated'/* && navigator.serviceWorker.controller !== null*/) {
                console.log('The new version has been activated');

                window.dispatchEvent(new CustomEvent('pwa:updated'));
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // On Chrome this event will be triggered when all criterias are met
    // to install the website as progressive web app
    window.addEventListener('beforeinstallprompt', function(beforeinstallpromptEvent) {
        document.querySelector('#add-to-homescreen').hidden = false;

        // We need to call "event.prompt()" to show a dialog to the user
        // to install the progressive web app. This can only be called from wiithin a user gesture!
        document.querySelector('#add-to-homescreen').addEventListener('click', function() {
            beforeinstallpromptEvent.prompt();
        });
    });

    // This event will be fired when the web app has been successfully added to the homescreen
    window.addEventListener('appinstalled', function() {
        document.querySelector('#add-to-homescreen').hidden = true;
    });

    // Check if there's a new version available and install it, if any
    document.querySelector('#check-for-updates').addEventListener('click', async function() {
        let serviceWorkerRegistration = await navigator.serviceWorker.ready;

        serviceWorkerRegistration.update();
    });

    // A new version of the web app has been installed
    //
    // The version has been downloaded but is not yet active so
    // now we should show the user a notification to activate the new version.
    window.addEventListener('pwa:update', function(event) {
        let updatedServiceWorker = event.detail;

        document.querySelector('#check-for-updates').hidden = true;

        document.querySelector('#install-updates').hidden = false;
        document.querySelector('#install-updates').addEventListener('click', function() {
            // Send a message to the new service worker that we want to activate it
            updatedServiceWorker.postMessage({
                action: 'activate'
            });
        });
    });

    // A new version of the web app has been installed and activated
    //
    // Let's reload the page so the user can actually use the new version.
    window.addEventListener('pwa:updated', function() {
        location.reload();
    });
});
