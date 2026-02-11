# Message Delivery Fix - Summary

## Problem
Messages were not being delivered to recipients. Users could send messages, but recipients never saw them in the UI.

## Root Causes

### Issue 1: Room joining
When a room was created, the server notified participants about the new room via `room:created` event, but it **did not automatically add participants' sockets to the room**. 

### Issue 2: Username not sent during authentication
When users authenticated, the client only sent `userId`, `token`, and `publicKey` but **not the username**. The server used a fallback `User-${userId.slice(0, 6)}` as the username.

### Issue 3: Room participants stored as username strings
When creating a room with "Bob", the client sent "Bob" as the participant ID. The server tried to look up this username but users were stored with names like "User-user-xxx" instead.

### Issue 4: Messages missing `isOwn` flag
Received messages didn't have the `isOwn` property, which determines bubble alignment (left/right) and styling.

### Issue 5: Duplicate messages
When the sender received their own message back via the broadcast, the store added it as a duplicate instead of updating the temporary message.

## Fixes Applied

### 1. Server: Auto-join participants to room on creation
**File:** `server/src/socket/handlers.ts`

Added code to automatically join all participants' sockets to the room when it's created:

```typescript
// Add all participants' sockets to the room and notify them
room.participants.forEach((pid) => {
  const user = users.get(pid);
  if (user) {
    // Add socket to the room so they receive messages immediately
    const userSocket = io.sockets.sockets.get(user.socketId);
    if (userSocket) {
      userSocket.join(roomId);
    }
    // Notify participant about the new room
    io.to(user.socketId).emit('room:created', room);
  }
});
```

### 2. Client: Include username in authentication
**File:** `client/src/services/chat.ts`

Added username to the authentication payload:

```typescript
this.socket?.emit('authenticate', {
  userId: user.id,
  username: user.username,  // ← This was missing!
  token,
  publicKey: user.publicKey,
});
```

### 3. Client: Add `isOwn` flag to received messages
**File:** `client/src/services/chat.ts`

```typescript
const { user } = useAuthStore.getState();
const isOwn = user ? message.senderId === user.id : false;

const messageWithOwnFlag = {
  ...message,
  isOwn,
  status: isOwn ? 'sent' : 'delivered',
};
```

### 4. Client: Fix duplicate message handling
**File:** `client/src/stores/chatStore.ts`

Changed `addMessage` to replace existing messages instead of adding duplicates:

```typescript
const existingIndex = roomMessages.findIndex((msg) => msg.id === message.id);
if (existingIndex >= 0) {
  // Update existing message instead of adding duplicate
  return { /* ... */ };
}
```

### 5. Server: Include full participant data in room objects
**File:** `server/src/socket/handlers.ts`

Added `transformRoomForClient` function to populate participants with full User objects including `publicKey`:

```typescript
function transformRoomForClient(room: Room) {
  return {
    ...room,
    participants: room.participants.map(pid => {
      const user = users.get(pid);
      if (user) {
        return {
          id: user.id,
          username: user.username,
          publicKey: user.publicKey,
          isOnline: user.isOnline,
        };
      }
      // Fallback...
    }),
  };
}
```

### 6. Server: Resolve usernames to user IDs in room creation
**File:** `server/src/socket/handlers.ts`

When a room is created with usernames, resolve them to user IDs:

```typescript
const resolvedParticipantIds = participantIds.map(pid => {
  if (users.has(pid)) return pid;  // Already a userId
  const userByName = Array.from(users.values()).find(u => u.username === pid);
  if (userByName) return userByName.id;  // Resolve username to userId
  return pid;  // Keep as-is if not found
});
```

## Testing Steps

1. **Start the server:**
   ```bash
   cd server && npm run dev
   ```

2. **Start the client:**
   ```bash
   cd client && npm run dev
   ```

3. **Open http://localhost:3000 in two browser windows (or incognito)**

4. **In Window 1:**
   - Register/login as "Alice" with a password

5. **In Window 2:**
   - Register/login as "Bob" with a password

6. **In Window 1 (Alice):**
   - Click the "+" button to start a new chat
   - Enter "Bob" as the username
   - Click "Start Chat"

7. **In Window 2 (Bob):**
   - You should see a room with "Alice" appear in the sidebar
   - Click on it to open the chat

8. **In Window 1 (Alice):**
   - Send a message to Bob

9. **In Window 2 (Bob):**
   - You should see Alice's message appear immediately!
   - Reply to test bidirectional messaging

## Debug Logs

Watch the browser console (F12 → Console) and server terminal for debug messages:

**Server logs:**
```
[SERVER] User authenticated: Alice (user-xxx)
[SERVER] Creating room: room-xxx, requested participants: ['Bob']
[SERVER] Resolved username 'Bob' to userId 'user-bob-xxx'
[SERVER] Room created with participants: ['user-alice-xxx', 'user-bob-xxx']
[SERVER] Broadcasting to room room-xxx, sockets in room: ['socket-id-1', 'socket-id-2']
```

**Client logs:**
```
[CLIENT] Authenticating user: Alice with publicKey: present
[CLIENT] Received room:created event: {id: 'room-xxx', ...}
[CLIENT] Received message:new: {roomId: 'room-xxx', message: {...}}
[CLIENT] Message isOwn: false
[CLIENT] Adding message to store for room: room-xxx
```

## Known Limitations

1. **User Discovery:** Currently uses username for lookups. In production, you'd need a proper user directory.

2. **Key Verification:** No UI for verifying fingerprints (WhatsApp-style safety numbers) yet.

3. **Offline Messages:** Messages sent while recipient is offline are not queued or stored.

4. **Encryption Fallback:** If public keys aren't available, messages send unencrypted. This should be improved.

## Next Steps

- ✅ Test bidirectional messaging
- ✅ Verify encryption/decryption works
- ✅ Check message persistence across page refreshes
- Implement proper user registration/login (currently always registers new)
- Add message history/pagination
- Implement group chat encryption

---
