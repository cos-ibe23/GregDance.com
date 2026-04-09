from flask import Flask, request, jsonify
from deepface import DeepFace
import cv2
import numpy as np
import mediapipe as mp

app = Flask(__name__)

@app.route('/compare', methods=['POST'])
def compare_faces():
    data = request.json

    img1 = data.get('image1')
    img2 = data.get('image2')

    if not img1 or not img2:
        return jsonify({"error": "Missing images"}), 400

    try:
        print("IMG1:", img1)
        print("IMG2:", img2)

        # ✅ DETECT FACES FIRST (ANTI-SPOOF LEVEL 1)
        faces1 = DeepFace.extract_faces(
            img_path=img1,
            detector_backend="retinaface",
            enforce_detection=True
        )

        faces2 = DeepFace.extract_faces(
            img_path=img2,
            detector_backend="retinaface",
            enforce_detection=True
        )

        # ❌ NO FACE
        if len(faces1) == 0 or len(faces2) == 0:
            return jsonify({
                "verified": False,
                "error": "No face detected"
            })

        # ❌ MULTIPLE FACES
        if len(faces1) > 1 or len(faces2) > 1:
            return jsonify({
                "verified": False,
                "error": "Multiple faces detected"
            })

        # ✅ FACE MATCH
        result = DeepFace.verify(
            img1_path=img1,
            img2_path=img2,
            model_name="ArcFace",
            detector_backend="retinaface",
            enforce_detection=True
        )

        distance = float(result["distance"])
        
        # 🔥 TIGHTER THRESHOLD
        verified = distance < 0.5   # was 0.6 → stricter now

        print("Distance:", distance)
        print("Verified:", verified)

        return jsonify({
            "verified": verified,
            "distance": distance
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({
            "verified": False,
            "error": str(e)
        })


@app.route('/liveness', methods=['POST'])
def liveness_check():
    data = request.json

    frames = data.get("frames")
    reference = data.get("reference")

    if not frames or len(frames) < 3:
        return jsonify({"verified": False, "error": "Not enough frames"})

    try:
        distances = []

        # ✅ Compare each frame to reference
        for frame in frames:
            result = DeepFace.verify(
                img1_path=reference,
                img2_path=frame,
                model_name="ArcFace",
                detector_backend="retinaface",
                enforce_detection=True
            )

            distances.append(float(result["distance"]))

        print("Frame distances:", distances)

        # ✅ Check consistency
        avg_distance = sum(distances) / len(distances)

        # 🔥 movement check (frames must differ slightly)
        movement = max(distances) - min(distances)

        print("Avg:", avg_distance)
        print("Movement:", movement)

        # ✅ RULES
        if avg_distance < 0.5 and movement > 0.02:
            return jsonify({
                "verified": True,
                "avg_distance": avg_distance,
                "movement": movement
            })
        else:
            return jsonify({
                "verified": False,
                "avg_distance": avg_distance,
                "movement": movement
            })

    except Exception as e:
        return jsonify({
            "verified": False,
            "error": str(e)
        })


if __name__ == "__main__":
    app.run(port=5001, debug=True)