from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime
from app.db.database import Base

class DiagnosisRecord(Base):
    __tablename__ = "diagnosis_records"

    id = Column(Integer, primary_key=True, index=True)
    crop = Column(String, index=True)
    disease = Column(String, index=True)
    confidence = Column(String)
    severity = Column(String)
    symptoms_json = Column(Text)
    treatment_json = Column(Text)
    prevention_json = Column(Text)
    is_uncertain = Column(Boolean, default=False)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatRecord(Base):
    __tablename__ = "chat_records"

    id = Column(Integer, primary_key=True, index=True)
    user_message = Column(Text)
    assistant_reply = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
