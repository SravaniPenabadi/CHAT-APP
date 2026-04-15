// ─────────────────────────────────────────
// MessageList.jsx — Renders all chat messages
// ─────────────────────────────────────────

import { useEffect, useRef } from 'react';

// Receives the `messages` array from parent (App)
// Each message: { id, username, text, timestamp }
export default function MessageList({ messages, currentId }) {
  const bottomRef = useRef(null);

  // Auto-scroll to latest message whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return <p style={styles.empty}>No messages yet. Say something!</p>;
  }

  return (
    <div style={styles.list}>
      {messages.map((msg, index) => {
        // Check if this message was sent by the current user
        const isOwn = msg.id === currentId;

        return (
          <div
            key={`${msg.id}-${index}`}
            style={{
              ...styles.message,
              alignSelf: isOwn ? 'flex-end' : 'flex-start',
              background: isOwn ? '#dcf8c6' : '#f1f0f0',
            }}
          >
            {/* Show username only for others' messages */}
            {!isOwn && (
              <span style={styles.username}>{msg.username}</span>
            )}
            <p style={styles.text}>{msg.text}</p>
            <span style={styles.time}>
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        );
      })}

      {/* Invisible div at bottom — scrolled into view on new message */}
      <div ref={bottomRef} />
    </div>
  );
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    overflowY: 'auto',
    flex: 1,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: '40px',
  },
  message: {
    maxWidth: '70%',
    padding: '8px 12px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  username: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#555',
  },
  text: {
    margin: 0,
    fontSize: '14px',
  },
  time: {
    fontSize: '10px',
    color: '#888',
    alignSelf: 'flex-end',
  },
};
