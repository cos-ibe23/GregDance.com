import cv2

def detect_real_face(image_path):
    image = cv2.imread(image_path)

    if image is None:
        return False

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # simple blur detection (fake screens are smoother)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()

    print("Anti-spoof variance:", variance)

    return variance > 50  # real faces usually higher texture