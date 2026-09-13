from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

courses = []
next_course_id = 1


class CreateCourse(BaseModel):
    course_code: str
    name: str

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
    next_course_id+= 1
    return new_course

@app.get("/api/courses/{course_id}")
def get_course(course_id: int):
    for course in courses:
        if course["id"] == course_id:
            return course