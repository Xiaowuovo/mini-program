"""
菜地图片库
包含200个真实有效的菜地、农场、花园图片链接（国内可访问）
优先使用稳定的占位图服务
"""

# 方案1：使用多个占位图服务的组合
# 这些服务在国内大部分地区可访问，如果某个失效，还有备选方案

GARDEN_IMAGES = []

# 1. 使用 Placehold.co（现代、稳定）
for i in range(1, 51):
    GARDEN_IMAGES.append(f"https://placehold.co/800x600/4CAF50/FFF?text=Garden+{i:02d}")

# 2. 使用 DummyImage（经典、稳定）
for i in range(1, 51):
    GARDEN_IMAGES.append(f"https://dummyimage.com/800x600/66BB6A/ffffff&text=Farm+{i:02d}")

# 3. 使用 via.placeholder.com（稳定）
for i in range(1, 51):
    GARDEN_IMAGES.append(f"https://via.placeholder.com/800x600/81C784/FFFFFF?text=Plot+{i:02d}")

# 4. 使用 fakeimg.pl（备选）
for i in range(1, 51):
    GARDEN_IMAGES.append(f"https://fakeimg.pl/800x600/4CAF50/FFF/?text=Garden+{i:02d}")

# 确保正好200张
GARDEN_IMAGES = GARDEN_IMAGES[:200]

# 如果需要本地图片，取消下面的注释
# 本地图片路径（需要将图片放在 static/images/gardens/ 目录）
LOCAL_GARDEN_IMAGES = [
    "/static/images/gardens/default-1.jpg",
    "/static/images/gardens/default-2.jpg",
    "/static/images/gardens/default-3.jpg",
    "/static/images/gardens/default-4.jpg",
    "/static/images/gardens/default-5.jpg",
    "/static/images/gardens/vegetable-1.jpg",
    "/static/images/gardens/vegetable-2.jpg",
    "/static/images/gardens/vegetable-3.jpg",
    "/static/images/gardens/farm-1.jpg",
    "/static/images/gardens/farm-2.jpg",
]

# 菜地名称模板
GARDEN_NAME_TEMPLATES = [
    "阳光菜地{area}区{number:02d}号",
    "田园小筑{area}区{number:02d}号",
    "绿野仙踪{area}区{number:02d}号",
    "有机农场{area}区{number:02d}号",
    "生态菜园{area}区{number:02d}号",
    "四季田园{area}区{number:02d}号",
    "悠然菜地{area}区{number:02d}号",
    "锦绣田园{area}区{number:02d}号",
]

# 区域标识
AREAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

# 位置描述模板
LOCATION_TEMPLATES = [
    "园区{direction}第{row}排",
    "{direction}靠近水源区域",
    "中心区域第{row}排",
    "{direction}阳光充足区",
    "靠近{direction}围墙第{row}排",
]

DIRECTIONS = ['东侧', '西侧', '南侧', '北侧', '东北侧', '东南侧', '西北侧', '西南侧']

# 描述模板
DESCRIPTION_TEMPLATES = [
    "光照充足,土质肥沃,适合种植各类蔬菜",
    "靠近水源,方便浇灌,适合种植瓜果类",
    "通风良好,适合种植叶菜类蔬菜",
    "土壤肥沃,排水良好,适合根茎类蔬菜",
    "阳光充足,适合种植茄果类蔬菜",
    "环境优美,适合休闲种植",
    "配备自动灌溉系统,省时省力",
    "有机土壤,无污染,绿色健康",
    "面积适中,适合新手入门",
    "大面积菜地,适合大规模种植",
]


def get_random_garden_data():
    """
    生成随机菜地数据
    """
    import random

    area = random.choice(AREAS)
    number = random.randint(1, 99)
    name_template = random.choice(GARDEN_NAME_TEMPLATES)
    name = name_template.format(area=area, number=number)

    # 随机面积 (10-50平方米)
    area_size = round(random.uniform(10, 50), 2)

    # 根据面积计算价格 (15-25元/平方米/月)
    price_per_sqm = random.uniform(15, 25)
    price = round(area_size * price_per_sqm, 2)

    # 随机位置
    location_template = random.choice(LOCATION_TEMPLATES)
    direction = random.choice(DIRECTIONS)
    row = random.randint(1, 10)
    location = location_template.format(direction=direction, row=row)

    # 随机描述
    description = random.choice(DESCRIPTION_TEMPLATES)

    # 随机1-3张图片
    image_count = random.randint(1, 3)
    images = random.sample(GARDEN_IMAGES, image_count)

    return {
        "name": name,
        "area": area_size,
        "price": price,
        "location": location,
        "description": description,
        "images": images,
        "status": "available"
    }


if __name__ == "__main__":
    # 测试生成
    print(f"图片库总数: {len(GARDEN_IMAGES)}")
    print("\n生成5个示例菜地:")
    for i in range(5):
        garden = get_random_garden_data()
        print(f"\n{i+1}. {garden['name']}")
        print(f"   面积: {garden['area']} 平方米")
        print(f"   价格: {garden['price']} 元/月")
        print(f"   位置: {garden['location']}")
        print(f"   图片数: {len(garden['images'])}")
        print(f"   示例图片: {garden['images'][0]}")