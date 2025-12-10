"""
点赞数据模型
"""
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.core.database import Base


class Like(Base):
    """点赞模型"""
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True, comment="点赞ID")
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True, comment="帖子ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="点赞时间")

    # 唯一约束：每个用户对每个帖子只能点赞一次
    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='uq_post_user_like'),
    )

    def __repr__(self):
        return f"<Like(post_id={self.post_id}, user_id={self.user_id})>"
