# E2EE Chatroom

End-to-end encrypted web-based chatroom using PGP protocol.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd e2ee-chatroom

# Install dependencies for both client and server
npm install
cd client && npm install
cd ../server && npm install
```

### Development

Run both client and server simultaneously:

```bash
# From root directory
npm run dev
```

Or run individually:

```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

- Client runs on http://localhost:3000
- Server runs on http://localhost:5000

### Build for Production

```bash
# Build both client and server
npm run build

# Start production server
cd server && npm start
```

## Project Structure

```
e2ee-chatroom/
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # Business logic services
│   │   ├── stores/      # Zustand state management
│   │   └── utils/       # Utility functions
│   └── package.json
├── server/              # Node.js + Express backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── models/      # Data models
│   │   ├── middleware/  # Express middleware
│   │   ├── socket/      # Socket.io handlers
│   │   └── utils/       # Utility functions
│   └── package.json
└── package.json         # Root workspace configuration
```

## Features

- 🔐 **End-to-end encryption** using OpenPGP
- 💬 **1-on-1 private messaging**
- 👥 **Group chat** with hybrid encryption
- 📁 **Encrypted file sharing**
- ✅ **WhatsApp-style key verification**
- ⚠️ **MITM detection** via key change alerts
- 🔑 **Client-side key storage** in IndexedDB
- 🛡️ **Password-protected private keys**

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- openpgp.js (encryption)
- Socket.io-client (real-time)

**Backend:**
- Node.js
- Express
- TypeScript
- Socket.io (WebSockets)
- JWT (authentication)
- bcryptjs (password hashing)

## Architecture

This application implements true end-to-end encryption:

- **All encryption/decryption happens in the browser**
- **Server is a "dumb relay"** - it only transports encrypted data
- **Server never sees:** plaintext messages, private keys, or decryption keys
- **Private keys stored only in browser's IndexedDB** (encrypted with user password)

## Documentation

See the `blueprint/` directory for detailed documentation:

- [Architecture](blueprint/architecture.md)
- [Database Schema](blueprint/database-schema.md)
- [Encryption Strategy](blueprint/encryption-strategy.md)
- [API Reference](blueprint/api-reference.md)
- [Component Structure](blueprint/component-structure.md)
- [Implementation Roadmap](blueprint/implementation-roadmap.md)
- [Security Guide](blueprint/security-guide.md)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both client and server in development mode |
| `npm run dev:client` | Run client only |
| `npm run dev:server` | Run server only |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint on both projects |

## Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=development
```

## Security

⚠️ **Important Security Notes:**

1. **Never commit** the JWT secret or any credentials to git
2. **Use strong passwords** - your private key is encrypted with your password
3. **Verify fingerprints** with contacts before trusting their keys
4. **The server cannot decrypt your messages** - but it knows who you talk to (metadata)

See [Security Guide](blueprint/security-guide.md) for detailed security information.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/e2ee-chatroom/issues).

---

**Built with security in mind.** 🔒
