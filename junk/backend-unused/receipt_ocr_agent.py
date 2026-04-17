import io
import json
import os
import re
import sys
from typing import Any

from google.cloud import vision
import google.generativeai as genai


# SET YOUR KEY PATH (or use env variable)
# Example: C:\\path\\to\\your\\key.json
if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:\\path\\to\\your\\key.json"

# INIT CLIENTS
vision_client = vision.ImageAnnotatorClient()
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
llm = genai.GenerativeModel("gemini-1.5-flash")


def extract_text(image_path: str) -> str:
    with io.open(image_path, "rb") as image_file:
        content = image_file.read()

    image = vision.Image(content=content)
    response = vision_client.document_text_detection(image=image)

    if response.error.message:
        raise RuntimeError(f"Google Vision error: {response.error.message}")

    if response.text_annotations:
        return response.text_annotations[0].description
    return ""


def _extract_json_object(text: str) -> dict[str, Any]:
    text = text.strip()

    # Direct JSON parse first.
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Fallback: pull first JSON object from mixed output.
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("Model did not return JSON.")

    return json.loads(match.group(0))


def process_with_agent(text: str) -> dict[str, Any]:
    prompt = f"""
You are a receipt processing agent for a food expiry prediction system.

Input:
Raw OCR text extracted from a receipt. The text may contain errors, noise, broken words, or irrelevant information.

Raw OCR text:
"""{text}"""

Your task:
1. Extract the purchase date from the receipt.
2. Identify ONLY food-related items.
3. Clean and normalize item names (e.g., "MLK" -> "milk", "BRD" -> "bread" if obvious).
4. Ignore non-food items such as toiletries, cleaning products, etc.
5. Ignore unreadable or uncertain words.

Output:
Return ONLY valid JSON in the following format:
{{
  "purchase_date": "",
  "items": [
    {{"name": ""}}
  ]
}}

Rules:
- Do not include explanations or extra text.
- Do not hallucinate items.
- If purchase date is not found, return null.
- Keep item names simple and lowercase.
- Be robust to OCR errors and partial words.

Goal:
Provide accurate and minimal structured data for expiry prediction.
"""

    response = llm.generate_content(prompt)
    content = (response.text or "").strip()
    parsed = _extract_json_object(content)

    # Keep strict output shape.
    purchase_date = parsed.get("purchase_date", None)
    raw_items = parsed.get("items", []) if isinstance(parsed.get("items", []), list) else []

    items = []
    for item in raw_items:
        if isinstance(item, dict):
            name = str(item.get("name", "")).strip()
            if name:
                items.append({"name": name})

    return {
        "purchase_date": purchase_date,
        "items": items,
    }


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/receipt_ocr_agent.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        sys.exit(1)

    if os.environ.get("GEMINI_API_KEY", "").strip() == "":
        print("Set GEMINI_API_KEY before running.")
        sys.exit(1)

    if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").endswith("path\\to\\your\\key.json"):
        print("Set GOOGLE_APPLICATION_CREDENTIALS to your real key path before running.")
        sys.exit(1)

    ocr_text = extract_text(image_path)
    print("OCR TEXT:\n", ocr_text)

    result = process_with_agent(ocr_text)
    print("\nSTRUCTURED OUTPUT:\n", json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
