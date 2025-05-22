export interface Course {
  id: string;
  code: string;
  name: string;
  units: number;
  grade: number;
  nas: boolean; // Non-Academic Subject
}

export interface Term {
  id: number;
  courses: Course[];
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  terms: Term[];
} 