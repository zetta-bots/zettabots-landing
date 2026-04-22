# Deployment Checklist — ZettaBots Landing Page

Follow this checklist before deploying to production.

## Pre-Deployment Setup

### 1. Formspree (Lead Collection)
- [ ] Create account at [formspree.io](https://formspree.io)
- [ ] Create a new form
- [ ] Copy your Form ID (format: `f/xxxxxxxxxxxxxx`)
- [ ] Add to `.env.local`: `VITE_FORMSPREE_ID=f/your-id`
- [ ] Test form submission locally
- [ ] Verify you receive test email

### 2. Google Analytics
- [ ] Create GA4 property at [analytics.google.com](https://analytics.google.com)
- [ ] Get Measurement ID (format: `G-XXXXXXXXXX`)
- [ ] Add to `.env.local`: `VITE_GA_ID=G-XXXXXXXXXX`
- [ ] Wait 24-48 hours for data to populate
- [ ] Verify events in GA dashboard

### 3. reCAPTCHA v3 (Optional but Recommended)
- [ ] Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
- [ ] Register domain (your production domain)
- [ ] Select **reCAPTCHA v3**
- [ ] Get **Site Key**
- [ ] Add to `.env.local`: `VITE_RECAPTCHA_SITE_KEY=your-key`
- [ ] Test form with spam bot attempt

### 4. WhatsApp Business Setup
- [ ] Get your WhatsApp business number
- [ ] Format: Country code + number (no spaces/dashes)
- [ ] Example: `5511987654321`
- [ ] Add to `.env.local`: `VITE_WHATSAPP_NUMBER=5511987654321`
- [ ] Test WhatsApp links work
- [ ] Set up WhatsApp automation/templates (optional)

## Local Testing

### 5. Development Testing
- [ ] Run `npm install`
- [ ] Create `.env.local` with all values
- [ ] Run `npm run dev`
- [ ] Test form submission end-to-end
- [ ] Verify Formspree receives email
- [ ] Test WhatsApp float button
- [ ] Check Google Analytics console
- [ ] Test on mobile (use phone/tablet)
- [ ] Test all CTAs work
- [ ] Verify no console errors

### 6. Build Testing
- [ ] Run `npm run build`
- [ ] Verify `dist/` folder created
- [ ] Run `npm run preview`
- [ ] Test production build locally
- [ ] Verify all features work

## Production Deployment

### 7. Choose Hosting Platform

#### Option A: Vercel (Recommended)
- [ ] Create account at [vercel.com](https://vercel.com)
- [ ] Connect GitHub repository
- [ ] Add environment variables in Vercel dashboard:
  - `VITE_WHATSAPP_NUMBER`
  - `VITE_FORMSPREE_ID`
  - `VITE_GA_ID`
  - `VITE_RECAPTCHA_SITE_KEY`
- [ ] Deploy
- [ ] Get production URL
- [ ] Update reCAPTCHA domain whitelist

#### Option B: Netlify
- [ ] Create account at [netlify.com](https://netlify.com)
- [ ] Connect GitHub repository
- [ ] Add environment variables in Build & Deploy settings
- [ ] Deploy
- [ ] Get production URL

#### Option C: Static Hosting
- [ ] Run `npm run build`
- [ ] Upload `dist/` folder to:
  - GitHub Pages / AWS S3 / Cloudflare Pages / Azure Static Web Apps
- [ ] Verify all files uploaded
- [ ] Get production URL

### 8. Domain Setup
- [ ] Purchase domain (if not already owned)
- [ ] Point domain to hosting service
- [ ] Set up SSL/HTTPS (automatic on Vercel/Netlify)
- [ ] Wait 24-48 hours for DNS propagation
- [ ] Test domain accessibility

### 9. Production Verification
- [ ] Visit production URL
- [ ] Test form submission
- [ ] Check Formspree email delivery
- [ ] Verify WhatsApp links work
- [ ] Check Google Analytics (wait 24-48h)
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Check Lighthouse scores:
  - Performance: 90+
  - Accessibility: 90+
  - Best Practices: 90+
  - SEO: 100

### 10. Post-Deployment

#### Google Indexing
- [ ] Submit sitemap to Google Search Console
  - URL: `yoursite.com/sitemap.xml` (if auto-generated)
  - Or submit manually: `https://www.google.com/webmasters/tools/`
- [ ] Submit to Bing Webmaster Tools
- [ ] Wait 1-2 weeks for indexing

#### Analytics Setup
- [ ] Verify GA events firing
  - `generate_lead` on form submit
  - Page views on each section
- [ ] Set up conversion goals in GA
- [ ] Create custom dashboards
- [ ] Set up email alerts for anomalies

#### Security
- [ ] Verify `.env.local` is NOT in git (check `.gitignore`)
- [ ] Verify environment variables are set in hosting platform
- [ ] Test that secrets don't leak in source maps
- [ ] Enable security headers (if available)
- [ ] Run security scan (e.g., npm audit)

#### Monitoring
- [ ] Set up error tracking (e.g., Sentry - optional)
- [ ] Monitor form submissions
- [ ] Monitor page performance (Core Web Vitals)
- [ ] Set up Slack notifications for critical errors (optional)

### 11. Optimization (First Month)

- [ ] Analyze GA data for traffic patterns
- [ ] A/B test CTA copy/colors
- [ ] Optimize form fields (remove unnecessary fields)
- [ ] Improve load time if slow
- [ ] Adjust pricing based on interest
- [ ] Collect customer testimonials

## Maintenance Schedule

### Weekly
- [ ] Check form submissions
- [ ] Monitor WhatsApp messages
- [ ] Quick performance check

### Monthly
- [ ] Review GA analytics
- [ ] Check for broken links
- [ ] Update testimonials
- [ ] Security audit

### Quarterly
- [ ] A/B testing analysis
- [ ] Feature/copy updates
- [ ] Competitor research
- [ ] Budget review

## Rollback Plan

If something breaks in production:

1. **Quick Fix**: Push patch to GitHub → Redeploy (automatic on Vercel/Netlify)
2. **Revert**: Use git to revert to last known good version
3. **Hotline**: Disable broken feature, add TODO comment
4. **Communication**: Update status page if available

## Support

Need help?
- Check [README.md](./README.md) troubleshooting section
- Review error logs in hosting platform
- Check browser console for errors
- Test locally to isolate issue

---

**Last Updated:** 2026-04-18
**Status:** ✅ Ready for Production
