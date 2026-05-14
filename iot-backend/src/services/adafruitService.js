const axios = require('axios');
const adafruitConfig = require('../config/adafruit');

class AdafruitService {
  constructor() {
    this.baseURL = adafruitConfig.apiUrl;
    this.username = adafruitConfig.username;
    this.headers = adafruitConfig.getHeaders();
    this.cache = {}; // Local cache for latest values
  }

  /**
   * 📤 SEND DATA TO ADAFRUIT (PUSH)
   * Gửi dữ liệu từ local MQTT lên Adafruit Cloud
   */
  async sendData(feedName, value) {
    try {
      const url = `${this.baseURL}/${this.username}/feeds/${feedName}/data`;
      
      const payload = { value: value };
      
      const response = await axios.post(url, payload, { headers: this.headers });
      
      console.log(`✅ Gửi ${feedName} = ${value} lên Adafruit Cloud`);
      this.cache[feedName] = value;
      
      return response.data;
    } catch (error) {
      console.error(`❌ Lỗi gửi ${feedName} lên Adafruit:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * 📥 GET DATA FROM ADAFRUIT (PULL)
   * Lấy dữ liệu từ Adafruit Cloud về local
   */
  async getData(feedName) {
    try {
      const url = `${this.baseURL}/${this.username}/feeds/${feedName}/data`;
      
      const response = await axios.get(url, { headers: this.headers });
      console.log(`📥 Lấy ${feedName} từ Adafruit:`, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`❌ Lỗi lấy ${feedName} từ Adafruit:`, error.message);
      return null;
    }
  }

  /**
   * 🔄 GET LAST VALUE (LATEST)
   * Lấy giá trị gần nhất từ Adafruit
   */
  async getLastValue(feedName) {
    try {
      const url = `${this.baseURL}/${this.username}/feeds/${feedName}/data/last`;
      
      const response = await axios.get(url, { headers: this.headers });
      const value = response.data.value;
      
      console.log(`✅ Giá trị cuối từ ${feedName}:`, value);
      this.cache[feedName] = value;
      
      return value;
    } catch (error) {
      console.error(`❌ Lỗi lấy last value ${feedName}:`, error.message);
      return null;
    }
  }

  /**
   * 📊 GET HISTORY (FOR CHARTS)
   * Lấy lịch sử dữ liệu từ Adafruit (cho biểu đồ)
   */
  async getHistory(feedName, hours = 6) {
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      const url = `${this.baseURL}/${this.username}/feeds/${feedName}/data`;
      
      const response = await axios.get(url, {
        headers: this.headers,
        params: {
          start_time: startTime,
          limit: 100,
        },
      });
      
      console.log(`📊 Lịch sử ${feedName} (${hours}h): ${response.data.length} records`);
      return response.data;
    } catch (error) {
      console.error(`❌ Lỗi lấy history ${feedName}:`, error.message);
      return null;
    }
  }

  /**
   * 🔄 SYNC ALL FEEDS
   * Đồng bộ tất cả feeds từ Adafruit về local
   */
  async syncAllFeeds(feedList) {
    try {
      const results = {};
      
      for (const feedName of feedList) {
        try {
          const url = `${this.baseURL}/${this.username}/feeds/${feedName}/data/last`;
          const response = await axios.get(url, { headers: this.headers });
          
          results[feedName] = {
            value: response.data.value,
            timestamp: response.data.created_at,
            synced: true
          };
          
          this.cache[feedName] = response.data.value;
        } catch (error) {
          console.error(`⚠️ Lỗi đồng bộ ${feedName}:`, error.message);
          results[feedName] = { synced: false, error: error.message };
        }
      }
      
      console.log('✅ Hoàn thành đồng bộ tất cả feeds từ Adafruit');
      return results;
    } catch (error) {
      console.error('❌ Lỗi sync all feeds:', error.message);
      return null;
    }
  }

  /**
   * 🔍 CHECK CONNECTION
   * Kiểm tra kết nối tới Adafruit bằng cách test đọc một feed
   */
  async checkConnection() {
    try {
      // Test by reading a known feed (da-temp)
      const url = `${this.baseURL}/${this.username}/feeds/da-temp/data/last`;
      const response = await axios.get(url, { headers: this.headers });
      
      console.log('✅ Kết nối Adafruit IO: OK');
      return { connected: true, data: response.data };
    } catch (error) {
      console.error('❌ Lỗi kết nối Adafruit:', error.message);
      return { connected: false, error: error.message };
    }
  }

  /**
   * 📈 GET ALL FEEDS
   * Lấy giá trị cuối từ tất cả feeds
   */
  async getAllFeeds(feedsObject) {
    try {
      const feedNames = Object.values(feedsObject);
      const results = {};
      
      for (const feedName of feedNames) {
        try {
          const value = await this.getLastValue(feedName);
          results[feedName] = value;
        } catch (error) {
          console.error(`⚠️ Lỗi lấy ${feedName}:`, error.message);
          results[feedName] = null;
        }
      }
      
      console.log('✅ Lấy tất cả feeds từ Adafruit');
      return results;
    } catch (error) {
      console.error('❌ Lỗi get all feeds:', error.message);
      return null;
    }
  }

  /**
   * 📈 GET CACHED VALUE
   * Lấy giá trị từ cache local (nhanh)
   */
  getCachedValue(feedName) {
    return this.cache[feedName] || null;
  }

  /**
   * 🗑️ CLEAR CACHE
   * Xóa cache
   */
  clearCache() {
    this.cache = {};
  }
}

module.exports = AdafruitService;
