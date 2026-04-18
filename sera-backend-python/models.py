from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)

class Hospital(Base):
    __tablename__ = "hospitals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    city = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    totalBeds = Column(Integer)
    ventilators = Column(Integer)
    icuBeds = Column(Integer)
    ambulances = Column(Integer)
    staff = Column(Integer)
    specialties = Column(String)

class Emergency(Base):
    __tablename__ = "emergencies"
    id = Column(Integer, primary_key=True, index=True)
    patientName = Column(String)
    age = Column(Integer, nullable=True)
    contact = Column(String, nullable=True)
    emergencyType = Column(String)
    severity = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    description = Column(String, nullable=True)
    status = Column(String, default="PENDING")
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    allocatedHospital = Column(String, nullable=True)

class Allocation(Base):
    __tablename__ = "allocations"
    id = Column(Integer, primary_key=True, index=True)
    emergencyId = Column(Integer, ForeignKey("emergencies.id"))
    hospitalId = Column(Integer, ForeignKey("hospitals.id"))
    hospitalName = Column(String)
    eta = Column(Integer)
    distance = Column(Float)
    score = Column(Float)
    reason = Column(String)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    allocatedBy = Column(String)
