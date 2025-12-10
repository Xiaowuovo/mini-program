// utils/crop-rules.js - 作物生长规则引擎

/**
 * 作物生长规则库
 * 基于农业专业知识和实践经验
 */

// 作物类型配置
const CROP_TYPES = {
  'tomato': {
    name: '番茄',
    growthDays: 90,        // 生长周期（天）
    wateringInterval: 2,   // 浇水间隔（天）
    fertilizingInterval: 14, // 施肥间隔（天）
    weedingInterval: 10,   // 除草间隔（天）
    optimalTemp: { min: 15, max: 28 }, // 最适温度（°C）
    optimalHumidity: { min: 60, max: 80 }, // 最适湿度（%）
    stages: [
      { name: '育苗期', days: 20, tasks: ['保温', '适量浇水'] },
      { name: '生长期', days: 30, tasks: ['增加浇水', '施氮肥'] },
      { name: '开花期', days: 20, tasks: ['减少浇水', '施磷钾肥'] },
      { name: '结果期', days: 20, tasks: ['均匀浇水', '病虫害防治'] }
    ]
  },
  'cucumber': {
    name: '黄瓜',
    growthDays: 60,
    wateringInterval: 1,
    fertilizingInterval: 10,
    weedingInterval: 7,
    optimalTemp: { min: 18, max: 32 },
    optimalHumidity: { min: 70, max: 90 },
    stages: [
      { name: '育苗期', days: 15, tasks: ['保温保湿', '防病'] },
      { name: '抽蔓期', days: 20, tasks: ['搭架', '追肥'] },
      { name: '开花结果期', days: 25, tasks: ['授粉', '采收'] }
    ]
  },
  'lettuce': {
    name: '生菜',
    growthDays: 40,
    wateringInterval: 2,
    fertilizingInterval: 15,
    weedingInterval: 10,
    optimalTemp: { min: 15, max: 20 },
    optimalHumidity: { min: 60, max: 70 },
    stages: [
      { name: '发芽期', days: 7, tasks: ['保湿', '遮阳'] },
      { name: '生长期', days: 20, tasks: ['施肥', '浇水'] },
      { name: '成熟期', days: 13, tasks: ['控水', '准备采收'] }
    ]
  },
  'spinach': {
    name: '菠菜',
    growthDays: 35,
    wateringInterval: 3,
    fertilizingInterval: 14,
    weedingInterval: 10,
    optimalTemp: { min: 10, max: 22 },
    optimalHumidity: { min: 50, max: 70 },
    stages: [
      { name: '发芽期', days: 7, tasks: ['保持土壤湿润'] },
      { name: '生长期', days: 20, tasks: ['施氮肥', '除草'] },
      { name: '成熟期', days: 8, tasks: ['停止施肥'] }
    ]
  },
  'carrot': {
    name: '胡萝卜',
    growthDays: 100,
    wateringInterval: 4,
    fertilizingInterval: 20,
    weedingInterval: 14,
    optimalTemp: { min: 15, max: 25 },
    optimalHumidity: { min: 50, max: 70 },
    stages: [
      { name: '发芽期', days: 10, tasks: ['保持土壤湿润', '覆盖遮阳'] },
      { name: '幼苗期', days: 20, tasks: ['间苗', '除草'] },
      { name: '肉质根膨大期', days: 50, tasks: ['追肥', '防虫'] },
      { name: '成熟期', days: 20, tasks: ['控水', '准备采收'] }
    ]
  }
}

/**
 * 智能提醒规则引擎
 */
class CropReminderEngine {
  /**
   * 根据种植信息生成提醒任务
   * @param {object} plantInfo - 种植信息
   * @returns {array} 提醒任务列表
   */
  static generateReminders(plantInfo) {
    const { cropType, plantDate, gardenName } = plantInfo
    const crop = CROP_TYPES[cropType]

    if (!crop) {
      console.warn('未知作物类型:', cropType)
      return []
    }

    const reminders = []
    const plantDateTime = new Date(plantDate)
    const now = new Date()
    const daysPassed = Math.floor((now - plantDateTime) / (1000 * 60 * 60 * 24))

    // 1. 生成浇水提醒
    reminders.push(...this.generateWateringReminders(
      crop, plantDateTime, daysPassed, gardenName
    ))

    // 2. 生成施肥提醒
    reminders.push(...this.generateFertilizingReminders(
      crop, plantDateTime, daysPassed, gardenName
    ))

    // 3. 生成除草提醒
    reminders.push(...this.generateWeedingReminders(
      crop, plantDateTime, daysPassed, gardenName
    ))

    // 4. 生成阶段性任务提醒
    reminders.push(...this.generateStageReminders(
      crop, plantDateTime, daysPassed, gardenName
    ))

    // 5. 生成收获提醒
    if (daysPassed >= crop.growthDays - 5) {
      reminders.push({
        type: 'harvesting',
        title: `${crop.name}即将成熟`,
        description: `您的${crop.name}预计在${crop.growthDays - daysPassed}天后可以收获`,
        dueDate: this.addDays(plantDateTime, crop.growthDays),
        priority: 'high',
        gardenName
      })
    }

    return reminders
  }

  /**
   * 生成浇水提醒
   */
  static generateWateringReminders(crop, plantDate, daysPassed, gardenName) {
    const reminders = []
    const nextWateringDay = Math.ceil((daysPassed + 1) / crop.wateringInterval) * crop.wateringInterval

    reminders.push({
      type: 'watering',
      title: '浇水提醒',
      description: `建议对${crop.name}进行浇水，保持土壤湿润`,
      dueDate: this.addDays(plantDate, nextWateringDay),
      priority: 'high',
      gardenName,
      tips: '早晨或傍晚浇水效果最好，避免中午高温时段'
    })

    return reminders
  }

  /**
   * 生成施肥提醒
   */
  static generateFertilizingReminders(crop, plantDate, daysPassed, gardenName) {
    const reminders = []
    const nextFertilizingDay = Math.ceil((daysPassed + 1) / crop.fertilizingInterval) * crop.fertilizingInterval

    if (nextFertilizingDay <= crop.growthDays) {
      reminders.push({
        type: 'fertilizing',
        title: '施肥提醒',
        description: `建议对${crop.name}施肥，促进生长`,
        dueDate: this.addDays(plantDate, nextFertilizingDay),
        priority: 'medium',
        gardenName,
        tips: '根据生长阶段选择合适的肥料类型'
      })
    }

    return reminders
  }

  /**
   * 生成除草提醒
   */
  static generateWeedingReminders(crop, plantDate, daysPassed, gardenName) {
    const reminders = []
    const nextWeedingDay = Math.ceil((daysPassed + 1) / crop.weedingInterval) * crop.weedingInterval

    if (nextWeedingDay <= crop.growthDays) {
      reminders.push({
        type: 'weeding',
        title: '除草提醒',
        description: `建议清除${crop.name}周围的杂草`,
        dueDate: this.addDays(plantDate, nextWeedingDay),
        priority: 'low',
        gardenName,
        tips: '连根拔除，避免伤害作物根系'
      })
    }

    return reminders
  }

  /**
   * 生成阶段性任务提醒
   */
  static generateStageReminders(crop, plantDate, daysPassed, gardenName) {
    const reminders = []
    let accumulatedDays = 0

    for (let stage of crop.stages) {
      const stageStartDay = accumulatedDays
      const stageEndDay = accumulatedDays + stage.days
      accumulatedDays += stage.days

      // 如果当前处于该阶段或即将进入该阶段
      if (daysPassed >= stageStartDay - 2 && daysPassed <= stageEndDay + 2) {
        reminders.push({
          type: 'stage_task',
          title: `${stage.name}管理`,
          description: `${crop.name}进入${stage.name}，需要：${stage.tasks.join('、')}`,
          dueDate: this.addDays(plantDate, stageStartDay),
          priority: 'medium',
          gardenName,
          tips: stage.tasks.join('；')
        })
      }
    }

    return reminders
  }

  /**
   * 根据物联网数据生成预警提醒
   * @param {object} sensorData - 传感器数据
   * @param {object} plantInfo - 种植信息
   */
  static generateIoTReminders(sensorData, plantInfo) {
    const { cropType, gardenName } = plantInfo
    const crop = CROP_TYPES[cropType]

    if (!crop) return []

    const reminders = []
    const { temperature, humidity, soilMoisture, lightIntensity } = sensorData

    // 温度预警
    if (temperature < crop.optimalTemp.min) {
      reminders.push({
        type: 'temperature_low',
        title: '温度过低预警',
        description: `当前温度${temperature}°C，低于${crop.name}最适温度`,
        priority: 'high',
        gardenName,
        action: '建议采取保温措施'
      })
    } else if (temperature > crop.optimalTemp.max) {
      reminders.push({
        type: 'temperature_high',
        title: '温度过高预警',
        description: `当前温度${temperature}°C，高于${crop.name}最适温度`,
        priority: 'high',
        gardenName,
        action: '建议遮阳降温'
      })
    }

    // 湿度预警
    if (humidity < crop.optimalHumidity.min) {
      reminders.push({
        type: 'humidity_low',
        title: '湿度过低提醒',
        description: `当前湿度${humidity}%，建议增加浇水频率`,
        priority: 'medium',
        gardenName,
        action: '喷雾增湿或增加浇水'
      })
    } else if (humidity > crop.optimalHumidity.max) {
      reminders.push({
        type: 'humidity_high',
        title: '湿度过高预警',
        description: `当前湿度${humidity}%，注意通风防病`,
        priority: 'medium',
        gardenName,
        action: '加强通风，预防病害'
      })
    }

    // 土壤湿度预警
    if (soilMoisture < 30) {
      reminders.push({
        type: 'soil_dry',
        title: '土壤干燥提醒',
        description: `土壤湿度仅${soilMoisture}%，请及时浇水`,
        priority: 'high',
        gardenName,
        action: '立即浇水'
      })
    } else if (soilMoisture > 80) {
      reminders.push({
        type: 'soil_wet',
        title: '土壤过湿预警',
        description: `土壤湿度${soilMoisture}%，可能积水`,
        priority: 'medium',
        gardenName,
        action: '检查排水，暂停浇水'
      })
    }

    return reminders
  }

  /**
   * 工具函数：日期加天数
   */
  static addDays(date, days) {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result.toISOString()
  }

  /**
   * 获取作物信息
   */
  static getCropInfo(cropType) {
    return CROP_TYPES[cropType] || null
  }

  /**
   * 获取所有支持的作物类型
   */
  static getAllCropTypes() {
    return Object.keys(CROP_TYPES).map(key => ({
      value: key,
      label: CROP_TYPES[key].name,
      growthDays: CROP_TYPES[key].growthDays
    }))
  }
}

module.exports = {
  CROP_TYPES,
  CropReminderEngine
}
