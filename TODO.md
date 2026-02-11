# E2EE Chatroom - Project TODO

## 🔴 High Priority (Next Session)

### Fix Sidebar UI
- [ ] Investigate and fix sidebar UI issues
- [ ] Improve responsiveness on smaller screens
- [ ] Fix any visual glitches or alignment problems
- [ ] Test sidebar with multiple rooms
- [ ] Ensure room list updates correctly when new rooms are added

### Authentication Flow
- [ ] Implement proper user registration vs login flow
- [ ] Add "Register" and "Login" toggle on auth screen
- [ ] Store user credentials properly
- [ ] Handle existing user on registration attempt
- [ ] Persist private keys securely (already in progress)

## 🟡 Medium Priority

### User Discovery
- [ ] Implement user search functionality
- [ ] Show online users list
- [ ] Display user status indicators
- [ ] Add user profile view with fingerprint

### Message Features
- [ ] Add message history/pagination
- [ ] Implement message editing
- [ ] Add message deletion
- [ ] Add read receipt handling
- [ ] Show typing indicators with timeouts

### Group Chat
- [ ] Implement group creation (multiple participants)
- [ ] Hybrid encryption for group messages
- [ ] Group member management
- [ ] Group name editing
- [ ] Admin/owner permissions

### Security & Encryption
- [ ] Add key verification UI (WhatsApp-style safety numbers)
- [ ] Display fingerprint matching warnings
- [ ] MITM detection via key change alerts
- [ ] Secure key export/import
- [ ] Implement key rotation

### File Sharing
- [ ] Add file attachment support
- [ ] Encrypt file contents before upload
- [ ] File size limits and validation
- [ ] Image preview in chat
- [ ] Download encrypted files

### Offline Support
- [ ] Queue messages when offline
- [ ] Sync messages on reconnection
- [ ] Show offline indicator in UI
- [ ] Store messages in IndexedDB

## 🟢 Low Priority

### UI/UX Improvements
- [ ] Add dark/light theme toggle
- [ ] Sound notifications for new messages
- [ ] Desktop notifications
- [ ] Message search within conversations
- [ ] Emoji picker
- [ ] Voice message support

### Advanced Features
- [ ] Message reactions (emoji responses)
- [ ] Message replies/threads
- [ ] Message forwarding
- [ ] Star/favorite messages
- [ ] Pin important messages

### Performance & Monitoring
- [ ] Add error tracking (Sentry, etc.)
- [ ] Performance metrics
- [ ] Connection quality indicators
- [ ] Message delivery analytics
- [ ] Storage usage warnings

### DevOps & Testing
- [ ] Add automated tests (unit, integration)
- [ ] E2E test coverage
- [ ] Load testing
- [ ] Security audit
- [ ] CI/CD pipeline setup

---

## Completed ✅

- [x] Fix message delivery issues
- [x] Auto-join participants to rooms on creation
- [x] Include username in authentication
- [x] Add `isOwn` flag to messages
- [x] Fix duplicate message handling
- [x] Transform rooms with full participant data
- [x] Add debug logging throughout
- [x] Basic E2EE encryption implementation

---

## Notes

### Known Issues
- None currently (session resolved all identified bugs)

### Technical Debt
- In-memory storage needs database replacement
- Username-based user lookup is temporary
- No proper session management
- Token-based auth needs validation

### Future Considerations
- Signal protocol for better E2EE
- Server-side user directory
- Backup/export encryption keys
- Multi-device support

---

**Last Updated:** 2026-02-06
