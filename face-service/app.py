from fastapi import FastAPI
from deepface import DeepFace
from liveness import verify_liveness

app = FastAPI()

@app.post("/compare")
def compare(data: dict):
    try:
        img1 = data["image1"]
        img2 = data["image2"]

        result = DeepFace.verify(img1, img2)

        return {
            "verified": result["verified"],
            "distance": result["distance"]
        }

    except Exception as e:
        return {"error": str(e)}


@app.post("/liveness")
def liveness_check(data: dict):
    frames = data.get("frames")
    reference = data.get("reference")

    if not frames or len(frames) < 3:
        return {"verified": False}

    try:
        verified = verify_liveness(frames, reference)

        return {
            "verified": verified
        }

    except Exception as e:
        return {
            "verified": False,
            "error": str(e)
        }