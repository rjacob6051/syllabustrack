import "./App.css";
import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"

type Course = {
  id: number;
  course_code: string;
  name: string;
};

type Assignment = {
  id: number;
  course_id: number;
  title: string;
  due_date: string;
  type: string;
};

const courseColors = ["red", "blue", "green", "purple", "orange"]

function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
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
    const course = courses.find(
      (course) => course.id === assignment.course_id
    );
    const courseColor = course ? courseColors[course.id % courseColors.length]: "gray";
    return{
      title: assignment.title,
      date: assignment.due_date,
      color: courseColor
    };
  })

  return (
    <div className="outerwrapper">
      <h1>SyllabusTrack</h1>

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
              </li>
            ))}
          </ul>
        </div>
        <div className="calendar">
          <h2>Calendar</h2>
          <FullCalendar plugins={[dayGridPlugin]} initialView="dayGridMonth" events={calendarEvents}></FullCalendar>
        </div>
        <div className="upcoming">
          <h2>Upcoming</h2>
          <ul>
            {selectedAssignments.map((assignment) => {
              const readableDate = new Date(`${assignment.due_date}T00:00:00`).toLocaleDateString("en-US", {month: "short", day: "numeric"})
              const course = courses.find(
                (course) => course.id === assignment.course_id
              );
              const courseColor = course ? courseColors[course.id % courseColors.length]: "gray";
              return (
                <li key={assignment.id}>
                  <span className="courseBullet" style={{backgroundColor: courseColor}}></span>
                  {readableDate} - {assignment.title}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
