# Admin Posts Management - Multi-View Interface

This implementation provides three different views for managing blog posts in the Rotaract NYC admin panel:

## Views

### 1. **Table View** (`_components/TableView.tsx`)
A comprehensive table layout showing:
- Post title with excerpt preview
- Author information
- Category badges
- Publish date
- Status indicators (Published/Draft)
- Quick action buttons (Edit/Delete)
- Pagination footer

**Best for:** Quickly scanning large amounts of posts and seeing all metadata at once.

### 2. **Card View** (`_components/CardView.tsx`)
A modern card-based grid layout featuring:
- Visual post cards with gradient placeholders
- Status badges (Published/Draft)
- Category tags with color coding
- Author initials avatars
- Hover effects revealing edit/delete actions
- "Create New Post" card

**Best for:** Visual browsing and getting a quick overview of post content.

### 3. **Kanban View** (`_components/KanbanView.tsx`)
A workflow-based board with columns:
- **Ideas:** Posts without content (planning stage)
- **In Progress:** Unpublished posts with content
- **Under Review:** (Placeholder for future review workflow)
- **Published:** Live posts

**Best for:** Managing editorial workflow and tracking post progress.

## Features

### View Switching
- Toggle between views using the view switcher in the toolbar
- Three buttons with Material Symbols icons:
  - `format_list_bulleted` - Table View
  - `grid_view` - Card View
  - `view_kanban` - Kanban View
- Active view is highlighted with primary color

### Search & Filters
- Search bar for finding posts by title
- Category dropdown filter
- Filters apply across all views

### Actions
- **Edit:** Click on any post to edit
- **Delete:** Available in Table and Card views
- **Create New:** Multiple entry points depending on view

## Styling

### Color Coding
Categories are color-coded for quick identification:
- **Events:** Purple
- **News/Club News:** Blue/Primary
- **Community Service:** Teal/Green
- **Fundraising:** Orange
- **Social:** Pink
- **Professional Development:** Purple
- **Default:** Gray

### Status Indicators
- **Published:** Green dot + "Published" label
- **Draft:** Amber dot + "Draft" label
- **Scheduled:** Blue + "Scheduled" (future feature)

### Dark Mode
All views fully support dark mode with appropriate color adjustments.

## Technical Details

### State Management
- `viewMode` state controls which view is rendered
- Persists across page refreshes (can be enhanced with localStorage)
- Independent of post editing state

### Props Interface
Each view component accepts:
```typescript
{
  posts: Post[]           // Array of post data
  onEdit: (slug: string) => void   // Edit handler
  onDelete?: (slug: string) => void // Delete handler (optional)
  onCreate?: () => void    // Create new post handler (optional)
}
```

### Post Type
```typescript
type Post = {
  slug: string
  title: string
  date: string
  author: string
  category: string
  excerpt: string
  content: string[]
  published: boolean
}
```

## Usage

The main posts page (`page.tsx`) handles:
1. Data fetching and state management
2. View mode switching
3. Routing between list/edit/create modes
4. Integration with all three view components

## Future Enhancements

1. **Drag & Drop:** Enable dragging posts between Kanban columns
2. **Bulk Actions:** Select multiple posts for batch operations
3. **Advanced Filtering:** Filter by date range, author, status
4. **Search:** Full-text search across post content
5. **Review Workflow:** Implement actual review status tracking
6. **View Preferences:** Remember user's preferred view
7. **Export/Import:** CSV or JSON export of posts
8. **Analytics:** View counts and engagement metrics per post

## Design Credits

Inspired by modern admin dashboard designs featuring:
- Clean, minimal aesthetics
- Intuitive iconography (Material Symbols)
- Smooth transitions and hover effects
- Accessible color contrasts
- Responsive layouts
