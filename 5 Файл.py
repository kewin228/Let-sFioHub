from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# User models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    display_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    avatar: Optional[str] = None
    channel_description: Optional[str] = None
    subscriber_count: int
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Video models
class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_public: bool = True
    category: Optional[str] = None
    tags: Optional[List[str]] = None

class VideoCreate(VideoBase):
    pass

class VideoResponse(VideoBase):
    id: str
    uploader_id: int
    thumbnail_path: Optional[str] = None
    duration: Optional[int] = None
    views: int
    likes: int
    dislikes: int
    created_at: datetime
    uploader: UserResponse
    
    class Config:
        from_attributes = True

# Comment models
class CommentBase(BaseModel):
    text: str
    parent_comment_id: Optional[int] = None

class CommentCreate(CommentBase):
    pass

class CommentResponse(CommentBase):
    id: int
    video_id: str
    author_id: int
    likes: int
    created_at: datetime
    author: UserResponse
    
    class Config:
        from_attributes = True

# Token models
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None