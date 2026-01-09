import { FirebaseApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const REQUIRED_FIREBASE_CLIENT_ENV_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const

function getClientConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  }
}

export function getMissingFirebaseClientEnvVars(): string[] {
  return REQUIRED_FIREBASE_CLIENT_ENV_VARS.filter((key) => {
    const value = process.env[key]
    return !value || value.trim().length === 0
  })
}

export function isFirebaseClientConfigured() {
  return getClientConfig() !== null
}

export function getFirebaseClientApp(): FirebaseApp | null {
  const config = getClientConfig()
  if (!config) return null

  const existing = getApps()[0]
  if (existing) return existing

  return initializeApp(config)
}

export function getFirebaseAuth() {
  const app = getFirebaseClientApp()
  if (!app) return null
  return getAuth(app)
}

export function getFirebaseFirestore() {
  const app = getFirebaseClientApp()
  if (!app) return null
  return getFirestore(app)
}

export function getFirebaseStorage() {
  const app = getFirebaseClientApp()
  if (!app) return null
  return getStorage(app)
}
