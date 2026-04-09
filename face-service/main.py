from fastapi import FastAPI
from pydantic import BaseModel
import face_recognition
import os

app = FastAPI()

class FaceRequest(BaseModel):
    image1: str
    image2: str

@app.get("/")
def root():
    return {"message": "Face API running"}

@app.post("/compare")
def compare_faces(data: FaceRequest):
    try:
        img1_path = os.path.abspath(data.image1)
        img2_path = os.path.abspath(data.image2)

        if not os.path.exists(img1_path):
            return {"error": f"Image1 not found: {img1_path}"}

        if not os.path.exists(img2_path):
            return {"error": f"Image2 not found: {img2_path}"}

        img1 = face_recognition.load_image_file(img1_path)
        img2 = face_recognition.load_image_file(img2_path)

        enc1 = face_recognition.face_encodings(img1)
        enc2 = face_recognition.face_encodings(img2)

        if len(enc1) == 0 or len(enc2) == 0:
            return {"error": "No face detected in one of the images"}

        result = face_recognition.compare_faces([enc1[0]], enc2[0])

        return {"verified": result[0]}

    except Exception as e:
        return {"error": str(e)}