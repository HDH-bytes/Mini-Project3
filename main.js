// Import (Node.js syntax)
const { Observer, ClassList, Student } = require("./assignmentManager");

// Create system
const observer = new Observer();
const classList = new ClassList(observer);

// Create students
const s1 = new Student("Alice Smith", "alice@example.com", observer);
const s2 = new Student("Bob Jones", "bob@example.com", observer);

// Add students
classList.addStudent(s1);
classList.addStudent(s2);

// Release assignments in parallel
classList.releaseAssignmentsParallel(["A1", "A2"]).then(() => {
  s1.startWorking("A1");
  s2.startWorking("A2");

  // Send reminder after 200ms
  setTimeout(() => classList.sendReminder("A1"), 200);
});