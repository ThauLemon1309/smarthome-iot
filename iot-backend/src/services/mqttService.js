const mqtt = require('mqtt');
const mqttConfig = require('../config/mqtt');

class MQTTService {
  constructor(onMessageCallback) {
    this.client = null;
    this.onMessageCallback = onMessageCallback;
    this.connected = false;
  }

  connect() {
    this.client = mqtt.connect(mqttConfig.broker, {
      username: mqttConfig.username,
      password: mqttConfig.password,
      clientId: mqttConfig.clientId,
      ...mqttConfig.options,
    });

    this.client.on('connect', () => {
      console.log('MQTT connected');
      this.connected = true;

      this.subscribe([
        mqttConfig.topics.temperature,
        mqttConfig.topics.humidity,
        mqttConfig.topics.light,
        mqttConfig.topics.fan,
        mqttConfig.topics.mode,
        mqttConfig.topics.rbg,
        mqttConfig.topics.rgb,
        mqttConfig.topics.led,
        mqttConfig.topics.lcd,
      ].filter(Boolean));
    });

    this.client.on('message', (topic, message) => {
      const payload = message.toString();
      console.log(`MQTT received ${topic}: ${payload}`);
      if (this.onMessageCallback) {
        this.onMessageCallback(topic, payload);
      }
    });

    this.client.on('error', (error) => {
      console.error('MQTT error:', error.message);
    });

    this.client.on('disconnect', () => {
      console.log('MQTT disconnected');
      this.connected = false;
    });

    this.client.on('close', () => {
      this.connected = false;
    });
  }

  subscribe(topics) {
    if (!Array.isArray(topics)) topics = [topics];

    topics.forEach((topic) => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`MQTT subscribe ${topic} failed:`, err.message);
        } else {
          console.log(`MQTT subscribed: ${topic}`);
        }
      });
    });
  }

  publish(topic, message) {
    if (!this.connected) {
      console.error('MQTT is not connected');
      return false;
    }

    this.client.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
      if (err) {
        console.error(`MQTT publish ${topic} failed:`, err.message);
      } else {
        console.log(`MQTT published ${topic}: ${JSON.stringify(message)}`);
      }
    });

    return true;
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('MQTT connection closed');
    }
  }
}

module.exports = MQTTService;
