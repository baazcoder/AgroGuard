from pydantic import BaseModel, Field
from typing import List, Optional

class DiagnosisResult(BaseModel):
    crop: str = Field(..., description="Identified crop name, e.g., Wheat, Rice, Tomato")
    disease: str = Field(..., description="Identified disease name or Healthy Crop")
    confidence: str = Field(..., description="Confidence level: High, Medium, Low, or Uncertain")
    severity: str = Field(..., description="Disease severity: None, Mild, Moderate, Severe, Critical")
    symptoms: List[str] = Field(default_factory=list, description="List of visible visual symptoms")
    treatment: List[str] = Field(default_factory=list, description="Recommended treatment steps and fungicides/pesticides")
    prevention: List[str] = Field(default_factory=list, description="Long term prevention and crop management practices")
    is_uncertain: bool = Field(default=False, description="True if diagnosis is uncertain or image is unclear")
    summary: str = Field(..., description="Short summary of the visual diagnosis")
    disclaimer: str = Field(
        default="AI-assisted analysis. For severe crop damage, consult a qualified agricultural expert.",
        description="Standard medical/agricultural advice disclaimer"
    )

class AnalysisErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
