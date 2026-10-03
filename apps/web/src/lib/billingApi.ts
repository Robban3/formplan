import { request } from './api'

export interface BillingStatus {
  access: boolean
  premium: boolean
  inTrial: boolean
  trialEndsAt: string
  trialDaysLeft: number
  /** Sant bara när en Stripe-prenumeration finns att hantera (se API:ts access.ts). */
  manageable: boolean
  price_sek: number
}

export const billingApi = {
  getStatus: () => request<BillingStatus>('/billing/status'),

  startCheckout: () =>
    request<{ url: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ origin: window.location.origin }),
    }),

  openPortal: () =>
    request<{ url: string }>('/billing/portal', {
      method: 'POST',
      body: JSON.stringify({ origin: window.location.origin }),
    }),
}
