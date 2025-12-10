"""
社区功能API路由
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.models.post import Post
from app.models.comment import Comment
from app.models.like import Like
from app.models.user import User
from app.schemas.post import (
    Post as PostSchema,
    PostCreate,
    PostUpdate,
    PostDetail,
    PostListResponse,
    Comment as CommentSchema,
    CommentCreate,
    CommentDetail,
    CommentListResponse
)
from app.api.deps import get_current_user

router = APIRouter()


# ========== 帖子接口 ==========

@router.get("/posts", response_model=PostListResponse, summary="获取帖子列表")
async def get_posts(
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db)
):
    """
    获取社区帖子列表（公开接口，可不登录访问）
    按发布时间倒序排列
    """
    current_user = None  # 公开接口，不需要登录

    # 获取总数
    total = db.query(Post).count()

    # 分页查询
    posts = db.query(Post).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()

    # 构造详情列表（包含用户信息和点赞状态）
    post_details = []
    for post in posts:
        user = db.query(User).filter(User.id == post.user_id).first()

        post_dict = PostDetail.from_orm(post).dict()
        if user:
            post_dict["user_nickname"] = user.nickname
            post_dict["user_avatar"] = user.avatar

        # 检查当前用户是否点赞
        if current_user:
            like = db.query(Like).filter(
                Like.post_id == post.id,
                Like.user_id == current_user.id
            ).first()
            post_dict["is_liked"] = like is not None

        post_details.append(PostDetail(**post_dict))

    return PostListResponse(total=total, items=post_details)


@router.get("/posts/{post_id}", response_model=PostDetail, summary="获取帖子详情")
async def get_post(
    post_id: int,
    db: Session = Depends(get_db)
):
    """获取指定帖子的详细信息（公开接口）"""
    current_user = None  # 公开接口，不需要登录

    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在"
        )

    user = db.query(User).filter(User.id == post.user_id).first()

    post_dict = PostDetail.from_orm(post).dict()
    if user:
        post_dict["user_nickname"] = user.nickname
        post_dict["user_avatar"] = user.avatar

    # 检查当前用户是否点赞
    if current_user:
        like = db.query(Like).filter(
            Like.post_id == post.id,
            Like.user_id == current_user.id
        ).first()
        post_dict["is_liked"] = like is not None

    return PostDetail(**post_dict)


@router.post("/posts", response_model=PostSchema, summary="发布帖子")
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """发布新帖子"""

    post = Post(
        user_id=current_user.id,
        title=post_data.title,
        content=post_data.content,
        images=post_data.images,
        like_count=0,
        comment_count=0
    )

    db.add(post)
    db.commit()
    db.refresh(post)

    return post


@router.put("/posts/{post_id}", response_model=PostSchema, summary="更新帖子")
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新帖子（仅作者可操作）"""

    post = db.query(Post).filter(
        Post.id == post_id,
        Post.user_id == current_user.id
    ).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在或无权限操作"
        )

    # 更新字段
    if post_data.title is not None:
        post.title = post_data.title
    if post_data.content is not None:
        post.content = post_data.content
    if post_data.images is not None:
        post.images = post_data.images

    db.commit()
    db.refresh(post)

    return post


@router.delete("/posts/{post_id}", summary="删除帖子")
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除帖子（仅作者可操作）"""

    post = db.query(Post).filter(
        Post.id == post_id,
        Post.user_id == current_user.id
    ).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在或无权限操作"
        )

    db.delete(post)
    db.commit()

    return {"message": "删除成功"}


# ========== 点赞接口 ==========

@router.post("/posts/{post_id}/like", summary="点赞帖子")
async def like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """点赞帖子"""

    # 检查帖子是否存在
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在"
        )

    # 检查是否已点赞
    existing_like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == current_user.id
    ).first()

    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已经点赞过了"
        )

    # 创建点赞记录
    like = Like(
        post_id=post_id,
        user_id=current_user.id
    )

    db.add(like)

    # 更新帖子点赞数
    post.like_count += 1

    db.commit()

    return {"message": "点赞成功", "like_count": post.like_count}


@router.delete("/posts/{post_id}/like", summary="取消点赞")
async def unlike_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """取消点赞"""

    # 检查帖子是否存在
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在"
        )

    # 查找点赞记录
    like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == current_user.id
    ).first()

    if not like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="还未点赞"
        )

    # 删除点赞记录
    db.delete(like)

    # 更新帖子点赞数
    if post.like_count > 0:
        post.like_count -= 1

    db.commit()

    return {"message": "取消点赞成功", "like_count": post.like_count}


# ========== 评论接口 ==========

@router.get("/posts/{post_id}/comments", response_model=CommentListResponse, summary="获取帖子评论列表")
async def get_post_comments(
    post_id: int,
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(50, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db)
):
    """获取指定帖子的评论列表"""

    # 检查帖子是否存在
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在"
        )

    # 获取总数
    total = db.query(Comment).filter(Comment.post_id == post_id).count()

    # 分页查询
    comments = db.query(Comment).filter(Comment.post_id == post_id)\
        .order_by(Comment.created_at.asc()).offset(skip).limit(limit).all()

    # 构造详情列表（包含用户信息）
    comment_details = []
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()

        comment_dict = CommentDetail.from_orm(comment).dict()
        if user:
            comment_dict["user_nickname"] = user.nickname
            comment_dict["user_avatar"] = user.avatar

        comment_details.append(CommentDetail(**comment_dict))

    return CommentListResponse(total=total, items=comment_details)


@router.post("/posts/{post_id}/comments", response_model=CommentSchema, summary="发表评论")
async def create_comment(
    post_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """对帖子发表评论"""

    # 检查帖子是否存在
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在"
        )

    # 创建评论
    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment_data.content
    )

    db.add(comment)

    # 更新帖子评论数
    post.comment_count += 1

    db.commit()
    db.refresh(comment)

    return comment


@router.delete("/comments/{comment_id}", summary="删除评论")
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除评论（仅作者可操作）"""

    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.user_id == current_user.id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="评论不存在或无权限操作"
        )

    # 更新帖子评论数
    post = db.query(Post).filter(Post.id == comment.post_id).first()
    if post and post.comment_count > 0:
        post.comment_count -= 1

    db.delete(comment)
    db.commit()

    return {"message": "删除成功"}


# ========== 我的帖子 ==========

@router.get("/my-posts", response_model=PostListResponse, summary="获取我的帖子")
async def get_my_posts(
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户发布的帖子列表"""

    # 获取总数
    total = db.query(Post).filter(Post.user_id == current_user.id).count()

    # 分页查询
    posts = db.query(Post).filter(Post.user_id == current_user.id)\
        .order_by(Post.created_at.desc()).offset(skip).limit(limit).all()

    # 构造详情列表
    post_details = []
    for post in posts:
        post_dict = PostDetail.from_orm(post).dict()
        post_dict["user_nickname"] = current_user.nickname
        post_dict["user_avatar"] = current_user.avatar

        # 检查点赞状态
        like = db.query(Like).filter(
            Like.post_id == post.id,
            Like.user_id == current_user.id
        ).first()
        post_dict["is_liked"] = like is not None

        post_details.append(PostDetail(**post_dict))

    return PostListResponse(total=total, items=post_details)
