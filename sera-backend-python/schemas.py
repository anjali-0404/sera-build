from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    token: str
    name: str
    email: str

class LoginRequest(BaseModel):
    email: str
    password: str

class HospitalBase(BaseModel):
    name: str
    city: str
    latitude: float
    longitude: float

class Hospital(HospitalBase):
    id: int
    totalBeds: int
    ventilators: int
    icuBeds: int
    ambulances: int
    staff: int
    specialties: str
    class Config:
        from_attributes = True

class EmergencyCreate(BaseModel):
    patientName: str
    age: Optional[int] = None
    contact: Optional[str] = None
    emergencyType: str
    severity: str
    latitude: float
    longitude: float
    description: Optional[str] = None

class Emergency(EmergencyCreate):
    id: int
    status: str
    createdAt: datetime
    allocatedHospital: Optional[str] = None
    class Config:
        from_attributes = True

class AllocationBase(BaseModel):
    emergencyId: int
    hospitalId: int

class Allocation(AllocationBase):
    id: int
    hospitalName: str
    eta: int
    distance: float
    score: float
    reason: str
    createdAt: datetime
    allocatedBy: str
    class Config:
        from_attributes = True
