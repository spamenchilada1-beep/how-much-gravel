// Replace this bridge with window.cloudflareWebAnalytics or another provider when ready.
export function track(eventName, properties = {}) {
  window.dispatchEvent(new CustomEvent('gravel-calculator-event', {
    detail: { eventName, properties }
  }))
  if (typeof window.cloudflareWebAnalytics === 'function') {
    window.cloudflareWebAnalytics(eventName, properties)
  }
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, properties)
  }
}
