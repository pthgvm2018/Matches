import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAcmNHb3nQ7FeAtPy4-au6njguMXaWQn3c',
  authDomain: 'pingpong-tournament-69d36.firebaseapp.com',
  projectId: 'pingpong-tournament-69d36',
  storageBucket: 'pingpong-tournament-69d36.firebasestorage.app',
  messagingSenderId: '652014324361',
  appId: '1:652014324361:web:8bec477c29722ee1f6d458',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
