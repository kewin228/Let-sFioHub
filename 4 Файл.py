from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import pytz

SQLALCHEMY_DATABASE_URL = "postgresql://fiohub:fiohub123@db/fiohub"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    display_name = Column(String(100))
    avatar = Column(String(200))
    channel_description = Column(Text)
    subscriber_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(pytz.UTC))
    
    videos = relationship("Video", back_populates="uploader")
    comments = relationship("Comment", back_populates="author")
    subscriptions = relationship("Subscription", foreign_keys="Subscription.subscriber_id")

class Video(Base):
    __tablename__ = "videos"
    
    id = Column(String(11), primary_key=True, index=True)  # Наподобие YouTube ID
    title = Column(String(200), nullable=False)
    description = Column(Text)
    file_path = Column(String(500), nullable=False)
    thumbnail_path = Column(String(500))
    duration = Column(Integer)  # В секундах
    views = Column(BigInteger, default=0)
    likes = Column(Integer, default=0)
    dislikes = Column(Integer, default=0)
    is_public = Column(Boolean, default=True)
    uploader_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String(50))
    tags = Column(Text)  # JSON массив тегов
    created_at = Column(DateTime, default=lambda: datetime.now(pytz.UTC))
    
    uploader = relationship("User", back_populates="videos")
    comments = relationship("Comment", back_populates="video")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    video_id = Column(String(11), ForeignKey("videos.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(pytz.UTC))
    
    video = relationship("Video", back_populates="comments")
    author = relationship("User", back_populates="comments")
    replies = relationship("Comment", backref="parent", remote_side=[id])

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    subscriber_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    channel_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(pytz.UTC))
    
    subscriber = relationship("User", foreign_keys=[subscriber_id])
    channel = relationship("User", foreign_keys=[channel_id])

class WatchHistory(Base):
    __tablename__ = "watch_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    video_id = Column(String(11), ForeignKey("videos.id"), nullable=False)
    watched_at = Column(DateTime, default=lambda: datetime.now(pytz.UTC))
    watch_duration = Column(Integer)  # Сколько секунд просмотрено
    
    user = relationship("User")
    video = relationship("Video")

# Создаем таблицы
Base.metadata.create_all(bind=engine)

# Dependency для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()