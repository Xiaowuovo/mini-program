"""
种植记录相关的Pydantic模型
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PlantingRecordCreate(BaseModel):
    """创建种植记录请求"""
    garden_id: int = Field(..., description="菜地ID")
    crop_id: int = Field(..., description="作物ID")
    planting_date: str = Field(..., description="种植日期，格式: YYYY-MM-DD")
    quantity: Optional[int] = Field(1, description="种植数量")
    area: Optional[float] = Field(0, description="占地面积（平方米）")
    notes: Optional[str] = Field("", description="备注")


class PlantingRecordResponse(BaseModel):
    """种植记录响应"""
    id: int
    crop_name: str
    planting_date: str
    expected_harvest_date: str
    quantity: int
    area: float

    class Config:
        from_attributes = True
