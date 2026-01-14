# Component Architecture - Admin Posts Management

## File Structure

```
app/admin/posts/
├── page.tsx                    # Main posts management page
├── _components/
│   ├── TableView.tsx          # Table/list view component
│   ├── CardView.tsx           # Card grid view component
│   └── KanbanView.tsx         # Kanban board view component
├── README.md                   # Technical documentation
└── [other files...]

tailwind.config.js              # Added accent color
docs/
└── ADMIN_POSTS_GUIDE.md       # User guide

IMPLEMENTATION_SUMMARY.md       # This implementation summary
```

## Component Hierarchy

```
page.tsx (Main Container)
│
├── Header Section
│   ├── Breadcrumbs
│   ├── Title & Description
│   └── Action Buttons (Import, Create New)
│
├── View Controls Toolbar
│   ├── Search Input
│   ├── Category Filter
│   └── View Switcher (Table/Cards/Kanban)
│
└── Content Area (Conditional Rendering)
    │
    ├── IF mode === 'list'
    │   ├── IF viewMode === 'table'
    │   │   └── <TableView />
    │   │       ├── Table Headers
    │   │       ├── Table Rows (mapped posts)
    │   │       └── Pagination Footer
    │   │
    │   ├── IF viewMode === 'cards'
    │   │   └── <CardView />
    │   │       ├── Post Cards (grid)
    │   │       └── Create New Card
    │   │
    │   └── IF viewMode === 'kanban'
    │       └── <KanbanView />
    │           ├── Ideas Column
    │           ├── In Progress Column
    │           ├── Under Review Column
    │           └── Published Column
    │
    └── IF mode === 'edit' || mode === 'new'
        └── Edit Form
            ├── Category Selector
            ├── Title Input
            ├── Rich Text Editor (Quill)
            └── Save/Cancel Buttons
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         page.tsx                            │
│  (State Management & Data Fetching)                         │
│                                                              │
│  State:                                                      │
│  • posts: Post[]                                            │
│  • viewMode: 'table' | 'cards' | 'kanban'                  │
│  • mode: 'list' | 'edit' | 'new'                           │
│  • editingSlug: string | null                               │
│                                                              │
│  Functions:                                                  │
│  • refresh() - Fetch posts from API                         │
│  • startNew() - Enter create mode                           │
│  • startEdit(post) - Enter edit mode                        │
│  • save() - Save post to API                                │
│  • backToList() - Return to list view                       │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ Props passed down ↓
                   │
    ┌──────────────┼──────────────┬──────────────────┐
    │              │              │                  │
    ▼              ▼              ▼                  ▼
┌─────────┐  ┌──────────┐  ┌──────────┐      ┌──────────┐
│ Table   │  │  Card    │  │ Kanban   │      │   Edit   │
│  View   │  │  View    │  │  View    │      │   Form   │
└─────────┘  └──────────┘  └──────────┘      └──────────┘
    │              │              │                  │
    │ Events ↑     │ Events ↑     │ Events ↑         │ Events ↑
    │              │              │                  │
    └──────────────┴──────────────┴──────────────────┘
                   │
                   │ Callbacks ↑
                   │
    ┌──────────────┴─────────────────────────────┐
    │                                              │
    │  • onEdit(slug) - Trigger edit mode         │
    │  • onDelete(slug) - Delete post             │
    │  • onCreate() - Trigger create mode         │
    │                                              │
    └──────────────────────────────────────────────┘
```

## API Integration

```
Component          →  API Endpoint              →  Firebase/Database
─────────────────────────────────────────────────────────────────
page.tsx:refresh()  →  GET /api/admin/posts    →  Fetch all posts
page.tsx:save()     →  POST /api/admin/posts   →  Create new post
page.tsx:save()     →  PUT /api/admin/posts    →  Update existing
TableView:onDelete  →  DELETE /api/admin/posts →  Delete post
```

## State Management

### Local State (page.tsx)
- `posts` - Array of all posts
- `loadingData` - Loading indicator
- `saving` - Save in progress
- `error` - Error messages
- `viewMode` - Current view selection
- `mode` - List vs Edit vs New
- `editingSlug` - Currently editing post
- `form` - Form data for editing

### Derived State
- `sorted` - Posts sorted by date (useMemo)
- `allCategories` - Unique categories (useMemo)

## Props Interface

### TableView Props
```typescript
{
  posts: Post[]
  onEdit: (slug: string) => void
  onDelete: (slug: string) => void
}
```

### CardView Props
```typescript
{
  posts: Post[]
  onEdit: (slug: string) => void
  onDelete: (slug: string) => void
  onCreate: () => void
}
```

### KanbanView Props
```typescript
{
  posts: Post[]
  onEdit: (slug: string) => void
  onCreate: () => void
}
```

## Post Type Definition

```typescript
type Post = {
  slug: string        // URL-friendly identifier
  title: string       // Post title
  date: string        // Publish date
  author: string      // Author name/email
  category: string    // Category name
  excerpt: string     // Short description
  content: string[]   // Content paragraphs
  published: boolean  // Publication status
}
```

## Styling Architecture

### Tailwind Classes
- Base colors: `primary`, `accent`, `slate-*`
- Dark mode: `dark:*` variants
- Responsive: `md:*`, `lg:*`, `xl:*` breakpoints
- Transitions: `transition-*`, `hover:*`, `group-hover:*`

### Color Palette
```css
primary: #135bec      /* Main brand blue */
accent: #D9A440       /* Gold accent for highlights */
slate-*: Gray scale   /* Text and borders */
```

### Component-Specific Styles
- **TableView:** Striped rows, hover effects
- **CardView:** Shadow elevations, scale transforms
- **KanbanView:** Column backgrounds, card borders

## Performance Considerations

### Optimizations
1. **useMemo** for sorted/filtered data
2. **useCallback** for stable function references
3. **Dynamic imports** for React Quill editor
4. **Key props** for list rendering efficiency

### Lazy Loading
- Quill editor loaded on-demand
- View components only render when selected

## Extension Points

### Adding New Views
1. Create component in `_components/`
2. Add viewMode type to state
3. Add button to view switcher
4. Add conditional render in page.tsx

### Adding Filters
1. Add filter state
2. Modify `sorted` useMemo
3. Add filter UI to toolbar

### Adding Bulk Actions
1. Add selection state
2. Add checkboxes to views
3. Add bulk action toolbar
4. Implement multi-delete/edit

## Testing Strategy

### Unit Tests (Future)
- Test each view component in isolation
- Mock post data
- Test event handlers

### Integration Tests (Future)
- Test view switching
- Test edit flow
- Test API interactions

### E2E Tests (Future)
- Full user workflows
- Create → Edit → Publish → Delete
- View switching with data persistence

---

**Architecture Version:** 1.0.0
**Last Updated:** January 2026
