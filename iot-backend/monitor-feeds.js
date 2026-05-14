require('dotenv').config();
const axios = require('axios');
const adafruitConfig = require('./src/config/adafruit');

const API_URL = adafruitConfig.apiUrl;
const USERNAME = adafruitConfig.username;
const KEY = adafruitConfig.key;
const FEEDS = adafruitConfig.allFeeds;

const headers = {
  'X-AIO-Key': KEY,
  'Content-Type': 'application/json'
};

// Lưu giá trị trước đó để phát hiện thay đổi
let previousValues = {};

async function getFeedValue(feedName) {
  try {
    const url = `${API_URL}/${USERNAME}/feeds/${feedName}/data/last`;
    const response = await axios.get(url, { headers });
    return response.data.value;
  } catch (error) {
    return null;
  }
}

async function monitorFeeds() {
  console.log('🔍 Bắt đầu monitor các feeds từ Adafruit IO...\n');
  
  for (const feed of FEEDS) {
    try {
      const value = await getFeedValue(feed);
      previousValues[feed] = value;
    } catch (error) {
      previousValues[feed] = null;
    }
  }

  // Kiểm tra giá trị mỗi 2 giây
  const intervalId = setInterval(async () => {
    try {
      for (const feed of FEEDS) {
        const currentValue = await getFeedValue(feed);
        const previousValue = previousValues[feed];

        if (currentValue !== previousValue) {
          const timestamp = new Date().toLocaleTimeString('vi-VN');
          const feedDisplayName = adafruitConfig.feedNames[feed] || feed;
          
          console.log(`\n📊 [${timestamp}] ${feedDisplayName} (${feed})`);
          console.log(`   Cũ: ${previousValue || 'null'}  ➜  Mới: ${currentValue || 'null'}`);
          
          previousValues[feed] = currentValue;
        }
      }
    } catch (error) {
      console.error('❌ Lỗi khi kiểm tra feeds:', error.message);
    }
  }, 2000);

  // Dừng khi nhấn Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(intervalId);
    console.log('\n\n👋 Dừng monitoring...');
    process.exit(0);
  });
}

// Kiểm tra kết nối
async function checkConnection() {
  try {
    const url = `${API_URL}/${USERNAME}/feeds`;
    const response = await axios.get(url, { headers });
    console.log('✅ Kết nối Adafruit IO thành công!\n');
    return true;
  } catch (error) {
    console.error('❌ Lỗi kết nối:', error.message);
    return false;
  }
}

// Chạy chương trình
(async () => {
  const connected = await checkConnection();
  if (connected) {
    await monitorFeeds();
  }
})();
