// MQTT Broker Configuration
module.exports = {
  broker: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  clientId: 'iot-backend-' + Math.random().toString(16).substr(2, 8),
  
  // MQTT Topics
  topics: {
    temperature: process.env.MQTT_TOPIC_TEMP || 'smartHome/sensors/temperature',
    humidity: process.env.MQTT_TOPIC_HUMIDITY || 'smartHome/sensors/humidity',
    light: process.env.MQTT_TOPIC_LIGHT || 'smartHome/sensors/light',
    fan: process.env.MQTT_TOPIC_FAN || 'smartHome/devices/fan',
    mode: process.env.MQTT_TOPIC_MODE || 'smartHome/devices/mode',
    rbg: process.env.MQTT_TOPIC_RBG || 'smartHome/devices/rbg',
    rgb: process.env.MQTT_TOPIC_RGB || process.env.MQTT_TOPIC_RBG || 'smartHome/devices/rbg',
    led: process.env.MQTT_TOPIC_LED || 'smartHome/devices/led',
    lcd: process.env.MQTT_TOPIC_LCD || 'smartHome/devices/lcd'
  },
  
  // MQTT Options
  options: {
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000
  }
};
