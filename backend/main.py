from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sqlite3
from pathlib import Path
DB_PATH = Path(__file__).resolve().parent / "syllabustrack.db"

app = FastAPI()

connection = sqlite3.connect(DB_PATH)
connection.row_factory = sqlite3.Row
connection.execute("PRAGMA foreign_keys = ON")
cursor = connection.cursor()
cursor.execute("""
CREATE TABLE IF NOT EXISTS courses (
id INTEGER PRIMARY KEY AUTOINCREMENT,
course_code TEXT NOT NULL,
name TEXT NOT NULL
)
""")
cursor.execute("""
CREATE TABLE IF NOT EXISTS assignments (
id INTEGER PRIMARY KEY AUTOINCREMENT,
course_id INTEGER NOT NULL,
title TEXT NOT NULL,
due_date TEXT NOT NULL,
type TEXT NOT NULL,
FOREIGN KEY (course_id) references courses(id)
)
""")
connection.commit()
connection.close()

def get_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection

def course_doesnt_exist(cursor, course_id):
    cursor.execute(
        """
        SELECT * FROM courses
        WHERE id = ?
        """,
        (course_id,)
    )
    return cursor.fetchone() is None

def assignment_doesnt_exist(cursor, assignment_id):
    cursor.execute(
        """
        SELECT * FROM courses
        WHERE id = ?
        """,
        (assignment_id,)
    )
    return cursor.fetchone() is None

class CreateCourse(BaseModel):
    course_code: str
    name: str

class UpdateCourse(BaseModel):
    course_code: str | None = None
    name: str | None = None

class CreateAssignment(BaseModel):
    title: str
    due_date: str
    type: str

class UpdateAssignment(BaseModel):
    title: str | None = None
    due_date: str | None = None
    type: str | None = None

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

@app.post("/api/courses/{course_id}/assignments")
def add_assignment(course_id: int, assignment: CreateAssignment):
    connection = get_db()
    cursor = connection.cursor()
    if course_doesnt_exist(cursor, course_id):
        connection.close()
        raise HTTPException(status_code=404, detail="Course not found")
    cursor.execute(
        """
    INSERT INTO assignments (course_id, title, due_date, type)
    VALUES (?, ?, ?, ?)
    """,
    (course_id, assignment.title, assignment.due_date, assignment.type)
    )
    connection.commit()
    new_assignment = {
        "id": cursor.lastrowid,
        "course_id": course_id,
        "title": assignment.title,
        "due_date": assignment.due_date,
        "type": assignment.type
    }
    connection.close()
    return new_assignment

@app.get("/api/courses/{course_id}/assignments")    
def get_assignments(course_id: int):
    connection = get_db()
    cursor = connection.cursor()
    if course_doesnt_exist(cursor, course_id):
        connection.close()
        raise HTTPException(status_code=404, detail="Course not found")
    cursor.execute(
    """
    SELECT * FROM assignments
    WHERE course_id = ?
    """,
    (course_id, )
    )
    rows = cursor.fetchall()
    connection.close()
    return [dict(row) for row in rows]

@app.patch("/api/assignments/{assignment_id}")
def update_assignment(assignment_id: int, updates: UpdateAssignment):
    connection = get_db()
    cursor = connection.cursor()
    if assignment_doesnt_exist(cursor, assignment_id):
        connection.close()
        raise HTTPException(status_code=404, detail="Assignment not found")
    if updates.title is not None:
        cursor.execute(
            """
            UPDATE assignments
            SET title = ?
            WHERE id = ?
            """,
            (updates.title, assignment_id)
            )
    if updates.due_date is not None:
        cursor.execute(
            """
            UPDATE assignments
            SET due_date = ?
            WHERE id = ?
            """,
            (updates.due_date, assignment_id)
            )
    if updates.type is not None:
        cursor.execute(
            """
            UPDATE assignments
            SET type = ?
            WHERE id = ?
            """,
            (updates.type, assignment_id)
            )
    connection.commit()
    cursor.execute(
        """
    SELECT * FROM assignments WHERE id = ?
    """,
    (assignment_id,)
    )
    row = cursor.fetchone()
    connection.close()
    return dict(row)

@app.delete("/api/assignments/{assignment_id}")
def delete_assignment(assignment_id: int):
    connection = get_db()
    cursor = connection.cursor()
    cursor.execute(
        """
        DELETE FROM assignments WHERE id = ?
        """,
        (assignment_id,)
        )
    if cursor.rowcount == 0:
        connection.close()
        raise HTTPException(status_code=404, detail="Assignment not found")
    connection.commit()
    connection.close()
    return{"message": "Assignment Deleted"}