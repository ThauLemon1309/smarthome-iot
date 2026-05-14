// src/config/adafruit.js
// Adafruit IO Configuration for Cloud Sync (REST API + MQTT)

module.exports = {
  // REST API Configuration
  apiUrl: process.env.ADAFRUIT_API_URL || 'https://io.adafruit.com/api/v2',
  username: process.env.ADAFRUIT_IO_USERNAME,
  key: process.env.ADAFRUIT_IO_KEY,
  
  // MQTT Broker Configuration (Adafruit IoT)
  mqttBroker: 'io.adafruit.com',
  mqttPort: 1883,
  mqttUsername: process.env.ADAFRUIT_IO_USERNAME,
  mqttKey: process.env.ADAFRUIT_IO_KEY,
  
  // Feeds Mapping - Match with actual Adafruit feeds
  feeds: {
    temperature: 'da-temp',
    humidity: 'da-humi',
    brightness: 'da-brig',
    fan: 'da-fan',
    mode: 'da-mode',
    rgb: 'da-rgb',
    lcd: 'da-lcd'
  },
  
  // Danh sách tất cả feeds
  allFeeds: [
    'da-temp',
    'da-humi',
    'da-brig',
    'da-fan',
    'da-mode',
    'da-rgb',
    'da-lcd'
  ],
  
  // Mapping feed names sang display names
  feedNames: {
    'da-temp': 'Temperature (°C)',
    'da-brig': 'Brightness (%)',
    'da-fan': 'Fan Speed',
    'da-humi': 'Humidity (%)',
    'da-lcd': 'LCD Display',
    'da-mode': 'Mode',
    'da-rgb': 'RGB Color'
  },
  
  // Headers cho API requests
  getHeaders() {
    return {
      'X-AIO-Key': this.key,
      'Content-Type': 'application/json'
    };
  },
  
  // Get MQTT Topic for Subscribe
  getMqttTopic(feedName) {
    return `${this.mqttUsername}/feeds/${feedName}`;
  },
  
  // Get MQTT Publish Topic
  getMqttPublishTopic(feedName) {
    return `${this.mqttUsername}/feeds/${feedName}/json`;
  }
};
