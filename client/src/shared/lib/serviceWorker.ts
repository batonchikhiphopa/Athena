export function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        console.warn("Service Worker is not supported in this browser");
        return;
    }

    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js")
            .then(() => {
                console.log("Service Worker registered");
            })
            .catch((err) => {
                console.error("Service Worker registration failed:", err);
            });
    });
}
