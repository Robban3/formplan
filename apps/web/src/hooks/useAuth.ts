import type { User } from '@supabase/supabase-js'
// DEV BYPASS
const DEV_USER = { id: 'dev-user', email: 'dev@formplan.local' } as unknown as User
export function useAuth() { return { user: DEV_USER, loading: false } }
