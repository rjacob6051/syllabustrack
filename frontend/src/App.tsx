import './App.css'
import {useState, useEffect} from 'react'

type Course = {
  id: number
  course_code: string
  name: string
}

function App() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourses, setSelectedCourses]= useState<number[]>([])
  async function loadCourses() {
    const response = await fetch("http://127.0.0.1:8000/api/courses")
    const data = await response.json()
    setCourses(data)
  }
  useEffect(() => {
    loadCourses()
  }, [])
  return (
    <div>
      <h1>SyllabusTrack</h1>
      <ul>
        {courses.map((course) => (
          <li key={course.id}>
            <label>
              <input type="checkbox"
              onChange={() => {
                if (selectedCourses.includes(course.id)) {
                  setSelectedCourses(
                    selectedCourses.filter((id) => id !== course.id)
                  )
                }
                else {
                  setSelectedCourses([...selectedCourses, course.id])
                }
              }}></input>
              {course.course_code} - {course.name}
            </label>
          </li>
        ))}
      </ul>
      <p>Selected Course: {selectedCourses}</p>
    </div>
  )
}

export default App