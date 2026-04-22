// Google Analytics Initialization
export const initGoogleAnalytics = () => {
  const GA_ID = import.meta.env.VITE_GA_ID

  if (!GA_ID) {
    console.warn('Google Analytics ID not configured (VITE_GA_ID)')
    return
  }

  // Load Google Analytics script
  const script1 = document.createElement('script')
  script1.async = true
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script1)

  // Initialize gtag
  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_ID, { 'anonymize_ip': true })
}

// Track form submissions
export const trackFormSubmit = (formData) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'generate_lead', {
      event_category: 'lead_form',
      event_label: formData.segment || 'unknown_segment'
    })
  }
}

// Track CTA clicks
export const trackCTAClick = (ctaName) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'click_cta', {
      event_category: 'engagement',
      event_label: ctaName
    })
  }
}
