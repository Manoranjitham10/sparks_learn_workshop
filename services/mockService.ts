import { College, Workshop, Task, Student, Submission, TaskType, Badge } from '../types';

// Initial Mock Data
const MOCK_COLLEGES: College[] = [
  { id: 'c1', name: 'Tech Institute of Engineering', location: 'New York, NY', studentCount: 120, adminName: 'Sarah Connor', status: 'Active' },
  { id: 'c2', name: 'Global Valley University', location: 'San Francisco, CA', studentCount: 85, adminName: 'John Doe', status: 'Active' },
  { id: 'c3', name: 'Future Systems Academy', location: 'Austin, TX', studentCount: 45, adminName: 'Jane Smith', status: 'Inactive' },
];

const MOCK_WORKSHOPS: Workshop[] = [
  { id: 'w1', title: 'Intro to AI & ML', collegeId: 'c1', startDate: '2023-10-01', endDate: '2023-10-05', status: 'Completed' },
  { id: 'w2', title: 'Advanced React Patterns', collegeId: 'c2', startDate: '2023-11-10', endDate: '2023-11-12', status: 'Ongoing' },
  { id: 'w3', title: 'Data Science Bootcamp', collegeId: 'c1', startDate: '2023-12-01', endDate: '2023-12-05', status: 'Upcoming' },
];

const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: 'React Component Basics',
    description: 'Create a reusable Button component with variants.',
    workshopId: 'w2',
    type: TaskType.FILE_UPLOAD,
    totalPoints: 50,
    deadline: '2023-11-11',
    rubric: [
      { id: 'r1', description: 'Component renders correctly', maxPoints: 20 },
      { id: 'r2', description: 'TypeScript types used', maxPoints: 10 },
      { id: 'r3', description: 'Tailwind styling applied', maxPoints: 20 },
    ]
  },
  {
    id: 't2',
    title: 'AI Ethics Quiz',
    description: 'Complete the quiz on responsible AI usage.',
    workshopId: 'w1',
    type: TaskType.QUIZ,
    totalPoints: 20,
    deadline: '2023-10-02',
    quizData: [
      { id: 'q1', question: 'What is Bias in AI?', options: ['Good', 'Bad', 'Neutral', 'Unknown'], correctAnswerIndex: 1, points: 10 },
      { id: 'q2', question: 'True or False: AI is always right.', options: ['True', 'False'], correctAnswerIndex: 1, points: 10 },
    ]
  }
];

const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Alice Johnson', collegeId: 'c1', email: 'alice@example.com', totalPoints: 120, badges: ['Fast Learner'] },
  { id: 's2', name: 'Bob Smith', collegeId: 'c1', email: 'bob@example.com', totalPoints: 95, badges: [] },
  { id: 's3', name: 'Charlie Davis', collegeId: 'c2', email: 'charlie@example.com', totalPoints: 150, badges: ['Top Coder'] },
];

const MOCK_SUBMISSIONS: Submission[] = [
  { id: 'sub1', taskId: 't1', studentId: 's3', submittedAt: '2023-11-11T10:00:00Z', status: 'Pending', content: 'button-component.tsx', score: 0 },
  { id: 'sub2', taskId: 't2', studentId: 's1', submittedAt: '2023-10-02T14:30:00Z', status: 'Approved', content: 'Quiz Completed', score: 20 },
];

const MOCK_BADGES: Badge[] = [
    { id: 'b1', name: 'Fast Learner', icon: '🚀', criteria: 'Submit 5 tasks before deadline' },
    { id: 'b2', name: 'Top Coder', icon: '💻', criteria: 'Score 100% on a coding task' },
    { id: 'b3', name: 'Helper', icon: '🤝', criteria: 'Help 3 students in forums' },
];

// Simple in-memory store
class MockService {
  colleges = MOCK_COLLEGES;
  workshops = MOCK_WORKSHOPS;
  tasks = MOCK_TASKS;
  students = MOCK_STUDENTS;
  submissions = MOCK_SUBMISSIONS;
  badges = MOCK_BADGES;

  getColleges() { return this.colleges; }
  getWorkshops() { return this.workshops; }
  getTasks() { return this.tasks; }
  getStudents() { return this.students; }
  getSubmissions() { return this.submissions; }
  getBadges() { return this.badges; }

  addCollege(college: College) { this.colleges = [...this.colleges, college]; }
  updateCollege(updated: College) { this.colleges = this.colleges.map(c => c.id === updated.id ? updated : c); }
  deleteCollege(id: string) { this.colleges = this.colleges.filter(c => c.id !== id); }

  addWorkshop(workshop: Workshop) { this.workshops = [...this.workshops, workshop]; }
  
  addTask(task: Task) { this.tasks = [...this.tasks, task]; }
  deleteTask(id: string) { this.tasks = this.tasks.filter(t => t.id !== id); }
  
  updateSubmission(updated: Submission) {
    this.submissions = this.submissions.map(s => s.id === updated.id ? updated : s);
    // Update student points if submission is graded
    if (updated.status === 'Approved') {
       this.updateStudentPoints(updated.studentId, updated.score);
    }
  }

  updateStudentPoints(studentId: string, pointsToAdd: number) {
      const student = this.students.find(s => s.id === studentId);
      if (student) {
          student.totalPoints += pointsToAdd;
      }
  }

  getSubmission(id: string) { return this.submissions.find(s => s.id === id); }
}

export const mockService = new MockService();