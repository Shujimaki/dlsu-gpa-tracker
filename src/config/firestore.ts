import { db } from './firebase';
import { 
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import type { Course } from '../types';

export interface TermData {
  courses: Course[];
  isFlowchartExempt: boolean;
}

export interface ProjectionSettings {
  targetCGPA: number;
  totalUnits: number;
}

export interface CGPASettings {
  creditedUnits: number;
}

export const saveUserData = async (userId: string, term: number, courses: Course[], isFlowchartExempt: boolean = false) => {
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
    
    console.log('Saving to Firestore:', { userId, term, courses: validCourses, isFlowchartExempt });
    
    const userRef = doc(db, 'users', userId);
    const termRef = doc(userRef, 'terms', term.toString());
    await setDoc(termRef, { courses: validCourses, isFlowchartExempt }, { merge: true });
    console.log('Data saved to Firestore successfully');
    return true; // Return true on success
  } catch (error) {
    console.error('Error saving user data:', error);
    return false; // Return false to indicate failure
  }
};

export const loadUserData = async (userId: string, term: number): Promise<TermData | null> => {
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
      return {
        courses: data.courses as Course[],
        isFlowchartExempt: data.isFlowchartExempt || false
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
};

export const getUserTerms = async (userId: string): Promise<number[]> => {
  try {
    if (!userId || userId.trim() === '') {
      console.warn('Cannot get terms from Firestore: userId is empty or undefined');
      return [];
    }
    
    const userRef = doc(db, 'users', userId);
    const termsCollectionRef = collection(userRef, 'terms');
    const termsSnapshot = await getDocs(termsCollectionRef);
    
    if (termsSnapshot.empty) {
      console.log('No terms found in Firestore for user:', userId);
      return [];
    }
    
    // Extract term numbers from document IDs
    const termNumbers = termsSnapshot.docs.map(doc => {
      const termId = doc.id;
      const termNumber = parseInt(termId);
      return isNaN(termNumber) ? null : termNumber;
    }).filter((term): term is number => term !== null);
    
    console.log('Terms loaded from Firestore:', termNumbers);
    return termNumbers;
  } catch (error) {
    console.error('Error getting user terms:', error);
    return [];
  }
};

export const deleteUserTerm = async (userId: string, term: number): Promise<boolean> => {
  try {
    if (!userId || userId.trim() === '') {
      console.warn('Cannot delete term from Firestore: userId is empty or undefined');
      return false;
    }
    
    const userRef = doc(db, 'users', userId);
    const termRef = doc(userRef, 'terms', term.toString());
    
    await deleteDoc(termRef);
    console.log(`Term ${term} deleted from Firestore for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting term ${term}:`, error);
    return false;
  }
};

export const saveUserProjectionSettings = async (userId: string, settings: ProjectionSettings): Promise<boolean> => {
  try {
    // Validate userId
    if (!userId || userId.trim() === '') {
      console.warn('Cannot save projection settings: userId is empty or undefined');
      return false;
    }
    
    console.log('Saving projection settings to Firestore:', { userId, settings });
    
    const userRef = doc(db, 'users', userId);
    await setDoc(doc(userRef, 'settings', 'projections'), settings, { merge: true });
    console.log('Projection settings saved to Firestore successfully');
    return true;
  } catch (error) {
    console.error('Error saving projection settings:', error);
    return false;
  }
};

export const loadUserProjectionSettings = async (userId: string): Promise<ProjectionSettings | null> => {
  try {
    if (!userId || userId.trim() === '') {
      console.warn('Cannot load projection settings: userId is empty or undefined');
      return null;
    }
    
    const userRef = doc(db, 'users', userId);
    const settingsRef = doc(userRef, 'settings', 'projections');
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data() as ProjectionSettings;
      console.log('Projection settings loaded from Firestore:', data);
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error loading projection settings:', error);
    return null;
  }
};

export const saveUserCGPASettings = async (userId: string, settings: CGPASettings): Promise<boolean> => {
  try {
    // Validate userId
    if (!userId || userId.trim() === '') {
      console.warn('Cannot save CGPA settings: userId is empty or undefined');
      return false;
    }
    
    console.log('Saving CGPA settings to Firestore:', { userId, settings });
    
    const userRef = doc(db, 'users', userId);
    await setDoc(doc(userRef, 'settings', 'cgpa'), settings, { merge: true });
    console.log('CGPA settings saved to Firestore successfully');
    return true;
  } catch (error) {
    console.error('Error saving CGPA settings:', error);
    return false;
  }
};

export const loadUserCGPASettings = async (userId: string): Promise<CGPASettings | null> => {
  try {
    if (!userId || userId.trim() === '') {
      console.warn('Cannot load CGPA settings: userId is empty or undefined');
      return null;
    }
    
    const userRef = doc(db, 'users', userId);
    const settingsRef = doc(userRef, 'settings', 'cgpa');
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data() as CGPASettings;
      console.log('CGPA settings loaded from Firestore:', data);
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error loading CGPA settings:', error);
    return null;
  }
}; 