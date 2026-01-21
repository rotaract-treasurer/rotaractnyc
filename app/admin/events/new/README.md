# New Event Wizard

A comprehensive 3-step wizard for creating events in the Rotaract NYC admin portal.

## Features

### Step 1: Logistics (Where & When)
- **Event Title**: Required text input for the event name
- **Venue Type**: Choice between Physical, Virtual, or Hybrid
- **Location**: 
  - Physical venues: Address search with map preview
  - Virtual events: Meeting link input (Zoom, Google Meet, etc.)
  - Hybrid: Both physical location and virtual link
- **Date & Time**: 
  - Start date and time pickers
  - End date and time pickers
  - Timezone selector (defaults to Eastern Time)

### Step 2: Content (Tell Your Story)
- **Event Description**: Rich textarea for detailed event information
- **Event Image**: URL input with live preview
- **Visibility Settings**:
  - Public: Visible to everyone
  - Members Only: Requires login
  - Board Only: Restricted to board members
- **Event Type**: Upcoming or Past event categorization

### Step 3: Registration & Ticketing
- **Registration Toggle**: Enable/disable RSVP requirements
- **Event Capacity**: Optional maximum attendee limit
- **Registration Deadline**: When RSVPs close
- **Guest Policy**: Allow members to bring guests
- **Pricing**:
  - Member price
  - Guest price (when guests are allowed)
- **Event Summary**: Review all details before publishing

## Technical Implementation

### Frontend Components
- `page.tsx`: Main wizard orchestrator with state management
- `WizardHeader.tsx`: Navigation header with branding
- `WizardProgress.tsx`: Step indicator and progress bar
- `LogisticsStep.tsx`: Step 1 form fields
- `ContentStep.tsx`: Step 2 form fields
- `RegistrationStep.tsx`: Step 3 form fields
- `WizardFooter.tsx`: Navigation buttons and actions

### Backend Integration
The wizard integrates with the existing Firebase/Firestore backend through `/api/admin/events`:

**Event Document Structure:**
```typescript
{
  // Core fields
  title: string
  description: string
  startAt: Timestamp
  endAt: Timestamp
  location: string
  visibility: 'public' | 'member' | 'board'
  
  // Venue details
  venueType: 'physical' | 'virtual' | 'hybrid'
  virtualLink?: string
  
  // Registration
  requiresRegistration: boolean
  capacity?: number
  registrationDeadline?: string
  allowGuests: boolean
  memberPrice?: number
  guestPrice?: number
  
  // Status
  status: 'published' | 'draft' | 'cancelled'
  imageUrl?: string
  
  // Metadata
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### API Endpoints
- `POST /api/admin/events` - Create new event (draft or published)
- `PUT /api/admin/events` - Update existing event
- `GET /api/admin/events` - List all events
- `DELETE /api/admin/events?id=<id>` - Delete event

### State Management
The wizard uses local React state with a single `EventFormData` object that gets passed through all steps. Form data persists when navigating between steps.

### Actions
- **Save Draft**: Saves event with status='draft', returns to events list
- **Preview**: (Placeholder for future implementation)
- **Back**: Navigate to previous step
- **Next**: Proceed to next step
- **Publish Event**: Validates required fields and saves with status='published'

## Usage

1. Navigate to `/admin/events`
2. Click "Create New Event" button
3. Complete Step 1 (Logistics) - title, venue, date/time required
4. Click "Next: Content"
5. Complete Step 2 (Content) - description and visibility
6. Click "Next: Registration"
7. Complete Step 3 (Registration) - configure RSVP settings
8. Click "Publish Event" or "Save Draft"

## Validation
- Title, description, start date, and start time are required for publishing
- Events can be saved as drafts at any time without validation
- Form displays error messages for missing required fields

## Design
The wizard follows the design provided in the HTML mockup with:
- Clean, modern UI with primary color (#007a8a)
- Dark mode support
- Responsive layout (mobile-first)
- Material Symbols icons
- Progress indicators
- Helpful tips and expert advice panels
