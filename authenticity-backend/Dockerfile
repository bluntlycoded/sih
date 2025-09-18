# --- Base image ---
FROM python:3.11-slim

# --- Environment variables ---
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# --- Workdir ---
WORKDIR /app

# --- System deps (for OCR / QR / PDF) ---
RUN apt-get update && apt-get install -y \
    build-essential \
    libzbar0 \
    tesseract-ocr \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# --- Install pip deps ---
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Copy project files ---
COPY . .

# --- Expose port ---
EXPOSE 8000

# --- Run app ---
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
