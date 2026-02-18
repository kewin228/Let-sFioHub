import os
import uuid
import subprocess
import json
from PIL import Image
from pathlib import Path
from typing import Tuple, List
from .config import settings

def generate_video_id() -> str:
    """Генерация уникального ID для видео (аналогично YouTube)"""
    import random
    import string
    
    # Генерация 11-символьного ID
    characters = string.ascii_letters + string.digits + "_-"
    return ''.join(random.choice(characters) for _ in range(11))

def save_uploaded_video(upload_file, user_id: int) -> Tuple[str, str]:
    """Сохранение загруженного видео и создание директорий"""
    
    # Создание структуры директорий
    user_dir = Path(settings.UPLOAD_DIR) / str(user_id)
    video_dir = user_dir / settings.VIDEO_DIR
    thumbnail_dir = user_dir / settings.THUMBNAIL_DIR
    
    for directory in [user_dir, video_dir, thumbnail_dir]:
        directory.mkdir(parents=True, exist_ok=True)
    
    # Генерация уникального имени файла
    video_id = generate_video_id()
    original_filename = f"{video_id}_original.mp4"
    original_path = video_dir / original_filename
    
    # Сохранение файла
    with open(original_path, "wb") as buffer:
        content = upload_file.file.read()
        buffer.write(content)
    
    return str(original_path), video_id

def create_thumbnail(video_path: str, thumbnail_path: str, time_sec: int = 10):
    """Создание thumbnail из видео"""
    try:
        cmd = [
            settings.FFMPEG_PATH,
            '-i', video_path,
            '-ss', str(time_sec),
            '-vframes', '1',
            '-vf', 'scale=640:360',
            '-q:v', '2',
            thumbnail_path,
            '-y'
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except Exception as e:
        print(f"Error creating thumbnail: {e}")
        return False

def get_video_duration(video_path: str) -> int:
    """Получение длительности видео в секундах"""
    try:
        cmd = [
            settings.FFMPEG_PATH,
            '-i', video_path,
            '-f', 'null',
            '-'
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # Парсим вывод ffmpeg для получения длительности
        import re
        duration_match = re.search(r"Duration: (\d{2}):(\d{2}):(\d{2})", result.stderr)
        if duration_match:
            hours, minutes, seconds = map(int, duration_match.groups())
            return hours * 3600 + minutes * 60 + seconds
        return 0
    except:
        return 0

def get_video_resolution(video_path: str) -> Tuple[int, int]:
    """Получение разрешения видео"""
    try:
        cmd = [
            settings.FFMPEG_PATH,
            '-i', video_path,
            '-f', 'null',
            '-'
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        import re
        resolution_match = re.search(r"(\d+)x(\d+)", result.stderr)
        if resolution_match:
            return int(resolution_match.group(1)), int(resolution_match.group(2))
        return (1920, 1080)
    except:
        return (1920, 1080)

def transcode_video(video_path: str, output_dir: str, video_id: str) -> dict:
    """Транскодирование видео в несколько форматов"""
    qualities = [
        {'name': '360p', 'height': 360, 'bitrate': '800k'},
        {'name': '720p', 'height': 720, 'bitrate': '2500k'},
        {'name': '1080p', 'height': 1080, 'bitrate': '5000k'},
    ]
    
    results = {}
    
    for quality in qualities:
        output_path = Path(output_dir) / f"{video_id}_{quality['name']}.mp4"
        
        cmd = [
            settings.FFMPEG_PATH,
            '-i', video_path,
            '-vf', f"scale=-2:{quality['height']}",
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-b:v', quality['bitrate'],
            '-c:a', 'aac',
            '-b:a', '128k',
            str(output_path),
            '-y'
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            results[quality['name']] = str(output_path)
        except Exception as e:
            print(f"Error transcoding to {quality['name']}: {e}")
    
    return results