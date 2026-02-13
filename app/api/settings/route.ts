import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// Public site settings (for theming, announcements, etc.)
export async function GET() {
  try {
    const doc = await adminDb.collection('settings').doc('site').get();
    if (!doc.exists) {
      return NextResponse.json({
        announcementBar: null,
        maintenanceMode: false,
      });
    }
    return NextResponse.json(doc.data());
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      announcementBar: null,
      maintenanceMode: false,
    });
  }
}
