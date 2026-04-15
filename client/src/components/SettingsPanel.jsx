import { useState } from 'react';

const DEFAULTS = {
  msgNotifs: true, soundAlerts: true, desktopNotifs: false, msgPreview: true,
  lastSeen: 'everyone', profileVisibility: 'everyone', readReceipts: true,
  fontSize: 'medium', enterToSend: true, autoDownload: false, twoStep: false,
};

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('chat_settings') || '{}') }; }
  catch { return DEFAULTS; }
}

export default function SettingsPanel({ user = { username: 'User' }, onLogout, toggleTheme, theme = 'dark', onClose }) {
  const [s, setS]                   = useState(load);
  const [activeSection, setActiveSection] = useState('notifications');
  const [bio, setBio]               = useState('Hey there! I am using ChatApp');
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio]         = useState(bio);
  const [storageCleared, setStorageCleared] = useState(false);
  const [pwForm, setPwForm]         = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg]           = useState('');

  const set = (key, val) => {
    const next = { ...s, [key]: val };
    setS(next);
    localStorage.setItem('chat_settings', JSON.stringify(next));
    if (key === 'theme') toggleTheme?.();
  };

  const t = theme === 'dark' ? dark : light;

  const sections = [
    { id: 'profile',       label: 'Profile',       icon: '👤' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy',       label: 'Privacy',       icon: '🔒' },
    { id: 'appearance',    label: 'Appearance',    icon: '🎨' },
    { id: 'chats',         label: 'Chats',         icon: '💬' },
    { id: 'storage',       label: 'Storage',       icon: '💾' },
    { id: 'security',      label: 'Security',      icon: '🛡️' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: t.bg, overflow: 'hidden' }}>

      {/* ── Left nav ── */}
      <div style={{ width: 280, minWidth: 280, background: t.sidebar, borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', background: t.header, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: t.text }}>Settings</h2>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.subtext, fontSize: 22, lineHeight: 1, padding: '0 4px' }}>✕</button>
          )}
        </div>

        {/* User card */}
        <div
          onClick={() => setActiveSection('profile')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${t.border}`, cursor: 'pointer', background: activeSection === 'profile' ? t.active : 'transparent' }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
            {user.username[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
            <div style={{ fontSize: 13, color: t.subtext, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bio}</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {sections.map(sec => (
            <div key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 20px', cursor: 'pointer',
              background: activeSection === sec.id ? t.active : 'transparent',
              borderLeft: `3px solid ${activeSection === sec.id ? '#00a884' : 'transparent'}`,
              transition: 'background 0.15s',
            }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{sec.icon}</span>
              <span style={{ fontSize: 14, fontWeight: activeSection === sec.id ? 600 : 400, color: activeSection === sec.id ? '#00a884' : t.text }}>
                {sec.label}
              </span>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
          <button onClick={onLogout} style={{ width: '100%', padding: '10px 0', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 8, color: '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            🚪 Log out
          </button>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px', background: t.bg }}>

        {/* PROFILE */}
        {activeSection === 'profile' && (
          <Section title="Profile" t={t}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 16px', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 40 }}>
                  {user.username[0].toUpperCase()}
                </div>
                <button style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: '50%', background: '#00a884', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>📷</button>
              </div>
              <div style={{ color: t.subtext, fontSize: 12 }}>Tap to change photo</div>
            </div>

            <Field label="YOUR NAME" t={t}>
              <input defaultValue={user.username} style={inp(t)} />
            </Field>

            <Field label="ABOUT" t={t}>
              {editingBio ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={newBio} onChange={e => setNewBio(e.target.value)} style={{ ...inp(t), flex: 1 }} autoFocus />
                  <button onClick={() => { setBio(newBio); setEditingBio(false); }} style={btnAccent}>Save</button>
                  <button onClick={() => setEditingBio(false)} style={btnGhost(t)}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: t.text }}>{bio}</span>
                  <button onClick={() => { setNewBio(bio); setEditingBio(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00a884', fontSize: 13, fontWeight: 600 }}>Edit</button>
                </div>
              )}
            </Field>

            <Field label="USERNAME" t={t}>
              <div style={{ fontSize: 14, color: t.subtext, padding: '6px 0' }}>{user.username}</div>
            </Field>
          </Section>
        )}

        {/* NOTIFICATIONS */}
        {activeSection === 'notifications' && (
          <Section title="Notifications" t={t}>
            <TRow label="Message notifications" sub="Get notified for new messages" icon="💬" value={s.msgNotifs}    onChange={v => set('msgNotifs', v)}    t={t} />
            <TRow label="Sound alerts"          sub="Play sound for messages"        icon="🔊" value={s.soundAlerts}  onChange={v => set('soundAlerts', v)}  t={t} />
            <TRow label="Desktop notifications" sub="Show desktop popups"            icon="🖥️" value={s.desktopNotifs} onChange={v => set('desktopNotifs', v)} t={t} />
            <TRow label="Message preview"       sub="Show content in notifications"  icon="👁️" value={s.msgPreview}   onChange={v => set('msgPreview', v)}   t={t} />
          </Section>
        )}

        {/* PRIVACY */}
        {activeSection === 'privacy' && (
          <Section title="Privacy" t={t}>
            <Field label="LAST SEEN" t={t}>
              <Sel value={s.lastSeen} onChange={v => set('lastSeen', v)} t={t}
                options={[['everyone','Everyone'],['contacts','My Contacts'],['nobody','Nobody']]} />
            </Field>
            <Field label="PROFILE PHOTO" t={t}>
              <Sel value={s.profileVisibility} onChange={v => set('profileVisibility', v)} t={t}
                options={[['everyone','Everyone'],['contacts','My Contacts'],['nobody','Nobody']]} />
            </Field>
            <TRow label="Read receipts" sub="Show ticks when messages are read" icon="✓✓" value={s.readReceipts} onChange={v => set('readReceipts', v)} t={t} />
            <Info t={t}>Turning off read receipts also hides others' read receipts from you.</Info>
          </Section>
        )}

        {/* APPEARANCE */}
        {activeSection === 'appearance' && (
          <Section title="Appearance" t={t}>
            <Field label="THEME" t={t}>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {[['dark','🌙 Dark'],['light','☀️ Light']].map(([val, label]) => (
                  <button key={val} onClick={() => { set('theme', val); if (val !== theme) toggleTheme?.(); }}
                    style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: `2px solid ${theme === val ? '#00a884' : t.border}`, background: theme === val ? 'rgba(0,168,132,0.1)' : t.card, color: theme === val ? '#00a884' : t.text, fontWeight: theme === val ? 600 : 400, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="FONT SIZE" t={t}>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[['small','Small'],['medium','Medium'],['large','Large']].map(([val, label]) => (
                  <button key={val} onClick={() => set('fontSize', val)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `2px solid ${s.fontSize === val ? '#00a884' : t.border}`, background: s.fontSize === val ? 'rgba(0,168,132,0.1)' : t.card, color: s.fontSize === val ? '#00a884' : t.text, fontWeight: s.fontSize === val ? 600 : 400, fontSize: val === 'small' ? 12 : val === 'large' ? 16 : 14, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="CHAT WALLPAPER" t={t}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                {['#0b141a','#efeae2','#1a2940','#2d1f3d','#1a3a2f','#3d2a1a'].map(color => (
                  <div key={color} title={color}
                    style={{ width: 44, height: 44, borderRadius: 8, background: color, cursor: 'pointer', border: '2px solid transparent', transition: 'border 0.2s', boxSizing: 'border-box' }}
                    onMouseEnter={e => e.currentTarget.style.border = '2px solid #00a884'}
                    onMouseLeave={e => e.currentTarget.style.border = '2px solid transparent'} />
                ))}
                <div style={{ width: 44, height: 44, borderRadius: 8, border: `1px dashed ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.subtext, fontSize: 22 }}>+</div>
              </div>
            </Field>
          </Section>
        )}

        {/* CHATS */}
        {activeSection === 'chats' && (
          <Section title="Chats" t={t}>
            <TRow label="Enter to send"      sub="Press Enter to send, Shift+Enter for new line" icon="↵"  value={s.enterToSend}  onChange={v => set('enterToSend', v)}  t={t} />
            <TRow label="Auto-download media" sub="Automatically download photos and videos"      icon="⬇️" value={s.autoDownload} onChange={v => set('autoDownload', v)} t={t} />
          </Section>
        )}

        {/* STORAGE */}
        {activeSection === 'storage' && (
          <Section title="Storage" t={t}>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: 13, color: t.subtext, marginBottom: 14, fontWeight: 600, letterSpacing: '0.5px' }}>STORAGE USAGE</div>
              {[['Messages', 68, '#00a884'],['Media', 22, '#3b82f6'],['Documents', 10, '#f59e0b']].map(([label, pct, color]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, color: t.text }}>{label}</span>
                    <span style={{ fontSize: 13, color: t.subtext }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: t.border, borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '0 20px 20px' }}>
              <button onClick={() => setStorageCleared(true)}
                style={{ width: '100%', padding: '12px 0', background: 'transparent', border: `1px solid ${storageCleared ? '#00a884' : '#ef4444'}`, borderRadius: 10, color: storageCleared ? '#00a884' : '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                {storageCleared ? '✓ Cleared' : '🗑️ Clear all chats'}
              </button>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: t.subtext, lineHeight: 1.5 }}>
                This permanently deletes all messages. This action cannot be undone.
              </p>
            </div>
          </Section>
        )}

        {/* SECURITY */}
        {activeSection === 'security' && (
          <Section title="Security" t={t}>
            <TRow label="Two-step verification" sub="Require a PIN when registering" icon="🔐" value={s.twoStep} onChange={v => set('twoStep', v)} t={t} />
            <Field label="CHANGE PASSWORD" t={t}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="password" placeholder="Current password"     style={inp(t)} value={pwForm.current}  onChange={e => setPwForm(p => ({ ...p, current:  e.target.value }))} />
                <input type="password" placeholder="New password"         style={inp(t)} value={pwForm.next}     onChange={e => setPwForm(p => ({ ...p, next:     e.target.value }))} />
                <input type="password" placeholder="Confirm new password" style={inp(t)} value={pwForm.confirm}  onChange={e => setPwForm(p => ({ ...p, confirm:  e.target.value }))} />
                {pwMsg && <p style={{ margin: 0, fontSize: 13, color: pwMsg.startsWith('✓') ? '#00a884' : '#ef4444' }}>{pwMsg}</p>}
                <button onClick={() => {
                  if (!pwForm.current) return setPwMsg('Enter your current password');
                  if (pwForm.next.length < 6) return setPwMsg('New password must be at least 6 characters');
                  if (pwForm.next !== pwForm.confirm) return setPwMsg('Passwords do not match');
                  setPwMsg('✓ Password updated successfully');
                  setPwForm({ current: '', next: '', confirm: '' });
                }} style={btnAccent}>
                  Update Password
                </button>
              </div>
            </Field>
          </Section>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────

function Section({ title, t, children }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: t.text }}>{title}</h3>
      <div style={{ background: t.card, borderRadius: 14, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, t, children }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', color: t.subtext, marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}

function TRow({ label, sub, icon, value, onChange, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
      <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: t.text, marginBottom: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: t.subtext, lineHeight: 1.4 }}>{sub}</div>}
      </div>
      <div onClick={() => onChange(!value)}
        style={{ width: 48, height: 26, borderRadius: 13, background: value ? '#00a884' : t.toggleOff, position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: value ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.25s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  );
}

function Sel({ value, onChange, options, t }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '9px 12px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
      {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
    </select>
  );
}

function Info({ t, children }) {
  return (
    <div style={{ padding: '12px 20px', borderTop: `1px solid ${t.border}` }}>
      <p style={{ margin: 0, fontSize: 12, color: t.subtext, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

const inp = t => ({
  width: '100%', padding: '10px 12px', background: t.input,
  border: `1px solid ${t.border}`, borderRadius: 8, color: t.text,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
});

const btnAccent = {
  padding: '10px 20px', background: '#00a884', color: '#fff',
  border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
};

const btnGhost = t => ({
  padding: '10px 16px', background: 'transparent', color: t.subtext,
  border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 14, cursor: 'pointer',
});

const dark = {
  bg: '#111b21', sidebar: '#111b21', header: '#202c33', card: '#202c33',
  input: '#2a3942', border: '#2a3942', active: '#2a3942',
  text: '#e9edef', subtext: '#8696a0', toggleOff: '#374151',
};
const light = {
  bg: '#f0f2f5', sidebar: '#ffffff', header: '#f0f2f5', card: '#ffffff',
  input: '#f0f2f5', border: '#e9edef', active: '#f0f2f5',
  text: '#111b21', subtext: '#667781', toggleOff: '#d1d5db',
};
