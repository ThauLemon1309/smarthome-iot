// src/services/adafruitMqttService.js
// Kết nối MQTT tới Adafruit IO Cloud (bidirectional sync)

const mqtt = require('mqtt');
const adafruitConfig = require('../config/adafruit');

class AdafruitMqttService {
  constructor(onMessageCallback) {
    this.client = null;
    this.onMessageCallback = onMessageCallback;
    this.connected = false;
    this.isAdafruitMqtt = true; // Flag để phân biệt với local MQTT
  }

  /**
   * 🔗 CONNECT TO ADAFRUIT MQTT BROKER
   * Kết nối tới MQTT broker của Adafruit IO
   */
  connect() {
    console.log('🔄 Đang kết nối tới Adafruit MQTT Broker...');
    
    const clientId = `iot-backend-${Date.now()}`;
    const brokerUrl = `mqtt://${adafruitConfig.mqttBroker}:${adafruitConfig.mqttPort}`;
    
    this.client = mqtt.connect(brokerUrl, {
      username: adafruitConfig.mqttUsername,
      password: adafruitConfig.mqttKey,
      clientId: clientId,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 3000,
    });

    // ✅ Connected
    this.client.on('connect', () => {
      console.log('✅ Kết nối Adafruit MQTT: SUCCESS');
      this.connected = true;
      
      // Subscribe tới tất cả feeds để nhận data từ cloud
      this.subscribeToAllFeeds();
    });

    // 📨 Message received (dữ liệu từ Adafruit)
    this.client.on('message', (topic, message) => {
      const payload = message.toString();
      console.log(`📨 Nhận từ Adafruit ${topic}: ${payload}`);
      
      if (this.onMessageCallback) {
        this.onMessageCallback(topic, payload);
      }
    });

    // ⚠️ Error
    this.client.on('error', (error) => {
      console.error('❌ Adafruit MQTT error:', error.message);
    });

    // 🔌 Disconnected
    this.client.on('disconnect', () => {
      console.log('🔌 Adafruit MQTT disconnected');
      this.connected = false;
    });

    // 🔄 Reconnecting
    this.client.on('reconnect', () => {
      console.log('🔄 Đang kết nối lại tới Adafruit...');
    });
  }

  /**
   * 📨 SUBSCRIBE TO ALL FEEDS
   * Đăng ký nhận dữ liệu từ tất cả feeds
   */
  subscribeToAllFeeds() {
    const topics = adafruitConfig.allFeeds.map(feed => 
      adafruitConfig.getMqttTopic(feed)
    );

    topics.forEach((topic) => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`❌ Subscribe ${topic} failed:`, err.message);
        } else {
          console.log(`✅ Subscribed: ${topic}`);
        }
      });
    });
  }

  /**
   * 📤 PUBLISH DATA TO ADAFRUIT
   * Gửi dữ liệu lên Adafruit MQTT topic
   */
  publish(topic, message) {
    if (!this.connected) {
      console.error('❌ Adafruit MQTT is not connected');
      return false;
    }

    this.client.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
      if (err) {
        console.error(`❌ Publish to ${topic} failed:`, err.message);
      } else {
        console.log(`✅ Published to ${topic}:`, message);
      }
    });

    return true;
  }

  /**
   * 🔌 DISCONNECT
   * Ngắt kết nối
   */
  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('🔌 Adafruit MQTT connection closed');
    }
  }
}

module.exports = AdafruitMqttService;
