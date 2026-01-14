# Quick Start Guide - Admin Posts Management

## Accessing the New Views

1. **Login to Admin Panel**
   ```
   URL: https://your-domain.com/admin/login
   ```

2. **Navigate to Posts**
   ```
   URL: https://your-domain.com/admin/posts
   ```

3. **Switch Between Views**
   - Look for the view switcher in the toolbar (top-right area)
   - Three icon buttons:
     - 📋 **List icon** = Table View
     - 🔲 **Grid icon** = Card View
     - 📊 **Kanban icon** = Kanban View

## View Features at a Glance

### 🗂️ Table View
**When to use:** Need to see all post details at once, compare dates, filter quickly

**Features:**
- Sortable columns (coming soon)
- Inline status indicators
- Quick edit/delete buttons
- Pagination controls
- Category badges with colors
- Full post excerpt preview
- Author information

**Actions:**
- Click "Edit" icon to edit post
- Click "Delete" icon to remove post
- Click row to view details

### 🎴 Card View
**When to use:** Visual browsing, getting overview of content, modern interface

**Features:**
- Beautiful card layout
- Image placeholders (gradient)
- Status badges (Published/Draft)
- Hover effects reveal actions
- Category color coding
- Author initials avatars
- "Create New" card always visible

**Actions:**
- Hover over card to see Edit/Delete buttons
- Click card to edit
- Click "Create New Post" card to start writing

### 📋 Kanban View
**When to use:** Managing editorial workflow, tracking post progress, team collaboration

**Features:**
- Four workflow stages:
  - **Ideas:** Brainstorming/planning
  - **In Progress:** Being written
  - **Under Review:** Awaiting approval
  - **Published:** Live posts
- Progress indicators
- Due date badges
- Team member avatars
- Quick add to Ideas column

**Actions:**
- Click any card to edit
- Use "Add Idea" button for new posts
- Drag & drop between columns (coming soon)

## Category Color Coding

All views use consistent category colors:

- 🟣 **Events** → Purple
- 🔵 **News/Club News** → Blue
- 🟢 **Community Service** → Teal/Green
- 🟠 **Fundraising** → Orange
- 🔴 **Social** → Pink
- 🟣 **Professional Development** → Purple
- ⚪ **Other** → Gray

## Status Indicators

### Published
- 🟢 Green dot + "Published" label
- Shows in "Published" column in Kanban
- Visible on website

### Draft
- 🟡 Amber dot + "Draft" label
- Shows in "In Progress" or "Ideas" in Kanban
- Not visible on website

### Scheduled (Future)
- 🔵 Blue + "Scheduled" label
- Will auto-publish at set time

## Search & Filters

### Search Bar
- Located in the toolbar
- Searches: titles, authors, content
- Real-time filtering
- Works across all views

### Category Filter
- Dropdown next to search
- Shows all available categories
- "All Categories" to reset

## Creating New Posts

Three ways to start a new post:

1. **Header Button** (all views)
   - Click "Create New Post" in top-right
   - Blue button with plus icon

2. **Card View**
   - Click the dashed "Create New Post" card
   - Always last item in grid

3. **Kanban View**
   - Click "Add Idea" in Ideas column
   - Or hover over column header → click +

## Editing Posts

All views support editing:

1. **Click on any post** (card, row, or Kanban card)
2. Edit form appears with:
   - Title input
   - Category selector
   - Rich text editor (Quill)
   - Publish toggle
3. Click "Save Changes" when done
4. Returns to previous view

## Keyboard Shortcuts (Coming Soon)

- `Ctrl/Cmd + N` → New post
- `Ctrl/Cmd + S` → Save post
- `Ctrl/Cmd + K` → Focus search
- `Esc` → Close editor
- `1/2/3` → Switch views

## Tips & Best Practices

### For Content Managers
- Use **Card View** for visual content review
- Check status badges for publishing workflow
- Filter by category to focus on specific topics

### For Editors
- Use **Table View** for quick metadata edits
- Sort by date to find recent posts
- Use search for finding specific content

### For Team Leads
- Use **Kanban View** for workflow oversight
- Track posts in progress
- Identify bottlenecks in review stage
- Monitor team member assignments

## Mobile Usage

All views are responsive:

- **Table:** Scrolls horizontally
- **Cards:** Stack vertically (1 column)
- **Kanban:** Scrolls horizontally

Access via tablet or phone for quick edits on the go!

## Dark Mode

Toggle dark mode using your system preferences or browser settings. All views fully support dark mode with:
- Adjusted colors for readability
- Maintained contrast ratios
- Smooth transitions

## Troubleshooting

### Posts not showing?
- Check if you're logged in as admin
- Verify database connection
- Check browser console for errors

### Can't edit post?
- Ensure you have admin permissions
- Try refreshing the page
- Check if another user is editing

### View switcher not working?
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check JavaScript console

## Support

For issues or feature requests:
1. Check the README in `/app/admin/posts/`
2. Contact the development team
3. Submit an issue in the project repository

---

**Last Updated:** January 2026
**Version:** 1.0.0
