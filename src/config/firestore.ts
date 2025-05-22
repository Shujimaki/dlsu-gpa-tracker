import { db } from './firebase';
import { 
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import type { Course } from '../types';

export const saveUserData = async (userId: string, term: number, courses: Course[]) => {
  try {
    // Validate userId and data
    if (!userId || userId.trim() === '') {
      console.warn('Cannot save to Firestore: userId is empty or undefined');
      return false; // Return false to indicate failure
    }
    
    if (!Array.isArray(courses)) {
      console.warn('Cannot save to Firestore: courses is not an array');
      return false;
    }
    
    // Validate each course to ensure no undefined values
    const validCourses = courses.map(course => ({
      id: course.id || crypto.randomUUID(),
      code: course.code || '',
      name: course.name || '',
      units: typeof course.units === 'number' ? course.units : 3,
      grade: typeof course.grade === 'number' ? course.grade : 0,
      nas: typeof course.nas === 'boolean' ? course.nas : false
    }));
    
    console.log('Saving to Firestore:', { userId, term, courses: validCourses });
    
    const userRef = doc(db, 'users', userId);
    const termRef = doc(userRef, 'terms', term.toString());
    await setDoc(termRef, { courses: validCourses }, { merge: true });
    console.log('Data saved to Firestore successfully');
    return true; // Return true on success
  } catch (error) {
    console.error('Error saving user data:', error);
    return false; // Return false to indicate failure
  }
};

export const loadUserData = async (userId: string, term: number): Promise<Course[] | null> => {
  try {
    if (!userId || userId.trim() === '') {
      console.warn('Cannot load from Firestore: userId is empty or undefined');
      return null;
    }
    
    const userRef = doc(db, 'users', userId);
    const termRef = doc(userRef, 'terms', term.toString());
    const termDoc = await getDoc(termRef);
    
    if (termDoc.exists()) {
      const data = termDoc.data();
      console.log('Data loaded from Firestore:', data);
      return data.courses as Course[];
    }
    return null;
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
}; 