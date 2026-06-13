import { request } from './api'

export interface BillingStatus {
  access: boolean
  premium: boolean
  inTrial: boolean
  trialEndsAt: string
  trialDaysLeft: number
  price_sek: number
}

export const billingApi = {
  getStatus: () => request<BillingStatus>('/billing/status'),

  startCheckout: () =>
    request<{ url: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ origin: window.location.origin }),
    }),
}
