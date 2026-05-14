import serial.tools.list_ports
import time
import sys
from Adafruit_IO import MQTTClient

AIO_USERNAME = "w7thm"
AIO_KEY = "aio_RsOh51gGEAZtkkgzdTwN5PjRENnb"

AIO_FEED_IDS = ["da-mode", "da-fan", "da-rbg", "da-lcd"]

def connected(client):
    print("Ket noi thanh cong...")
    for feed in AIO_FEED_IDS:
        client.subscribe(feed)
        print(f"    >> Da subscribe feed: {feed}")

def subscribe(client, userdata, mid, granted_qos):
    print("Subcribe thanh cong...")

def disconnected(client):
    print("Ngat ket noi...")
    sys.exit(1)

def message(client, feed_id, payload):
    FEED_ID_MAP = {
        "da-mode": "1",
        "da-fan" : "2",
        "da-rbg" : "3",
        "da-lcd" : "4",
    }

    print(f"[Adafruit → Yolobit] Feed: {feed_id} | Gia tri: {payload}")

    if isMicrobitConnected:
        device_id = FEED_ID_MAP.get(feed_id, "0")
        command = f"!{device_id}:{feed_id}:{payload}#"
        ser.write(command.encode())
        print(f"    >> Da gui xuong Yolobit: {command.strip()}")

client = MQTTClient(AIO_USERNAME, AIO_KEY)
client.on_connect    = connected
client.on_disconnect = disconnected
client.on_message    = message
client.on_subscribe  = subscribe
client.connect()
client.loop_background()

def getPort():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        strPort = str(port)
        if "USB Serial Device" in strPort:
            return strPort.split(" ")[0]
    return "None"

isMicrobitConnected = False
ser = None

if getPort() != "None":
    ser = serial.Serial(port=getPort(), baudrate=115200)
    isMicrobitConnected = True
    print(f"Da ket noi Yolobit tai cong: {getPort()}")
else:
    print("Khong tim thay Yolobit")

FIELD_TO_FEED = {
    "da-temp"  : "da-temp",
    "da-humi"  : "da-humi",
    "da-bright": "da-bright",
    "da-fan"   : "da-fan",
}

def processData(data):
    try:
        data = data.replace("!", "").replace("#", "").strip()
        splitData = data.split(":")
        print(f"    Raw splitData: {splitData}")

        if len(splitData) < 3:
            print(f"Du lieu khong du 3 phan, bo qua: {splitData}")
            return

        device_id = splitData[0]
        field     = splitData[1]
        value     = splitData[2]

        if field in FIELD_TO_FEED:
            feed = FIELD_TO_FEED[field]
            client.publish(feed, value)
            print(f"[Yolobit → Adafruit] ID: {device_id} | Field: {field} | Value: {value} → Feed: {feed}")
        else:
            print(f"Field khong duoc ho tro: {field}")

    except Exception as e:
        print(f"Loi xu ly du lieu '{data}': {e}")

mess = ""

def readSerial():
    global mess
    try:
        bytesToRead = ser.inWaiting()
        if bytesToRead > 0:
            mess += ser.read(bytesToRead).decode("UTF-8")

            while ("!" in mess) and ("#" in mess):
                start = mess.find("!")
                end   = mess.find("#")

                if start < end:
                    processData(mess[start:end + 1])

                mess = mess[end + 1:]

    except Exception as e:
        print(f"Loi doc Serial: {e}")

print("\nGateway dang chay...\n")

while True:
    if isMicrobitConnected:
        readSerial()
    time.sleep(1)
