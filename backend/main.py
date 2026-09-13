from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

courses = []
next_course_id = 1


class CreateCourse(BaseModel):
    course_code: str
    name: str

class UpdateCourse(BaseModel):
    course_code: str | None = None
    name: str | None = None

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def main_check():
    return {"message": "SyllabusTrack API"}

@app.get("/api/courses")    
def get_courses():
    return courses

@app.post("/api/courses")
def add_course(course: CreateCourse):
    global next_course_id
    new_course = {
        "id": next_course_id,
        "course_code": course.course_code,
        "name": course.name
    }

    courses.append(new_course)
    next_course_id += 1
    return new_course

@app.get("/api/courses/{course_id}")
def get_course(course_id: int):
    for course in courses:
        if course["id"] == course_id:
            return course
    raise HTTPException(status_code=404, detail="Course not found")

@app.delete("/api/courses/{course_id}")
def delete_course(course_id: int):
    for course in courses:
        if course["id"] == course_id:
            courses.remove(course)
            return {"message": "Course deleted"}
    raise HTTPException(status_code=404, detail="Course not found")

@app.patch("/api/courses/{course_id}")
def update_course(course_id: int, updates: UpdateCourse):
    for course in courses:
        if course["id"] == course_id:
            if updates.course_code is not None:
                course["course_code"] = updates.course_code
            if updates.name is not None:
                course["name"] = updates.name
            return course
    raise HTTPException(status_code=404, detail="Course not found")