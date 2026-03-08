from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Integer, Float
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# 1. Khởi tạo Database SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./students.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Định nghĩa Model (Bảng dữ liệu)
class DBStudent(Base):
    __tablename__ = "students"
    student_id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    birth_year = Column(Integer)
    major = Column(String)
    gpa = Column(Float)

Base.metadata.create_all(bind=engine)

# 3. Khởi tạo FastAPI App & CORS
app = FastAPI(title="Student Management API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép React gọi API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Pydantic Schemas (Validate dữ liệu đầu vào)
class StudentCreate(BaseModel):
    student_id: str
    name: str
    birth_year: int
    major: str
    gpa: float

# Dependency lấy Session DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 5. Các Endpoints (CRUD)
@app.get("/students", response_model=list[StudentCreate])
def get_students(db: Session = Depends(get_db)):
    return db.query(DBStudent).all()

@app.post("/students", response_model=StudentCreate)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(DBStudent).filter(DBStudent.student_id == student.student_id).first()
    if db_student:
        raise HTTPException(status_code=400, detail="Student ID already registered")
    new_student = DBStudent(**student.model_dump())
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student

@app.put("/students/{student_id}", response_model=StudentCreate)
def update_student(student_id: str, student: StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(DBStudent).filter(DBStudent.student_id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    for key, value in student.model_dump().items():
        setattr(db_student, key, value)
    
    db.commit()
    db.refresh(db_student)
    return db_student

@app.delete("/students/{student_id}")
def delete_student(student_id: str, db: Session = Depends(get_db)):
    db_student = db.query(DBStudent).filter(DBStudent.student_id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(db_student)
    db.commit()
    return {"message": "Student deleted successfully"}