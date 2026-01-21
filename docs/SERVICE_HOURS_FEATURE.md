# Service Hours Logging System

A complete service hours tracking and approval system for Rotaract NYC members.

## Features

### For Members
- **Multi-step wizard** for logging service hours with intuitive UI
- Select from recent club events or add custom activities
- Adjustable hour tracking with time picker
- Add optional notes and reflections
- View recent submissions with approval status
- Real-time status updates (Pending, Approved, Rejected)

### For Administrators
- **Review dashboard** to approve/reject submissions
- Filter by status (All, Pending, Approved, Rejected)
- View member details and notes for each submission
- Track total approved hours and statistics
- Add review notes when rejecting submissions

## Components

### 1. LogServiceHoursModal.tsx
Location: `/app/portal/_components/LogServiceHoursModal.tsx`

The main modal component with a 3-step wizard:
- **Step 1**: Event Selection - Choose from recent events or "Other"
- **Step 2**: Time Logging - Set hours and date with +/- controls
- **Step 3**: Details & Confirmation - Add notes and review submission

**Props:**
```typescript
interface LogServiceHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### 2. RecentServiceHours.tsx
Location: `/app/portal/_components/RecentServiceHours.tsx`

Displays the user's 5 most recent service hour submissions with:
- Event name and hours
- Date of service
- Status badge (Pending/Approved/Rejected)
- Total hours summary

### 3. Service Hours Review Page
Location: `/app/admin/service-hours/page.tsx`

Admin interface for reviewing submissions:
- Statistics cards (Pending, Total Hours, Approved, Rejected)
- Filter tabs for different statuses
- Approve/Reject buttons with confirmation
- Member name and details display

## API Endpoints

### POST /api/portal/service-hours
Submit new service hours

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "eventId": "string",
  "eventName": "string",
  "hours": number,
  "date": "ISO-8601 date string",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "id": "submission-id",
  "message": "Service hours submitted successfully"
}
```

### GET /api/portal/service-hours?limit=10
Get user's service hour submissions

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response:**
```json
{
  "success": true,
  "submissions": [
    {
      "id": "string",
      "eventName": "string",
      "hours": number,
      "date": "ISO-8601 string",
      "status": "pending|approved|rejected",
      "notes": "string",
      "createdAt": "ISO-8601 string"
    }
  ]
}
```

## Database Schema

### Collection: `serviceHours`

```typescript
interface ServiceHourSubmission {
  id: string;
  uid: string;                    // Member's Firebase UID
  eventId: string;                // Event ID or "other"
  eventName: string;              // Display name of event
  hours: number;                  // Hours contributed (0.5 increments)
  date: Timestamp;                // Date of service
  notes?: string;                 // Optional member notes
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;            // UID of reviewer
  reviewedAt?: Timestamp;         // When reviewed
  reviewNotes?: string;           // Admin's review notes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Firestore Security Rules

```javascript
match /serviceHours/{submissionId} {
  // Members can read their own submissions, board/admin can read all
  allow read: if (isAuthenticated() && resource.data.uid == request.auth.uid) 
              || isBoard();
  // Members can create their own submissions
  allow create: if isMember() 
                && request.resource.data.uid == request.auth.uid
                && request.resource.data.status == 'pending';
  // Only board/admin can update (for review/approval)
  allow update: if isBoard();
  // Only admin can delete
  allow delete: if isAdmin();
}
```

## Firestore Indexes

Required composite indexes:
1. `serviceHours` collection: `status` (ASC) + `createdAt` (DESC)
2. `serviceHours` collection: `uid` (ASC) + `createdAt` (DESC)

These are already configured in `firestore.indexes.json`.

## Integration Points

### Portal Dashboard
The service hours widget is integrated into the main portal dashboard:
- QuickLinks component includes "Log Service Hours" button
- RecentServiceHours widget displays in the right sidebar
- Modal opens when clicking the quick link

### Admin Navigation
Added to admin navigation bar as "Service Hours" tab for easy access to the review interface.

## Usage

### For Members
1. Navigate to the Portal Dashboard
2. Click "Log Service Hours" in Quick Links
3. Select an event or choose "Other Activity"
4. Enter hours (default 2, adjustable in 0.5 hour increments)
5. Add optional notes
6. Submit for review

### For Admins
1. Navigate to Admin Panel → Service Hours
2. Review pending submissions
3. Click "Approve" or "Reject" with optional notes
4. View statistics and filter by status

## Design Features
- **Dark mode support** throughout
- **Material Icons** for consistent iconography
- **Responsive layout** works on all screen sizes
- **Smooth animations** for transitions and loading states
- **Form validation** ensures data quality
- **Error handling** with user-friendly messages

## Future Enhancements
- Email notifications on approval/rejection
- Export service hours reports (CSV/PDF)
- Bulk approval for administrators
- Service hours leaderboard
- Monthly/yearly statistics dashboard
- Category tags for different types of service
- Photo upload for service verification
- Integration with calendar events
