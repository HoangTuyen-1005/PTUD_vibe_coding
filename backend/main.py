import io
import csv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Integer, Float, ForeignKey, func
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship

# 1. Khởi tạo Database SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./students.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Định nghĩa Model (Bảng dữ liệu)
class DBClass(Base):
    __tablename__ = "classes"
    class_id = Column(String, primary_key=True, index=True)
    class_name = Column(String)
    advisor = Column(String)
    students = relationship("DBStudent", back_populates="student_class")

class DBStudent(Base):
    __tablename__ = "students"
    student_id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    birth_year = Column(Integer)
    major = Column(String)
    gpa = Column(Float)
    class_id = Column(String, ForeignKey("classes.class_id")) # Thêm khóa ngoại
    
    student_class = relationship("DBClass", back_populates="students")

Base.metadata.create_all(bind=engine)

# 3. Khởi tạo FastAPI App & CORS
app = FastAPI(title="Student Management API - Part 2")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Pydantic Schemas
class ClassCreate(BaseModel):
    class_id: str
    class_name: str
    advisor: str

class StudentCreate(BaseModel):
    student_id: str
    name: str
    birth_year: int
    major: str
    gpa: float
    class_id: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 5. Các Endpoints cho Lớp học (Class)
@app.post("/classes", response_model=ClassCreate)
def create_class(cls: ClassCreate, db: Session = Depends(get_db)):
    new_class = DBClass(**cls.model_dump())
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class

@app.get("/classes", response_model=list[ClassCreate])
def get_classes(db: Session = Depends(get_db)):
    return db.query(DBClass).all()

# 6. Các Endpoints cho Sinh viên (Đã tích hợp Tìm kiếm)
@app.get("/students", response_model=list[StudentCreate])
def get_students(name: str = None, db: Session = Depends(get_db)):
    query = db.query(DBStudent)
    if name: # Chức năng tìm kiếm theo tên
        query = query.filter(DBStudent.name.ilike(f"%{name}%"))
    return query.all()

@app.post("/students", response_model=StudentCreate)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    new_student = DBStudent(**student.model_dump())
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student

@app.put("/students/{student_id}", response_model=StudentCreate)
def update_student(student_id: str, student: StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(DBStudent).filter(DBStudent.student_id == student_id).first()
    for key, value in student.model_dump().items():
        setattr(db_student, key, value)
    db.commit()
    db.refresh(db_student)
    return db_student

@app.delete("/students/{student_id}")
def delete_student(student_id: str, db: Session = Depends(get_db)):
    db_student = db.query(DBStudent).filter(DBStudent.student_id == student_id).first()
    db.delete(db_student)
    db.commit()
    return {"message": "Deleted"}

# 7. Endpoint Thống kê (Statistics)
@app.get("/statistics")
def get_statistics(db: Session = Depends(get_db)):
    total_students = db.query(DBStudent).count()
    avg_gpa = db.query(func.avg(DBStudent.gpa)).scalar() or 0.0
    
    # Số sinh viên theo ngành
    majors_count = db.query(DBStudent.major, func.count(DBStudent.student_id)).group_by(DBStudent.major).all()
    by_major = {major: count for major, count in majors_count}
    
    return {
        "total_students": total_students,
        "average_gpa": round(avg_gpa, 2),
        "by_major": by_major
    }

# 8. Endpoint Xuất CSV (Export)
@app.get("/export")
def export_students_csv(db: Session = Depends(get_db)):
    students = db.query(DBStudent).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Ghi header
    writer.writerow(["student_id", "name", "birth_year", "major", "gpa", "class_id"])
    
    # Ghi data
    for s in students:
        writer.writerow([s.student_id, s.name, s.birth_year, s.major, s.gpa, s.class_id])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]), 
        media_type="text/csv", 
        headers={"Content-Disposition": "attachment; filename=students.csv"}
    )