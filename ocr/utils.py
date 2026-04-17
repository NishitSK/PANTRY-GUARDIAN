import cv2
import numpy as np
import pytesseract


def resize_image(image: np.ndarray, width: int) -> np.ndarray:
    height, current_width = image.shape[:2]
    if current_width == 0:
        return image

    scale = width / float(current_width)
    dimensions = (width, int(height * scale))
    return cv2.resize(image, dimensions, interpolation=cv2.INTER_AREA)


def order_points(points: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype="float32")
    sums = points.sum(axis=1)
    rect[0] = points[np.argmin(sums)]
    rect[2] = points[np.argmax(sums)]

    differences = np.diff(points, axis=1)
    rect[1] = points[np.argmin(differences)]
    rect[3] = points[np.argmax(differences)]
    return rect


def four_point_transform(image: np.ndarray, points: np.ndarray) -> np.ndarray:
    rect = order_points(points)
    (top_left, top_right, bottom_right, bottom_left) = rect

    width_a = np.linalg.norm(bottom_right - bottom_left)
    width_b = np.linalg.norm(top_right - top_left)
    max_width = max(int(width_a), int(width_b))

    height_a = np.linalg.norm(top_right - bottom_right)
    height_b = np.linalg.norm(top_left - bottom_left)
    max_height = max(int(height_a), int(height_b))

    destination = np.array(
        [
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1],
        ],
        dtype="float32",
    )

    matrix = cv2.getPerspectiveTransform(rect, destination)
    return cv2.warpPerspective(image, matrix, (max_width, max_height))


def perform_ocr(image_bytes: bytes) -> str:
    img = np.frombuffer(image_bytes, np.uint8)
    img_orig = cv2.imdecode(img, cv2.IMREAD_COLOR)
    if img_orig is None:
        raise ValueError("Could not decode image")

    image = img_orig.copy()
    image = resize_image(image, width=500)
    ratio = img_orig.shape[1] / float(image.shape[1])

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 75, 200)

    cnts = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = cnts[0] if len(cnts) == 2 else cnts[1]
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)

    receipt_cnt = None
    for contour in cnts:
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
        if len(approx) == 4:
            receipt_cnt = approx
            break

    if receipt_cnt is None:
        receipt = img_orig
    else:
        receipt = four_point_transform(img_orig, receipt_cnt.reshape(4, 2) * ratio)

    options = "--psm 6"
    return pytesseract.image_to_string(cv2.cvtColor(receipt, cv2.COLOR_BGR2RGB), config=options)