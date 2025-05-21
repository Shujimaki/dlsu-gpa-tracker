export interface Course {
  id: string;
  code: string;
  name?: string;
  units: number;
  grade: number;
}

export interface Term {
  id: string;
  number: number;
  courses: Course[];
  gpa: number;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  terms: Term[];
}

export type Grade = 4.0 | 3.5 | 3.0 | 2.5 | 2.0 | 1.5 | 1.0 | 0.0;
export type Units = 1 | 2 | 3 | 4 | 5; 