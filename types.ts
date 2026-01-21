
export enum TaskType {
  QUIZ = 'QUIZ',
  PROMPT = 'PROMPT',
  FILE_UPLOAD = 'FILE_UPLOAD',
  PROJECT_URL = 'PROJECT_URL',
  DOCUMENTATION = 'DOCUMENTATION',
}

export interface RubricItem {
  id: string;
  description: string;
  maxPoints: number;
  isAiEvaluated?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  points: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  workshopId: string;
  type: TaskType;
  totalPoints: number;
  rubric?: RubricItem[];
  quizData?: QuizQuestion[];
  deadline: string;
}

export interface College {
  id: string;
  name: string;
  location: string;
  studentCount: number;
  adminName: string;
  status: 'Active' | 'Inactive';
}

export interface Workshop {
  id: string;
  title: string;
  collegeId: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
}

export interface Student {
  id: string;
  uid?: string; // Firebase Auth UID
  name: string;
  roll_no: string;
  collegeId: string;
  email: string;
  dob: string;
  totalPoints: number;
  badges: string[];
  tasksCompleted: number;
  attendance: number;
}

export interface Submission {
  id: string;
  taskId: string;
  studentId: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  content: string;
  score: number;
  feedback?: string;
  breakdown?: Record<string, number>;
  aiGradeSuggestion?: {
    score: number;
    breakdown: Record<string, number>;
    reasoning: string;
  };
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  criteria: string;
}
