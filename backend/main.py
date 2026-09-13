from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sqlite3
from pathlib import Path
DB_PATH = Path(__file__).resolve().parent / "syllabustrack.db"

app = FastAPI()

connection = sqlite3.connect(DB_PATH)
connection.row_factory = sqlite3.Row
cursor = connection.cursor()
cursor.execute("""
CREATE TABLE IF NOT EXISTS courses (
id INTEGER PRIMARY KEY AUTOINCREMENT,
course_code TEXT NOT NULL,
name TEXT NOT NULL
)
""")
connection.commit()
connection.close()

def get_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection

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
    connection = get_db()
    cursor = connection.cursor()
    cursor.execute(
    """
    SELECT * FROM courses
    """
    )
    rows = cursor.fetchall()
    connection.close()
    return [dict(row) for row in rows]

@app.post("/api/courses")
def add_course(course: CreateCourse):
    connection = get_db()
    cursor = connection.cursor()
    cursor.execute(
        """
    INSERT INTO courses (course_code, name)
    VALUES (?, ?)
    """,
    (course.course_code, course.name)
    )
    connection.commit()
    new_course = {
        "id": cursor.lastrowid,
        "course_code": course.course_code,
        "name": course.name
    }
    connection.close()
    return new_course

@app.get("/api/courses/{course_id}")
def get_course(course_id: int):
    connection = get_db()
    cursor = connection.cursor()
    cursor.execute(
        """
    SELECT * FROM courses WHERE id = ?
    """,
    (course_id,)
    )
    row = cursor.fetchone()
    connection.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return dict(row)

@app.delete("/api/courses/{course_id}")
def delete_course(course_id: int):
    connection = get_db()
    cursor = connection.cursor()
    cursor.execute(
        """
        DELETE FROM courses WHERE id = ?
        """,
        (course_id,)
        )
    if cursor.rowcount == 0:
        connection.close()
        raise HTTPException(status_code=404, detail="Course not found")
    connection.commit()
    connection.close()
    return{"message": "Course Deleted"}

@app.patch("/api/courses/{course_id}")
def update_course(course_id: int, updates: UpdateCourse):
    connection = get_db()
    cursor = connection.cursor()
    cursor.execute(
        """
    SELECT * FROM courses WHERE id = ?
    """,
    (course_id,)
    )
    row = cursor.fetchone()
    if row is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Course not found")
    if updates.course_code is not None:
        cursor.execute(
            """
            UPDATE courses
            SET course_code = ?
            WHERE id = ?
            """,
            (updates.course_code, course_id)
            )
    if updates.name is not None:
        cursor.execute(
            """
            UPDATE courses
            SET name = ?
            WHERE id = ?
            """,
            (updates.name, course_id)
            )
    connection.commit()
    cursor.execute(
        """
    SELECT * FROM courses WHERE id = ?
    """,
    (course_id,)
    )
    row = cursor.fetchone()
    connection.close()
    return dict(row)