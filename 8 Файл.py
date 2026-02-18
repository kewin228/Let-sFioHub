from fastapi import status
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from pathlib import Path

from . import models, database, auth, video_utils
from .config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение статики
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== Аутентификация ==========
@app.post(f"{settings.API_V1_STR}/auth/register", response_model=models.UserResponse)
def register(user_data: models.UserCreate, db: Session = Depends(get_db)):
    # Проверка существования пользователя
    if db.query(database.User).filter(database.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(database.User).filter(database.User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Создание пользователя
    hashed_password = auth.get_password_hash(user_data.password)
    db_user = database.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        display_name=user_data.display_name or user_data.username
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.post(f"{settings.API_V1_STR}/auth/login", response_model=models.Token)
def login(login_data: models.UserLogin, db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

# ========== Видео ==========
@app.post(f"{settings.API_V1_STR}/videos/upload")
async def upload_video(
    title: str = Form(...),
    description: str = Form(""),
    is_public: bool = Form(True),
    category: str = Form(""),
    tags: str = Form("[]"),
    file: UploadFile = File(...),
    current_user: database.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Проверка типа файла
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Сохранение видео
    original_path, video_id = video_utils.save_uploaded_video(file, current_user.id)
    
    # Создание thumbnail
    user_dir = Path(settings.UPLOAD_DIR) / str(current_user.id)
    thumbnail_path = user_dir / settings.THUMBNAIL_DIR / f"{video_id}.jpg"
    video_utils.create_thumbnail(original_path, str(thumbnail_path))
    
    # Получение длительности видео
    duration = video_utils.get_video_duration(original_path)
    
    # Создание записи в БД
    db_video = database.Video(
        id=video_id,
        title=title,
        description=description,
        file_path=original_path,
        thumbnail_path=str(thumbnail_path),
        duration=duration,
        uploader_id=current_user.id,
        is_public=is_public,
        category=category,
        tags=tags
    )
    
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    
    # Запуск транскодирования в фоне (в реальном проекте через Celery)
    # video_utils.transcode_video(original_path, ...)
    
    return {"video_id": video_id, "message": "Video uploaded successfully"}

@app.get(f"{settings.API_V1_STR}/videos", response_model=List[models.VideoResponse])
def get_videos(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(database.Video).filter(database.Video.is_public == True)
    
    if category:
        query = query.filter(database.Video.category == category)
    
    videos = query.order_by(database.Video.created_at.desc()).offset(skip).limit(limit).all()
    
    # Преобразуем в список с пользователями
    result = []
    for video in videos:
        video_dict = {**video.__dict__}
        video_dict['uploader'] = video.uploader
        result.append(video_dict)
    
    return result

@app.get(f"{settings.API_V1_STR}/videos/{{video_id}}", response_model=models.VideoResponse)
def get_video(video_id: str, db: Session = Depends(get_db)):
    video = db.query(database.Video).filter(database.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Увеличиваем счетчик просмотров
    video.views += 1
    db.commit()
    
    video_dict = {**video.__dict__}
    video_dict['uploader'] = video.uploader
    return video_dict

@app.get(f"{settings.API_V1_STR}/videos/{{video_id}}/watch")
def watch_video(video_id: str, db: Session = Depends(get_db)):
    video = db.query(database.Video).filter(database.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # В реальном проекте здесь была бы логика выбора качества
    video_path = video.file_path
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(video_path, media_type="video/mp4")

# ========== Комментарии ==========
@app.post(f"{settings.API_V1_STR}/videos/{{video_id}}/comments", response_model=models.CommentResponse)
def create_comment(
    video_id: str,
    comment_data: models.CommentCreate,
    current_user: database.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Проверка существования видео
    video = db.query(database.Video).filter(database.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Создание комментария
    db_comment = database.Comment(
        text=comment_data.text,
        video_id=video_id,
        author_id=current_user.id,
        parent_comment_id=comment_data.parent_comment_id
    )
    
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    comment_dict = {**db_comment.__dict__}
    comment_dict['author'] = current_user
    return comment_dict

@app.get(f"{settings.API_V1_STR}/videos/{{video_id}}/comments", response_model=List[models.CommentResponse])
def get_comments(video_id: str, db: Session = Depends(get_db)):
    comments = db.query(database.Comment).filter(
        database.Comment.video_id == video_id,
        database.Comment.parent_comment_id == None  # Только родительские комментарии
    ).order_by(database.Comment.created_at.desc()).all()
    
    result = []
    for comment in comments:
        comment_dict = {**comment.__dict__}
        comment_dict['author'] = comment.author
        result.append(comment_dict)
    
    return result

# ========== Пользователи ==========
@app.get(f"{settings.API_V1_STR}/users/me", response_model=models.UserResponse)
def get_current_user_profile(current_user: database.User = Depends(auth.get_current_active_user)):
    return current_user

@app.get(f"{settings.API_V1_STR}/users/{{username}}", response_model=models.UserResponse)
def get_user_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(database.User).filter(database.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get(f"{settings.API_V1_STR}/users/{{username}}/videos", response_model=List[models.VideoResponse])
def get_user_videos(username: str, db: Session = Depends(get_db)):
    user = db.query(database.User).filter(database.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    videos = db.query(database.Video).filter(
        database.Video.uploader_id == user.id,
        database.Video.is_public == True
    ).order_by(database.Video.created_at.desc()).all()
    
    result = []
    for video in videos:
        video_dict = {**video.__dict__}
        video_dict['uploader'] = user
        result.append(video_dict)
    
    return result

# ========== Подписки ==========
@app.post(f"{settings.API_V1_STR}/users/{{username}}/subscribe")
def subscribe_to_channel(
    username: str,
    current_user: database.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Cannot subscribe to yourself")
    
    user = db.query(database.User).filter(database.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Проверка существующей подписки
    existing_sub = db.query(database.Subscription).filter(
        database.Subscription.subscriber_id == current_user.id,
        database.Subscription.channel_id == user.id
    ).first()
    
    if existing_sub:
        raise HTTPException(status_code=400, detail="Already subscribed")
    
    # Создание подписки
    subscription = database.Subscription(
        subscriber_id=current_user.id,
        channel_id=user.id
    )
    
    db.add(subscription)
    
    # Увеличение счетчика подписчиков
    user.subscriber_count += 1
    db.commit()
    
    return {"message": "Subscribed successfully"}

# ========== Поиск ==========
@app.get(f"{settings.API_V1_STR}/search")
def search_videos(
    q: str = Query(..., min_length=1),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    # Простой поиск по заголовку и описанию
    videos = db.query(database.Video).filter(
        database.Video.is_public == True,
        database.Video.title.ilike(f"%{q}%") | database.Video.description.ilike(f"%{q}%")
    ).order_by(database.Video.created_at.desc()).offset(skip).limit(limit).all()
    
    users = db.query(database.User).filter(
        database.User.display_name.ilike(f"%{q}%") | database.User.username.ilike(f"%{q}%")
    ).limit(10).all()
    
    result = []
    for video in videos:
        video_dict = {**video.__dict__}
        video_dict['uploader'] = video.uploader
        result.append(video_dict)
    
    return {
        "videos": result,
        "channels": users
    }

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
