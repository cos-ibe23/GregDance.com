# face-service/Dockerfile
FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libgl1

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0


COPY requirements.txt ./
RUN pip install --upgrade pip
RUN pip install --upgrade pip && \
    pip install --retries 10 --timeout 1000 -r requirements.txt
RUN python -c "from deepface import DeepFace; DeepFace.build_model('ArcFace')"

COPY . .

EXPOSE 5001

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5001"]