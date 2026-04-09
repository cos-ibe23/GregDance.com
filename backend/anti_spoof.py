import cv2
import numpy as np
from insightface.app import FaceAnalysis

# load model once
app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=0)

def detect_real_face(image_path):
    image = cv2.imread(image_path)

    if image is None:
        return False

    faces = app.get(image)

    if len(faces) == 0:
        print("No face detected")
        return False

    face = faces[0]

    # 🔥 key anti-spoof signal
    embedding_norm = np.linalg.norm(face.embedding)

    print("Embedding norm:", embedding_norm)

    # heuristic: fake faces often have unstable embeddings
    return embedding_norm > 10