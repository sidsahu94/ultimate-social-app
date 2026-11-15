# SOCIALVERSE ∞ — MASTER AI PROJECT CONTEXT & ARCHITECTURAL BLUEPRINT
> **Document Purpose**: This single file provides a complete, exhaustive, and self-contained technical specification of the entire **SocialVerse ∞** codebase. Any AI assistant (Claude, ChatGPT, Gemini, etc.) reading this document will have complete context of the application's architecture, database schemas, API routes, frontend pages, real-time engines, security model, and deployment configurations to answer any technical question, build new features, or debug existing components.

---

## 1. AI INGESTION & PROMPT DIRECTIVE

```markdown
SYSTEM CONTEXT FOR AI ASSISTANT:
You are the Lead Software Architect and Core Maintainer of SocialVerse ∞.
When the user asks you anything related to this internal project:
1. Base your answers on the architecture, conventions, and implementations detailed in this blueprint.
2. Maintain brand consistency: The platform is "SocialVerse ∞ — Beyond Social".
3. Maintain Founder Identity: Founder & Chief Architect is Sidhanta Sahu (@sidsahu / sidhantas786@gmail.com).
4. Maintain Security Invariants: Administrative capabilities, enclave tools, and founder profiles are strictly guarded by dual-layer hardware enclave protection.
5. Code Stack: Use JavaScript / JSX (React 18 + Node.js 22 + Express 4 + Mongoose 8). Do NOT introduce TypeScript unless explicitly asked.
```

---

## 2. SYSTEM TOPOLOGY & PROJECT IDENTITY

- **Platform Name**: SocialVerse ∞ — Beyond Social
- **Version**: `v5.1.0-PROD`
- **Founder & Chief Architect**: Sidhanta Sahu (`@sidsahu`, `sidhantas786@gmail.com`)
- **Git Repository**: `https://github.com/sidsahu94/ultimate-social-app.git` (branch `main`)
- **Live Frontend**: `https://ultimate-social-app.vercel.app` (Vercel Edge Network)
- **Live Backend**: `https://ultimate-social-app.onrender.com` (Render Web Service `srv-d5offhnpm1nc73914org`)
- **Database**: MongoDB Atlas Replica Set (AWS Mumbai `ap-south-1`, Cluster `ac-rp5wdv0-shard-00-01.8fcmyqk.mongodb.net`, Database `ultimate_social`)
- **Media CDN**: Cloudinary Media Storage (`res.cloudinary.com`)
- **Cache/Socket Adapter**: Redis (Optional / Fallback in-memory map)

```
[Client Devices: Mobile / Desktop / PWA]
                 │
                 ▼ (HTTPS / WSS)
    [Vercel Edge Gateway & CDN]
       ├─ Static Assets & Cached Bundles (dist/*)
       └─ Reverse Proxy (/api/*, /socket.io/*)
                 │
                 ▼
     [Render Node.js 22 Web Service]
       ├─ Express 4 REST API Gateway (/api/v1/*)
       ├─ Socket.io 4 Real-Time Hub (Signaling, Lounge, Chat)
       ├─ Security WAF (Helmet, MongoSanitize, RateLimiters)
       └─ Hardware Enclave Auth Guard (Founder Lock)
                 │
        ┌────────┴────────┐
        ▼                 ▼
[MongoDB Atlas]     [Cloudinary CDN]
 (23 Collections)    (Images / Reels)
```

---

## 3. FULL DIRECTORY & COMPONENT MAP

```
UltimateSocialMedia/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB Atlas Mongoose connection & pool config
│   │   ├── env.js                # Environment variable reader with defaults
│   │   ├── envValidator.js       # Zod schema validation for process.env
│   │   └── redis.js              # Redis client with graceful memory fallback
│   ├── controllers/              # 31 Express route controllers
│   │   ├── adminController.js    # Founder metrics, coin minting, verification, bans
│   │   ├── authController.js     # Register, OTP verify, login, refresh, biometric
│   │   ├── callsController.js    # WebRTC call initialization, signaling, termination
│   │   ├── chatController.js     # 1-on-1 and group chat rooms & messages
│   │   ├── commentsController.js # Nested comments, comment likes
│   │   ├── eventsController.js   # Community events, ticketing, RSVP
│   │   ├── gamesController.js    # Arcade scores, Cyber Snake, 2048, leaderboards
│   │   ├── liveController.js     # WebRTC live broadcast rooms & spectator channels
│   │   ├── marketplaceController.js # Shop items, listings, orders, creator market
│   │   ├── notificationsController.js # Real-time & Web Push notification engine
│   │   ├── postsController.js    # Feed, media uploads, AI compose, bookmarking
│   │   ├── reelsController.js    # 9:16 vertical short-form video streaming
│   │   ├── usersController.js    # User profiles, follow graph, passkeys, search
│   │   └── walletController.js   # Coin balance, tips, transfers, transaction ledger
│   ├── middleware/
│   │   ├── authMiddleware.js     # protect, optionalAuth, restrictTo('admin')
│   │   ├── errorHandler.js       # Global 5xx / 4xx JSON error formatting
│   │   └── requestLogger.js      # Structured HTTP request auditing
│   ├── models/                   # 23 Mongoose Schemas (Detailed in Section 4)
│   ├── routes/                   # 31 Express router modules
│   ├── services/
│   │   ├── authService.js        # Token signing & password comparisons
│   │   ├── mediasoup.js          # SFU WebRTC routing
│   │   └── socketService.js      # Real-time event dispatching & room state
│   ├── utils/
│   │   ├── AppError.js           # Custom operational error class
│   │   ├── logger.js             # Winston logger configuration
│   │   └── push.js               # Web Push VAPID configuration & auto-generator
│   └── server.js                 # Primary Express app, HTTP server, and Socket.io setup
│
├── frontend/
│   ├── public/
│   │   ├── favicon.ico           # Multi-resolution ICO (16x16 to 256x256)
│   │   ├── icon-192.png          # 192x192 PNG for PWA & Android
│   │   ├── icon-512.png          # 512x512 PNG for high-DPI splash & OS taskbar
│   │   ├── apple-touch-icon.png  # 180x180 PNG for iOS home screen
│   │   ├── manifest.json         # PWA Web Manifest (v2.0 standalone)
│   │   ├── ringtone.mp3          # WebRTC incoming call audio chime
│   │   └── socialverse-logo.jpg  # 3D Infinity Ribbon master brand logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/             # LoginCard, RegisterCard, AuthModals
│   │   │   ├── chat/             # ChatBox, MessageBubble, AudioRecorder
│   │   │   ├── common/           # AdminRoute, ProtectedRoute, InstallAppModal, AdminCyberGateway
│   │   │   ├── layouts/          # Navbar, Sidebar, MobileFooterNav, HeaderTopBar
│   │   │   ├── posts/            # PostCard, CreatePostModal, CommentsModal, PostModal
│   │   │   ├── profile/          # ProfileEditModal, FollowButton, MyQR, ScanQR
│   │   │   ├── reels/            # ReelCard, ReelViewer, ReelActions
│   │   │   └── ui/               # ToastProvider, UserAvatar, Spinner, Lightbox
│   │   ├── contexts/
│   │   │   ├── SocketContext.jsx # Socket.io connection provider & event dispatcher
│   │   │   ├── ThemeProvider.jsx # 12 Dynamic Luxury Themes with CSS variables
│   │   │   └── VideoContext.jsx  # Global video playback coordinator
│   │   ├── pages/                # 55 React Views (Detailed in Section 6)
│   │   ├── redux/
│   │   │   ├── slices/           # authSlice, chatSlice, postSlice, notificationSlice, userSlice
│   │   │   └── store.js          # Redux Toolkit root store
│   │   ├── services/
│   │   │   └── api.js            # Axios client with bearer token injection & auto-refresh
│   │   ├── App.jsx               # Main React router tree & modal orchestrator
│   │   └── main.jsx              # DOM root mount with Redux Provider & Service Worker registration
│   ├── index.html                # HTML5 Shell with meta tags, theme-color, and favicon links
│   └── vite.config.js            # Vite 5 + React + VitePWA build configuration
├── package.json                  # Root monorepo build scripts
└── vercel.json                   # Edge reverse proxy rewrites to Render backend
```

---

## 4. COMPLETE DATABASE SCHEMAS (ALL 23 MONGOOSE MODELS)

### 1. `User.js` (`users` collection)
- `name`: `String` (Required, trim, max 60)
- `email`: `String` (Required, unique, lowercase, index)
- `username`: `String` (Required, unique, lowercase, index)
- `password`: `String` (Required, select: false, bcrypt hashed)
- `role`: `String` (Enum: `['user', 'admin', 'moderator', 'banned']`, default: `'user'`)
- `avatar`: `String` (Default URL or uploaded Cloudinary path)
- `coverPhoto`: `String` (Default cover image URL)
- `bio`: `String` (Max 300)
- `website`: `String` (Max 200)
- `location`: `String` (Max 100)
- `isVerified`: `Boolean` (Default: false)
- `badges`: `[String]` (e.g. `'founder'`, `'architect'`, `'vip'`, `'verified'`)
- `wallet`:
  - `balance`: `Number` (Default: 0)
  - `totalReceived`: `Number` (Default: 0)
  - `totalSent`: `Number` (Default: 0)
- `walletPin`: `String` (Select: false, hashed 4-digit PIN)
- `following`: `[{ type: ObjectId, ref: 'User' }]`
- `followers`: `[{ type: ObjectId, ref: 'User' }]`
- `blockedUsers`: `[{ type: ObjectId, ref: 'User' }]`
- `privateProfile`: `Boolean` (Default: false)
- `streak`:
  - `count`: `Number` (Default: 1)
  - `lastActiveDate`: `Date`
  - `bestStreak`: `Number` (Default: 1)
- `dailyQuests`: `[{ id, title, reward, completed, claimed, progress, target }]`
- `passkeyCredentials`: `[{ credentialId, publicKey, counter, transports, createdAt }]`
- `profileCompletion`: `Number` (Default: 20, 0-100 calculated)
- `isDeleted`: `Boolean` (Default: false)
- **Indexes**: `{ email: 1 }` (unique), `{ username: 1 }` (unique)
- **Pre-save Hook**: Automatically hashes `password` with bcrypt 10 rounds if modified.
- **Methods**: `matchPassword(enteredPassword)` returns `Promise<Boolean>`.

### 2. `Post.js` (`posts` collection)
- `user`: `ObjectId` (Ref: `'User'`, Required, index)
- `group`: `ObjectId` (Ref: `'Group'`, Default: null, index)
- `content`: `String` (Max 5000, default: '')
- `caption`: `String` (Max 5000, default: '')
- `images`: `[String]` (Cloudinary image URLs)
- `videos`: `[String]` (Cloudinary video URLs)
- `hashtags`: `[String]` (Lowercase, index)
- `mentions`: `[{ type: ObjectId, ref: 'User' }]`
- `likes`: `[{ type: ObjectId, ref: 'User' }]`
- `likesCount`: `Number` (Default: 0)
- `commentsCount`: `Number` (Default: 0)
- `sharesCount`: `Number` (Default: 0)
- `score`: `Number` (Default: 0, algorithmic viral rank)
- `location`: `String`
- `link`: `String`
- `metadata`: `Mixed`
- **Virtuals**: `comments` (Ref: `'Comment'`, localField: `'_id'`, foreignField: `'post'`)
- **Indexes**: `{ hashtags: 1 }`, `{ createdAt: -1 }`, `{ user: 1, createdAt: -1 }`, `{ score: -1, createdAt: -1 }`

### 3. `Comment.js` (`comments` collection)
- `post`: `ObjectId` (Ref: `'Post'`, Required, index)
- `user`: `ObjectId` (Ref: `'User'`, Required)
- `content`: `String` (Required, trim, max 1000)
- `parentComment`: `ObjectId` (Ref: `'Comment'`, default: null, for nested replies)
- `likes`: `[{ type: ObjectId, ref: 'User' }]`
- `likesCount`: `Number` (Default: 0)
- **Indexes**: `{ post: 1, createdAt: -1 }`

### 4. `Reel.js` (`reels` collection)
- `user`: `ObjectId` (Ref: `'User'`, Required, index)
- `videoUrl`: `String` (Required, 9:16 vertical MP4/HLS)
- `thumbnailUrl`: `String`
- `caption`: `String` (Max 2200)
- `audioTrack`: `{ title: String, artist: String, audioUrl: String }`
- `hashtags`: `[String]`
- `likes`: `[{ type: ObjectId, ref: 'User' }]`
- `likesCount`: `Number` (Default: 0)
- `commentsCount`: `Number` (Default: 0)
- `viewsCount`: `Number` (Default: 0)
- **Indexes**: `{ createdAt: -1 }`, `{ user: 1, createdAt: -1 }`

### 5. `Story.js` (`stories` collection)
- `user`: `ObjectId` (Ref: `'User'`, Required, index)
- `mediaUrl`: `String` (Required)
- `mediaType`: `String` (Enum: `['image', 'video']`, default: `'image'`)
- `caption`: `String`
- `viewers`: `[{ user: { type: ObjectId, ref: 'User' }, viewedAt: Date }]`
- `expiresAt`: `Date` (TTL Index: 24 hours from creation)
- **Indexes**: `{ expiresAt: 1 }` (ExpireAfterSeconds: 0)

### 6. `Chat.js` & `Message.js` (`chats` & `messages` collections)
- **Chat**: `participants`: `[{ type: ObjectId, ref: 'User' }]`, `isGroup`: `Boolean`, `groupName`: `String`, `groupAvatar`: `String`, `lastMessage`: `ObjectId`, `updatedAt`: `Date`.
- **Message**: `chat`: `ObjectId` (Ref: `'Chat'`), `sender`: `ObjectId` (Ref: `'User'`), `content`: `String`, `media`: `String`, `mediaType`: `String` (`'image'|'audio'|'video'|'file'`), `readBy`: `[{ type: ObjectId, ref: 'User' }]`, `reactions`: `[{ user, emoji }]`.

### 7. `LiveStream.js` (`livestreams` collection)
- `host`: `ObjectId` (Ref: `'User'`, Required)
- `roomId`: `String` (Unique, index)
- `title`: `String`
- `isLive`: `Boolean` (Default: true)
- `viewerCount`: `Number` (Default: 0)
- `viewers`: `[{ type: ObjectId, ref: 'User' }]`
- `messages`: `[{ user, text, timestamp }]`

### 8. `Event.js` (`events` collection)
- `organizer`: `ObjectId` (Ref: `'User'`, Required)
- `title`: `String` (Required)
- `description`: `String`
- `coverImage`: `String`
- `startDate`: `Date` (Required)
- `endDate`: `Date`
- `location`: `String` (Physical address or "Virtual")
- `attendees`: `[{ type: ObjectId, ref: 'User' }]`
- `ticketPrice`: `Number` (Default: 0)

### 9. `Product.js` & `ShopItem.js` (`products` collection)
- `seller`: `ObjectId` (Ref: `'User'`, Required)
- `title`: `String` (Required)
- `description`: `String`
- `price`: `Number` (In creator coins or fiat)
- `images`: `[String]`
- `category`: `String` (Enum: `['digital', 'physical', 'art', 'membership']`)
- `inventory`: `Number` (Default: 1)
- `isAvailable`: `Boolean` (Default: true)

### 10. `Transaction.js` & `Payout.js`
- **Transaction**: `sender`: `ObjectId`, `recipient`: `ObjectId`, `amount`: `Number`, `type`: `['tip', 'transfer', 'mint', 'reward', 'purchase']`, `status`: `['completed', 'pending', 'failed']`, `referenceId`: `String`.
- **Payout**: `creator`: `ObjectId`, `amount`: `Number`, `currency`: `String`, `status`: `['pending', 'paid', 'rejected']`, `payoutMethod`: `String`.

### 11. `Report.js` & `ModerationReport.js`
- `reportedBy`: `ObjectId` (Ref: `'User'`)
- `targetUser`: `ObjectId` (Ref: `'User'`, optional)
- `targetPost`: `ObjectId` (Ref: `'Post'`, optional)
- `targetComment`: `ObjectId` (Ref: `'Comment'`, optional)
- `reason`: `String` (Required)
- `status`: `String` (Enum: `['open', 'resolved', 'dismissed']`, default: `'open'`)
- `resolvedAt`: `Date`

### 12. Other Supporting Models:
- `ActiveCall.js`: Tracks live peer-to-peer WebRTC video rooms.
- `FollowRequest.js`: Handles private account follow approval requests.
- `GameScore.js`: High scores for 2048, Cyber Snake, and Trivia.
- `Group.js`: Community clusters with admins, members, and custom rules.
- `Notification.js`: System notifications with `actor`, `recipient`, `type`, `read`, `data`.
- `PollVote.js`: User votes on interactive post polls.
- `Saved.js`: User bookmarks and collections.
- `Space.js`: Real-time audio rooms (Night Lounge).

---

## 5. COMPLETE API ROUTE CATALOG (ALL 31 MODULES)

All routes are mounted under both `/api/v1/*` and `/api/*`.

### 1. `/auth` (`backend/routes/auth.js`)
- `POST /register`: Creates account, hashes password, generates OTP.
- `POST /verify-otp`: Validates 6-digit OTP, marks `isVerified = true`.
- `POST /login`: Validates credentials, issues access JWT + HttpOnly refresh cookie.
- `POST /refresh`: Verifies refresh token, rotates tokens.
- `POST /forgot-password`: Generates secure password reset token.
- `POST /reset-password/:token`: Verifies token and sets new password.
- `POST /logout`: Clears auth cookie and revokes session.
- `POST /logout-all`: Revokes all active device sessions.

### 2. `/users` (`backend/routes/users.js`)
- `GET /me`: Returns currently authenticated user document.
- `GET /quests`: Returns daily gamification quests and completion status.
- `GET /blocked`: Lists accounts blocked by caller.
- `GET /search?q=`: Full-text search across username and name.
- `GET /suggestions`: Returns personalized follow recommendations.
- `GET /follow-requests`: Lists pending follow requests for private profiles.
- `GET /:id`: Resolves user by MongoDB `ObjectId` or `@username`.
- `PUT /:id`: Multipart profile update (name, bio, location, links, avatar, cover).
- `PUT /:id/follow`: Toggles following state on target user.
- `PUT /:id/block`: Blocks target user.
- `GET /:id/followers`: Returns array of follower user cards.
- `GET /:id/following`: Returns array of following user cards.
- `GET /passkey/register-options`: WebAuthn registration challenge generator.
- `POST /passkey/register-verify`: Cryptographically binds WebAuthn passkey.

### 3. `/admin` (`backend/routes/admin.js`) — *Founder Enclave Protected*
- `GET /stats`: Returns live user, post, and report counts + server RAM/heap telemetry.
- `POST /broadcast`: Dispatches platform-wide announcement via Socket.io.
- `POST /maintenance`: Toggles Emergency Platform Freeze across all clients.
- `GET /users?cursor=&limit=`: Paginated creator management directory.
- `PUT /users/:id/verify`: 1-Click toggle for verified checkmark and badges.
- `POST /users/:id/coins`: Founder Creator Coin Minting directly to wallet.
- `PUT /users/:id/ban`: Toggles account ban status.
- `DELETE /users/:id`: Permanently deletes account and associated data.
- `GET /posts`: Admin content inspection.
- `GET /reports?status=`: Filter open/resolved moderation reports.
- `PUT /reports/:id`: Resolves report (dismiss, delete_post, or ban_user).

### 4. `/posts` (`backend/routes/posts.js`)
- `GET /feed?page=&limit=`: Main algorithmic home feed.
- `POST /`: Multipart create post (caption, images, videos, hashtags).
- `GET /:id`: Single post view with populated user and comments.
- `DELETE /:id`: Delete post (Author or Admin only).
- `PUT /:id/like`: Toggles like on post.
- `POST /ai/compose`: AI-assisted creative post drafting and viral reel generator.

### 5. `/reels` (`backend/routes/reels.js`)
- `GET /?page=`: Vertical video stream with infinite scroll.
- `POST /`: Upload 9:16 vertical video reel with audio metadata.
- `PUT /:id/like`: Toggles like on reel.
- `POST /:id/view`: Increments reel view count.

### 6. `/comments` (`backend/routes/comments.js`)
- `GET /post/:postId`: Returns top-level comments and replies.
- `POST /post/:postId`: Submits new comment or reply.
- `PUT /:id/like`: Toggles like on comment.
- `DELETE /:id`: Removes comment (Author or Post Owner only).

### 7. `/wallet` (`backend/routes/wallet.js`)
- `GET /`: Returns creator coin balance, total received, and transactions.
- `POST /tip`: Send coins to creator on a post or reel.
- `POST /transfer`: P2P coin transfer by username.
- `POST /daily-bonus`: Claims daily login streak coin reward.

### 8. `/chat` & `/conversations` (`backend/routes/chat.js`)
- `GET /conversations`: Lists user's active DM channels.
- `GET /messages/:chatId`: Fetches paginated chat message history.
- `POST /messages`: Sends text or media attachment message.
- `DELETE /messages/:messageId`: Un-sends message.

### 9. `/live` (`backend/routes/live.js`)
- `GET /list`: Lists currently active live stream rooms.
- `POST /create`: Starts a new broadcast room and emits `live:started`.
- `POST /join/:roomId`: Joins viewer channel.
- `POST /end/:roomId`: Closes live broadcast.

### 10. Other Routes:
- `/stories`: Post story, view active 24h stories, record viewer.
- `/events`: Create event, RSVP, list community events.
- `/games`: Submit arcade scores, retrieve global leaderboards.
- `/market` & `/shop`: Browse products, buy with coins, list creator items.
- `/notifications`: Fetch user notifications, mark read, register push subscription.
- `/search`: Multi-entity search across users, posts, hashtags, products.
- `/spaces`: Join audio Night Lounge, mute/unmute, leave.
- `/calls`: WebRTC P2P video call signaling.
- `/payouts`: Creator payout requests and payout history.
- `/moderation`: Quick moderation stats and flagged queues.

---

## 6. FRONTEND ROUTING & PAGE INVENTORY (55 PAGES)

All routes defined in `frontend/src/App.jsx`:

### Public / Authentication Pages:
- `/welcome`: First-time user onboarding & interactive tour (`Onboarding.jsx`).
- `/login`: Luxury login screen with biometric gateway trigger (`Login.jsx`).
- `/register`: Account registration with username availability check (`Register.jsx`).
- `/forgot-password`: Password recovery request (`ForgotPassword.jsx`).
- `/reset-password`: Token password reset (`ResetPassword.jsx`).
- `/verify-account`: 6-digit OTP verification screen (`VerifyAccount.jsx`).

### Main App Shell (`MainLayout.jsx`):
- `/`: Algorithmic Feed with story tray, composer, and post cards (`Feed.jsx`).
- `/explore`: Luxury masonry explore grid with trending hashtags (`Explore.jsx`).
- `/search/advanced`: Deep filtered search by media type, tags, and creators (`SearchAdvanced.jsx`).
- `/reels`: Full-screen 9:16 vertical video reel player with auto-play (`ReelsPage.jsx`).
- `/tags/:tag`: Filtered tag feed (`TagFeed.jsx`).
- `/chat` & `/chat/:id`: Real-time instant messaging with voice notes (`ChatPage.jsx`).
- `/notifications`: Filtered real-time notification feed (`NotificationsPage.jsx`).
- `/saved`: Bookmarked posts and media collections (`Saved.jsx`).
- `/memories`: "On this day" historical retrospectives (`Memories.jsx`).
- `/groups`: Community groups and follow suggestions (`FollowSuggestions.jsx`).
- `/drafts`: Stored unfinished drafts (`DraftsPage.jsx`).
- `/profile` & `/profile/:id`: Luxury profile with highlights, media tabs, and QR (`ProfilePage.jsx`).
- `/post/:id`: Dedicated post permalink with comments (`PostPage.jsx`).
- `/shop` / `/marketplace`: Creator marketplace and digital store (`Marketplace.jsx`).
- `/events`: Community events, virtual meetups, ticketing (`EventsPage.jsx`).
- `/wallet`: Creator economy coin hub, transactions, daily rewards (`WalletPage.jsx`).
- `/games`: Retro arcade arena (Cyber Snake, 2048, Trivia) (`GamesPage.jsx`).
- `/analytics`: Creator telemetry, impressions, reach, engagement (`AnalyticsPage.jsx`).
- `/settings`: Security preferences, 2FA, passkeys, sessions (`SettingsPage.jsx`).
- `/report`: User safety, community guidelines, ticket submission (`SafetyPage.jsx`).
- `/apps/news`: Curated real-time global tech & culture newsfeed (`NewsPage.jsx`).
- `/apps/markets`: Live crypto & market price tracker (`MarketPage.jsx`).
- `/live` & `/live/studio` & `/live/watch/:roomId`: WebRTC live streaming (`LiveStudio.jsx`, `LiveWatch.jsx`).
- `/stories`: Full-screen Instagram/Snapchat-style story viewer (`StoriesPage.jsx`).
- `/feature-hub` / `/command-center`: Matrix of all platform features (`FeatureHub.jsx`).
- `/scheduled-posts`: Creator post scheduling calendar (`ScheduledPosts.jsx`).

### Protected Admin Routes (`AdminRoute.jsx` — Founder Only):
- `/admin/dashboard`: Founder Command Matrix with telemetry, user management, and coin minting (`AdminDashboard.jsx`).
- `/admin/payouts`: Creator financial disbursement ledger (`CreatorPayouts.jsx`).
- `/admin/moderation`: Moderation queue and flagged content manager (`ModerationDashboard.jsx`).

---

## 7. REAL-TIME ENGINE & SOCKET.IO ARCHITECTURE

Managed via `backend/services/socketService.js` and `frontend/src/contexts/SocketContext.jsx`.

### Key Socket Events:
| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `user:online` | Server -> All | `userId` | Broadcasts user presence. |
| `user:offline` | Server -> All | `userId` | Removes user presence. |
| `message:send` | Client -> Server | `{ chatId, content, media }` | Relays chat message. |
| `message:receive` | Server -> Client | `Message` entity | Real-time chat delivery. |
| `typing` | Both | `{ chatId, userId, isTyping }` | Ephemeral typing indicator. |
| `call:start` | Client -> Server | `{ toUserId, roomId, callerName }` | Triggers WebRTC incoming call modal. |
| `call:incoming` | Server -> Client | `{ roomId, from }` | Displays audio/video call ringtone. |
| `call:signal` | Both | `{ signal, to, from }` | WebRTC ICE candidate / SDP exchange. |
| `lounge:join` | Client -> Server | `None` | Joins global audio space. |
| `lounge:update` | Server -> All | `Array<User>` | Syncs speaking/muted state of room. |
| `wallet:update` | Server -> Client | `{ balance, delta, message }` | Real-time coin deposit notification. |
| `system:maintenance`| Server -> All | `{ active: Boolean }` | Triggers emergency platform freeze. |

---

## 8. SECURITY & CRYPTOGRAPHIC DESIGN

### 1. Dual-Layer Hardware Enclave
- The Founder account (`sidhantas786@gmail.com` / `@sidsahu`) cannot be deleted, banned, or modified by any external API.
- All admin endpoints verify the cryptographic JWT and enforce `founderEnclaveGuard`:
```javascript
const isFounder = (
  u.email === 'sidhantas786@gmail.com' ||
  u.email === 'admin@socialapp.com' ||
  u.username === 'sidsahu' ||
  u.role === 'admin'
);
if (!isFounder) return res.status(403).json({ message: 'Access Denied: Hardware Enclave Protection.' });
```
- The frontend features the **Cybernetic Admin Gateway** (`AdminCyberGateway.jsx`), invoked via `Ctrl + Shift + A` or the hidden shield trigger, supporting native WebAuthn biometric sensors and encrypted master passkeys.

### 2. Defense-in-Depth Middleware Stack
- **Helmet**: Content Security Policy (`scriptSrc: ['self']`, `connectSrc: ['self', 'ws:', 'wss:', '*.onrender.com', '*.vercel.app']`).
- **MongoSanitize**: Prevents NoSQL Operator Injection (`$gt`, `$ne`).
- **Rate Limiters**: Global API (1000/15m), Auth (60/15m), Uploads (50/15m).
- **CORS**: Strict origin whitelist allowing `.vercel.app`, `.onrender.com`, and local development with credentials.
- **Tokens**: Short-lived Access Token in headers + HttpOnly cookie storage for token renewal.

---

## 9. LUXURY THEME ENGINE (12 STYLES)

Configured in `frontend/src/contexts/ThemeProvider.jsx`:
1. **Deep Teal** (`#00F2FE` / `#0D9488`): Cinematic ocean glow.
2. **Obsidian Gold** (`#D4AF37` / `#F59E0B`): Royal luxury prestige.
3. **Midnight Sapphire** (`#38BDF8` / `#1D4ED8`): Deep space corporate blue.
4. **Cyberpunk Neon** (`#FF007F` / `#00F2FE`): High-voltage synthwave.
5. **Emerald Luxury** (`#10B981` / `#052E24`): Forest vault prestige.
6. **Amethyst Royal** (`#A855F7` / `#6B21A8`): Imperial purple velvet.
7. **Crimson Eclipse** (`#EF4444` / `#991B1B`): Dark ruby intensity.
8. **Rose Quartz** (`#F472B6` / `#DB2777`): Elegant soft blush.
9. **Solar Flare** (`#F97316` / `#EA580C`): High-energy solar burst.
10. **Aetheria Imperial Noir** (`#F3E8FF` / `#4C1D95`): Ultra-luxury hyper-contrast monochrome.
11. **Monochrome Slate** (`#94A3B8` / `#475569`): Minimalist industrial titanium.
12. **Bioluminescence** (`#2DD4BF` / `#0369A1`): Deep-ocean aquatic glow.

---

## 10. COMMON HOW-TO RECIPES FOR AI ASSISTANTS

### How to add a new API route:
1. Create controller method in `backend/controllers/<name>Controller.js` using `async (req, res, next)`.
2. Register route in `backend/routes/<name>.js` with appropriate middleware (`protect`, `restrictTo('admin')`).
3. Ensure the router is mounted in `backend/server.js` under `apiRouter.use('/<path>', <router>)`.

### How to add a new Page:
1. Create `frontend/src/pages/<category>/<PageName>.jsx`.
2. Add lazy import in `frontend/src/App.jsx`.
3. Wrap inside `<PageTransition>` and `<ProtectedRoute>` if authentication is required.
4. Add navigation link in `frontend/src/components/layouts/Navbar.jsx` or `Sidebar.jsx`.

### How to emit a Socket.io Event from a Controller:
```javascript
const io = req.app.get('io') || global.io;
if (io) {
  io.to(recipientUserId).emit('eventName', { data: payload });
}
```

---
*End of SocialVerse ∞ Master AI Context Blueprint. Maintained by Founder Sidhanta Sahu.*
