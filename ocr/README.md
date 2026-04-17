# OCR Service

Standalone Tesseract OCR API for Pantry Guardian.

## Endpoints

- `GET /health`
- `POST /ocr/`

## Render deploy

Use this folder as a separate Render service with:

- Root Directory: `ocr`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

After deploy, set the backend env:

- `RECEIPT_OCR_API_URL=https://your-ocr-service.onrender.com`
- `RECEIPT_OCR_OCR_PATH=/ocr/`