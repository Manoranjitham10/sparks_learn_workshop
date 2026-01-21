
import { College, Workshop, Task, Student, Submission, TaskType, Badge } from '../types';

const STORAGE_KEYS = {
  COLLEGES: 'sparks_colleges',
  WORKSHOPS: 'sparks_workshops',
  TASKS: 'sparks_tasks',
  STUDENTS: 'sparks_students',
  SUBMISSIONS: 'sparks_submissions',
  BADGES: 'sparks_badges',
  CMS_RESOURCES: 'sparks_cms_resources',
  CMS_ANNOUNCEMENTS: 'sparks_cms_announcements'
};

const INITIAL_COLLEGES: College[] = [
  { id: 'c1', name: 'Tech Institute of Engineering', location: 'New York, NY', studentCount: 120, adminName: 'Sarah Connor', status: 'Active' },
  { id: 'c2', name: 'Global Valley University', location: 'San Francisco, CA', studentCount: 85, adminName: 'John Doe', status: 'Active' }
];

const INITIAL_RESOURCES = [
  { id: 'res1', title: 'React Best Practices 2024', type: 'PDF', category: 'Technical', size: '2.4 MB', updatedAt: '2024-05-10' },
  { id: 'res2', title: 'Interview Preparation Guide', type: 'DOC', category: 'Career', size: '1.1 MB', updatedAt: '2024-05-12' },
  { id: 'res3', title: 'Intro to AI Workshop Video', type: 'VIDEO', category: 'Multimedia', size: '450 MB', updatedAt: '2024-05-14' }
];

const INITIAL_ANNOUNCEMENTS = [
  { id: 'ann1', title: 'Mid-Season Hackathon', content: 'Registrations opening soon for the June Hackathon.', status: 'Active', priority: 'High', date: '2024-05-15' },
  { id: 'ann2', title: 'System Maintenance', content: 'Scheduled downtime on Sunday at 2 AM EST.', status: 'Draft', priority: 'Medium', date: '2024-05-20' }
];

class MockService {
  private simulateLatency = () => new Promise(res => setTimeout(res, 400 + Math.random() * 600));

  private load<T>(key: string, defaultValue: T[]): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private save<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async getColleges(): Promise<College[]> {
    await this.simulateLatency();
    return this.load(STORAGE_KEYS.COLLEGES, INITIAL_COLLEGES);
  }

  async addCollege(college: College) {
    const colleges = await this.getColleges();
    colleges.push(college);
    this.save(STORAGE_KEYS.COLLEGES, colleges);
  }

  async getWorkshops(): Promise<Workshop[]> {
    return this.load(STORAGE_KEYS.WORKSHOPS, [
      { id: 'w1', title: 'Intro to AI & ML', collegeId: 'c1', startDate: '2023-10-01', endDate: '2023-10-05', status: 'Completed' },
      { id: 'w2', title: 'Advanced React Patterns', collegeId: 'c2', startDate: '2023-11-10', endDate: '2023-11-12', status: 'Ongoing' }
    ]);
  }

  async getTasks(): Promise<Task[]> {
    return this.load(STORAGE_KEYS.TASKS, []);
  }

  async addTask(task: Task) {
    const tasks = await this.getTasks();
    tasks.push(task);
    this.save(STORAGE_KEYS.TASKS, tasks);
  }

  async deleteTask(id: string) {
    const tasks = (await this.getTasks()).filter(t => t.id !== id);
    this.save(STORAGE_KEYS.TASKS, tasks);
  }

  async getSubmissions(): Promise<Submission[]> {
    return this.load(STORAGE_KEYS.SUBMISSIONS, [
      { id: 'sub1', taskId: 't1', studentId: 's1', submittedAt: new Date().toISOString(), status: 'Pending', content: 'const Button = () => <button className="bg-blue-500 p-4">Click Me</button>', score: 0 }
    ]);
  }

  async updateSubmission(updated: Submission) {
    const subs = await this.getSubmissions();
    const index = subs.findIndex(s => s.id === updated.id);
    if (index > -1) {
      subs[index] = updated;
      this.save(STORAGE_KEYS.SUBMISSIONS, subs);

      if (updated.status === 'Approved') {
        const students = await this.getStudents();
        const student = students.find(s => s.id === updated.studentId);
        if (student) {
          student.totalPoints += updated.score;
          this.save(STORAGE_KEYS.STUDENTS, students);
        }
      }
    }
  }

  async getStudents(): Promise<Student[]> {
    return this.load(STORAGE_KEYS.STUDENTS, [
      { id: 's1', name: 'Alice Johnson', roll_no: '21CS001', collegeId: 'c1', email: 'alice@example.com', dob: '2004-05-12', totalPoints: 120, badges: ['Fast Learner'], tasksCompleted: 5, attendance: 95 }
    ]);
  }

  async addStudents(newStudents: Student[]) {
    const students = await this.getStudents();
    students.push(...newStudents);
    this.save(STORAGE_KEYS.STUDENTS, students);
  }

  async deleteStudents(studentIds: string[]) {
    let students = await this.getStudents();
    students = students.filter(s => !studentIds.includes(s.id));
    this.save(STORAGE_KEYS.STUDENTS, students);
  }

  async updateStudent(updatedStudent: Student) {
    const students = await this.getStudents();
    const index = students.findIndex(s => s.id === updatedStudent.id);
    if (index > -1) {
      students[index] = updatedStudent;
      this.save(STORAGE_KEYS.STUDENTS, students);
    }
  }

  async getBadges(): Promise<Badge[]> {
    return this.load(STORAGE_KEYS.BADGES, [
      { id: 'b1', name: 'Fast Learner', icon: '🚀', criteria: 'Submit 5 tasks before deadline' },
      { id: 'b2', name: 'Top Coder', icon: '💻', criteria: 'Score 100% on a coding task' }
    ]);
  }

  async getCmsResources() {
    return this.load(STORAGE_KEYS.CMS_RESOURCES, INITIAL_RESOURCES);
  }

  async saveCmsResources(resources: any[]) {
    this.save(STORAGE_KEYS.CMS_RESOURCES, resources);
  }

  async getCmsAnnouncements() {
    return this.load(STORAGE_KEYS.CMS_ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  }

  async saveCmsAnnouncements(announcements: any[]) {
    this.save(STORAGE_KEYS.CMS_ANNOUNCEMENTS, announcements);
  }

  getCollegeVisualAnalytics(collegeId: string) {
    const students = this.load<Student>(STORAGE_KEYS.STUDENTS, []).filter(s => s.collegeId === collegeId);
    const workshops = this.load<Workshop>(STORAGE_KEYS.WORKSHOPS, []).filter(w => w.collegeId === collegeId);

    return {
      kpis: {
        totalStudents: students.length,
        activeStudents: students.length,
        workshopsCount: workshops.length,
        completionRate: '75',
        avgAttendance: '88',
        totalPoints: students.reduce((a, b) => a + b.totalPoints, 0),
        globalRank: Math.floor(Math.random() * 10) + 1,
        activePercentage: '92'
      },
      visuals: {
        dailyEngagement: [80, 70, 90, 85, 95],
        attendanceHeatmap: Array.from({ length: 28 }, () => Math.floor(Math.random() * 100)),
        workshopPerformance: workshops.map(w => ({ title: w.title, participation: 80, completion: 70, assignedTasks: 10 })),
        radarData: { college: [80, 70, 90, 60, 85], platform: [60, 50, 70, 40, 65] },
        rankHistory: [10, 8, 5, 4],
        dropOffPoints: [0, 5, 12, 18, 22]
      }
    };
  }

  getDetailedStudentAudit(collegeId: string) {
    const students = this.load<Student>(STORAGE_KEYS.STUDENTS, []).filter(s => s.collegeId === collegeId);
    return students.map((s, idx) => ({
      ...s,
      collegeRank: idx + 1,
      globalRank: idx + 10,
      completionRate: '85',
      pointsVelocity: 12,
      riskIndex: s.attendance < 75 ? 'HIGH' : 'LOW',
      totalSubmissions: 5,
      approvedSubmissions: 4
    }));
  }
}

export const mockService = new MockService();
