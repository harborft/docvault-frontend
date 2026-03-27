import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api }     from '../utils/api';

export default function Layout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.me().then(d => setUnread(d.unread_notifications || 0)).catch(() => {});
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const nav = [
    { to: '/dashboard', label: 'Dashboard',  icon: '▦' },
    { to: '/clients',   label: 'Clients',     icon: '👥' },
    { to: '/documents', label: 'Documents',   icon: '📄' },
    { to: '/approvals', label: 'Approvals',   icon: '✓',  badge: true },
    { to: '/audit',     label: 'Audit Log',   icon: '🔍' },
  ];

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.brand}>DocVault</div>
          <div style={s.sub}>Fractional Finance Portal</div>
        </div>
        <nav style={s.nav}>
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
              {item.badge && unread > 0 && (
                <span style={s.badge}>{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div style={s.user}>
          <div style={s.avatar}>
            {profile?.full_name?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.userName}>{profile?.full_name || 'Admin'}</div>
            <div style={s.userRole}>CFO Partner · Admin</div>
          </div>
          <button onClick={handleSignOut} style={s.signOut} title="Sign out">⏻</button>
        </div>
      </aside>
      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}

const s = {
  shell:    { display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' },
  sidebar:  { width: 210, background: '#0D1B2A', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  logo:     { padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,.08)' },
  brand:    { fontSize: 17, fontWeight: 700, color: '#E8C96A' },
  sub:      { fontSize: 9, color: 'rgba(255,255,255,.3)', letterSpacing: '.8px', textTransform: 'uppercase', marginTop: 2 },
  nav:      { flex: 1, padding: '10px 0' },
  navItem:  { display: 'flex', alignItems: 'center', gap: 9, padding: '9px 16px',
              color: 'rgba(255,255,255,.52)', textDecoration: 'none', fontSize: 13, fontWeight: 500,
              borderLeft: '2px solid transparent', transition: 'all .15s' },
  navActive:{ color: '#E8C96A', borderLeftColor: '#C9A84C', background: 'rgba(201,168,76,.09)' },
  badge:    { marginLeft: 'auto', background: '#E24B4A', color: '#fff',
              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20 },
  user:     { padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.08)',
              display: 'flex', alignItems: 'center', gap: 9 },
  avatar:   { width: 30, height: 30, borderRadius: '50%', background: '#243B5A',
              border: '1.5px solid #C9A84C', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#E8C96A', flexShrink: 0 },
  userName: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.72)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { fontSize: 9, color: 'rgba(255,255,255,.32)' },
  signOut:  { background: 'none', border: 'none', color: 'rgba(255,255,255,.35)',
              cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0 },
  main:     { flex: 1, overflow: 'auto', background: '#F2F4F7' }
};
