declare module 'firebase/app' {
  export type FirebaseApp = unknown;
  export function initializeApp(config: unknown): FirebaseApp;
}

declare module 'firebase/auth' {
  export type Auth = unknown;
  export type User = {
    uid: string;
    email: string | null;
    displayName: string | null;
  };
  export type UserCredential = {
    user: User;
  };
  export function getAuth(app: unknown): Auth;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signInWithPopup(auth: Auth, provider: unknown): Promise<UserCredential>;
  export class GoogleAuthProvider {
    constructor();
    customParameters?: Record<string, unknown>;
  }
}

declare module 'firebase/firestore' {
  export type Firestore = unknown;
  export function getFirestore(app: unknown): Firestore;
} 