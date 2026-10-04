import { request } from './api'

export interface BillingStatus {
  access: boolean
  premium: boolean
  inTrial: boolean
  trialEndsAt: string
  trialDaysLeft: number
  /**
   * Sant bara när en Stripe-prenumeration finns att hantera (se API:ts
   * access.ts). Valfri: ett API som inte hunnit deployas svarar utan fältet,
   * och då får klienten inte dölja knappen för en betalande kund.
   */
  manageable?: boolean
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
