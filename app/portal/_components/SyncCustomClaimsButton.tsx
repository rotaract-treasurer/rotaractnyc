'use client';

import { useState } from 'react';

interface SyncResult {
  email: string | null;
  uid: string;
  role: string | null;
  status: 'synced' | 'already-synced' | 'skipped' | 'error';
  message: string;
}

interface SyncResponse {
  success: boolean;
  summary: {
    total: number;
    synced: number;
    alreadySynced: number;
    skipped: number;
    errors: number;
  };
  results: SyncResult[];
  warning?: string;
  error?: string;
}

export default function SyncCustomClaimsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResponse | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleSync = async () => {
    if (!confirm('This will sync all user roles to Firebase Auth custom claims. Continue?')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/portal/admin/sync-claims', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        alert(`✅ Sync complete!\n\nSynced: ${data.summary.synced}\nAlready synced: ${data.summary.alreadySynced}\nSkipped: ${data.summary.skipped}\nErrors: ${data.summary.errors}\n\n⚠️ ${data.warning}`);
      } else {
        alert(`❌ Sync failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
      setResult({
        success: false,
        error: error.message,
        summary: { total: 0, synced: 0, alreadySynced: 0, skipped: 0, errors: 0 },
        results: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
              Fix Permission Issues
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
              If users are getting &quot;Missing or insufficient permissions&quot; errors,
              this tool will sync their Firestore roles to Firebase Auth custom claims.
            </p>
            <button
              onClick={handleSync}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white text-sm font-semibold transition-colors"
            >
              {loading ? 'Syncing...' : 'Sync Custom Claims'}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className={`rounded-lg border p-4 ${
          result.success
            ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20'
            : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            result.success ? 'text-green-900 dark:text-green-200' : 'text-red-900 dark:text-red-200'
          }`}>
            {result.success ? '✅ Sync Complete' : '❌ Sync Failed'}
          </h3>
          
          {result.success && result.summary && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>Total users: {result.summary.total}</div>
                <div>✅ Synced: {result.summary.synced}</div>
                <div>✓ Already synced: {result.summary.alreadySynced}</div>
                <div>⊘ Skipped: {result.summary.skipped}</div>
                {result.summary.errors > 0 && (
                  <div className="col-span-2 text-red-600 dark:text-red-400">
                    ❌ Errors: {result.summary.errors}
                  </div>
                )}
              </div>
              
              {result.warning && (
                <div className="mt-3 p-2 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 text-xs">
                  ⚠️ {result.warning}
                </div>
              )}
              
              {result.results && result.results.length > 0 && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-green-700 dark:text-green-300 hover:underline mt-2"
                >
                  {showDetails ? 'Hide' : 'Show'} details
                </button>
              )}
              
              {showDetails && result.results && (
                <div className="mt-2 max-h-60 overflow-y-auto text-xs space-y-1">
                  {result.results.map((r, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded ${
                        r.status === 'error'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : r.status === 'synced'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <div className="font-mono">{r.email || r.uid}</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {r.status === 'synced' && '✅ '}
                        {r.status === 'already-synced' && '✓ '}
                        {r.status === 'skipped' && '⊘ '}
                        {r.status === 'error' && '❌ '}
                        {r.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {!result.success && (
            <p className="text-sm text-red-800 dark:text-red-300">
              {result.error || 'Unknown error occurred'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
