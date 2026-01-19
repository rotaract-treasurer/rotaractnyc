# Community Hub Features Documentation

## Overview
The community hub has been fully implemented with a modular, real-time architecture supporting posts, comments, reactions, and multiple content types.

## Components

### 1. CommunityPostComposer (`app/portal/_components/CommunityPostComposer.tsx`)
**Purpose**: Allow members to create posts with text, images, and links.

**Features**:
- **Text Posts**: Simple text updates and announcements
- **Image Uploads**: 
  - Support for up to 4 images per post
  - 10MB file size limit per image
  - Image preview before posting
  - Ability to remove selected images
  - Firebase Storage integration: `community-posts/{userId}/{timestamp}-{filename}`
- **Link Attachments**: 
  - URL input field
  - Optional title and description
  - Creates `link` type posts
- **Optimistic UI**: Posts appear immediately with "Posting..." feedback
- **User Context**: Automatically includes author name, role, photo URL, and UID

**Usage**:
```tsx
<CreatePostComposer 
  user={user} 
  userData={userData} 
  onPostCreated={() => {}} 
/>
```

### 2. PostCard (`app/portal/_components/PostCard.tsx`)
**Purpose**: Display individual posts with full interaction capabilities.

**Features**:

#### Reactions System
- **Like/Unlike**: Click heart icon to like or unlike a post
- **Optimistic Updates**: UI updates immediately, then syncs with Firestore
- **Real-time Sync**: Uses `arrayUnion()` and `arrayRemove()` for atomic operations
- **Like Count**: Shows total number of likes
- **Visual Feedback**: Heart icon changes color when liked by current user

#### Comments System
- **Real-time Loading**: Uses `onSnapshot` to listen for new comments
- **Comment Display**: Shows author photo, name, timestamp, and comment text
- **Add Comments**: Input field with "Comment" button
- **Comment Likes**: Each comment can be liked/unliked independently
- **Server Timestamps**: All comments use `serverTimestamp()` for consistency
- **Comment Count**: Incremented atomically with `increment(1)`

#### Content Type Support
- **Text Posts**: Standard text content
- **Image Posts**: Grid layout supporting 1-4 images with hover effects
- **Link Posts**: Displays URL with optional preview (title, description, image)
- **Document Posts**: Shows PDF/file attachments with download option
- **Event Posts**: Displays event details (title, date, time, location)
- **Announcements**: Special gradient styling with celebration icon and "NEW" badge

#### UI Features
- Collapsible comments section (click "X Comments" to expand/collapse)
- Time ago formatting (e.g., "5m ago", "2h ago", "3d ago")
- Dark mode support throughout
- Hover animations and transitions
- Mobile-responsive design

**Usage**:
```tsx
<PostCard
  postId={post.id}
  author={post.author}
  timestamp={post.timestamp}
  content={post.content}
  likes={post.likes}
  commentsCount={post.commentsCount}
/>
```

### 3. CommunityFeed (`app/portal/_components/CommunityFeed.tsx`)
**Purpose**: Main container that orchestrates the community hub experience.

**Features**:
- **Real-time Updates**: Uses `onSnapshot` to automatically load new posts
- **Post Ordering**: Shows newest posts first (`orderBy('createdAt', 'desc')`)
- **Limit**: Loads last 50 posts for performance
- **Loading State**: Spinner animation while loading
- **Empty State**: Friendly message when no posts exist
- **Greeting**: Personalized greeting based on time of day and user name

**Architecture**:
```
CommunityFeed (Container)
├── Greeting Header
├── CommunityPostComposer (Post Creation)
└── PostCard[] (Real-time Post List)
    └── Comments Subcollection
```

## Data Structure

### Post Document (`communityPosts/{postId}`)
```typescript
{
  authorUid: string;          // Firebase Auth UID
  authorName: string;         // Display name
  authorRole: string;         // MEMBER, BOARD, TREASURER, ADMIN
  authorPhotoURL: string | null;
  title?: string;             // Optional post title
  body: string;               // Main post content
  type: 'text' | 'images' | 'link' | 'document' | 'event' | 'announcement';
  images?: string[];          // Array of Firebase Storage URLs
  link?: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
  };
  document?: {
    name: string;
    size: string;
    url: string;
  };
  event?: {
    id: string;
    title: string;
    date: string;
    time: string;
  };
  likes: string[];            // Array of UIDs who liked the post
  commentsCount: number;      // Total comments (incremented atomically)
  createdAt: Timestamp;       // Server timestamp
}
```

### Comment Document (`communityPosts/{postId}/comments/{commentId}`)
```typescript
{
  authorUid: string;
  authorName: string;
  authorPhotoURL: string | null;
  text: string;
  likes: string[];            // Array of UIDs who liked the comment
  createdAt: Timestamp;
}
```

## Security Rules

### Firestore Rules (`firestore.rules`)
```javascript
match /communityPosts/{postId} {
  // All members can read posts
  allow read: if isMember();
  
  // Members can create posts (must be author)
  allow create: if isMember() && request.resource.data.authorUid == request.auth.uid;
  
  // Members can update likes, authors can update their own posts
  allow update: if isMember() && (
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes'])
    || resource.data.authorUid == request.auth.uid
    || isAdmin()
  );
  
  // Authors and admins can delete posts
  allow delete: if resource.data.authorUid == request.auth.uid || isAdmin();
  
  // Comments subcollection
  match /comments/{commentId} {
    allow read: if isMember();
    allow create: if isMember() && request.resource.data.authorUid == request.auth.uid;
    allow update: if isMember() && (
      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes'])
      || resource.data.authorUid == request.auth.uid
      || isAdmin()
    );
    allow delete: if resource.data.authorUid == request.auth.uid || isAdmin();
  }
}
```

### Storage Rules (`storage.rules`)
```javascript
// Community post images
match /community-posts/{userId}/{fileName} {
  allow read: if isMember();
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

## User Flow

### Creating a Post
1. User types text in composer or clicks image/link buttons
2. For images: Select up to 4 files (max 10MB each)
3. Preview images with option to remove
4. Click "Post" button
5. Images upload to Firebase Storage (if any)
6. Post document created in Firestore
7. Optimistic UI shows post immediately
8. Real-time listener updates all connected clients

### Liking a Post
1. User clicks heart icon
2. Optimistic UI updates heart color and count
3. Firestore `arrayUnion()` adds UID to likes array
4. All clients receive update via `onSnapshot`

### Adding a Comment
1. User expands comments section
2. Types comment text
3. Clicks "Comment" button
4. Comment created in subcollection
5. Post's `commentsCount` incremented atomically
6. Real-time listener shows new comment to all users

### Real-time Updates
- All connected users see new posts instantly
- Like counts update in real-time across all sessions
- New comments appear immediately
- No page refresh required

## Implementation Details

### Optimistic UI Pattern
```typescript
// 1. Update UI immediately
setLiked(!isLiked);
setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

// 2. Update Firestore
await updateDoc(postRef, {
  likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
});

// 3. onSnapshot listener ensures consistency
```

### Real-time Listener Pattern
```typescript
const unsubscribe = onSnapshot(
  collection(db, 'communityPosts', postId, 'comments'),
  (snapshot) => {
    const loadedComments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setComments(loadedComments);
  }
);

// Cleanup on unmount
return () => unsubscribe();
```

## Future Enhancements

### Planned Features (Not Yet Implemented)
1. **Calendar Event Attachments**: "Add Event" button in composer
2. **Rich Link Previews**: Fetch metadata from URLs
3. **Announcement Creation**: Admin tool to create celebration posts
4. **Post Editing**: Allow users to edit their own posts
5. **Comment Replies**: Nested comment threads
6. **Emoji Reactions**: Beyond just likes (❤️ 👍 😂 etc.)
7. **Image Lightbox**: Full-screen image viewer
8. **Mentions**: @username notifications
9. **Hashtags**: #tag filtering
10. **Pin Posts**: Admins can pin important posts to top

### Performance Optimizations
- Pagination for older posts (load more)
- Image compression before upload
- Lazy loading for images
- Virtual scrolling for large feeds

## Testing Checklist

- [ ] Create text-only post
- [ ] Create post with 1 image
- [ ] Create post with 4 images
- [ ] Create post with link
- [ ] Like a post
- [ ] Unlike a post
- [ ] Add comment
- [ ] Like a comment
- [ ] Delete own post (author)
- [ ] Delete own comment (author)
- [ ] View post as non-author (can like, can't delete)
- [ ] Real-time updates across multiple browser tabs
- [ ] Mobile responsive layout
- [ ] Dark mode appearance

## Deployment Status

✅ **Deployed**:
- CommunityPostComposer component
- PostCard component with full reactions/comments
- CommunityFeed with real-time updates
- Firestore security rules for posts and comments
- Storage rules for community post images

🔄 **Pending**:
- Link preview metadata fetching
- Event attachment UI
- Announcement creation tool
- Additional reaction types

## Support

For questions or issues, contact:
- Technical Lead: treasurerrcun@gmail.com
- Deployment: Vercel (auto-deploy from main branch)
- Database: Firebase Console (rotaractnyc-ac453)
