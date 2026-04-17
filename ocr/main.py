from fastapi import FastAPI, UploadFile
from fastapi.responses import JSONResponse

from utils import perform_ocr

app = FastAPI(title="Receipt OCR API", version="1.0.0")


@app.get("/")
async def root():
    return {"message": "Receipt OCR API", "endpoints": {"GET /health": "Health check", "POST /ocr/": "Extract OCR text from an image"}}


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "receipt-ocr"}


@app.post("/ocr/")
async def ocr_receipt(file: UploadFile):
    if not file.content_type or not file.content_type.startswith("image/"):
        return JSONResponse({"error": "Uploaded file is not an image"}, status_code=400)

    image_bytes = await file.read()
    if not image_bytes:
        return JSONResponse({"error": "Empty file uploaded"}, status_code=400)

    ocr_text = perform_ocr(image_bytes)
    return JSONResponse(content={"result": ocr_text}, status_code=200)