from fastapi import FastAPI
from deepface import DeepFace
from liveness import verify_liveness

app = FastAPI()

print("🔥 Loading model once...")
model = DeepFace.build_model("ArcFace")

@app.get("/")
def root():
    return {"message": "Face service running 🚀"}


@app.post("/compare")
def compare(data: dict):
    try:
        img1 = data["image1"]
        img2 = data["image2"]

        result = DeepFace.verify(
    img1,
    img2,
    model_name="ArcFace",         
    distance_metric="cosine",
    enforce_detection=False
)

        return {
            "verified": result["verified"],
            "distance": result["distance"]
        }

    except Exception as e:
        return {"verified": False, "error": str(e)}


@app.post("/liveness")
def liveness_check(data: dict):
    frames = data.get("frames")
    reference = data.get("reference")
    if frames:
        frames = frames[:2]

    if not frames or len(frames) < 2:
        return {"verified": False}

    try:
        verified = verify_liveness(frames, reference)

        return {"verified": verified}

    except Exception as e:
        return {
            "verified": False,
            "error": str(e)
        }