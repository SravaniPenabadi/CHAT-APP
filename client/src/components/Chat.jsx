import { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import SettingsPanel from './SettingsPanel';

const API = 'http://localhost:3000';

const dk = {
  rail:      '#1f2c34',
  sidebar:   '#111b21',
  sideHead:  '#202c33',
  chatBg:    '#0b141a',
  bubbleOut: '#005c4b',
  bubbleIn:  '#202c33',
  inputArea: '#202c33',
  inputBox:  '#2a3942',
  divider:   '#2a3942',
  text:      '#e9edef',
  sub:       '#8696a0',
  accent:    '#00a884',
  hover:     '#2a3942',
  active:    '#2a3942',
  search:    '#2a3942',
  unread:    '#00a884',
};

function nameColor(n) {
  if (!n) return dk.accent;
  const p = ['#d32f2f','#7b1fa2','#1976d2','#388e3c','#f57c00','#0097a7','#c2185b','#5d4037'];
  let h = 0;
  for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts), now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

function timeAgo(ts) {
  if (!ts) return '';
  const m = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Av({ name, size = 40, online }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: nameColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size > 48 ? 26 : size > 36 ? 17 : 14 }}>
        {name?.[0]?.toUpperCase()}
      </div>
      {online !== undefined && (
        <div style={{ position: 'absolute', bottom: 1, right: 1, width: size > 36 ? 11 : 9, height: size > 36 ? 11 : 9, borderRadius: '50%', background: online ? '#25d366' : '#8696a0', border: `2px solid ${dk.sidebar}` }} />
      )}
    </div>
  );
}

function RailBtn({ icon, label, active, onClick }) {
  return (
    <button title={label} onClick={onClick} style={{ width: 48, height: 48, borderRadius: 12, border: 'none', cursor: 'pointer', background: active ? 'rgba(0,168,132,0.18)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'background 0.15s', color: active ? dk.accent : dk.sub }}>
      {icon}
    </button>
  );
}

export default function Chat({ user, onLogout, theme, toggleTheme }) {
  const [rooms, setRooms]                   = useState([]);
  const [allUsers, setAllUsers]             = useState([]);
  const [onlineMap, setOnlineMap]           = useState({});
  const [lastSeenMap, setLastSeenMap]       = useState({});
  const [dmNotifs, setDmNotifs]             = useState({});
  const [lastMsgs, setLastMsgs]             = useState({});
  const [railTab, setRailTab]               = useState('chats');
  const [filter, setFilter]                 = useState('all');
  const [searchQ, setSearchQ]               = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [chatMode, setChatMode]             = useState(null);
  const [activeRoom, setActiveRoom]         = useState(null);
  const [dmUser, setDmUser]                 = useState(null);
  const [messages, setMessages]             = useState([]);
  const [text, setText]                     = useState('');
  const [typingText, setTypingText]         = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName]       = useState('');
  const [newRoomDesc, setNewRoomDesc]       = useState('');
  const [roomError, setRoomError]           = useState('');
  const [isMobile, setIsMobile]             = useState(window.innerWidth < 768);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const bottomRef   = useRef(null);
  const isTypingRef = useRef(false);
  const stopRef     = useRef(null);
  const inputRef    = useRef(null);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    fetch(`${API}/rooms`).then(r => r.json()).then(setRooms).catch(() => {});
    fetch(`${API}/users`).then(r => r.json())
      .then(d => setAllUsers(d.filter(u => u.username !== user.username)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeRoom) socket.emit('user:join', { username: user.username, room: activeRoom.name });

    socket.on('message:history', h =>
      setMessages(h.map(m => ({ id: m._id, username: m.username, text: m.text, timestamp: m.createdAt }))));

    socket.on('message:receive', msg => {
      setMessages(prev => [...prev, { id: msg.id, username: msg.username, text: msg.text, timestamp: msg.timestamp }]);
      if (activeRoom) setLastMsgs(p => ({ ...p, [activeRoom._id]: msg.text }));
    });

    socket.on('room:update', ({ userCount }) =>
      setRooms(prev => prev.map(r => activeRoom && r.name === activeRoom.name ? { ...r, liveCount: userCount } : r)));

    socket.on('users:online', map => setOnlineMap(map));
    socket.on('user:lastSeen', ({ username, lastSeen }) =>
      setLastSeenMap(p => ({ ...p, [username]: lastSeen })));

    socket.on('typing:start', ({ username }) => setTypingText(`${username} is typing…`));
    socket.on('typing:stop',  ()             => setTypingText(''));

    socket.on('dm:receive', msg => {
      if (chatMode === 'dm' && dmUser === msg.from) {
        setMessages(prev => [...prev, { id: msg.id, username: msg.username, text: msg.text, timestamp: msg.timestamp }]);
        setLastMsgs(p => ({ ...p, [msg.from]: msg.text }));
      } else if (msg.from !== user.username) {
        setDmNotifs(p => ({ ...p, [msg.from]: (p[msg.from] || 0) + 1 }));
        setLastMsgs(p => ({ ...p, [msg.from]: msg.text }));
      }
    });

    socket.on('dm:typing:start', ({ from }) => setTypingText(`${from} is typing…`));
    socket.on('dm:typing:stop',  ()          => setTypingText(''));

    return () => {
      ['message:history','message:receive','room:update','users:online','user:lastSeen',
       'typing:start','typing:stop','dm:receive','dm:typing:start','dm:typing:stop'].forEach(e => socket.off(e));
    };
  }, [activeRoom, chatMode, dmUser]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    const id = setTimeout(async () => {
      try {
        const d = await fetch(`${API}/users/search?q=${encodeURIComponent(searchQ)}`).then(r => r.json());
        setSearchResults(d.filter(u => u.username !== user.username));
      } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(id);
  }, [searchQ]);

  const joinRoom = async (room) => {
    await fetch(`${API}/rooms/${room._id}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username }) }).catch(() => {});
    setRooms(await fetch(`${API}/rooms`).then(r => r.json()).catch(() => rooms));
    openRoom(room);
  };

  const leaveRoom = async (room) => {
    await fetch(`${API}/rooms/${room._id}/leave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username }) }).catch(() => {});
    setRooms(await fetch(`${API}/rooms`).then(r => r.json()).catch(() => rooms));
    if (activeRoom?._id === room._id) { setActiveRoom(null); setChatMode(null); setMessages([]); }
  };

  const openRoom = async (room) => {
    setChatMode('room'); setActiveRoom(room); setDmUser(null); setMessages([]); setTypingText('');
    socket.emit('room:switch', { room: room.name });
    try {
      const d = await fetch(`${API}/rooms/${room._id}/messages`).then(r => r.json());
      setMessages(d.map(m => ({ id: m._id, username: m.username, text: m.text, timestamp: m.createdAt })));
    } catch {}
    if (isMobile) setMobileShowChat(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const openDM = async (target) => {
    setChatMode('dm'); setDmUser(target); setActiveRoom(null); setMessages([]); setTypingText('');
    setDmNotifs(p => ({ ...p, [target]: 0 }));
    setSearchQ(''); setSearchResults([]);
    try {
      const d = await fetch(`${API}/users/dm/${user.username}/${target}`).then(r => r.json());
      setMessages(d.map(m => ({ id: m._id, username: m.username, text: m.text, timestamp: m.createdAt })));
    } catch {}
    if (isMobile) setMobileShowChat(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const createRoom = async () => {
    setRoomError('');
    if (!newRoomName.trim()) return setRoomError('Room name required');
    try {
      const res  = await fetch(`${API}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newRoomName.trim(), description: newRoomDesc.trim(), createdBy: user.username }) });
      const data = await res.json();
      if (!res.ok) return setRoomError(data.error);
      setRooms(await fetch(`${API}/rooms`).then(r => r.json()));
      setShowCreateRoom(false); setNewRoomName(''); setNewRoomDesc('');
      openRoom(data);
    } catch { setRoomError('Failed to create room'); }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      chatMode === 'dm' ? socket.emit('dm:typing:start', { to: dmUser }) : socket.emit('typing:start');
    }
    clearTimeout(stopRef.current);
    stopRef.current = setTimeout(() => {
      isTypingRef.current = false;
      chatMode === 'dm' ? socket.emit('dm:typing:stop', { to: dmUser }) : socket.emit('typing:stop');
    }, 1000);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    clearTimeout(stopRef.current);
    isTypingRef.current = false;
    if (chatMode === 'dm') { socket.emit('dm:send', { text: trimmed, to: dmUser }); socket.emit('dm:typing:stop', { to: dmUser }); }
    else if (activeRoom)   { socket.emit('message:send', { text: trimmed, room: activeRoom.name }); socket.emit('typing:stop'); }
    setText('');
  };

  const chatTitle   = chatMode === 'dm' ? dmUser : activeRoom?.name;
  const isOnline    = chatMode === 'dm' ? !!onlineMap[dmUser] : false;
  const memberCount = chatMode === 'room' && activeRoom ? (activeRoom.liveCount ?? activeRoom.members?.length ?? 0) : null;
  const chatSub     = typingText || (chatMode === 'dm' ? (isOnline ? 'Online' : (lastSeenMap[dmUser] ? `Last seen ${timeAgo(lastSeenMap[dmUser])}` : 'Offline')) : memberCount !== null ? `${memberCount} member${memberCount !== 1 ? 's' : ''}` : '');

  const roomItems = rooms.map(r => ({ type: 'room', id: r._id, key: `room-${r._id}`, name: r.name, last: lastMsgs[r._id] || r.description || 'No messages yet', notif: 0, online: false, isMember: r.members?.includes(user.username), raw: r }));
  const dmItems   = allUsers.map(u => ({ type: 'dm', id: u.username, key: `dm-${u.username}`, name: u.username, last: lastMsgs[u.username] || '', notif: dmNotifs[u.username] || 0, online: !!onlineMap[u.username], isMember: true, raw: u }));

  let listItems = [...roomItems, ...dmItems];
  if (filter === 'unread') listItems = listItems.filter(i => i.notif > 0);
  if (searchQ) {
    const q = searchQ.toLowerCase();
    listItems = [
      ...roomItems.filter(i => i.name.toLowerCase().includes(q)),
      ...(searchResults.length ? searchResults.map(u => ({ type: 'dm', id: u.username, key: `sr-${u.username}`, name: u.username, last: '', notif: 0, online: !!onlineMap[u.username], isMember: true, raw: u }))
        : dmItems.filter(i => i.name.toLowerCase().includes(q))),
    ];
  }

  const showSidebar = !isMobile || !mobileShowChat;
  const showChat    = !isMobile || mobileShowChat;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: dk.chatBg, fontFamily: "'Segoe UI', Helvetica, sans-serif" }}>

      {/* ── Settings overlay ── */}
      {railTab === 'settings' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <SettingsPanel user={user} onLogout={onLogout} toggleTheme={toggleTheme} theme={theme} onClose={() => setRailTab('chats')} />
        </div>
      )}

      {/* ════════ COL 1 — RAIL ════════ */}
      {showSidebar && (
        <div style={{ width: 60, background: dk.rail, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 4, borderRight: `1px solid ${dk.divider}`, flexShrink: 0 }}>
          <div style={{ fontSize: 26, marginBottom: 16 }}>💬</div>
          {[{ id:'chats', icon:'🗨️', label:'Chats' }, { id:'people', icon:'👥', label:'People' }, { id:'status', icon:'⭕', label:'Status' }, { id:'calls', icon:'📞', label:'Calls' }].map(b => (
            <RailBtn key={b.id} icon={b.icon} label={b.label} active={railTab === b.id} onClick={() => setRailTab(b.id)} />
          ))}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            <RailBtn icon={theme === 'dark' ? '☀️' : '🌙'} label="Theme" active={false} onClick={toggleTheme} />
            <RailBtn icon="⚙️" label="Settings" active={railTab === 'settings'} onClick={() => setRailTab('settings')} />
            <div style={{ marginTop: 4, cursor: 'pointer' }} title={user.username}><Av name={user.username} size={36} /></div>
          </div>
        </div>
      )}

      {/* ════════ COL 2 — CHAT LIST ════════ */}
      {showSidebar && (
        <div style={{ width: isMobile ? '100%' : 360, background: dk.sidebar, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${dk.divider}`, flexShrink: 0, overflow: 'hidden' }}>

          {/* Panel header */}
          <div style={{ padding: '14px 16px 10px', background: dk.sideHead, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: dk.text }}>{railTab === 'people' ? 'People' : railTab === 'status' ? 'Status' : railTab === 'calls' ? 'Calls' : 'Chats'}</span>
              {railTab === 'chats' && <button onClick={() => setShowCreateRoom(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dk.accent, fontSize: 13, fontWeight: 600 }}>+ Room</button>}
            </div>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: dk.search, borderRadius: 8, padding: '8px 14px' }}>
              <span style={{ color: dk.sub, fontSize: 15 }}>🔍</span>
              <input
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: dk.text, fontSize: 14 }}
                placeholder={railTab === 'people' ? 'Search users…' : 'Search or start new chat'}
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
              {searchQ && <span onClick={() => { setSearchQ(''); setSearchResults([]); }} style={{ color: dk.sub, cursor: 'pointer', fontSize: 16 }}>✕</span>}
            </div>

            {/* Filters */}
            {railTab === 'chats' && !searchQ && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {['all','unread'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: filter === f ? dk.accent : dk.search, color: filter === f ? '#fff' : dk.sub, transition: 'all 0.15s' }}>
                    {f[0].toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {railTab === 'people' && (
              <>
                <SectionLabel text={searchQ ? 'SEARCH RESULTS' : 'ALL USERS'} />
                {(searchQ ? searchResults : allUsers).length === 0 && <Empty text={searchQ ? `No users for "${searchQ}"` : 'No other users yet'} />}
                {(searchQ ? searchResults : allUsers).map(u => (
                  <ChatRow key={u.username} avatar={<Av name={u.username} size={46} online={!!onlineMap[u.username]} />}
                    name={u.username} last={onlineMap[u.username] ? '🟢 Online' : 'Offline'} time="" notif={0}
                    active={chatMode === 'dm' && dmUser === u.username}
                    onClick={() => { openDM(u.username); setRailTab('chats'); }} />
                ))}
              </>
            )}

            {railTab === 'status' && <Empty text="Status feature coming soon" icon="⭕" />}
            {railTab === 'calls'  && <Empty text="Calls feature coming soon"  icon="📞" />}

            {railTab === 'chats' && (
              <>
                {listItems.length === 0 && <Empty text={filter === 'unread' ? 'No unread chats' : searchQ ? `No results for "${searchQ}"` : 'No chats yet — create a room or search for users'} />}
                {listItems.map(item => {
                  const isActive = (item.type === 'room' && chatMode === 'room' && activeRoom?._id === item.id) || (item.type === 'dm' && chatMode === 'dm' && dmUser === item.id);
                  return (
                    <ChatRow key={item.key}
                      avatar={item.type === 'room' ? <RoomAv name={item.name} /> : <Av name={item.name} size={46} online={item.online} />}
                      name={item.name}
                      last={item.last}
                      time=""
                      notif={item.notif}
                      active={isActive}
                      tag={item.type === 'room' && !item.isMember ? 'Join' : ''}
                      onClick={() => item.type === 'room' ? (item.isMember ? openRoom(item.raw) : joinRoom(item.raw)) : openDM(item.name)}
                      extra={item.type === 'room' && item.isMember && (
                        <button onClick={e => { e.stopPropagation(); leaveRoom(item.raw); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>Leave</button>
                      )}
                    />
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════ COL 3 — CHAT WINDOW ════════ */}
      {showChat && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: dk.chatBg, minWidth: 0, position: 'relative' }}>

          {/* Subtle background pattern */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`, pointerEvents: 'none' }} />

          {!chatMode ? (
            /* Empty state */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, position: 'relative', textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 90 }}>💬</div>
              <div style={{ fontSize: 30, fontWeight: 300, color: dk.text }}>ChatApp Web</div>
              <div style={{ fontSize: 14, color: dk.sub, lineHeight: 1.8, maxWidth: 360 }}>
                Send and receive messages without keeping your phone online.<br />
                Select a chat or create a room to get started.
              </div>
              <div style={{ padding: '6px 18px', border: `1px solid ${dk.divider}`, borderRadius: 20, color: dk.sub, fontSize: 13, marginTop: 8 }}>
                🔒 End-to-end encrypted
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: dk.sideHead, borderBottom: `1px solid ${dk.divider}`, flexShrink: 0, minHeight: 60, zIndex: 1 }}>
                {isMobile && <button onClick={() => setMobileShowChat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dk.sub, fontSize: 22, padding: 0, marginRight: 4 }}>←</button>}
                {chatMode === 'dm' ? <Av name={dmUser} size={40} online={isOnline} /> : <RoomAv name={chatTitle} size={40} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chatTitle}</div>
                  <div style={{ fontSize: 12, color: typingText ? dk.accent : dk.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chatSub || '\u00a0'}</div>
                </div>
                {chatMode === 'room' && activeRoom && (
                  <button onClick={() => leaveRoom(activeRoom)} style={{ background: 'none', border: `1px solid #ef4444`, borderRadius: 6, cursor: 'pointer', color: '#ef4444', fontSize: 12, fontWeight: 600, padding: '4px 10px', flexShrink: 0 }}>Leave</button>
                )}
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: dk.sub, fontSize: 20 }}>⋮</button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 6%', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
                {messages.length === 0 && (
                  <div style={{ margin: 'auto', textAlign: 'center', color: dk.sub }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>{chatMode === 'dm' ? '👋' : '💬'}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.7 }}>{chatMode === 'dm' ? `Say hi to ${dmUser}!` : `Welcome to ${chatTitle}!`}</div>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isOwn    = msg.username === user.username;
                  const prev     = messages[i - 1];
                  const next     = messages[i + 1];
                  const showName = !isOwn && chatMode === 'room' && (!prev || prev.username !== msg.username);
                  const isLast   = !next || next.username !== msg.username;
                  return (
                    <div key={msg.id || i} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: isLast ? 6 : 1, alignItems: 'flex-end', gap: 6 }}>
                      {!isOwn && chatMode === 'room' && (
                        <div style={{ width: 28, flexShrink: 0 }}>{isLast && <Av name={msg.username} size={26} />}</div>
                      )}
                      <div style={{ maxWidth: '65%', background: isOwn ? dk.bubbleOut : dk.bubbleIn, borderRadius: isOwn ? (isLast ? '12px 2px 12px 12px' : '12px') : (isLast ? '2px 12px 12px 12px' : '12px'), padding: '7px 10px 5px', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
                        {showName && <div style={{ color: nameColor(msg.username), fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{msg.username}</div>}
                        <span style={{ color: dk.text, fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</span>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <span style={{ fontSize: 11, color: isOwn ? '#a9c7be' : dk.sub }}>{fmtTime(msg.timestamp)}</span>
                          {isOwn && <span style={{ fontSize: 13, color: dk.accent }}>✓✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: dk.inputArea, borderTop: `1px solid ${dk.divider}`, flexShrink: 0 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: dk.inputBox, borderRadius: 24, padding: '10px 18px', gap: 10 }}>
                  <input
                    ref={inputRef}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: dk.text, fontSize: 15 }}
                    placeholder="Type a message"
                    value={text}
                    onChange={handleChange}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    autoFocus
                  />
                </div>
                <button onClick={handleSend} disabled={!text.trim()} style={{ width: 46, height: 46, borderRadius: '50%', border: 'none', background: text.trim() ? dk.accent : dk.search, color: text.trim() ? '#fff' : dk.sub, cursor: text.trim() ? 'pointer' : 'default', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}>
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 380, background: dk.sideHead, borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700, color: dk.text }}>Create a Room</h3>
            <input style={{ width: '100%', padding: '11px 14px', background: dk.search, border: `1px solid ${dk.divider}`, borderRadius: 8, color: dk.text, fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} placeholder="Room name *" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createRoom()} />
            <input style={{ width: '100%', padding: '11px 14px', background: dk.search, border: `1px solid ${dk.divider}`, borderRadius: 8, color: dk.text, fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} placeholder="Description (optional)" value={newRoomDesc} onChange={e => setNewRoomDesc(e.target.value)} />
            {roomError && <p style={{ margin: '0 0 10px', color: '#ef4444', fontSize: 13 }}>{roomError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowCreateRoom(false); setRoomError(''); }} style={{ flex: 1, padding: '11px 0', background: 'transparent', border: `1px solid ${dk.divider}`, borderRadius: 8, color: dk.sub, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={createRoom} style={{ flex: 1, padding: '11px 0', background: dk.accent, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomAv({ name, size = 46 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: dk.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size > 40 ? 18 : 14, flexShrink: 0 }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

function ChatRow({ avatar, name, last, time, notif, active, onClick, extra, tag }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', background: active ? dk.active : hov ? dk.hover : 'transparent', borderBottom: `1px solid ${dk.divider}`, transition: 'background 0.1s' }}>
      {avatar}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontWeight: 500, fontSize: 15, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          <span style={{ fontSize: 11, color: notif > 0 ? dk.accent : dk.sub, flexShrink: 0, marginLeft: 8 }}>{time}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: dk.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{last || '\u00a0'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
            {notif > 0 && <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: dk.unread, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{notif}</div>}
            {tag && <div style={{ padding: '2px 8px', borderRadius: 10, background: 'rgba(0,168,132,0.15)', color: dk.accent, fontSize: 11, fontWeight: 600 }}>{tag}</div>}
          </div>
        </div>
      </div>
      {extra}
    </div>
  );
}

function SectionLabel({ text }) {
  return <div style={{ padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: dk.sub }}>{text}</div>;
}

function Empty({ text, icon = '💬' }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: dk.sub }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}