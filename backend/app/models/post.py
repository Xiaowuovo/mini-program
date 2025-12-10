"""
社区帖子数据模型
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class Post(Base):
    """社区帖子模型"""
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True, comment="帖子ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    title = Column(String(200), nullable=False, comment="标题")
    content = Column(Text, nullable=False, comment="内容")
    images = Column(JSON, comment="图片URL列表")
    like_count = Column(Integer, default=0, comment="点赞数")
    comment_count = Column(Integer, default=0, comment="评论数")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="发布时间")

    def __repr__(self):
        return f"<Post(id={self.id}, title={self.title})>"
