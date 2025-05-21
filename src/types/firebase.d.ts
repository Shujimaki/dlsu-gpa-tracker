declare module 'firebase/app' {
  export interface FirebaseApp {}
  export function initializeApp(config: any): FirebaseApp;
}

declare module 'firebase/auth' {
  export interface Auth {}
  export function getAuth(app: any): Auth;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<any>;
  export function signInWithPopup(auth: Auth, provider: any): Promise<any>;
  export class GoogleAuthProvider {
    constructor();
  }
}

declare module 'firebase/firestore' {
  export interface Firestore {}
  export function getFirestore(app: any): Firestore;
} 