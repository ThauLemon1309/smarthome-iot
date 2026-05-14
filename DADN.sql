USE DADN;
GO

-- 1. DỌN DẸP BẢNG CŨ
DROP TABLE IF EXISTS Alert;
DROP TABLE IF EXISTS ActionExecution;
DROP TABLE IF EXISTS RuleAction;
DROP TABLE IF EXISTS ThresholdRule;
DROP TABLE IF EXISTS ScheduleAction;
DROP TABLE IF EXISTS ActionParameter;
DROP TABLE IF EXISTS ActionDefinition;
DROP TABLE IF EXISTS Schedule;
DROP TABLE IF EXISTS SensorData;
DROP TABLE IF EXISTS ControlDevice;
DROP TABLE IF EXISTS SensorDevice;
DROP TABLE IF EXISTS Device;
DROP TABLE IF EXISTS DeviceType;
DROP TABLE IF EXISTS Room;
DROP TABLE IF EXISTS Floor;
DROP TABLE IF EXISTS Admin_Home;
DROP TABLE IF EXISTS Owner_Home;
DROP TABLE IF EXISTS Home;
DROP TABLE IF EXISTS Admin;
DROP TABLE IF EXISTS Owner;
DROP TABLE IF EXISTS [User];
DROP TABLE IF EXISTS AutoModeConfig;
DROP TABLE IF EXISTS ActivityLog;
GO

-- 2. TẠO BẢNG

CREATE TABLE [User] (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('OWNER', 'ADMIN')),
    Created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE Owner (
    UserID INT PRIMARY KEY,
    FOREIGN KEY (UserID) REFERENCES [User](UserID) ON DELETE CASCADE
);

CREATE TABLE Admin (
    UserID INT PRIMARY KEY,
    FOREIGN KEY (UserID) REFERENCES [User](UserID) ON DELETE CASCADE
);

CREATE TABLE Home (
    HomeID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100),
    Address NVARCHAR(255)
);

CREATE TABLE Owner_Home (
    OwnerID INT,
    HomeID INT,
    PRIMARY KEY (OwnerID, HomeID),
    FOREIGN KEY (OwnerID) REFERENCES Owner(UserID) ON DELETE CASCADE,
    FOREIGN KEY (HomeID) REFERENCES Home(HomeID) ON DELETE CASCADE
);

CREATE TABLE Admin_Home (
    AdminID INT,
    HomeID INT,
    PRIMARY KEY (AdminID, HomeID),
    FOREIGN KEY (AdminID) REFERENCES Admin(UserID) ON DELETE CASCADE,
    FOREIGN KEY (HomeID) REFERENCES Home(HomeID) ON DELETE CASCADE
);

CREATE TABLE Floor (
    FloorID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Level INT NOT NULL,
    HomeID INT NOT NULL,
    FOREIGN KEY (HomeID) REFERENCES Home(HomeID) ON DELETE CASCADE
);

CREATE TABLE Room (
    RoomID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    FloorID INT NOT NULL,
    FOREIGN KEY (FloorID) REFERENCES Floor(FloorID) ON DELETE CASCADE
);

CREATE TABLE DeviceType (
    TypeID INT IDENTITY PRIMARY KEY,
    Code NVARCHAR(50) UNIQUE,
    Category NVARCHAR(50),   -- 'sensor' | 'control'
    Protocol NVARCHAR(50),
    ConfigSchema NVARCHAR(MAX)
);

CREATE TABLE Device (
    DeviceID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Manufacturer NVARCHAR(100),
    Is_active BIT DEFAULT 1,
    Last_seen_at DATETIME,
    Created_at DATETIME DEFAULT GETDATE(),
    TypeID INT NOT NULL,
    RoomID INT NOT NULL,
    FOREIGN KEY (RoomID) REFERENCES Room(RoomID) ON DELETE CASCADE,
    FOREIGN KEY (TypeID) REFERENCES DeviceType(TypeID) ON DELETE CASCADE
);

-- Bảng metadata tùy chọn (không nằm trong FK chain chính)
CREATE TABLE SensorDevice (
    SensorID INT PRIMARY KEY,
    DataType NVARCHAR(50),
    Unit NVARCHAR(20),
    FOREIGN KEY (SensorID) REFERENCES Device(DeviceID) ON DELETE CASCADE
);

CREATE TABLE ControlDevice (
    ControlID INT PRIMARY KEY,
    FOREIGN KEY (ControlID) REFERENCES Device(DeviceID) ON DELETE CASCADE
);

-- SensorData trỏ thẳng vào Device (không qua SensorDevice)
CREATE TABLE SensorData (
    DataID INT IDENTITY PRIMARY KEY,
    DeviceID INT NOT NULL,
    Value FLOAT NOT NULL,
    Timestamp DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (DeviceID) REFERENCES Device(DeviceID) ON DELETE CASCADE
);

CREATE TABLE Schedule (
    ScheduleID INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(100),
    RepeatType NVARCHAR(20),
    RepeatDay NVARCHAR(50),
    SpecificDays NVARCHAR(100),
    Time NVARCHAR(5) NULL,        -- HH:MM
    DurationMinutes INT NULL,     -- NULL = chạy mãi, >0 = tự tắt sau N phút
    ApplyLevel NVARCHAR(20),
    Status NVARCHAR(20),
    CreatedBy INT,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CreatedBy) REFERENCES [User](UserID) ON DELETE CASCADE
);

-- ActionDefinition trỏ thẳng vào Device (không qua ControlDevice)
CREATE TABLE ActionDefinition (
    ActionDefID INT IDENTITY PRIMARY KEY,
    ControlID INT NOT NULL,       -- Device.DeviceID của thiết bị điều khiển
    ActionType NVARCHAR(20),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ControlID) REFERENCES Device(DeviceID) ON DELETE CASCADE
);

CREATE TABLE ActionParameter (
    ParamID INT IDENTITY PRIMARY KEY,
    ActionDefID INT,
    ParamName NVARCHAR(50),
    ParamValue NVARCHAR(100),
    FOREIGN KEY (ActionDefID) REFERENCES ActionDefinition(ActionDefID) ON DELETE CASCADE
);

CREATE TABLE ScheduleAction (
    ScheduleID INT,
    ActionDefID INT,
    PRIMARY KEY (ScheduleID, ActionDefID),
    FOREIGN KEY (ScheduleID) REFERENCES Schedule(ScheduleID) ON DELETE CASCADE,
    FOREIGN KEY (ActionDefID) REFERENCES ActionDefinition(ActionDefID) ON DELETE CASCADE
);

-- ThresholdRule trỏ thẳng vào Device
CREATE TABLE ThresholdRule (
    RuleID INT IDENTITY PRIMARY KEY,
    SensorID INT NOT NULL,        -- Device.DeviceID của cảm biến
    Operator NVARCHAR(10),
    ThresholdValue FLOAT,
    CooldownSeconds INT,
    LastTriggerAt DATETIME,
    FOREIGN KEY (SensorID) REFERENCES Device(DeviceID) ON DELETE CASCADE
);

CREATE TABLE RuleAction (
    RuleID INT,
    ActionDefID INT,
    PRIMARY KEY (RuleID, ActionDefID),
    FOREIGN KEY (RuleID) REFERENCES ThresholdRule(RuleID) ON DELETE CASCADE,
    FOREIGN KEY (ActionDefID) REFERENCES ActionDefinition(ActionDefID) ON DELETE NO ACTION
);

-- ActionExecution trỏ thẳng vào Device
CREATE TABLE ActionExecution (
    ExecutionID INT IDENTITY(1,1) PRIMARY KEY,
    ActionDefID INT NULL,
    ControlID INT NOT NULL,       -- Device.DeviceID của thiết bị điều khiển
    TriggerSource NVARCHAR(20),   -- MANUAL / SCHEDULE / AUTO_MODE / RULE
    TriggerID INT NULL,
    UserID INT NULL,
    ExecutedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20),
    Message NVARCHAR(255),
    FOREIGN KEY (ActionDefID) REFERENCES ActionDefinition(ActionDefID) ON DELETE SET NULL,
    FOREIGN KEY (ControlID) REFERENCES Device(DeviceID) ON DELETE NO ACTION,
    FOREIGN KEY (UserID) REFERENCES [User](UserID) ON DELETE SET NULL
);

CREATE TABLE AutoModeConfig (
    ConfigID      INT IDENTITY(1,1) PRIMARY KEY,
    FanTempLow    FLOAT NOT NULL DEFAULT 25,
    FanTempMid    FLOAT NOT NULL DEFAULT 28,
    FanTempHigh   FLOAT NOT NULL DEFAULT 32,
    FanSpeed1     INT NOT NULL DEFAULT 30,
    FanSpeed2     INT NOT NULL DEFAULT 60,
    FanSpeed3     INT NOT NULL DEFAULT 100,
    HumiThreshold FLOAT NOT NULL DEFAULT 70,
    HumiBoost     INT NOT NULL DEFAULT 20,
    LedBrigOff    FLOAT NOT NULL DEFAULT 60,
    LedBrigYellow FLOAT NOT NULL DEFAULT 40,
    UpdatedAt     DATETIME DEFAULT GETDATE()
);

CREATE TABLE ActivityLog (
    LogID      INT IDENTITY(1,1) PRIMARY KEY,
    Category   NVARCHAR(20) NOT NULL,
    Description NVARCHAR(500) NOT NULL,
    CreatedAt  DATETIME DEFAULT GETDATE()
);

-- Alert trỏ thẳng vào Device
CREATE TABLE Alert (
    AlertID INT IDENTITY PRIMARY KEY,
    RuleID INT,
    SensorID INT,
    Message NVARCHAR(255),
    Level NVARCHAR(20),
    CreatedAt DATETIME DEFAULT GETDATE(),
    IsRead BIT DEFAULT 0,
    FOREIGN KEY (RuleID) REFERENCES ThresholdRule(RuleID) ON DELETE CASCADE,
    FOREIGN KEY (SensorID) REFERENCES Device(DeviceID) ON DELETE NO ACTION
);
GO

-- 3. TRIGGER BẢO VỆ TÍNH TOÀN VẸN
CREATE TRIGGER trg_ActionExecution_ReadOnly
ON ActionExecution
AFTER UPDATE, DELETE
AS
BEGIN
  RAISERROR('ActionExecution is append-only. UPDATE and DELETE are not allowed.', 16, 1);
  ROLLBACK TRANSACTION;
END;
GO

-- 4. DỮ LIỆU SEED

-- Users
INSERT INTO [User] (Name, Email, PasswordHash, Role)
VALUES ('Chủ Nhà Demo', 'owner@smarthome.vn', '$2b$10$Otzr7br6z9jw195CenR/veRcb5EZXRqUVJV7q7k8GcWMWOF44a8tS', 'OWNER');
INSERT INTO [User] (Name, Email, PasswordHash, Role)
VALUES ('Admin Demo', 'admin@smarthome.vn', '$2b$10$Otzr7br6z9jw195CenR/veRcb5EZXRqUVJV7q7k8GcWMWOF44a8tS', 'ADMIN');
INSERT INTO Owner (UserID) VALUES (1);
INSERT INTO Admin (UserID) VALUES (2);

-- Home
INSERT INTO Home (Name, Address) VALUES ('Nhà Thông Minh Demo', '123 Đường ABC, TP.HCM');
INSERT INTO Owner_Home (OwnerID, HomeID) VALUES (1, 1);
INSERT INTO Admin_Home (AdminID, HomeID) VALUES (2, 1);

-- Floor + Room (1 phòng duy nhất cho demo)
INSERT INTO Floor (Name, Level, HomeID) VALUES (N'Tầng 1', 1, 1);
INSERT INTO Room (Name, FloorID) VALUES (N'Phòng chính', 1);

-- DeviceTypes (khớp với TypeCode dùng trong backend)
INSERT INTO DeviceType (Code, Category, Protocol) VALUES ('temperature-sensor', 'sensor', 'MQTT');
INSERT INTO DeviceType (Code, Category, Protocol) VALUES ('humidity-sensor',    'sensor', 'MQTT');
INSERT INTO DeviceType (Code, Category, Protocol) VALUES ('light-sensor',       'sensor', 'MQTT');
INSERT INTO DeviceType (Code, Category, Protocol) VALUES ('fan',                'control','MQTT');
INSERT INTO DeviceType (Code, Category, Protocol) VALUES ('rgb-led',            'control','MQTT');
INSERT INTO DeviceType (Code, Category, Protocol) VALUES ('lcd',                'control','MQTT');

-- Devices: 1 thiết bị mỗi loại, tất cả trong phòng duy nhất (RoomID=1)
-- TypeID 1=temp, 2=humi, 3=light, 4=fan, 5=rgb-led, 6=lcd
INSERT INTO Device (Name, TypeID, RoomID) VALUES (N'Cảm biến nhiệt độ',  1, 1); -- DeviceID 1
INSERT INTO Device (Name, TypeID, RoomID) VALUES (N'Cảm biến độ ẩm',     2, 1); -- DeviceID 2
INSERT INTO Device (Name, TypeID, RoomID) VALUES (N'Cảm biến ánh sáng',  3, 1); -- DeviceID 3
INSERT INTO Device (Name, TypeID, RoomID) VALUES (N'Quạt',                4, 1); -- DeviceID 4
INSERT INTO Device (Name, TypeID, RoomID) VALUES (N'Đèn LED RGB',         5, 1); -- DeviceID 5
INSERT INTO Device (Name, TypeID, RoomID) VALUES (N'Màn hình LCD',        6, 1); -- DeviceID 6

-- SensorDevice metadata (tùy chọn, dùng để hiển thị unit)
INSERT INTO SensorDevice (SensorID, DataType, Unit) VALUES (1, 'Float', N'°C');
INSERT INTO SensorDevice (SensorID, DataType, Unit) VALUES (2, 'Float', '%');
INSERT INTO SensorDevice (SensorID, DataType, Unit) VALUES (3, 'Float', '%');

-- ControlDevice metadata
INSERT INTO ControlDevice (ControlID) VALUES (4);
INSERT INTO ControlDevice (ControlID) VALUES (5);
INSERT INTO ControlDevice (ControlID) VALUES (6);

-- AutoModeConfig mặc định
INSERT INTO AutoModeConfig (FanTempLow, FanTempMid, FanTempHigh, FanSpeed1, FanSpeed2, FanSpeed3,
                            HumiThreshold, HumiBoost, LedBrigOff, LedBrigYellow)
VALUES (25, 28, 32, 30, 60, 100, 70, 20, 60, 40);
GO
