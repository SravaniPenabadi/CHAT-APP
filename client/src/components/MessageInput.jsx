import { useState, useRef } from 'react';

export default function MessageInput({ onSend, disabled, typingUsers, socket }) {
  const [text, setText] = useState('');
  const isTyping = useRef(false);  // tracks if we already emitted typing:start
  const stopTimer = useRef(null);  // timer to detect when user stopped typing

  const handleChange = (e) => {
    setText(e.target.value);

    // Emit typing:start only once (not on every keystroke)
    if (!isTyping.current) {
      isTyping.current = true;
      socket.emit('typing:start');
    }

    // Reset the stop timer on every keystroke
    clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      isTyping.current = false;
      socket.emit('typing:stop');
    }, 1000); // stop after 1 second of no typing
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Stop typing indicator when message is sent
    clearTimeout(stopTimer.current);
    isTyping.current = false;
    socket.emit('typing:stop');

    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Build typing text: "sravani is typing..." or "sravani and navya are typing..."
  const typingText = typingUsers.length === 0 ? '' :
    typingUsers.length === 1 ? `${typingUsers[0]} is typing...` :
    `${typingUsers.join(' and ')} are typing...`;

  return (
    <div>
      {/* Typing indicator shown above input */}
      {typingText && (
        <div style={styles.typing}>{typingText}</div>
      )}
      <div style={styles.container}>
        <input
          style={styles.input}
          type="text"
          placeholder={disabled ? 'Joining...' : 'Type a message...'}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus
        />
        <button
          style={{
            ...styles.button,
            opacity: disabled || !text.trim() ? 0.5 : 1,
            cursor:  disabled || !text.trim() ? 'not-allowed' : 'pointer',
          }}
          onClick={handleSend}
          disabled={disabled || !text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  typing: {
    padding: '4px 16px',
    fontSize: '12px',
    color: '#888',
    fontStyle: 'italic',
    minHeight: '20px',
  },
  container: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    borderTop: '1px solid #ddd',
    background: '#fff',
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    outline: 'none',
  },
  button: {
    padding: '10px 20px',
    fontSize: '14px',
    background: '#0084ff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
  },
};