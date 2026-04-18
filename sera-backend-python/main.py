from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import math
import models
import schemas
import auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SERA Python Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Comprehensive India Hospital Seed Data - 55 hospitals across 20+ cities
HOSPITALS_SEED = [
    # Delhi (8 hospitals)
    { "id": 1,  "name": "AIIMS New Delhi",               "city": "Delhi",         "latitude": 28.5672, "longitude": 77.2100, "totalBeds": 2500, "ventilators": 150, "icuBeds": 120, "ambulances": 20, "staff": 15, "specialties": "Multi-specialty, Trauma, Oncology" },
    { "id": 2,  "name": "Safdarjung Hospital",            "city": "Delhi",         "latitude": 28.5685, "longitude": 77.2064, "totalBeds": 2900, "ventilators": 80,  "icuBeds": 90,  "ambulances": 14, "staff": 12, "specialties": "Trauma, General Surgery, Cardiac" },
    { "id": 3,  "name": "Max Super Specialty Saket",      "city": "Delhi",         "latitude": 28.5275, "longitude": 77.2117, "totalBeds": 500,  "ventilators": 85,  "icuBeds": 50,  "ambulances": 12, "staff": 10, "specialties": "Cardiac, Neuro, Ortho" },
    { "id": 4,  "name": "Indraprastha Apollo",            "city": "Delhi",         "latitude": 28.5414, "longitude": 77.2847, "totalBeds": 700,  "ventilators": 120, "icuBeds": 60,  "ambulances": 15, "staff": 14, "specialties": "Transplant, Cardiac, Critical Care" },
    { "id": 5,  "name": "Sir Ganga Ram Hospital",         "city": "Delhi",         "latitude": 28.6385, "longitude": 77.1895, "totalBeds": 675,  "ventilators": 95,  "icuBeds": 45,  "ambulances": 10, "staff": 9,  "specialties": "Gastro, Nephro, General" },
    { "id": 6,  "name": "Fortis Hospital Shalimar Bagh",  "city": "Delhi",         "latitude": 28.7199, "longitude": 77.1557, "totalBeds": 262,  "ventilators": 45,  "icuBeds": 35,  "ambulances": 8,  "staff": 8,  "specialties": "Cardiac, Ortho, Neuro" },
    { "id": 7,  "name": "RML Hospital",                   "city": "Delhi",         "latitude": 28.6359, "longitude": 77.2060, "totalBeds": 1500, "ventilators": 70,  "icuBeds": 80,  "ambulances": 12, "staff": 11, "specialties": "General, Emergency, Maternal" },
    { "id": 8,  "name": "GTB Hospital",                   "city": "Delhi",         "latitude": 28.6826, "longitude": 77.3082, "totalBeds": 1576, "ventilators": 60,  "icuBeds": 70,  "ambulances": 10, "staff": 10, "specialties": "Trauma, General, Pediatric" },
    # Mumbai (6 hospitals)
    { "id": 9,  "name": "Tata Memorial Hospital",         "city": "Mumbai",        "latitude": 19.0039, "longitude": 72.8427, "totalBeds": 700,  "ventilators": 40,  "icuBeds": 85,  "ambulances": 8,  "staff": 6,  "specialties": "Oncology, Radiology, Surgery" },
    { "id": 10, "name": "Lilavati Hospital",               "city": "Mumbai",        "latitude": 19.0514, "longitude": 72.8270, "totalBeds": 323,  "ventilators": 60,  "icuBeds": 40,  "ambulances": 10, "staff": 8,  "specialties": "Cardiac, Neuro, Nephro" },
    { "id": 11, "name": "Kokilaben Dhirubhai Ambani",      "city": "Mumbai",        "latitude": 19.1269, "longitude": 72.8291, "totalBeds": 750,  "ventilators": 130, "icuBeds": 100, "ambulances": 18, "staff": 14, "specialties": "Cardiac, Neuro, Cancer" },
    { "id": 12, "name": "KEM Hospital",                   "city": "Mumbai",        "latitude": 19.0024, "longitude": 72.8409, "totalBeds": 1800, "ventilators": 90,  "icuBeds": 100, "ambulances": 15, "staff": 12, "specialties": "Trauma, General, Maternal" },
    { "id": 13, "name": "Breach Candy Hospital",          "city": "Mumbai",        "latitude": 18.9718, "longitude": 72.8066, "totalBeds": 130,  "ventilators": 50,  "icuBeds": 30,  "ambulances": 6,  "staff": 7,  "specialties": "Multi-specialty, Cardiac" },
    { "id": 14, "name": "Hinduja Hospital",                "city": "Mumbai",        "latitude": 19.0071, "longitude": 72.8370, "totalBeds": 350,  "ventilators": 70,  "icuBeds": 50,  "ambulances": 10, "staff": 9,  "specialties": "Cardiac, Ortho, Gastro" },
    # Bangalore (5 hospitals)
    { "id": 15, "name": "Fortis Bannerghatta",            "city": "Bangalore",     "latitude": 12.8950, "longitude": 77.5980, "totalBeds": 400,  "ventilators": 70,  "icuBeds": 50,  "ambulances": 10, "staff": 9,  "specialties": "Cardiac, Pulmonology, Neuro" },
    { "id": 16, "name": "Manipal Hospital Old Airport Rd","city": "Bangalore",     "latitude": 12.9592, "longitude": 77.6446, "totalBeds": 600,  "ventilators": 110, "icuBeds": 60,  "ambulances": 15, "staff": 12, "specialties": "Multi-specialty, Transplant" },
    { "id": 17, "name": "NIMHANS",                        "city": "Bangalore",     "latitude": 12.9461, "longitude": 77.5925, "totalBeds": 800,  "ventilators": 30,  "icuBeds": 120, "ambulances": 8,  "staff": 6,  "specialties": "Neurology, Psychiatry, Neurosurgery" },
    { "id": 18, "name": "Victoria Hospital Bangalore",    "city": "Bangalore",     "latitude": 12.9664, "longitude": 77.5769, "totalBeds": 1300, "ventilators": 65,  "icuBeds": 80,  "ambulances": 12, "staff": 10, "specialties": "Trauma, General, Burn" },
    { "id": 19, "name": "Apollo Hospitals Bannerghatta",  "city": "Bangalore",     "latitude": 12.8939, "longitude": 77.5980, "totalBeds": 250,  "ventilators": 55,  "icuBeds": 40,  "ambulances": 8,  "staff": 8,  "specialties": "Cardiac, Ortho, Transplant" },
    # Chennai (4 hospitals)
    { "id": 20, "name": "Apollo Hospitals Chennai",       "city": "Chennai",       "latitude": 13.0569, "longitude": 80.2430, "totalBeds": 650,  "ventilators": 100, "icuBeds": 75,  "ambulances": 15, "staff": 13, "specialties": "Cardiac, Transplant, Neuro" },
    { "id": 21, "name": "Rajiv Gandhi Govt General Hosp", "city": "Chennai",       "latitude": 13.0827, "longitude": 80.2707, "totalBeds": 2700, "ventilators": 120, "icuBeds": 150, "ambulances": 20, "staff": 15, "specialties": "Trauma, General, Maternal" },
    { "id": 22, "name": "MIOT International Hospital",   "city": "Chennai",       "latitude": 13.0204, "longitude": 80.1907, "totalBeds": 1000, "ventilators": 90,  "icuBeds": 80,  "ambulances": 14, "staff": 12, "specialties": "Ortho, Spine, Cardiac" },
    { "id": 23, "name": "Fortis Malar Hospital",          "city": "Chennai",       "latitude": 12.9970, "longitude": 80.2540, "totalBeds": 180,  "ventilators": 40,  "icuBeds": 30,  "ambulances": 6,  "staff": 7,  "specialties": "Cardiac, Multi-specialty" },
    # Hyderabad (4 hospitals)
    { "id": 24, "name": "NIMS Hyderabad",                 "city": "Hyderabad",     "latitude": 17.4065, "longitude": 78.4691, "totalBeds": 1000, "ventilators": 80,  "icuBeds": 90,  "ambulances": 14, "staff": 11, "specialties": "Trauma, Cardiac, General" },
    { "id": 25, "name": "Care Hospitals Hyderabad",       "city": "Hyderabad",     "latitude": 17.4122, "longitude": 78.4678, "totalBeds": 350,  "ventilators": 65,  "icuBeds": 55,  "ambulances": 10, "staff": 9,  "specialties": "Cardiac, Gastro, Neuro" },
    { "id": 26, "name": "Apollo Hyderabad Jubilee Hills", "city": "Hyderabad",     "latitude": 17.4319, "longitude": 78.4073, "totalBeds": 500,  "ventilators": 100, "icuBeds": 70,  "ambulances": 12, "staff": 11, "specialties": "Transplant, Cardiac, Onco" },
    { "id": 27, "name": "Yashoda Hospital Secunderabad",  "city": "Hyderabad",     "latitude": 17.4543, "longitude": 78.5012, "totalBeds": 450,  "ventilators": 75,  "icuBeds": 60,  "ambulances": 10, "staff": 9,  "specialties": "General, Ortho, Neuro" },
    # Kolkata (3 hospitals)
    { "id": 28, "name": "SSKM Hospital Kolkata",          "city": "Kolkata",       "latitude": 22.5392, "longitude": 88.3431, "totalBeds": 2000, "ventilators": 100, "icuBeds": 120, "ambulances": 18, "staff": 14, "specialties": "Trauma, Cardiac, General" },
    { "id": 29, "name": "Apollo Gleneagles Kolkata",      "city": "Kolkata",       "latitude": 22.5526, "longitude": 88.3908, "totalBeds": 520,  "ventilators": 90,  "icuBeds": 65,  "ambulances": 12, "staff": 10, "specialties": "Cardiac, Neuro, Gastro" },
    { "id": 30, "name": "Medica Superspecialty Hospital", "city": "Kolkata",       "latitude": 22.5066, "longitude": 88.3940, "totalBeds": 560,  "ventilators": 80,  "icuBeds": 55,  "ambulances": 10, "staff": 9,  "specialties": "Cardiac, Ortho, Onco" },
    # Pune (3 hospitals)
    { "id": 31, "name": "Ruby Hall Clinic Pune",          "city": "Pune",          "latitude": 18.5306, "longitude": 73.8859, "totalBeds": 650,  "ventilators": 85,  "icuBeds": 70,  "ambulances": 12, "staff": 10, "specialties": "Cardiac, Neuro, Ortho" },
    { "id": 32, "name": "Jehangir Hospital Pune",         "city": "Pune",          "latitude": 18.5311, "longitude": 73.8765, "totalBeds": 350,  "ventilators": 55,  "icuBeds": 45,  "ambulances": 8,  "staff": 8,  "specialties": "Multi-specialty, Transplant" },
    { "id": 33, "name": "Sassoon General Hospital Pune",  "city": "Pune",          "latitude": 18.5196, "longitude": 73.8631, "totalBeds": 1800, "ventilators": 90,  "icuBeds": 100, "ambulances": 16, "staff": 13, "specialties": "Trauma, General, Maternal" },
    # Ahmedabad (3 hospitals)
    { "id": 34, "name": "Civil Hospital Ahmedabad",       "city": "Ahmedabad",     "latitude": 23.0406, "longitude": 72.5718, "totalBeds": 2000, "ventilators": 110, "icuBeds": 130, "ambulances": 20, "staff": 14, "specialties": "Trauma, General, Burn" },
    { "id": 35, "name": "Sterling Hospital Ahmedabad",    "city": "Ahmedabad",     "latitude": 23.0437, "longitude": 72.5244, "totalBeds": 350,  "ventilators": 65,  "icuBeds": 55,  "ambulances": 10, "staff": 9,  "specialties": "Cardiac, Neuro, Ortho" },
    { "id": 36, "name": "Apollo Ahmedabad",               "city": "Ahmedabad",     "latitude": 23.0207, "longitude": 72.5075, "totalBeds": 400,  "ventilators": 80,  "icuBeds": 60,  "ambulances": 12, "staff": 10, "specialties": "Multi-specialty, Cardiac" },
    # Jaipur (2 hospitals)
    { "id": 37, "name": "SMS Hospital Jaipur",            "city": "Jaipur",        "latitude": 26.9124, "longitude": 75.8117, "totalBeds": 3000, "ventilators": 130, "icuBeds": 150, "ambulances": 22, "staff": 16, "specialties": "Trauma, General, Cardiac" },
    { "id": 38, "name": "Fortis Escorts Jaipur",          "city": "Jaipur",        "latitude": 26.8456, "longitude": 75.6698, "totalBeds": 350,  "ventilators": 70,  "icuBeds": 55,  "ambulances": 10, "staff": 9,  "specialties": "Cardiac, Ortho, Neuro" },
    # Lucknow (2 hospitals)
    { "id": 39, "name": "KGMU Lucknow",                   "city": "Lucknow",       "latitude": 26.8638, "longitude": 80.9375, "totalBeds": 5000, "ventilators": 200, "icuBeds": 200, "ambulances": 30, "staff": 20, "specialties": "Multi-specialty, Teaching, Trauma" },
    { "id": 40, "name": "Ram Manohar Lohia Hospital",     "city": "Lucknow",       "latitude": 26.8537, "longitude": 80.9418, "totalBeds": 1500, "ventilators": 100, "icuBeds": 120, "ambulances": 18, "staff": 14, "specialties": "General, Pediatric, Ortho" },
    # Chandigarh (2 hospitals)
    { "id": 41, "name": "PGI Chandigarh",                 "city": "Chandigarh",    "latitude": 30.7656, "longitude": 76.7770, "totalBeds": 2000, "ventilators": 150, "icuBeds": 160, "ambulances": 25, "staff": 18, "specialties": "Multi-specialty, Transplant, Neuro" },
    { "id": 42, "name": "GMCH Chandigarh",                "city": "Chandigarh",    "latitude": 30.7226, "longitude": 76.7494, "totalBeds": 900,  "ventilators": 70,  "icuBeds": 80,  "ambulances": 14, "staff": 11, "specialties": "General, Trauma, Maternal" },
    # Nagpur (2 hospitals)
    { "id": 43, "name": "AIIMS Nagpur",                   "city": "Nagpur",        "latitude": 21.1700, "longitude": 79.1500, "totalBeds": 1000, "ventilators": 90,  "icuBeds": 100, "ambulances": 16, "staff": 12, "specialties": "Multi-specialty, Trauma" },
    { "id": 44, "name": "Orange City Hospital Nagpur",    "city": "Nagpur",        "latitude": 21.1561, "longitude": 79.0981, "totalBeds": 250,  "ventilators": 45,  "icuBeds": 35,  "ambulances": 8,  "staff": 7,  "specialties": "Cardiac, Neuro, Ortho" },
    # Bhopal (2 hospitals)
    { "id": 45, "name": "AIIMS Bhopal",                   "city": "Bhopal",        "latitude": 23.1997, "longitude": 77.4066, "totalBeds": 960,  "ventilators": 80,  "icuBeds": 90,  "ambulances": 14, "staff": 11, "specialties": "Trauma, Multi-specialty" },
    { "id": 46, "name": "Hamidia Hospital Bhopal",        "city": "Bhopal",        "latitude": 23.2616, "longitude": 77.4104, "totalBeds": 1800, "ventilators": 100, "icuBeds": 110, "ambulances": 18, "staff": 13, "specialties": "General, Trauma, Maternal" },
    # Kochi (2 hospitals)
    { "id": 47, "name": "Amrita Hospital Kochi",          "city": "Kochi",         "latitude": 10.0422, "longitude": 76.3148, "totalBeds": 1350, "ventilators": 120, "icuBeds": 110, "ambulances": 18, "staff": 14, "specialties": "Cardiac, Neuro, Transplant" },
    { "id": 48, "name": "Lakeshore Hospital Kochi",       "city": "Kochi",         "latitude": 9.9750,  "longitude": 76.2936, "totalBeds": 450,  "ventilators": 70,  "icuBeds": 60,  "ambulances": 10, "staff": 9,  "specialties": "General, Cardiac, Ortho" },
    # Visakhapatnam
    { "id": 49, "name": "King George Hospital Vizag",     "city": "Visakhapatnam", "latitude": 17.7231, "longitude": 83.3013, "totalBeds": 1500, "ventilators": 90,  "icuBeds": 100, "ambulances": 16, "staff": 12, "specialties": "Trauma, General, Onco" },
    # Guwahati
    { "id": 50, "name": "GNRC Hospital Guwahati",         "city": "Guwahati",      "latitude": 26.1629, "longitude": 91.7390, "totalBeds": 300,  "ventilators": 50,  "icuBeds": 45,  "ambulances": 8,  "staff": 7,  "specialties": "General, Neuro, Cardiac" },
    # Surat
    { "id": 51, "name": "New Civil Hospital Surat",       "city": "Surat",         "latitude": 21.1826, "longitude": 72.8341, "totalBeds": 1500, "ventilators": 95,  "icuBeds": 110, "ambulances": 18, "staff": 13, "specialties": "Trauma, General, Burn" },
    # Patna
    { "id": 52, "name": "AIIMS Patna",                    "city": "Patna",          "latitude": 25.5494, "longitude": 84.8412, "totalBeds": 750,  "ventilators": 70,  "icuBeds": 80,  "ambulances": 12, "staff": 10, "specialties": "Multi-specialty, Trauma" },
    # Indore (2 hospitals)
    { "id": 53, "name": "MY Hospital Indore",             "city": "Indore",        "latitude": 22.7196, "longitude": 75.8577, "totalBeds": 1350, "ventilators": 85,  "icuBeds": 100, "ambulances": 16, "staff": 12, "specialties": "General, Trauma, Maternal" },
    { "id": 54, "name": "Apollo Hospitals Indore",        "city": "Indore",        "latitude": 22.7533, "longitude": 75.9018, "totalBeds": 300,  "ventilators": 55,  "icuBeds": 45,  "ambulances": 8,  "staff": 8,  "specialties": "Cardiac, Ortho, Neuro" },
    # Coimbatore
    { "id": 55, "name": "PSG Hospitals Coimbatore",       "city": "Coimbatore",    "latitude": 11.0168, "longitude": 77.0169, "totalBeds": 1200, "ventilators": 90,  "icuBeds": 100, "ambulances": 16, "staff": 12, "specialties": "Multi-specialty, Cardiac, Neuro" },
]

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    # Always re-seed if count doesn't match (so new hospitals get added)
    current_count = db.query(models.Hospital).count()
    if current_count != len(HOSPITALS_SEED):
        db.query(models.Hospital).delete()
        for h in HOSPITALS_SEED:
            db.add(models.Hospital(**h))

    if db.query(models.User).filter(models.User.email == "test@example.com").count() == 0:
        db.add(models.User(
            email="test@example.com",
            name="Test Admin",
            hashed_password=auth.get_password_hash("password123")
        ))
    db.commit()

# Auth Endpoints
@app.post("/api/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(email=user.email, name=user.name, hashed_password=auth.get_password_hash(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login")
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not auth.verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"token": access_token, "name": user.name, "email": user.email}

# Hospital Endpoints
@app.get("/api/hospital", response_model=List[schemas.Hospital])
def get_hospitals(db: Session = Depends(get_db)):
    return db.query(models.Hospital).all()

@app.get("/api/hospital/all", response_model=List[schemas.Hospital])
def get_all_hospitals(db: Session = Depends(get_db)):
    return db.query(models.Hospital).all()

# IMPORTANT: /nearby must come BEFORE /{id} to avoid being matched as id="nearby"
@app.get("/api/hospital/nearby")
def get_nearby_hospitals(lat: float, lng: float, limit: int = 10, db: Session = Depends(get_db)):
    hospitals = db.query(models.Hospital).all()
    results = []
    for h in hospitals:
        dist = haversine(lat, lng, h.latitude, h.longitude)
        results.append({
            "id": h.id, "name": h.name, "city": h.city,
            "latitude": h.latitude, "longitude": h.longitude,
            "totalBeds": h.totalBeds, "icuBeds": h.icuBeds,
            "ventilators": h.ventilators, "ambulances": h.ambulances,
            "staff": h.staff, "specialties": h.specialties,
            "distance": round(dist, 2),
            "eta": max(5, int(dist * 2.2))
        })
    results.sort(key=lambda x: x["distance"])
    return results[:limit]

@app.get("/api/hospital/{id}", response_model=schemas.Hospital)
def get_hospital(id: int, db: Session = Depends(get_db)):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital

# Emergency Endpoints
@app.get("/api/emergency", response_model=List[schemas.Emergency])
def get_emergencies_public(db: Session = Depends(get_db)):
    return db.query(models.Emergency).all()

@app.post("/api/emergency", response_model=schemas.Emergency)
def report_emergency(emergency: schemas.EmergencyCreate, db: Session = Depends(get_db)):
    db_emergency = models.Emergency(**emergency.model_dump())
    db.add(db_emergency)
    db.commit()
    db.refresh(db_emergency)
    return db_emergency

@app.get("/api/emergency/all", response_model=List[schemas.Emergency])
def get_all_emergencies(db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    return db.query(models.Emergency).all()

@app.get("/api/allocate/{emergency_id}", response_model=schemas.Allocation)
def allocate_hospital(emergency_id: int, db: Session = Depends(get_db)):
    emergency = db.query(models.Emergency).filter(models.Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    hospitals = db.query(models.Hospital).all()
    best_hospital = None
    min_dist = float('inf')

    for h in hospitals:
        dist = haversine(emergency.latitude, emergency.longitude, h.latitude, h.longitude)
        if dist < min_dist:
            min_dist = dist
            best_hospital = h

    if not best_hospital:
        raise HTTPException(status_code=404, detail="No hospital available")

    eta = max(5, int(min_dist * 2.2))
    score = max(0, 100 - (min_dist * 0.5))

    allocation = models.Allocation(
        emergencyId=emergency_id,
        hospitalId=best_hospital.id,
        hospitalName=best_hospital.name,
        eta=eta,
        distance=min_dist,
        score=round(score, 1),
        reason=f"Nearest facility at {min_dist:.1f}km with {best_hospital.icuBeds} ICU beds and {best_hospital.ambulances} ambulances. Specialties: {best_hospital.specialties}.",
        allocatedBy="SERA AI"
    )

    emergency.status = "ALLOCATED"
    emergency.allocatedHospital = best_hospital.name

    db.add(allocation)
    db.commit()
    db.refresh(allocation)
    return allocation

@app.get("/health")
def health():
    return {"status": "Backend running", "hospitals": "55 across 20+ cities"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
