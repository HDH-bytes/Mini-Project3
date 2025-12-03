// assignmentManager.js
// prints notifications for assignment status changes
class Observer {
  notify(studentName, assignmentName, statusText) {
    console.log(`Observer → ${studentName}, ${assignmentName} ${statusText}`);
  }
}

// represents an assignment with private grade and status changes
class Assignment {
  constructor(assignmentName) {
    this.assignmentName = assignmentName;
    this.status = "created";          // initial internal state
    this._grade = undefined;          // private-by-convention
  }

  setGrade(grade) {
    this._grade = grade;              // store private grade
    this.status = grade > 50 ? "pass" : "fail";  // required logic
  }
}

// stores student info, assignments, observer, and grade calculations
class Student {
  constructor(fullName, email, observer) {
    this.fullName = fullName;
    this.email = email;
    this.assignmentStatuses = [];           // list of Assignment objects
    this.overallGrade = 0;                  // average grade
    this._observer = observer;              // observer for notifications
    this._gradesByAssignment = {};          // assignmentName → grade
    this._submittedAssignments = new Set(); // track submissions
  }

  setFullName(newName) {
    this.fullName = newName;
  }

  setEmail(newEmail) {
    this.email = newEmail;
  }

  // find assignment object by name
  _findAssignment(name) {
    return this.assignmentStatuses.find(a => a.assignmentName === name);
  }

  // create assignment if missing or set grade if provided
  updateAssignmentStatus(name, grade) {
    let a = this._findAssignment(name);

    if (!a) {
      a = new Assignment(name);
      a.status = "released";
      this.assignmentStatuses.push(a);
      this._observer.notify(this.fullName, name, "has been released.");
    }

    if (grade !== undefined) {
      a.setGrade(grade);
      this._gradesByAssignment[name] = grade;

      if (grade > 50) {
        this._observer.notify(this.fullName, name, "has passed.");
      } else {
        this._observer.notify(this.fullName, name, "has failed.");
      }

      this._recalculateOverallGrade();
    }
  }

  // return assignment status or Pass/Fail if graded
  getAssignmentStatus(name) {
    const a = this._findAssignment(name);

    if (!a) return "Hasn't been assigned";

    const grade = this._gradesByAssignment[name];

    if (grade !== undefined) {
      a.status = grade > 50 ? "Pass" : "Fail";
      return a.status;
    }

    return a.status;
  }

  // mark working and auto-submit after 500ms if not already submitted
  startWorking(name) {
    let a = this._findAssignment(name);

    if (!a) {
      a = new Assignment(name);
      a.status = "released";
      this.assignmentStatuses.push(a);
      this._observer.notify(this.fullName, name, "has been released.");
    }

    a.status = "working";
    this._observer.notify(this.fullName, name, `is working on ${name}.`);

    setTimeout(() => {
      if (!this._submittedAssignments.has(name)) {
        this.submitAssignment(name);
      }
    }, 500);
  }

  // submit assignment, then grade after 500ms
  submitAssignment(name) {
    let a = this._findAssignment(name);

    if (!a) {
      a = new Assignment(name);
      a.status = "released";
      this.assignmentStatuses.push(a);
      this._observer.notify(this.fullName, name, "has been released.");
    }

    if (this._submittedAssignments.has(name)) return;

    this._submittedAssignments.add(name);

    a.status = "submitted";
    this._observer.notify(this.fullName, name, `has submitted ${name}.`);

    setTimeout(() => {
      const grade = Math.floor(Math.random() * 101);
      a.setGrade(grade);
      this._gradesByAssignment[name] = grade;

      if (grade > 50) {
        this._observer.notify(this.fullName, name, "has passed.");
      } else {
        this._observer.notify(this.fullName, name, "has failed.");
      }

      this._recalculateOverallGrade();
    }, 500);
  }

  // compute average grade across all graded assignments
  _recalculateOverallGrade() {
    const grades = Object.values(this._gradesByAssignment);
    if (grades.length === 0) {
      this.overallGrade = 0;
      return;
    }
    const sum = grades.reduce((acc, g) => acc + g, 0);
    this.overallGrade = sum / grades.length;
  }

  getGrade() {
    this._recalculateOverallGrade();
    return this.overallGrade;
  }
}


// stores students and manages  assignment actions
class ClassList {
  constructor(observer) {
    this.students = [];        // array of Student objects
    this._observer = observer; // used for reminders
  }

  addStudent(student) {
    this.students.push(student);
    console.log(`${student.fullName} has been added to the classlist.`);
  }

  removeStudent(fullName) {
    this.students = this.students.filter(s => s.fullName !== fullName);
  }

  findStudentByName(fullName) {
    return this.students.find(s => s.fullName === fullName);
  }

  // determine which students have outstanding assignments
  findOutstandingAssignments(name) {
    const result = [];

    this.students.forEach(s => {
      if (name) {
        const a = s.assignmentStatuses.find(x => x.assignmentName === name);
        if (!a) {
          result.push(s.fullName);
        } else {
          const done = ["submitted", "pass", "fail", "Pass", "Fail"].includes(a.status);
          if (!done) result.push(s.fullName);
        }
      } else {
        const outstanding = s.assignmentStatuses.some(a => {
          const done = ["submitted", "pass", "fail", "Pass", "Fail"].includes(a.status);
          return !done && ["released", "working", "final reminder"].includes(a.status);
        });
        if (outstanding) result.push(s.fullName);
      }
    });

    return result;
  }

  // release assignments asynchronously using Promise.all
  releaseAssignmentsParallel(names) {
    const tasks = names.map(n =>
      new Promise(resolve =>
        setTimeout(() => {
          this.students.forEach(s => s.updateAssignmentStatus(n));
          resolve();
        }, 0)
      )
    );

    return Promise.all(tasks);
  }

  // send reminder and force submission if needed
  sendReminder(name) {
    this.students.forEach(s => {
      let a = s.assignmentStatuses.find(x => x.assignmentName === name);

      if (!a) {
        a = new Assignment(name);
        a.status = "released";
        s.assignmentStatuses.push(a);
      }

      const done = ["submitted", "pass", "fail", "Pass", "Fail"].includes(a.status);

      if (!done) {
        a.status = "final reminder";
        this._observer.notify(s.fullName, name, "has received a final reminder.");
        s.submitAssignment(name);
      }
    });
  }
}
//exporting
module.exports = {
  Observer,
  Assignment,
  Student,
  ClassList
};
