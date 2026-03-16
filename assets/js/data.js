/* =========================================================
   ANSHA MONTESSORI LMS — DATA.JS
   LocalStorage CRUD helpers + Seed Data
   ========================================================= */

const DB = {
  USERS:       'lms_users',
  COURSES:     'lms_courses',
  LESSONS:     'lms_lessons',
  QUIZZES:     'lms_quizzes',
  ASSIGNMENTS: 'lms_assignments',
  SUBMISSIONS: 'lms_submissions',
  ENROLLMENTS: 'lms_enrollments',
  PROGRESS:    'lms_progress',
  SESSION:     'lms_session',
  NOTICES:     'lms_notices',
};

/* ---- Generic CRUD ---- */
function dbGet(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function dbSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function dbGetOne(key, id) {
  return dbGet(key).find(x => x.id === id) || null;
}
function dbSave(key, item) {
  const list = dbGet(key);
  const idx = list.findIndex(x => x.id === item.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...item };
  else list.push(item);
  dbSet(key, list);
  return item;
}
function dbDelete(key, id) {
  dbSet(key, dbGet(key).filter(x => x.id !== id));
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ---- Session ---- */
function getSession() {
  try { return JSON.parse(localStorage.getItem(DB.SESSION)); }
  catch { return null; }
}
function setSession(user) {
  localStorage.setItem(DB.SESSION, JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem(DB.SESSION);
}

/* ---- User helpers ---- */
function findUserByEmail(email) {
  return dbGet(DB.USERS).find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}
function getUsersByRole(role) {
  return dbGet(DB.USERS).filter(u => u.role === role);
}

/* ---- Enrollment helpers ---- */
function getEnrollment(studentId, courseId) {
  return dbGet(DB.ENROLLMENTS).find(e => e.studentId === studentId && e.courseId === courseId) || null;
}
function getStudentEnrollments(studentId) {
  return dbGet(DB.ENROLLMENTS).filter(e => e.studentId === studentId);
}
function getCourseEnrollments(courseId) {
  return dbGet(DB.ENROLLMENTS).filter(e => e.courseId === courseId);
}
function enrollStudent(studentId, courseId) {
  if (getEnrollment(studentId, courseId)) return null;
  const enrollment = {
    id: genId(), studentId, courseId,
    enrolledAt: new Date().toISOString(),
    progress: 0, status: 'active', feeStatus: 'pending'
  };
  return dbSave(DB.ENROLLMENTS, enrollment);
}

/* ---- Progress helpers ---- */
function markLessonComplete(studentId, lessonId) {
  const existing = dbGet(DB.PROGRESS).find(p => p.studentId === studentId && p.lessonId === lessonId);
  if (existing) return;
  dbSave(DB.PROGRESS, { id: genId(), studentId, lessonId, completed: true, completedAt: new Date().toISOString() });

  // Recalculate course progress
  const lesson = dbGetOne(DB.LESSONS, lessonId);
  if (!lesson) return;
  const courseLessons = dbGet(DB.LESSONS).filter(l => l.courseId === lesson.courseId);
  const completedLessons = dbGet(DB.PROGRESS).filter(p =>
    p.studentId === studentId &&
    courseLessons.some(cl => cl.id === p.lessonId)
  );
  const progress = courseLessons.length > 0
    ? Math.round((completedLessons.length / courseLessons.length) * 100)
    : 0;
  const enrollment = getEnrollment(studentId, lesson.courseId);
  if (enrollment) {
    enrollment.progress = progress;
    if (progress === 100) enrollment.status = 'completed';
    dbSave(DB.ENROLLMENTS, enrollment);
  }
}
function isLessonCompleted(studentId, lessonId) {
  return dbGet(DB.PROGRESS).some(p => p.studentId === studentId && p.lessonId === lessonId);
}

/* ---- Quiz Submissions ---- */
function saveQuizResult(studentId, quizId, score, total, answers) {
  const existing = getQuizResult(studentId, quizId);
  const sub = {
    id: existing ? existing.id : genId(),
    type: 'quiz', quizId, studentId,
    score, total, percentage: Math.round((score / total) * 100),
    answers, submittedAt: new Date().toISOString()
  };
  return dbSave(DB.SUBMISSIONS, sub);
}
function getQuizResult(studentId, quizId) {
  return dbGet(DB.SUBMISSIONS).find(s => s.type === 'quiz' && s.studentId === studentId && s.quizId === quizId) || null;
}

/* ---- Assignment Submissions ---- */
function submitAssignment(studentId, assignmentId, answer) {
  const existing = dbGet(DB.SUBMISSIONS).find(s => s.type === 'assignment' && s.studentId === studentId && s.assignmentId === assignmentId);
  if (existing) { existing.answer = answer; existing.submittedAt = new Date().toISOString(); return dbSave(DB.SUBMISSIONS, existing); }
  const sub = { id: genId(), type: 'assignment', assignmentId, studentId, answer, marks: null, feedback: '', submittedAt: new Date().toISOString() };
  return dbSave(DB.SUBMISSIONS, sub);
}
function gradeAssignment(submissionId, marks, feedback) {
  const sub = dbGetOne(DB.SUBMISSIONS, submissionId);
  if (!sub) return null;
  sub.marks = marks; sub.feedback = feedback; sub.gradedAt = new Date().toISOString();
  return dbSave(DB.SUBMISSIONS, sub);
}

/* =============================================
   SEED DATA
   ============================================= */
function initSeedData() {
  if (localStorage.getItem('lms_seeded')) return;

  /* --- Users --- */
  const users = [
    {
      id: 'u1', name: 'Admin User', email: 'admin@ansha.edu', password: 'admin123',
      role: 'admin', avatar: '👨‍💼', phone: '+92-300-1234567', createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'u2', name: 'Fatima Malik', email: 'fatima@ansha.edu', password: 'teacher123',
      role: 'teacher', avatar: '👩‍🏫', phone: '+92-301-2345678',
      qualification: 'M.Ed Montessori', experience: '8 years', createdAt: '2024-01-05T00:00:00Z'
    },
    {
      id: 'u3', name: 'Zainab Ahmed', email: 'zainab@ansha.edu', password: 'teacher123',
      role: 'teacher', avatar: '👩‍🏫', phone: '+92-302-3456789',
      qualification: 'B.Ed, TEFL Certified', experience: '5 years', createdAt: '2024-01-08T00:00:00Z'
    },
    {
      id: 'u4', name: 'Ayesha Khan', email: 'ayesha@student.edu', password: 'student123',
      role: 'student', avatar: '👩‍🎓', phone: '+92-303-4567890', createdAt: '2024-02-01T00:00:00Z'
    },
    {
      id: 'u5', name: 'Sara Riaz', email: 'sara@student.edu', password: 'student123',
      role: 'student', avatar: '👩‍🎓', phone: '+92-304-5678901', createdAt: '2024-02-05T00:00:00Z'
    },
    {
      id: 'u6', name: 'Nadia Hussain', email: 'nadia@student.edu', password: 'student123',
      role: 'student', avatar: '👩‍🎓', phone: '+92-305-6789012', createdAt: '2024-02-10T00:00:00Z'
    },
    {
      id: 'u7', name: 'Mariam Sheikh', email: 'mariam@student.edu', password: 'student123',
      role: 'student', avatar: '👩‍🎓', phone: '+92-306-7890123', createdAt: '2024-02-15T00:00:00Z'
    }
  ];
  dbSet(DB.USERS, users);

  /* --- Courses --- */
  const courses = [
    {
      id: 'c1', title: 'Advance Montessori Teacher Training',
      category: 'montessori', teacherId: 'u2',
      description: 'A comprehensive training program covering the philosophy, principles, and practical implementation of the Montessori method for early childhood education. Become a certified Montessori educator.',
      duration: '6 Months', level: 'Advanced', icon: '🏫', color: '#1a7a7a',
      modules: ['Montessori Philosophy & Principles', 'Prepared Environment', 'Sensorial Materials', 'Language & Literacy', 'Mathematics in Montessori', 'Practical Life Activities'],
      maxStudents: 25, fee: 15000, createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: 'c2', title: 'Spoken English',
      category: 'language', teacherId: 'u3',
      description: 'Develop fluency, confidence, and effective communication skills in English. Perfect for educators who want to teach in English-medium schools or improve their communication abilities.',
      duration: '3 Months', level: 'All Levels', icon: '🗣️', color: '#7c3aed',
      modules: ['Foundation & Basics', 'Pronunciation & Phonetics', 'Conversational English', 'Classroom English for Teachers'],
      maxStudents: 20, fee: 8000, createdAt: '2024-01-20T00:00:00Z'
    },
    {
      id: 'c3', title: 'Phonics Training',
      category: 'phonics', teacherId: 'u2',
      description: 'Master the art of teaching phonics to young learners. Learn systematic phonics instruction methods, phonemic awareness activities, and how to help children become confident readers.',
      duration: '2 Months', level: 'Intermediate', icon: '📖', color: '#d97706',
      modules: ['Phonemic Awareness', 'Letter-Sound Correspondence', 'Blending & Segmenting', 'Teaching Reading with Phonics'],
      maxStudents: 20, fee: 6000, createdAt: '2024-01-25T00:00:00Z'
    },
    {
      id: 'c4', title: 'Child Psychology',
      category: 'psychology', teacherId: 'u3',
      description: 'Understand child development, behavior, and learning patterns. This course equips teachers with psychological insights to create nurturing, supportive classrooms and handle diverse learner needs.',
      duration: '4 Months', level: 'Intermediate', icon: '🧠', color: '#db2777',
      modules: ['Child Development Stages', 'Cognitive Development', 'Emotional & Social Development', 'Learning Disabilities & Special Needs', 'Classroom Behavior Management'],
      maxStudents: 25, fee: 10000, createdAt: '2024-02-01T00:00:00Z'
    }
  ];
  dbSet(DB.COURSES, courses);

  /* --- Lessons --- */
  const lessons = [
    // Montessori (c1)
    { id: 'l1', courseId: 'c1', module: 'Montessori Philosophy & Principles', title: 'Introduction to Montessori Method', type: 'video', url: 'https://www.youtube.com/embed/kfLLQCEB5sg', duration: '18 min', order: 1 },
    { id: 'l2', courseId: 'c1', module: 'Montessori Philosophy & Principles', title: 'Core Principles of Dr. Maria Montessori', type: 'text', content: '<h3>Core Principles</h3><p>The Montessori method is based on six core principles:</p><ol><li><strong>Respect for the child</strong> — treating children as capable individuals</li><li><strong>The absorbent mind</strong> — children absorb knowledge effortlessly from 0-6 years</li><li><strong>Sensitive periods</strong> — windows of opportunity for optimal learning</li><li><strong>The prepared environment</strong> — a carefully organized learning space</li><li><strong>Auto-education</strong> — children naturally desire to learn</li><li><strong>The role of the teacher</strong> — guide and observer, not lecturer</li></ol>', duration: '15 min', order: 2 },
    { id: 'l3', courseId: 'c1', module: 'Prepared Environment', title: 'Setting Up a Montessori Classroom', type: 'video', url: 'https://www.youtube.com/embed/9X68dm92HVI', duration: '22 min', order: 3 },
    { id: 'l4', courseId: 'c1', module: 'Sensorial Materials', title: 'Introduction to Sensorial Materials', type: 'video', url: 'https://www.youtube.com/embed/0z0M5DPfLT8', duration: '20 min', order: 4 },
    // Spoken English (c2)
    { id: 'l5', courseId: 'c2', module: 'Foundation & Basics', title: 'Fundamentals of English Communication', type: 'video', url: 'https://www.youtube.com/embed/yyNPlDL3GBs', duration: '25 min', order: 1 },
    { id: 'l6', courseId: 'c2', module: 'Pronunciation & Phonetics', title: 'English Pronunciation Guide', type: 'text', content: '<h3>English Pronunciation Basics</h3><p>Good pronunciation is key to effective communication. Here are essential tips:</p><ul><li><strong>Vowel sounds</strong>: English has 12 pure vowels and 8 diphthongs</li><li><strong>Consonant clusters</strong>: Practice blending consonants (str-, spr-, -nds)</li><li><strong>Word stress</strong>: Know which syllable to stress in multi-syllable words</li><li><strong>Sentence rhythm</strong>: English has a stress-timed rhythm</li><li><strong>Intonation</strong>: Rising intonation for questions, falling for statements</li></ul><h4>Daily Practice Tips:</h4><p>Record yourself speaking, listen back, and compare with native speakers. Practice tongue twisters daily for articulation improvement.</p>', duration: '20 min', order: 2 },
    { id: 'l7', courseId: 'c2', module: 'Conversational English', title: 'Building Conversation Skills', type: 'video', url: 'https://www.youtube.com/embed/sW5QObM5CHA', duration: '30 min', order: 3 },
    // Phonics (c3)
    { id: 'l8', courseId: 'c3', module: 'Phonemic Awareness', title: 'What is Phonemic Awareness?', type: 'video', url: 'https://www.youtube.com/embed/d0GNqEbMGZY', duration: '15 min', order: 1 },
    { id: 'l9', courseId: 'c3', module: 'Letter-Sound Correspondence', title: 'Teaching Letter Sounds A-Z', type: 'text', content: '<h3>Teaching Letter-Sound Correspondence</h3><p>Letter-sound correspondence is the understanding that letters represent sounds in spoken words. Here is how to teach it effectively:</p><h4>Sequence of Introduction:</h4><ol><li>Start with high-frequency letters: a, m, s, t, i, p</li><li>Introduce consonants before complex vowels</li><li>Use multisensory approaches (see, hear, touch, write)</li><li>Practice daily for 5-10 minutes</li></ol><h4>Multisensory Activities:</h4><ul><li>Sandpaper letters for tactile learning</li><li>Air writing for kinesthetic practice</li><li>Songs and rhymes for auditory reinforcement</li><li>Picture cards for visual association</li></ul>', duration: '18 min', order: 2 },
    { id: 'l10', courseId: 'c3', module: 'Blending & Segmenting', title: 'Blending Sounds into Words', type: 'video', url: 'https://www.youtube.com/embed/RPTqBCdR1L4', duration: '20 min', order: 3 },
    // Child Psychology (c4)
    { id: 'l11', courseId: 'c4', module: 'Child Development Stages', title: "Piaget's Stages of Cognitive Development", type: 'video', url: 'https://www.youtube.com/embed/TRF27F2bn-A', duration: '22 min', order: 1 },
    { id: 'l12', courseId: 'c4', module: 'Cognitive Development', title: 'Understanding How Children Learn', type: 'text', content: '<h3>How Children Learn</h3><p>Understanding the cognitive processes in children helps educators create more effective learning experiences.</p><h4>Key Learning Theories:</h4><ul><li><strong>Constructivism (Piaget)</strong>: Children build knowledge through active exploration</li><li><strong>Social Learning (Vygotsky)</strong>: Learning happens through social interaction and the Zone of Proximal Development (ZPD)</li><li><strong>Behaviorism (Skinner)</strong>: Learning through reinforcement and reward</li><li><strong>Multiple Intelligences (Gardner)</strong>: 8 types of intelligence beyond IQ</li></ul><h4>Practical Implications:</h4><p>Use hands-on activities, collaborative projects, positive reinforcement, and varied teaching strategies to accommodate different learning styles.</p>', duration: '25 min', order: 2 },
    { id: 'l13', courseId: 'c4', module: 'Emotional & Social Development', title: 'Emotional Intelligence in Children', type: 'video', url: 'https://www.youtube.com/embed/Y7m9eNoB3NU', duration: '18 min', order: 3 },
  ];
  dbSet(DB.LESSONS, lessons);

  /* --- Quizzes --- */
  const quizzes = [
    {
      id: 'q1', courseId: 'c1', title: 'Montessori Fundamentals Quiz',
      timeLimit: 15, passMark: 60,
      questions: [
        { id: 'qq1', text: 'Who developed the Montessori method of education?', options: ['Friedrich Froebel', 'Maria Montessori', 'Jean Piaget', 'John Dewey'], correct: 1 },
        { id: 'qq2', text: 'What age range is considered the "absorbent mind" period?', options: ['0-3 years only', '3-6 years only', '0-6 years', '6-12 years'], correct: 2 },
        { id: 'qq3', text: 'In the Montessori method, what is the primary role of the teacher?', options: ['Direct instructor and lecturer', 'Guide and observer', 'Disciplinarian', 'Entertainer'], correct: 1 },
        { id: 'qq4', text: 'What are "sensitive periods" in Montessori education?', options: ['Times when children are emotionally sensitive', 'Windows of opportunity for optimal learning', 'Periods when children need more sleep', 'Times for sensory play only'], correct: 1 },
        { id: 'qq5', text: 'Which of these is a key characteristic of the Montessori prepared environment?', options: ['Teacher-centered layout', 'Fixed desks facing the board', 'Child-sized, accessible materials', 'Lots of colorful decorations'], correct: 2 },
      ]
    },
    {
      id: 'q2', courseId: 'c2', title: 'Spoken English Assessment',
      timeLimit: 10, passMark: 60,
      questions: [
        { id: 'qq6', text: 'Which sentence uses correct subject-verb agreement?', options: ['The children was playing.', 'The children were playing.', 'The children is playing.', 'The children be playing.'], correct: 1 },
        { id: 'qq7', text: 'What is the correct form? "She ___ to school every day."', options: ['go', 'goes', 'going', 'gone'], correct: 1 },
        { id: 'qq8', text: 'Which word is a conjunction?', options: ['Quickly', 'Beautiful', 'Because', 'Table'], correct: 2 },
        { id: 'qq9', text: 'Rising intonation is typically used for:', options: ['Statements', 'Yes/No questions', 'Commands', 'Exclamations'], correct: 1 },
        { id: 'qq10', text: 'Which is an example of active voice?', options: ['The book was read by Sara.', 'Sara read the book.', 'The book is being read.', 'The book had been read.'], correct: 1 },
      ]
    },
    {
      id: 'q3', courseId: 'c3', title: 'Phonics Knowledge Check',
      timeLimit: 10, passMark: 60,
      questions: [
        { id: 'qq11', text: 'Phonemic awareness is the ability to:', options: ['Recognize letters of the alphabet', 'Hear and manipulate sounds in spoken words', 'Read words silently', 'Write sentences correctly'], correct: 1 },
        { id: 'qq12', text: 'Which word has a short vowel sound?', options: ['cake', 'bite', 'cat', 'hope'], correct: 2 },
        { id: 'qq13', text: 'Blending means:', options: ['Breaking words into sounds', 'Putting sounds together to form words', 'Rhyming words', 'Spelling words'], correct: 1 },
        { id: 'qq14', text: 'The "ch" in "chair" is an example of:', options: ['A single phoneme', 'A digraph', 'A blend', 'A diphthong'], correct: 1 },
        { id: 'qq15', text: 'Which approach is BEST for phonics instruction?', options: ['Memorizing whole words only', 'Systematic, sequential phonics teaching', 'Random letter introduction', 'Visual-only methods'], correct: 1 },
      ]
    },
    {
      id: 'q4', courseId: 'c4', title: 'Child Psychology Basics',
      timeLimit: 15, passMark: 60,
      questions: [
        { id: 'qq16', text: "According to Piaget, what stage do most preschool children (ages 2-7) belong to?", options: ['Sensorimotor', 'Preoperational', 'Concrete Operational', 'Formal Operational'], correct: 1 },
        { id: 'qq17', text: "Vygotsky's 'Zone of Proximal Development' (ZPD) refers to:", options: ['What a child can do alone', 'What a child cannot do even with help', 'The gap between what a child can do alone vs. with guidance', 'A physical development stage'], correct: 2 },
        { id: 'qq18', text: 'Which theorist proposed 8 types of multiple intelligences?', options: ['Sigmund Freud', 'Erik Erikson', 'Howard Gardner', 'B.F. Skinner'], correct: 2 },
        { id: 'qq19', text: 'Attachment theory was primarily developed by:', options: ['Jean Piaget', 'John Bowlby', 'Lev Vygotsky', 'Abraham Maslow'], correct: 1 },
        { id: 'qq20', text: 'Which is a sign of healthy social-emotional development in a 4-year-old?', options: ['Preferring to always play alone', 'Showing empathy and sharing toys', 'Having no emotional reactions', 'Following rules perfectly'], correct: 1 },
      ]
    }
  ];
  dbSet(DB.QUIZZES, quizzes);

  /* --- Assignments --- */
  const assignments = [
    { id: 'a1', courseId: 'c1', title: 'Describe a Prepared Montessori Environment', description: 'Write a detailed description (300-500 words) of how you would set up a prepared environment for a 3-6 year old Montessori classroom. Include the areas you would create, materials you would provide, and how the arrangement promotes independence and learning.', dueDate: '2026-04-01', maxMarks: 20, teacherId: 'u2' },
    { id: 'a2', courseId: 'c2', title: 'Self-Introduction Speech', description: 'Write a 2-minute self-introduction speech in English (150-200 words). Focus on clear pronunciation, proper grammar, and confident delivery. Include your name, background, why you are taking this course, and your goals.', dueDate: '2026-04-05', maxMarks: 15, teacherId: 'u3' },
    { id: 'a3', courseId: 'c3', title: 'Phonics Lesson Plan', description: 'Create a detailed lesson plan for teaching the letter sound "S" to a group of 5-year-olds. Include: learning objectives, materials needed, introduction activity, main teaching activity, practice activity, assessment method, and accommodations for different learners.', dueDate: '2026-04-10', maxMarks: 25, teacherId: 'u2' },
    { id: 'a4', courseId: 'c4', title: 'Child Observation Report', description: 'Observe a child aged 3-7 years for 30 minutes in a natural setting (home, classroom, or playground). Write a structured observation report (400-600 words) documenting: physical, cognitive, social, and emotional behaviors observed. Relate your observations to the developmental theories covered in class.', dueDate: '2026-04-15', maxMarks: 30, teacherId: 'u3' },
  ];
  dbSet(DB.ASSIGNMENTS, assignments);

  /* --- Enrollments --- */
  const enrollments = [
    { id: 'e1', studentId: 'u4', courseId: 'c1', enrolledAt: '2024-02-05T00:00:00Z', progress: 50, status: 'active', feeStatus: 'paid' },
    { id: 'e2', studentId: 'u4', courseId: 'c3', enrolledAt: '2024-02-05T00:00:00Z', progress: 33, status: 'active', feeStatus: 'paid' },
    { id: 'e3', studentId: 'u5', courseId: 'c1', enrolledAt: '2024-02-08T00:00:00Z', progress: 25, status: 'active', feeStatus: 'pending' },
    { id: 'e4', studentId: 'u5', courseId: 'c2', enrolledAt: '2024-02-08T00:00:00Z', progress: 67, status: 'active', feeStatus: 'paid' },
    { id: 'e5', studentId: 'u6', courseId: 'c4', enrolledAt: '2024-02-12T00:00:00Z', progress: 100, status: 'completed', feeStatus: 'paid' },
    { id: 'e6', studentId: 'u6', courseId: 'c2', enrolledAt: '2024-02-12T00:00:00Z', progress: 33, status: 'active', feeStatus: 'pending' },
    { id: 'e7', studentId: 'u7', courseId: 'c1', enrolledAt: '2024-02-18T00:00:00Z', progress: 0,  status: 'active', feeStatus: 'pending' },
    { id: 'e8', studentId: 'u7', courseId: 'c4', enrolledAt: '2024-02-18T00:00:00Z', progress: 33, status: 'active', feeStatus: 'paid' },
  ];
  dbSet(DB.ENROLLMENTS, enrollments);

  /* --- Progress --- */
  const progress = [
    { id: 'p1', studentId: 'u4', lessonId: 'l1', completed: true, completedAt: '2024-02-10T00:00:00Z' },
    { id: 'p2', studentId: 'u4', lessonId: 'l2', completed: true, completedAt: '2024-02-12T00:00:00Z' },
    { id: 'p3', studentId: 'u4', lessonId: 'l8', completed: true, completedAt: '2024-02-14T00:00:00Z' },
    { id: 'p4', studentId: 'u5', lessonId: 'l1', completed: true, completedAt: '2024-02-10T00:00:00Z' },
    { id: 'p5', studentId: 'u5', lessonId: 'l5', completed: true, completedAt: '2024-02-11T00:00:00Z' },
    { id: 'p6', studentId: 'u5', lessonId: 'l6', completed: true, completedAt: '2024-02-13T00:00:00Z' },
    { id: 'p7', studentId: 'u6', lessonId: 'l11', completed: true, completedAt: '2024-02-13T00:00:00Z' },
    { id: 'p8', studentId: 'u6', lessonId: 'l12', completed: true, completedAt: '2024-02-15T00:00:00Z' },
    { id: 'p9', studentId: 'u6', lessonId: 'l13', completed: true, completedAt: '2024-02-17T00:00:00Z' },
    { id: 'p10', studentId: 'u6', lessonId: 'l5', completed: true, completedAt: '2024-02-19T00:00:00Z' },
  ];
  dbSet(DB.PROGRESS, progress);

  /* --- Notices --- */
  const notices = [
    { id: 'n1', title: 'Welcome to Ansha Montessori LMS!', body: 'We are delighted to launch our new online learning platform. All students can now access course materials, quizzes, and assignments from anywhere.', type: 'info', date: '2024-03-01T00:00:00Z' },
    { id: 'n2', title: 'New Course: Child Psychology Batch Starting', body: 'A new batch for Child Psychology course is starting on April 1st. Limited seats available — enroll now to secure your spot.', type: 'urgent', date: '2024-03-05T00:00:00Z' },
    { id: 'n3', title: 'Assignment Submission Reminder', body: 'Please ensure all assignments are submitted before the due date. Late submissions may result in reduced marks.', type: 'normal', date: '2024-03-08T00:00:00Z' },
  ];
  dbSet(DB.NOTICES, notices);

  localStorage.setItem('lms_seeded', 'true');
  console.log('✅ Ansha Montessori LMS: Seed data initialized');
}

// Auto-init on load
initSeedData();
