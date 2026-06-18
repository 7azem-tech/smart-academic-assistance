const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = path.resolve(__dirname, 'vector_db.sqlite');
const db = new sqlite3.Database(dbPath);

const enrolledCourses = [
    {
      code: "CS101",
      name: "Object Oriented Programming",
      instructor: "Dr. Yasser Abdelhameed",
      progress: 65,
      nextClass: "Tomorrow at 10:00 AM",
      unreadAnnouncements: 2,
      pendingAssignments: 1,
      color: "from-blue-500 to-blue-600",
      students: 45,
      rating: 4.8,
      materials: 24,
      videos: 12,
    },
    {
      code: "MATH204",
      name: "Mathematics-3",
      instructor: "Dr. Manal Shaban",
      progress: 58,
      nextClass: "Oct 29 at 2:00 PM",
      unreadAnnouncements: 1,
      pendingAssignments: 2,
      color: "from-purple-500 to-purple-600",
      students: 60,
      rating: 4.6,
      materials: 18,
      videos: 8,
    },
    {
      code: "DB301",
      name: "Database Systems",
      instructor: "Dr. Kamal Hamza",
      progress: 72,
      nextClass: "Oct 30 at 12:00 PM",
      unreadAnnouncements: 0,
      pendingAssignments: 0,
      color: "from-green-500 to-green-600",
      students: 38,
      rating: 4.9,
      materials: 30,
      videos: 15,
    },
    {
      code: "SE202",
      name: "Software Engineering",
      instructor: "Dr. Mayar Ali",
      progress: 45,
      nextClass: "Oct 31 at 9:00 AM",
      unreadAnnouncements: 3,
      pendingAssignments: 1,
      color: "from-orange-500 to-orange-600",
      students: 42,
      rating: 4.7,
      materials: 20,
      videos: 10,
    },
  ];

db.serialize(() => {
    // Check if courses already exist
    db.get('SELECT COUNT(*) as count FROM courses', [], (err, row) => {
        if (!err && row && row.count === 0) {
            console.log("Seeding courses...");
            enrolledCourses.forEach(c => {
                const id = crypto.randomUUID();
                db.run(`INSERT INTO courses (id, code, name, instructor, progress, nextClass, unreadAnnouncements, pendingAssignments, color, students, rating, materials, videos) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, c.code, c.name, c.instructor, c.progress, c.nextClass, c.unreadAnnouncements, c.pendingAssignments, c.color, c.students, c.rating, c.materials, c.videos]);

                // Seed some discussions
                db.run(`INSERT INTO lms_discussions (id, courseId, title, author, replies, lastActivity, likes) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [crypto.randomUUID(), id, "Welcome to " + c.code, "Admin", 0, "Just now", 0]
                );
            });
            console.log("Done seeding.");
        } else {
            console.log("Database already has courses.");
        }
    });
});
