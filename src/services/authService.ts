import { User } from '../types';
import { IAuthService } from './types';
import { supabase } from '../lib/supabase';

const DEFAULT_ADMIN_USER: User = {
  id: 'usr-admin-001',
  user_id: 'usr-admin-001',
  name: 'Dr. Vikramaditya Sharma',
  full_name: 'Dr. Vikramaditya Sharma',
  email: 'admin@roadsense.gov.in',
  role: 'MUNICIPAL_ADMIN',
  department: 'Metropolitan Urban Development & Traffic Command',
  badge_number: 'CMD-001',
  is_online: true,
  permissions: [
    'VIEW_INCIDENTS',
    'EDIT_INCIDENTS',
    'DISPATCH_SERVICES',
    'VIEW_RAW_CAMERAS',
    'CONTROL_AI_MODELS',
    'EXPORT_DATA',
    'SYSTEM_CONFIG',
  ],
  created_at: '2026-01-01T00:00:00.000Z',
  last_login: new Date().toISOString(),
  mfa_enabled: true,
};

class AuthService implements IAuthService {
  private user: User = { ...DEFAULT_ADMIN_USER };
  private listeners: Set<(user: User) => void> = new Set();

  constructor() {
    this.initSupabaseAuth();
  }

  private async initSupabaseAuth() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        this.setUserFromSupabase(session.user);
      }

      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession?.user) {
          this.setUserFromSupabase(newSession.user);
        }
      });
    } catch (err) {
      console.warn('Supabase Auth init notice:', err);
    }
  }

  private setUserFromSupabase(sbUser: any) {
    const metaRole = sbUser.user_metadata?.role || 'MUNICIPAL_ADMIN';
    const fullName = sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Municipal Officer';

    this.user = {
      id: sbUser.id,
      user_id: sbUser.id,
      name: fullName,
      full_name: fullName,
      email: sbUser.email || 'officer@roadsense.gov.in',
      role: metaRole,
      department: sbUser.user_metadata?.department || 'Metropolitan Urban Command',
      badge_number: 'CMD-SB-' + sbUser.id.slice(-4),
      is_online: true,
      permissions:
        metaRole === 'CENTRAL_ADMIN' || metaRole === 'MUNICIPAL_ADMIN'
          ? [
              'VIEW_INCIDENTS',
              'EDIT_INCIDENTS',
              'DISPATCH_SERVICES',
              'VIEW_RAW_CAMERAS',
              'CONTROL_AI_MODELS',
              'EXPORT_DATA',
              'SYSTEM_CONFIG',
            ]
          : metaRole === 'FIELD_RESPONDER' || metaRole === 'FIELD_INSPECTOR'
          ? ['VIEW_INCIDENTS', 'DISPATCH_SERVICES']
          : ['VIEW_INCIDENTS'],
      created_at: sbUser.created_at || new Date().toISOString(),
      last_login: new Date().toISOString(),
      mfa_enabled: false,
    };
    this.notifyListeners();
  }

  public subscribe(cb: (user: User) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb({ ...this.user });
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    });
  }

  async getCurrentUser(): Promise<User> {
    return { ...this.user };
  }

  async updateUser(updated: Partial<User>): Promise<User> {
    this.user = { ...this.user, ...updated };
    this.notifyListeners();
    return { ...this.user };
  }

  async switchRole(role: User['role']): Promise<User> {
    this.user = { ...this.user, role };
    // If authenticated on Supabase, attempt to update metadata
    try {
      await supabase.auth.updateUser({
        data: { role },
      });
    } catch {
      // ignore
    }
    this.notifyListeners();
    return { ...this.user };
  }

  async signInWithEmail(email: string, password: string):Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { user: null, error: error.message };
      }
      if (data.user) {
        this.setUserFromSupabase(data.user);
        return { user: { ...this.user }, error: null };
      }
      return { user: null, error: 'Sign in returned no user' };
    } catch (err: any) {
      return { user: null, error: err.message || 'Login exception' };
    }
  }

  async signUpWithEmail(
    email: string,
    password: string,
    fullName: string,
    role: User['role'] = 'FIELD_RESPONDER',
    department: string = 'Municipal Division'
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            department,
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        this.setUserFromSupabase(data.user);
        return { user: { ...this.user }, error: null };
      }

      return { user: null, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Sign up exception' };
    }
  }

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    this.user = {
      ...DEFAULT_ADMIN_USER,
      id: 'guest-viewer',
      user_id: 'guest-viewer',
      name: 'Guest Municipal Auditor',
      full_name: 'Guest Municipal Auditor',
      role: 'DATA_ANALYST',
    };
    this.notifyListeners();
  }
}

export const authService = new AuthService();
