'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import { apiPost } from '@/hooks/useFirestore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CheckinResult {
  status: 'success' | 'already' | 'expired' | 'invalid';
  member?: { displayName: string };
  ticketNumber?: number;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  memberName: string;
  ticketNumber: number | null;
  status: 'success' | 'already' | 'expired' | 'invalid' | 'error';
  message?: string;
}

// ─── Web Audio beep ──────────────────────────────────────────────────────────

function playBeep(freq: number, duration: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
    osc.onended = () => ctx.close();
  } catch {
    // Audio not available — silent fail
  }
}

// ─── Inline SVG icons ────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg className="w-5 h-5 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconStop() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="6" y="6" width="12" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Scanning overlay corners ─────────────────────────────────────────────────

function ScanOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Dark vignette outside the scan box */}
      <div className="absolute inset-0 bg-black/40" style={{ maskImage: 'radial-gradient(ellipse 55% 55% at center, transparent 60%, black 100%)' }} />
      {/* Scan box */}
      <div className="relative w-64 h-64">
        {/* Animated corner brackets */}
        {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
          <span
            key={corner}
            className="absolute w-8 h-8 border-cranberry"
            style={{
              borderColor: '#9B1B30',
              borderTopWidth: corner.startsWith('t') ? 3 : 0,
              borderBottomWidth: corner.startsWith('b') ? 3 : 0,
              borderLeftWidth: corner.endsWith('l') ? 3 : 0,
              borderRightWidth: corner.endsWith('r') ? 3 : 0,
              top: corner.startsWith('t') ? 0 : undefined,
              bottom: corner.startsWith('b') ? 0 : undefined,
              left: corner.endsWith('l') ? 0 : undefined,
              right: corner.endsWith('r') ? 0 : undefined,
              borderRadius: corner === 'tl' ? '6px 0 0 0' : corner === 'tr' ? '0 6px 0 0' : corner === 'bl' ? '0 0 0 6px' : '0 0 6px 0',
            }}
          />
        ))}
        {/* Scanning line animation */}
        <div className="absolute left-2 right-2 h-0.5 bg-cranberry/80 animate-scan-line" style={{ background: '#9B1B30', opacity: 0.85 }} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ScanPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const { member } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);
  const recentScansRef = useRef<Map<string, number>>(new Map());

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [browserSupported, setBrowserSupported] = useState<boolean | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [processing, setProcessing] = useState(false);

  // Check BarcodeDetector support
  useEffect(() => {
    setBrowserSupported('BarcodeDetector' in window);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const addLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    setLog((prev) => [{ ...entry, id: `${Date.now()}-${Math.random()}` }, ...prev].slice(0, 50));
  }, []);

  const handleDetected = useCallback(
    async (url: string) => {
      // Debounce same URL within 3 seconds
      const now = Date.now();
      const lastScan = recentScansRef.current.get(url);
      if (lastScan && now - lastScan < 3000) return;
      recentScansRef.current.set(url, now);

      // Parse URL params
      let parsedParams: Record<string, string | number> = {};
      try {
        const parsed = new URL(url);
        parsedParams = {
          t: parsed.searchParams.get('t') ?? '',
          sig: parsed.searchParams.get('sig') ?? '',
          tk: Number(parsed.searchParams.get('tk') ?? 0),
          tot: Number(parsed.searchParams.get('tot') ?? 0),
        };
      } catch {
        addLog({
          timestamp: new Date(),
          memberName: 'Unknown',
          ticketNumber: null,
          status: 'error',
          message: 'Invalid QR code format',
        });
        playBeep(300, 200);
        return;
      }

      setProcessing(true);
      try {
        const result: CheckinResult = await apiPost(`/api/portal/events/${eventId}/checkin`, parsedParams);

        if (result.status === 'success') {
          playBeep(800, 150);
          if (typeof navigator.vibrate === 'function') navigator.vibrate(100);
          addLog({
            timestamp: new Date(),
            memberName: result.member?.displayName ?? 'Member',
            ticketNumber: result.ticketNumber ?? null,
            status: 'success',
          });
        } else if (result.status === 'already') {
          playBeep(500, 200);
          addLog({
            timestamp: new Date(),
            memberName: result.member?.displayName ?? 'Member',
            ticketNumber: result.ticketNumber ?? null,
            status: 'already',
            message: 'Already checked in',
          });
        } else {
          playBeep(300, 300);
          addLog({
            timestamp: new Date(),
            memberName: result.member?.displayName ?? 'Unknown',
            ticketNumber: result.ticketNumber ?? null,
            status: result.status,
            message: result.status === 'expired' ? 'Ticket expired' : 'Invalid ticket',
          });
        }
      } catch (err: any) {
        playBeep(300, 300);
        addLog({
          timestamp: new Date(),
          memberName: 'Unknown',
          ticketNumber: null,
          status: 'error',
          message: err?.message ?? 'Check-in failed',
        });
      } finally {
        setProcessing(false);
      }
    },
    [eventId, addLog]
  );

  const startScanning = useCallback(
    (stream: MediaStream, detector: any) => {
      if (!videoRef.current) return;

      const scan = async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(scan);
          return;
        }
        try {
          const barcodes: any[] = await detector.detect(video);
          for (const barcode of barcodes) {
            if (barcode.rawValue) {
              await handleDetected(barcode.rawValue);
            }
          }
        } catch {
          // Detection frame error — continue
        }
        rafRef.current = requestAnimationFrame(scan);
      };

      rafRef.current = requestAnimationFrame(scan);
    },
    [handleDetected]
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      detectorRef.current = detector;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScanning(true);
      startScanning(stream, detector);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (err?.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError(`Could not start camera: ${err?.message ?? 'Unknown error'}`);
      }
    }
  }, [startScanning]);

  // ─── Role guard ───────────────────────────────────────────────────────────

  const BOARD_ROLES = ['board', 'president', 'treasurer'];
  if (member && !BOARD_ROLES.includes(member.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <IconX />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This page is only accessible to board members and administrators.
          </p>
        </div>
      </div>
    );
  }

  // ─── Unsupported browser ──────────────────────────────────────────────────

  if (browserSupported === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-4">
            <IconWarning />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Browser Not Supported</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            QR scanning requires the <strong>BarcodeDetector API</strong>, which is available in Chrome 83+, Edge 83+, and
            Safari 17.4+. Please use a supported browser on your phone or laptop.
          </p>
        </div>
      </div>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Event Check-in</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">QR Scanner</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Event ID: {eventId}</p>
      </div>

      {/* Camera card */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-black overflow-hidden relative">
        {/* Video element */}
        <video
          ref={videoRef}
          className="w-full aspect-[4/3] object-cover"
          playsInline
          muted
          style={{ display: scanning ? 'block' : 'none' }}
        />

        {/* Placeholder when not scanning */}
        {!scanning && (
          <div className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-3 bg-gray-950">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Camera off</p>
          </div>
        )}

        {/* Scanning overlay */}
        {scanning && <ScanOverlay />}

        {/* Processing indicator */}
        {processing && (
          <div className="absolute top-3 right-3 bg-black/70 rounded-full px-3 py-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cranberry animate-pulse" style={{ background: '#9B1B30' }} />
            <span className="text-white text-xs font-medium">Processing…</span>
          </div>
        )}
      </div>

      {/* Camera error */}
      {cameraError && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 flex gap-3">
          <IconX />
          <p className="text-sm text-red-700 dark:text-red-300">{cameraError}</p>
        </div>
      )}

      {/* Action button */}
      <div className="flex gap-3">
        {!scanning ? (
          <button
            onClick={startCamera}
            disabled={browserSupported === null}
            className="flex items-center gap-2 text-white rounded-xl px-5 py-2.5 font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#9B1B30' }}
          >
            <IconCamera />
            Start Scanner
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl px-5 py-2.5 font-medium text-sm transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <IconStop />
            Stop Scanner
          </button>
        )}
        {log.length > 0 && (
          <button
            onClick={() => setLog([])}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors px-3 py-2"
          >
            Clear log
          </button>
        )}
      </div>

      {/* Stats row */}
      {log.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { label: 'Checked In', status: 'success', color: 'text-green-600 dark:text-green-400' },
              { label: 'Already In', status: 'already', color: 'text-yellow-600 dark:text-yellow-400' },
              { label: 'Invalid', status: ['expired', 'invalid', 'error'], color: 'text-red-600 dark:text-red-400' },
            ] as const
          ).map(({ label, status, color }) => {
            const count = log.filter((e) =>
              Array.isArray(status) ? status.includes(e.status as any) : e.status === status
            ).length;
            return (
              <div
                key={label}
                className="rounded-xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 text-center"
              >
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Check-in log */}
      {log.length > 0 && (
        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Check-in Log</h2>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {log.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                {/* Status icon */}
                {entry.status === 'success' && <IconCheck />}
                {entry.status === 'already' && <IconWarning />}
                {(entry.status === 'expired' || entry.status === 'invalid' || entry.status === 'error') && <IconX />}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.memberName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {entry.ticketNumber != null ? `Ticket #${entry.ticketNumber}` : ''}
                    {entry.message ? (entry.ticketNumber != null ? ` · ${entry.message}` : entry.message) : ''}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    entry.status === 'success'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : entry.status === 'already'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {entry.status === 'success'
                    ? 'Checked In'
                    : entry.status === 'already'
                    ? 'Already In'
                    : entry.status === 'expired'
                    ? 'Expired'
                    : entry.status === 'invalid'
                    ? 'Invalid'
                    : 'Error'}
                </span>

                {/* Time */}
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">
                  {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {log.length === 0 && scanning && (
        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">Point the camera at a ticket QR code to scan.</p>
        </div>
      )}

      {/* Scan line animation style */}
      <style>{`
        @keyframes scan-line {
          0%   { top: 8px; }
          50%  { top: calc(100% - 8px); }
          100% { top: 8px; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
          position: absolute;
        }
      `}</style>
    </div>
  );
}
