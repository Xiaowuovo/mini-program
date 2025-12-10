"""
作物生长规则初始化器
初始化常见作物的生长规则数据
"""
from sqlalchemy.orm import Session
from app.models.crop import Crop, CropGrowthStage, CropType, GrowthStage
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class CropInitializer:
    """作物数据初始化器"""

    @staticmethod
    def initialize_crops(db: Session) -> Dict:
        """
        初始化常见作物及其生长规则

        Returns:
            初始化统计信息
        """
        crops_data = CropInitializer._get_crop_templates()

        created_crops = 0
        created_stages = 0

        for crop_data in crops_data:
            # 检查是否已存在
            existing = db.query(Crop).filter(
                Crop.name == crop_data["name"]
            ).first()

            if existing:
                logger.info(f"作物 {crop_data['name']} 已存在，跳过")
                continue

            # 创建作物
            crop = Crop(
                name=crop_data["name"],
                scientific_name=crop_data.get("scientific_name"),
                type=crop_data["type"],
                total_growth_days=crop_data["total_growth_days"],
                environment_requirements=crop_data["environment_requirements"],
                difficulty=crop_data["difficulty"],
                common_pests=crop_data.get("common_pests", []),
                description=crop_data.get("description"),
                planting_tips=crop_data.get("planting_tips")
            )

            db.add(crop)
            db.flush()  # 获取crop.id
            created_crops += 1

            # 创建生长阶段规则
            for stage_data in crop_data["growth_stages"]:
                stage = CropGrowthStage(
                    crop_id=crop.id,
                    stage=stage_data["stage"],
                    stage_days=stage_data["stage_days"],
                    watering_frequency=stage_data.get("watering_frequency"),
                    watering_amount=stage_data.get("watering_amount"),
                    fertilizing_frequency=stage_data.get("fertilizing_frequency"),
                    fertilizer_type=stage_data.get("fertilizer_type"),
                    weeding_frequency=stage_data.get("weeding_frequency"),
                    pest_check_frequency=stage_data.get("pest_check_frequency"),
                    other_tasks=stage_data.get("other_tasks"),
                    stage_tips=stage_data.get("stage_tips")
                )
                db.add(stage)
                created_stages += 1

            logger.info(f"成功创建作物: {crop_data['name']}")

        db.commit()

        return {
            "created_crops": created_crops,
            "created_stages": created_stages,
            "message": f"成功初始化 {created_crops} 种作物，{created_stages} 个生长阶段"
        }

    @staticmethod
    def _get_crop_templates() -> List[Dict]:
        """
        获取作物模板数据

        Returns:
            作物数据列表
        """
        return [
            # 番茄
            {
                "name": "番茄",
                "scientific_name": "Solanum lycopersicum",
                "type": CropType.VEGETABLE.value,
                "total_growth_days": 90,
                "difficulty": 2,
                "environment_requirements": {
                    "temperature": {"min": 15, "max": 30, "optimal": 25},
                    "humidity": {"min": 50, "max": 80, "optimal": 65},
                    "light_hours": {"min": 6, "max": 10, "optimal": 8},
                    "soil_ph": {"min": 6.0, "max": 7.0, "optimal": 6.5},
                    "soil_moisture": {"min": 50, "max": 75, "optimal": 65}
                },
                "common_pests": ["蚜虫", "白粉虱", "晚疫病", "早疫病"],
                "description": "番茄是一种常见的茄科蔬菜，适合初学者种植，果实营养丰富。",
                "planting_tips": "需要充足阳光和支架支撑，注意摘除侧枝以集中养分。",
                "growth_stages": [
                    {
                        "stage": GrowthStage.SEED.value,
                        "stage_days": 7,
                        "watering_frequency": 1,
                        "watering_amount": 0.5,
                        "fertilizing_frequency": None,
                        "fertilizer_type": None,
                        "weeding_frequency": None,
                        "pest_check_frequency": None,
                        "stage_tips": "保持土壤湿润，温度在20-25℃最佳，约7天发芽"
                    },
                    {
                        "stage": GrowthStage.SEEDLING.value,
                        "stage_days": 21,
                        "watering_frequency": 2,
                        "watering_amount": 1.0,
                        "fertilizing_frequency": 7,
                        "fertilizer_type": "氮肥为主",
                        "weeding_frequency": 7,
                        "pest_check_frequency": 3,
                        "stage_tips": "苗期需要充足光照，避免徒长，可适当追施氮肥促进叶片生长"
                    },
                    {
                        "stage": GrowthStage.GROWTH.value,
                        "stage_days": 28,
                        "watering_frequency": 2,
                        "watering_amount": 2.0,
                        "fertilizing_frequency": 10,
                        "fertilizer_type": "复合肥",
                        "weeding_frequency": 7,
                        "pest_check_frequency": 3,
                        "other_tasks": [
                            {"task": "搭架", "frequency": 0, "description": "植株长到30cm时搭建支架", "once": True},
                            {"task": "打杈", "frequency": 7, "description": "及时摘除侧枝"}
                        ],
                        "stage_tips": "及时搭架和打杈，保持通风，预防病虫害"
                    },
                    {
                        "stage": GrowthStage.FLOWERING.value,
                        "stage_days": 14,
                        "watering_frequency": 1,
                        "watering_amount": 2.0,
                        "fertilizing_frequency": 7,
                        "fertilizer_type": "磷钾肥",
                        "weeding_frequency": 7,
                        "pest_check_frequency": 3,
                        "other_tasks": [
                            {"task": "授粉", "frequency": 2, "description": "可人工辅助授粉提高坐果率"}
                        ],
                        "stage_tips": "开花期减少浇水，增施磷钾肥，可人工授粉"
                    },
                    {
                        "stage": GrowthStage.FRUITING.value,
                        "stage_days": 35,
                        "watering_frequency": 2,
                        "watering_amount": 3.0,
                        "fertilizing_frequency": 10,
                        "fertilizer_type": "钾肥为主",
                        "weeding_frequency": 10,
                        "pest_check_frequency": 3,
                        "other_tasks": [
                            {"task": "疏果", "frequency": 0, "description": "每穗保留4-5个果实", "once": True}
                        ],
                        "stage_tips": "果实膨大期需水量大，增施钾肥提高品质，注意预防裂果"
                    }
                ]
            },
            # 黄瓜
            {
                "name": "黄瓜",
                "scientific_name": "Cucumis sativus",
                "type": CropType.VEGETABLE.value,
                "total_growth_days": 65,
                "difficulty": 2,
                "environment_requirements": {
                    "temperature": {"min": 18, "max": 32, "optimal": 25},
                    "humidity": {"min": 60, "max": 90, "optimal": 75},
                    "light_hours": {"min": 6, "max": 10, "optimal": 8},
                    "soil_ph": {"min": 6.0, "max": 7.5, "optimal": 6.5},
                    "soil_moisture": {"min": 60, "max": 80, "optimal": 70}
                },
                "common_pests": ["霜霉病", "白粉病", "蚜虫", "红蜘蛛"],
                "description": "黄瓜生长快速，产量高，适合家庭种植。",
                "planting_tips": "喜温暖湿润环境，需要搭架栽培，及时采收嫩瓜。",
                "growth_stages": [
                    {
                        "stage": GrowthStage.SEED.value,
                        "stage_days": 5,
                        "watering_frequency": 1,
                        "watering_amount": 0.5,
                        "fertilizing_frequency": None,
                        "fertilizer_type": None,
                        "weeding_frequency": None,
                        "pest_check_frequency": None,
                        "stage_tips": "温度25-30℃，保持湿润，约5天发芽"
                    },
                    {
                        "stage": GrowthStage.SEEDLING.value,
                        "stage_days": 15,
                        "watering_frequency": 1,
                        "watering_amount": 1.0,
                        "fertilizing_frequency": 5,
                        "fertilizer_type": "腐熟有机肥",
                        "weeding_frequency": 5,
                        "pest_check_frequency": 3,
                        "stage_tips": "保持充足光照，防止徒长，适当控水"
                    },
                    {
                        "stage": GrowthStage.GROWTH.value,
                        "stage_days": 20,
                        "watering_frequency": 1,
                        "watering_amount": 2.0,
                        "fertilizing_frequency": 7,
                        "fertilizer_type": "复合肥",
                        "weeding_frequency": 7,
                        "pest_check_frequency": 3,
                        "other_tasks": [
                            {"task": "搭架", "frequency": 0, "description": "藤蔓开始攀爬时搭架", "once": True}
                        ],
                        "stage_tips": "及时搭架引蔓，摘除老叶，保持通风"
                    },
                    {
                        "stage": GrowthStage.FLOWERING.value,
                        "stage_days": 10,
                        "watering_frequency": 1,
                        "watering_amount": 2.0,
                        "fertilizing_frequency": 5,
                        "fertilizer_type": "磷钾肥",
                        "weeding_frequency": 7,
                        "pest_check_frequency": 2,
                        "stage_tips": "开花期保持稳定水肥，可人工授粉"
                    },
                    {
                        "stage": GrowthStage.FRUITING.value,
                        "stage_days": 25,
                        "watering_frequency": 1,
                        "watering_amount": 3.0,
                        "fertilizing_frequency": 5,
                        "fertilizer_type": "复合肥+钾肥",
                        "weeding_frequency": 10,
                        "pest_check_frequency": 2,
                        "other_tasks": [
                            {"task": "采收", "frequency": 2, "description": "及时采收嫩瓜，促进持续结瓜"}
                        ],
                        "stage_tips": "结瓜期需水肥充足，及时采收可延长采收期"
                    }
                ]
            },
            # 生菜
            {
                "name": "生菜",
                "scientific_name": "Lactuca sativa",
                "type": CropType.VEGETABLE.value,
                "total_growth_days": 45,
                "difficulty": 1,
                "environment_requirements": {
                    "temperature": {"min": 15, "max": 25, "optimal": 18},
                    "humidity": {"min": 60, "max": 80, "optimal": 70},
                    "light_hours": {"min": 4, "max": 8, "optimal": 6},
                    "soil_ph": {"min": 6.0, "max": 7.0, "optimal": 6.5},
                    "soil_moisture": {"min": 60, "max": 75, "optimal": 68}
                },
                "common_pests": ["蚜虫", "软腐病", "菌核病"],
                "description": "生菜生长周期短，管理简单，非常适合新手种植。",
                "planting_tips": "喜冷凉气候，夏季注意遮阴降温，保持土壤湿润。",
                "growth_stages": [
                    {
                        "stage": GrowthStage.SEED.value,
                        "stage_days": 5,
                        "watering_frequency": 1,
                        "watering_amount": 0.3,
                        "fertilizing_frequency": None,
                        "fertilizer_type": None,
                        "weeding_frequency": None,
                        "pest_check_frequency": None,
                        "stage_tips": "保持土壤湿润，温度15-20℃最佳"
                    },
                    {
                        "stage": GrowthStage.SEEDLING.value,
                        "stage_days": 10,
                        "watering_frequency": 1,
                        "watering_amount": 0.5,
                        "fertilizing_frequency": None,
                        "fertilizer_type": None,
                        "weeding_frequency": 5,
                        "pest_check_frequency": 5,
                        "stage_tips": "苗期避免强光直射，保持通风"
                    },
                    {
                        "stage": GrowthStage.GROWTH.value,
                        "stage_days": 25,
                        "watering_frequency": 1,
                        "watering_amount": 1.0,
                        "fertilizing_frequency": 10,
                        "fertilizer_type": "氮肥",
                        "weeding_frequency": 7,
                        "pest_check_frequency": 5,
                        "stage_tips": "生长期保持土壤湿润，适当追施氮肥促进叶片生长"
                    },
                    {
                        "stage": GrowthStage.HARVEST.value,
                        "stage_days": 5,
                        "watering_frequency": 1,
                        "watering_amount": 1.0,
                        "fertilizing_frequency": None,
                        "fertilizer_type": None,
                        "weeding_frequency": None,
                        "pest_check_frequency": 5,
                        "stage_tips": "叶球紧实后即可采收，早晨采收品质最佳"
                    }
                ]
            },
            # 草莓
            {
                "name": "草莓",
                "scientific_name": "Fragaria × ananassa",
                "type": CropType.FRUIT.value,
                "total_growth_days": 120,
                "difficulty": 3,
                "environment_requirements": {
                    "temperature": {"min": 15, "max": 25, "optimal": 20},
                    "humidity": {"min": 60, "max": 80, "optimal": 70},
                    "light_hours": {"min": 8, "max": 12, "optimal": 10},
                    "soil_ph": {"min": 5.5, "max": 6.5, "optimal": 6.0},
                    "soil_moisture": {"min": 60, "max": 75, "optimal": 68}
                },
                "common_pests": ["灰霉病", "白粉病", "蚜虫", "红蜘蛛"],
                "description": "草莓是多年生草本植物，果实香甜可口，深受喜爱。",
                "planting_tips": "需要充足阳光，定期摘除老叶和匍匐茎，注意病虫害防治。",
                "growth_stages": [
                    {
                        "stage": GrowthStage.SEEDLING.value,
                        "stage_days": 30,
                        "watering_frequency": 2,
                        "watering_amount": 0.8,
                        "fertilizing_frequency": 10,
                        "fertilizer_type": "有机肥",
                        "weeding_frequency": 7,
                        "pest_check_frequency": 5,
                        "stage_tips": "定植后保持土壤湿润，不要过深栽植"
                    },
                    {
                        "stage": GrowthStage.GROWTH.value,
                        "stage_days": 40,
                        "watering_frequency": 2,
                        "watering_amount": 1.5,
                        "fertilizing_frequency": 15,
                        "fertilizer_type": "复合肥",
                        "weeding_frequency": 10,
                        "pest_check_frequency": 5,
                        "other_tasks": [
                            {"task": "摘除匍匐茎", "frequency": 7, "description": "及时摘除匍匐茎，集中养分"}
                        ],
                        "stage_tips": "摘除多余匍匐茎和老叶，保持植株健壮"
                    },
                    {
                        "stage": GrowthStage.FLOWERING.value,
                        "stage_days": 20,
                        "watering_frequency": 1,
                        "watering_amount": 1.5,
                        "fertilizing_frequency": 10,
                        "fertilizer_type": "磷钾肥",
                        "weeding_frequency": 10,
                        "pest_check_frequency": 3,
                        "other_tasks": [
                            {"task": "授粉", "frequency": 2, "description": "可人工辅助授粉"}
                        ],
                        "stage_tips": "开花期减少浇水，避免花朵沾水，可人工授粉"
                    },
                    {
                        "stage": GrowthStage.FRUITING.value,
                        "stage_days": 30,
                        "watering_frequency": 2,
                        "watering_amount": 2.0,
                        "fertilizing_frequency": 10,
                        "fertilizer_type": "钾肥",
                        "weeding_frequency": 10,
                        "pest_check_frequency": 3,
                        "other_tasks": [
                            {"task": "铺草", "frequency": 0, "description": "果实下方铺草防止腐烂", "once": True}
                        ],
                        "stage_tips": "果实膨大期需水量大，及时采收成熟果实"
                    }
                ]
            },
            # 小白菜
            {
                "name": "小白菜",
                "scientific_name": "Brassica rapa subsp. chinensis",
                "type": CropType.VEGETABLE.value,
                "total_growth_days": 35,
                "difficulty": 1,
                "environment_requirements": {
                    "temperature": {"min": 15, "max": 25, "optimal": 20},
                    "humidity": {"min": 60, "max": 80, "optimal": 70},
                    "light_hours": {"min": 4, "max": 8, "optimal": 6},
                    "soil_ph": {"min": 6.0, "max": 7.5, "optimal": 6.8},
                    "soil_moisture": {"min": 65, "max": 80, "optimal": 72}
                },
                "common_pests": ["菜青虫", "蚜虫", "软腐病"],
                "description": "小白菜生长快速，营养丰富，是最适合新手的蔬菜之一。",
                "planting_tips": "喜冷凉湿润气候，生长期短，管理简单。",
                "growth_stages": [
                    {
                        "stage": GrowthStage.SEED.value,
                        "stage_days": 3,
                        "watering_frequency": 1,
                        "watering_amount": 0.3,
                        "fertilizing_frequency": None,
                        "fertilizer_type": None,
                        "weeding_frequency": None,
                        "pest_check_frequency": None,
                        "stage_tips": "保持土壤湿润，约3天发芽"
                    },
                    {
                        "stage": GrowthStage.SEEDLING.value,
                        "stage_days": 7,
                        "watering_frequency": 1,
                        "watering_amount": 0.5,
                        "fertilizing_frequency": None,
                        "fertilizer_type": None,
                        "weeding_frequency": 5,
                        "pest_check_frequency": 3,
                        "stage_tips": "苗期保持湿润，防治菜青虫"
                    },
                    {
                        "stage": GrowthStage.GROWTH.value,
                        "stage_days": 20,
                        "watering_frequency": 1,
                        "watering_amount": 1.0,
                        "fertilizing_frequency": 7,
                        "fertilizer_type": "氮肥",
                        "weeding_frequency": 7,
                        "pest_check_frequency": 3,
                        "stage_tips": "生长期追施氮肥，保持土壤湿润"
                    },
                    {
                        "stage": GrowthStage.HARVEST.value,
                        "stage_days": 5,
                        "watering_frequency": 1,
                        "watering_amount": 1.0,
                        "fertilizing_frequency": None,
                        "fertilizer_type": None,
                        "weeding_frequency": None,
                        "pest_check_frequency": 3,
                        "stage_tips": "叶片鲜嫩时采收，可分批采收"
                    }
                ]
            }
        ]
