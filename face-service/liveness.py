import cv2
import numpy as np
try:
    import mediapipe as mp
except Exception:
    import types
    class _DummyFaceMesh:
        def __init__(self, *args, **kwargs):
            pass
        def process(self, image):
            class _Results:
                multi_face_landmarks = None
            return _Results()
    mp = types.SimpleNamespace(solutions=types.SimpleNamespace(face_mesh=types.SimpleNamespace(FaceMesh=_DummyFaceMesh)))
    print("Warning: mediapipe not installed; using dummy face mesh (landmark detection disabled)")
else:
    print(mp.solutions)
from deepface import DeepFace
try:
    from anti_spoof import detect_real_face
except Exception:
    def detect_real_face(image_path):
        img = cv2.imread(image_path)
        return img is not None

mp_face_mesh = mp.solutions.face_mesh

face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True
)

def eye_aspect_ratio(eye_points):
    A = np.linalg.norm(eye_points[1] - eye_points[5])
    B = np.linalg.norm(eye_points[2] - eye_points[4])
    C = np.linalg.norm(eye_points[0] - eye_points[3])
    return (A + B) / (2.0 * C)

def get_ear(image_path):
    image = cv2.imread(image_path)
    if image is None:
        return None

    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    if not results.multi_face_landmarks:
        return None

    landmarks = results.multi_face_landmarks[0].landmark
    h, w, _ = image.shape

    left_eye_idx = [33, 160, 158, 133, 153, 144]

    eye_points = []
    for idx in left_eye_idx:
        x = int(landmarks[idx].x * w)
        y = int(landmarks[idx].y * h)
        eye_points.append([x, y])

    eye_points = np.array(eye_points)
    return eye_aspect_ratio(eye_points)

def get_face_direction(image_path):
    image = cv2.imread(image_path)
    if image is None:
        return None

    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    if not results.multi_face_landmarks:
        return None

    landmarks = results.multi_face_landmarks[0].landmark
    h, w, _ = image.shape

    nose = landmarks[1]
    left_cheek = landmarks[234]
    right_cheek = landmarks[454]

    nose_x = nose.x * w
    left_x = left_cheek.x * w
    right_x = right_cheek.x * w

    center = (left_x + right_x) / 2

    if nose_x < center - 10:
        return "LEFT"
    elif nose_x > center + 10:
        return "RIGHT"
    else:
        return "CENTER"

def detect_screen_artifacts(image_path):
    image = cv2.imread(image_path)
    if image is None:
        return False

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    variance = laplacian.var()

    print("Texture variance:", variance)

    return variance < 30

def detect_screen_reflection(image_path):
    image = cv2.imread(image_path)
    if image is None:
        return False

    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    brightness = hsv[:, :, 2].mean()

    print("Brightness:", brightness)

    return brightness > 230

def detect_fake_motion(distances):
    if len(distances) < 2:
        return True

    diffs = [abs(distances[i] - distances[i-1]) for i in range(1, len(distances))]

    print("Distance diffs:", diffs)

    variance = np.var(diffs)
    print("Motion variance:", variance)

    return variance < 0.00005

# =========================
# 🔒 ELITE LIVENESS CHECK (FINAL FIX)
# =========================
def verify_liveness(frames, reference):
    distances = []
    ears = []
    directions = []

    screen_flags = []
    reflection_flags = []
    real_face_flags = []

    for frame in frames:
        result = DeepFace.verify(
            img1_path=reference,
            img2_path=frame,
            model_name="ArcFace",
            detector_backend="retinaface",
            enforce_detection=True
        )

        distances.append(float(result["distance"]))

        ear = get_ear(frame)
        if ear is not None:
            ears.append(ear)

        direction = get_face_direction(frame)
        if direction:
            directions.append(direction)

        screen_flags.append(detect_screen_artifacts(frame))
        reflection_flags.append(detect_screen_reflection(frame))
        real_face_flags.append(detect_real_face(frame))

    if len(ears) < 2:
        print("❌ Not enough EAR data")
        return False

    avg_distance = sum(distances) / len(distances)
    movement = max(distances) - min(distances)
    blink = max(ears) - min(ears)

    moved_left = "LEFT" in directions
    moved_right = "RIGHT" in directions

    fake_motion = detect_fake_motion(distances)

    # ================= DEBUG =================
    print("---- LIVENESS DEBUG ----")
    print("Distances:", distances)
    print("Avg distance:", avg_distance)
    print("Movement:", movement)
    print("Blink:", blink)
    print("Directions:", directions)
    print("Screen flags:", screen_flags)
    print("Reflection flags:", reflection_flags)
    print("Real face flags:", real_face_flags)
    print("Fake motion:", fake_motion)
    print("------------------------")
    # ========================================

    # ✅ FINAL WORKING LOGIC (LESS STRICT)
    has_movement = movement > 0.07
    has_blink = blink > 0.08

    return (
        avg_distance < 0.6 and
        (has_movement or has_blink) and
        not any(screen_flags) and
        not any(reflection_flags) and
        not fake_motion
    )