"""
社区帖子数据Schema
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PostBase(BaseModel):
    """帖子基础Schema"""
    title: str = Field(..., max_length=200, description="标题")
    content: str = Field(..., description="内容")


class PostCreate(PostBase):
    """创建帖子Schema"""
    images: Optional[List[str]] = Field(default=[], description="图片URL列表")


class PostUpdate(BaseModel):
    """更新帖子Schema"""
    title: Optional[str] = Field(None, max_length=200, description="标题")
    content: Optional[str] = Field(None, description="内容")
    images: Optional[List[str]] = Field(None, description="图片URL列表")


class PostInDB(PostBase):
    """数据库中的帖子Schema"""
    id: int
    user_id: int
    images: Optional[List[str]]
    like_count: int
    comment_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class Post(PostInDB):
    """帖子响应Schema"""
    pass


class PostDetail(Post):
    """帖子详情Schema（包含用户信息）"""
    user_nickname: Optional[str] = Field(None, description="用户昵称")
    user_avatar: Optional[str] = Field(None, description="用户头像")
    is_liked: bool = Field(default=False, description="当前用户是否点赞")


class PostListResponse(BaseModel):
    """帖子列表响应Schema"""
    total: int = Field(..., description="总数")
    items: List[PostDetail] = Field(..., description="帖子列表")


class CommentBase(BaseModel):
    """评论基础Schema"""
    content: str = Field(..., description="评论内容")


class CommentCreate(CommentBase):
    """创建评论Schema"""
    pass


class CommentInDB(CommentBase):
    """数据库中的评论Schema"""
    id: int
    post_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Comment(CommentInDB):
    """评论响应Schema"""
    pass


class CommentDetail(Comment):
    """评论详情Schema（包含用户信息）"""
    user_nickname: Optional[str] = Field(None, description="用户昵称")
    user_avatar: Optional[str] = Field(None, description="用户头像")


class CommentListResponse(BaseModel):
    """评论列表响应Schema"""
    total: int = Field(..., description="总数")
    items: List[CommentDetail] = Field(..., description="评论列表")
