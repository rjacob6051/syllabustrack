import "./App.css";
import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

type Course = {
  id: number;
  course_code: string;
  name: string;
  color: string;
};

type Assignment = {
  id: number;
  course_id: number;
  title: string;
  due_date: string;
  type: string;
  completed: boolean;
};

type ExtractedAssignment = {
  title: string;
  due_date: string;
  type: string;
};

const courseColors = ["red", "blue", "green", "purple", "orange"];

function App() {
  const [screen, setScreen] = useState<
    "dashboard" | "upload" | "review" | "completed"
  >("dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [uploadCourseId, setUploadCourseId] = useState<number | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [extractedAssignments, setExtractedAssignments] = useState<
    ExtractedAssignment[]
  >([]);
  const [selectedCourseColoring, setSelectedCourseColoring] = useState<
    number | null
  >(null);

  async function loadCourses() {
    const response = await fetch("http://127.0.0.1:8000/api/courses");
    const data = await response.json();
    setCourses(data);
  }
  async function loadAssignments() {
    const response = await fetch("http://127.0.0.1:8000/api/assignments");
    const data = await response.json();
    setAssignments(data);
  }
  useEffect(() => {
    loadCourses();
    loadAssignments();
  }, []);

  async function saveReviewedAssignments() {
    const response = await fetch(
      `http://127.0.0.1:8000/api/courses/${uploadCourseId}/assignments/bulk`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: extractedAssignments }),
      }
    );
    await response.json();
    await loadAssignments();
    setUploadCourseId(null);
    setUploadFile(null);
    setExtractedAssignments([]);
    setScreen("dashboard");
  }

  async function changeCourseColor(courseId: number, color: string) {
    const response = await fetch(
      `http://127.0.0.1:8000/api/courses/${courseId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ color: color }),
      }
    );
    await response.json();
    await loadCourses();
  }

  async function completeAssignment(assignmentId: number) {
    const response = await fetch(
      `http://127.0.0.1:8000/api/assignments/${assignmentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: true }),
      }
    );
    await response.json();
    await loadAssignments();
  }

  async function uploadSyllabus() {
    const formData = new FormData();
    if (uploadFile === null) {
      return;
    }
    formData.append("file", uploadFile);
    const response = await fetch(
      `http://127.0.0.1:8000/api/courses/${uploadCourseId}/syllabus`,
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();
    setExtractedAssignments(data.assignments);
    setScreen("review");
  }

  const selectedAssignments = assignments
    .filter((assignment) => {
      if (selectedCourses.length == 0) {
        return true;
      } else {
        return selectedCourses.includes(assignment.course_id);
      }
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const calendarEvents = selectedAssignments.map((assignment) => {
    const course = courses.find((course) => course.id === assignment.course_id);
    const courseColor = course?.color ?? "gray";
    return {
      title: assignment.title,
      date: assignment.due_date,
      color: courseColor,
      classNames: assignment.completed ? ["completed-assignment"] : [],
    };
  });

  if (screen == "upload") {
    return (
      <div className="uploadwrapper">
        <div>Im uploading a syllabus!</div>
        <select
          onChange={(event) => setUploadCourseId(Number(event.target.value))}
        >
          <option value="">Choose a course:</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.course_code}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
        ></input>
        <button onClick={uploadSyllabus}>Upload Syllabus</button>
      </div>
    );
  }
  if (screen == "review") {
    return (
      <div className="uploadwrapper">
        <div>Im reviewing my assignments!</div>
        {extractedAssignments.map((assignment, index) => (
          <div key={index}>
            <button
              onClick={() =>
                setExtractedAssignments(
                  extractedAssignments.filter(
                    (_, itemIndex) => itemIndex !== index
                  )
                )
              }
            >
              Remove Assignment
            </button>
            <input
              type="text"
              value={assignment.title}
              onChange={(event) => {
                setExtractedAssignments(
                  extractedAssignments.map((item, itemIndex) => {
                    if (itemIndex === index) {
                      return { ...item, title: event.target.value };
                    }
                    return item;
                  })
                );
              }}
            ></input>
            -
            <input
              type="date"
              value={assignment.due_date}
              onChange={(event) => {
                setExtractedAssignments(
                  extractedAssignments.map((item, itemIndex) => {
                    if (itemIndex === index) {
                      return { ...item, due_date: event.target.value };
                    }
                    return item;
                  })
                );
              }}
            ></input>
            -
            <select
              value={assignment.type}
              onChange={(event) => {
                setExtractedAssignments(
                  extractedAssignments.map((item, itemIndex) => {
                    if (itemIndex === index) {
                      return { ...item, type: event.target.value };
                    }
                    return item;
                  })
                );
              }}
            >
              <option value="homework">homework</option>
              <option value="paper">paper</option>
              <option value="presentation">presentation</option>
              <option value="project">project</option>
              <option value="quiz">quiz</option>
              <option value="exam">exam</option>
              <option value="other">other</option>
            </select>
          </div>
        ))}
        <button onClick={saveReviewedAssignments}>Save</button>
      </div>
    );
  }
  if (screen == "completed") {
    return (
      <div className="completedwrapper">
        <div>Your Completed Assignments</div>
        <ul className="completedassignments">
          {assignments
            .filter((assignment) => assignment.completed)
            .map((assignment) => (
              <li key={assignment.id}>{assignment.title}</li>
            ))}
        </ul>
        <button onClick={() => setScreen("dashboard")}>Return</button>
      </div>
    );
  } else {
    return (
      <div className="outerwrapper">
        <h1>SyllabusTrack</h1>
        <button onClick={() => setScreen("upload")}>Upload Syllabus</button>
        <button onClick={() => setScreen("completed")}>View Completed</button>

        <div className="dashboard">
          <div className="course-selection">
            <h2>Courses</h2>
            <ul>
              {courses.map((course) => (
                <li key={course.id}>
                  <label>
                    <input
                      type="checkbox"
                      onChange={() => {
                        if (selectedCourses.includes(course.id)) {
                          setSelectedCourses(
                            selectedCourses.filter((id) => id !== course.id)
                          );
                        } else {
                          setSelectedCourses([...selectedCourses, course.id]);
                        }
                      }}
                    ></input>
                    {course.course_code}
                  </label>
                  <span
                    className="courseBullet"
                    style={{ backgroundColor: course.color }}
                    onClick={() => {
                      setSelectedCourseColoring(course.id);
                    }}
                  ></span>
                  {selectedCourseColoring === course.id && (
                    <div>
                      Choose Color
                      {courseColors.map((color) => (
                        <span
                          key={color}
                          className="courseBullet"
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            changeCourseColor(course.id, color);
                            setSelectedCourseColoring(null);
                          }}
                        ></span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="calendar">
            <h2>Calendar</h2>
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
            ></FullCalendar>
          </div>
          <div className="upcoming">
            <h2>Upcoming</h2>
            <ul>
              {selectedAssignments
                .filter((assignment) => {
                  if (assignment.completed == true) {
                    return false;
                  }
                  const assignmentTime = new Date(
                    `${assignment.due_date}T00:00:00`
                  ).getTime();

                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const todayTime = today.getTime();
                  const deadline = todayTime + (31 * 24 * 60 * 60 * 1000);

                  return assignmentTime >= todayTime && assignmentTime <= deadline;
                })
                .map((assignment) => {
                  const readableDate = new Date(
                    `${assignment.due_date}T00:00:00`
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const course = courses.find(
                    (course) => course.id === assignment.course_id
                  );
                  const courseColor = course?.color ?? "gray";
                  return (
                    <li key={assignment.id}>
                      <span
                        className="courseBullet"
                        style={{ backgroundColor: courseColor }}
                      ></span>
                      {readableDate} - {assignment.title} -{" "}
                      <button onClick={() => completeAssignment(assignment.id)}>
                        Mark Completed
                      </button>
                    </li>
                  );
                })}
            </ul>
            <h2>Past Due</h2>
            <ul>
              {selectedAssignments
                .filter((assignment) => {
                  if (assignment.completed == true) {
                    return false;
                  }
                  const assignmentTime = new Date(
                    `${assignment.due_date}T00:00:00`
                  ).getTime();

                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const todayTime = today.getTime();

                  return assignmentTime < todayTime
                })
                .map((assignment) => {
                  const readableDate = new Date(
                    `${assignment.due_date}T00:00:00`
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const course = courses.find(
                    (course) => course.id === assignment.course_id
                  );
                  const courseColor = course?.color ?? "gray";
                  return (
                    <li key={assignment.id}>
                      <span
                        className="courseBullet"
                        style={{ backgroundColor: courseColor }}
                      ></span>
                      {readableDate} - {assignment.title} -{" "}
                      <button onClick={() => completeAssignment(assignment.id)}>
                        Mark Completed
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
