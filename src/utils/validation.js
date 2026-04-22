// Form validation utilities

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePhone = (phone) => {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-().]/g, '')
  // Check if it's 10-15 digits (international format)
  return /^\d{10,15}$/.test(cleaned)
}

export const validateForm = (form) => {
  const errors = {}

  if (!form.name || form.name.trim().length < 2) {
    errors.name = 'Nome deve ter pelo menos 2 caracteres'
  }

  if (!validateEmail(form.email)) {
    errors.email = 'E-mail inválido'
  }

  if (!validatePhone(form.phone)) {
    errors.phone = 'Telefone inválido (mínimo 10 dígitos)'
  }

  if (!form.segment) {
    errors.segment = 'Selecione um segmento'
  }

  if (!form.businessName || form.businessName.trim().length < 2) {
    errors.businessName = 'Informe o nome do seu negócio'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// reCAPTCHA v3 Helper
export const loadRecaptcha = () => {
  const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

  if (!SITE_KEY) {
    console.warn('reCAPTCHA not configured (VITE_RECAPTCHA_SITE_KEY)')
    return null
  }

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
    script.onload = () => {
      window.grecaptcha.ready(() => {
        resolve(SITE_KEY)
      })
    }
    document.head.appendChild(script)
  })
}

export const getRecaptchaToken = async (action = 'submit') => {
  const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

  if (!SITE_KEY || !window.grecaptcha) {
    return null
  }

  try {
    return await window.grecaptcha.execute(SITE_KEY, { action })
  } catch (error) {
    console.error('reCAPTCHA error:', error)
    return null
  }
}
