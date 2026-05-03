"""
评论数据模型
"""
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class Comment(Base):
    """评论模型"""
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True, comment="评论ID")
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True, comment="帖子ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True, comment="父评论ID")
    reply_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="被回复用户ID")
    content = Column(Text, nullable=False, comment="评论内容")
    images = Column(JSON, nullable=True, comment="评论图片URL列表")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="评论时间")

    def __repr__(self):
        return f"<Comment(id={self.id}, post_id={self.post_id})>"
