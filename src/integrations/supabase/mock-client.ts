// Offline/Local Storage Mock Client for Supabase with 1 Admin and 3 Customers
// Fresh empty complaints database for clean manual testing

type Role = 'admin' | 'user';

export interface UserRecord {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface ComplaintRecord {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  ai_reason: string | null;
  ai_classified: boolean;
  csat_rating?: number | null;
  csat_feedback?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface ComplaintUpdateRecord {
  id: string;
  complaint_id: string;
  author_id?: string;
  author_name?: string;
  note?: string;
  from_status?: string;
  to_status?: string;
  created_at: string;
}

// 1 Admin & 3 Dedicated Customer Accounts
const DEFAULT_USERS: UserRecord[] = [
  {
    id: 'user-admin-1',
    email: 'admin@example.com',
    password: 'Password123!',
    full_name: 'System Admin',
    role: 'admin',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'user-customer-1',
    email: 'customer1@example.com',
    password: 'Password123!',
    full_name: 'Alex Johnson',
    role: 'user',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'user-customer-2',
    email: 'customer2@example.com',
    password: 'Password123!',
    full_name: 'Sarah Miller',
    role: 'user',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'user-customer-3',
    email: 'customer3@example.com',
    password: 'Password123!',
    full_name: 'David Chen',
    role: 'user',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

// Clean empty database for manual testing
const DEFAULT_COMPLAINTS: ComplaintRecord[] = [];
const DEFAULT_UPDATES: ComplaintUpdateRecord[] = [];

// In-memory runtime store for server-side SSR / API execution
let memoryUsers = [...DEFAULT_USERS];
let memoryComplaints: ComplaintRecord[] = [];
let memoryUpdates: ComplaintUpdateRecord[] = [];

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to update localStorage:', e);
  }
}

function getUsers(): UserRecord[] {
  if (typeof window === 'undefined') return memoryUsers;
  return getItem<UserRecord[]>('mock_users_v3', DEFAULT_USERS);
}

function saveUsers(users: UserRecord[]) {
  memoryUsers = users;
  setItem('mock_users_v3', users);
}

function getComplaints(): ComplaintRecord[] {
  if (typeof window === 'undefined') return memoryComplaints;
  return getItem<ComplaintRecord[]>('mock_complaints_v3', DEFAULT_COMPLAINTS);
}

function saveComplaints(complaints: ComplaintRecord[]) {
  memoryComplaints = complaints;
  setItem('mock_complaints_v3', complaints);
}

function getUpdates(): ComplaintUpdateRecord[] {
  if (typeof window === 'undefined') return memoryUpdates;
  return getItem<ComplaintUpdateRecord[]>('mock_updates_v3', DEFAULT_UPDATES);
}

function saveUpdates(updates: ComplaintUpdateRecord[]) {
  memoryUpdates = updates;
  setItem('mock_updates_v3', updates);
}

function getSession() {
  return getItem<any>('mock_session_v3', null);
}

function saveSession(session: any) {
  setItem('mock_session_v3', session);
}

const listeners: Set<Function> = new Set();

export const mockSupabase = {
  auth: {
    signUp: async ({ email, password, options }: any) => {
      try {
        if (!email || typeof email !== 'string') {
          return { data: { user: null, session: null }, error: { message: 'Valid email is required' } };
        }

        const users = getUsers();
        let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        const fullName = options?.data?.full_name || email.split('@')[0];
        const role: Role = email.toLowerCase().trim() === 'admin@example.com' ? 'admin' : 'user';

        if (!user) {
          user = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'user-' + Date.now(),
            email: email.trim(),
            password: password || 'Password123!',
            full_name: fullName,
            role,
            created_at: new Date().toISOString(),
          };
          users.push(user);
          saveUsers(users);
        }

        const session = {
          access_token: 'mock-jwt-token-' + user.id,
          token_type: 'bearer',
          user: {
            id: user.id,
            email: user.email,
            user_metadata: { full_name: user.full_name },
          },
        };

        saveSession(session);
        listeners.forEach((fn) => {
          try { fn('SIGNED_IN', session); } catch {}
        });

        return { data: { user: session.user, session }, error: null };
      } catch (err) {
        return { data: { user: null, session: null }, error: { message: err instanceof Error ? err.message : 'Sign up failed' } };
      }
    },

    signInWithPassword: async ({ email, password }: any) => {
      try {
        if (!email || !password) {
          return { data: { user: null, session: null }, error: { message: 'Email and password are required' } };
        }

        const users = getUsers();
        const user = users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase().trim() && (u.password === password || !u.password)
        );

        if (!user) {
          return { data: { user: null, session: null }, error: { message: 'Invalid email or password' } };
        }

        const session = {
          access_token: 'mock-jwt-token-' + user.id,
          token_type: 'bearer',
          user: {
            id: user.id,
            email: user.email,
            user_metadata: { full_name: user.full_name },
          },
        };

        saveSession(session);
        listeners.forEach((fn) => {
          try { fn('SIGNED_IN', session); } catch {}
        });

        return { data: { user: session.user, session }, error: null };
      } catch (err) {
        return { data: { user: null, session: null }, error: { message: err instanceof Error ? err.message : 'Sign in failed' } };
      }
    },

    signOut: async () => {
      try {
        saveSession(null);
        listeners.forEach((fn) => {
          try { fn('SIGNED_OUT', null); } catch {}
        });
        return { error: null };
      } catch (err) {
        return { error: { message: err instanceof Error ? err.message : 'Sign out failed' } };
      }
    },

    getSession: async () => {
      const session = getSession();
      return { data: { session }, error: null };
    },

    getUser: async () => {
      const session = getSession();
      return { data: { user: session ? session.user : null }, error: null };
    },

    onAuthStateChange: (callback: any) => {
      listeners.add(callback);
      const session = getSession();
      if (session) {
        try { callback('INITIAL_SESSION', session); } catch {}
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
      };
    },
  },

  rpc: async (functionName: string, args: any) => {
    try {
      if (functionName === 'has_role') {
        const users = getUsers();
        const user = users.find((u) => u.id === args?._user_id);
        const hasRole = user ? user.role === args?._role : false;
        return { data: hasRole, error: null };
      }
      return { data: null, error: null };
    } catch {
      return { data: false, error: null };
    }
  },

  from: (table: string) => {
    let filters: Array<{ field: string; op: string; val: any }> = [];
    let orderConfig: { field: string; ascending: boolean } | null = null;
    let limitCount: number | null = null;
    let isSingle = false;
    let isMaybeSingle = false;

    const builder: any = {
      select: (_fields?: string) => builder,
      eq: (field: string, val: any) => {
        filters.push({ field, op: 'eq', val });
        return builder;
      },
      neq: (field: string, val: any) => {
        filters.push({ field, op: 'neq', val });
        return builder;
      },
      order: (field: string, config?: { ascending?: boolean }) => {
        orderConfig = { field, ascending: config?.ascending ?? true };
        return builder;
      },
      limit: (count: number) => {
        limitCount = count;
        return builder;
      },
      single: () => {
        isSingle = true;
        return builder.execute();
      },
      maybeSingle: () => {
        isMaybeSingle = true;
        return builder.execute();
      },
      then: (onfulfilled?: any, onrejected?: any) => {
        return builder.execute().then(onfulfilled, onrejected);
      },
      execute: async () => {
        try {
          if (table === 'profiles') {
            const users = getUsers();
            let res = users.map((u) => ({ id: u.id, full_name: u.full_name, email: u.email, created_at: u.created_at }));
            for (const f of filters) {
              if (f.op === 'eq') res = res.filter((item: any) => item[f.field] === f.val);
              if (f.op === 'neq') res = res.filter((item: any) => item[f.field] !== f.val);
            }
            let data: any = res;
            if (isSingle || isMaybeSingle) data = res[0] ?? null;
            return { data, error: null };
          }

          if (table === 'complaints') {
            let complaints = getComplaints();
            for (const f of filters) {
              if (f.op === 'eq') complaints = complaints.filter((item: any) => item[f.field] === f.val);
              if (f.op === 'neq') complaints = complaints.filter((item: any) => item[f.field] !== f.val);
            }
            if (orderConfig) {
              const { field, ascending } = orderConfig;
              complaints.sort((a: any, b: any) => {
                const valA = a[field] ?? '';
                const valB = b[field] ?? '';
                return ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
              });
            }
            if (limitCount !== null) {
              complaints = complaints.slice(0, limitCount);
            }
            let data: any = complaints;
            if (isSingle || isMaybeSingle) data = complaints[0] ?? null;
            return { data, error: null };
          }

          if (table === 'complaint_updates') {
            let updates = getUpdates();
            for (const f of filters) {
              if (f.op === 'eq') updates = updates.filter((item: any) => item[f.field] === f.val);
              if (f.op === 'neq') updates = updates.filter((item: any) => item[f.field] !== f.val);
            }
            if (orderConfig) {
              const { field, ascending } = orderConfig;
              updates.sort((a: any, b: any) => {
                const valA = a[field] ?? '';
                const valB = b[field] ?? '';
                return ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
              });
            }
            let data: any = updates;
            if (isSingle || isMaybeSingle) data = updates[0] ?? null;
            return { data, error: null };
          }

          return { data: [], error: null };
        } catch (err) {
          return { data: isSingle || isMaybeSingle ? null : [], error: { message: err instanceof Error ? err.message : 'Query failed' } };
        }
      },

      insert: async (payload: any) => {
        try {
          const record = Array.isArray(payload) ? payload[0] : payload;

          if (table === 'complaints') {
            const complaints = getComplaints();
            const newRecord: ComplaintRecord = {
              id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'c-' + Date.now(),
              user_id: record.user_id,
              user_email: record.user_email,
              user_name: record.user_name,
              title: record.title,
              description: record.description,
              category: record.category || 'other',
              priority: record.priority || 'medium',
              status: record.status || 'open',
              ai_reason: record.ai_reason || null,
              ai_classified: record.ai_classified ?? false,
              csat_rating: null,
              csat_feedback: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            complaints.unshift(newRecord);
            saveComplaints(complaints);

            return {
              select: () => ({
                single: async () => ({ data: newRecord, error: null }),
              }),
              data: newRecord,
              error: null,
            };
          }

          if (table === 'complaint_updates') {
            const updates = getUpdates();
            const newRecord: ComplaintUpdateRecord = {
              id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'cu-' + Date.now(),
              complaint_id: record.complaint_id,
              author_id: record.author_id,
              author_name: record.author_name,
              note: record.note,
              from_status: record.from_status,
              to_status: record.to_status,
              created_at: new Date().toISOString(),
            };
            updates.unshift(newRecord);
            saveUpdates(updates);
            return { data: newRecord, error: null };
          }

          return { data: record, error: null };
        } catch (err) {
          return { data: null, error: { message: err instanceof Error ? err.message : 'Insert failed' } };
        }
      },

      update: (payload: any) => {
        let updateFilters: Array<{ field: string; val: any }> = [];
        const updateBuilder = {
          eq: (field: string, val: any) => {
            updateFilters.push({ field, val });
            return updateBuilder;
          },
          then: async (onfulfilled?: any, onrejected?: any) => {
            try {
              if (table === 'complaints') {
                const complaints = getComplaints();
                for (const c of complaints) {
                  const matches = updateFilters.every((f) => (c as any)[f.field] === f.val);
                  if (matches) {
                    const oldStatus = c.status;
                    Object.assign(c, payload, { updated_at: new Date().toISOString() });
                    if (payload.status && payload.status !== oldStatus) {
                      const updates = getUpdates();
                      updates.unshift({
                        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'cu-' + Date.now(),
                        complaint_id: c.id,
                        from_status: oldStatus,
                        to_status: payload.status,
                        created_at: new Date().toISOString(),
                      });
                      saveUpdates(updates);
                    }
                  }
                }
                saveComplaints(complaints);
              }
              const res = { data: null, error: null };
              return Promise.resolve(res).then(onfulfilled, onrejected);
            } catch (err) {
              const res = { data: null, error: { message: err instanceof Error ? err.message : 'Update failed' } };
              return Promise.resolve(res).then(onfulfilled, onrejected);
            }
          },
        };
        return updateBuilder;
      },
    };

    return builder;
  },
};
