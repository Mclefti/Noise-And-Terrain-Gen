FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose internal port (Nginx will route to this)
EXPOSE 8080

# Run uvicorn — one worker per container, Nginx handles load balancing
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
