import cv2
import imutils
import numpy as np
import pytesseract
from imutils.perspective import four_point_transform


def perform_ocr(image_bytes: bytes) -> str:
    img = np.frombuffer(image_bytes, np.uint8)
    img_orig = cv2.imdecode(img, cv2.IMREAD_COLOR)
    if img_orig is None:
        raise ValueError("Could not decode image")

    image = img_orig.copy()
    image = imutils.resize(image, width=500)
    ratio = img_orig.shape[1] / float(image.shape[1])

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 75, 200)

    cnts = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)
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