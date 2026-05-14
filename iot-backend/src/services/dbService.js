const { sql, getPool } = require('../config/database');

class DbService {
  // ==================== USER ====================
  async getUserByEmail(email) {
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT u.UserID, u.Name, u.Email, u.PasswordHash, u.Role, u.Created_at,
               CASE WHEN o.UserID IS NOT NULL THEN 'OWNER'
                    WHEN a.UserID IS NOT NULL THEN 'ADMIN'
                    ELSE u.Role END AS ResolvedRole
        FROM [User] u
        LEFT JOIN Owner o ON u.UserID = o.UserID
        LEFT JOIN Admin a ON u.UserID = a.UserID
        WHERE u.Email = @email
      `);
    return result.recordset[0] || null;
  }

  async getUserById(userId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`SELECT UserID, Name, Email, Role, Created_at FROM [User] WHERE UserID = @userId`);
    return result.recordset[0] || null;
  }

  async getAllUsers() {
    const pool = await getPool();
    const result = await pool.request()
      .query(`SELECT UserID, Name, Email, Role, Created_at FROM [User] ORDER BY Created_at DESC`);
    return result.recordset;
  }

  async createUser(name, email, passwordHash, role) {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('role', sql.NVarChar, role)
      .query(`
        INSERT INTO [User] (Name, Email, PasswordHash, Role)
        OUTPUT INSERTED.UserID, INSERTED.Name, INSERTED.Email, INSERTED.Role, INSERTED.Created_at
        VALUES (@name, @email, @passwordHash, @role)
      `);
    const user = result.recordset[0];

    // Insert into Owner or Admin table
    if (role === 'OWNER') {
      await pool.request()
        .input('userId', sql.Int, user.UserID)
        .query('INSERT INTO Owner (UserID) VALUES (@userId)');
    } else if (role === 'ADMIN') {
      await pool.request()
        .input('userId', sql.Int, user.UserID)
        .query('INSERT INTO Admin (UserID) VALUES (@userId)');
    }

    return user;
  }

  async deleteUser(userId) {
    const pool = await getPool();
    await pool.request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM [User] WHERE UserID = @userId');
  }

  // ==================== HOME ====================
  async getHomesByUser(userId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT DISTINCT h.HomeID, h.Name, h.Address
        FROM Home h
        LEFT JOIN Owner_Home oh ON h.HomeID = oh.HomeID AND oh.OwnerID = @userId
        LEFT JOIN Admin_Home ah ON h.HomeID = ah.HomeID AND ah.AdminID = @userId
        WHERE oh.OwnerID IS NOT NULL OR ah.AdminID IS NOT NULL
      `);
    return result.recordset;
  }

  async getHomeById(homeId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('homeId', sql.Int, homeId)
      .query('SELECT HomeID, Name, Address FROM Home WHERE HomeID = @homeId');
    return result.recordset[0] || null;
  }

  // ==================== FLOOR ====================
  async getFloorsByHome(homeId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('homeId', sql.Int, homeId)
      .query('SELECT FloorID, Name, Level, HomeID FROM Floor WHERE HomeID = @homeId ORDER BY Level');
    return result.recordset;
  }

  async createFloor(name, level, homeId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('level', sql.Int, level)
      .input('homeId', sql.Int, homeId)
      .query(`
        INSERT INTO Floor (Name, Level, HomeID)
        OUTPUT INSERTED.*
        VALUES (@name, @level, @homeId)
      `);
    return result.recordset[0];
  }

  async deleteFloor(floorId) {
    const pool = await getPool();
    await pool.request()
      .input('floorId', sql.Int, floorId)
      .query('DELETE FROM Floor WHERE FloorID = @floorId');
  }

  // ==================== ROOM ====================
  async getRoomsByHome(homeId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('homeId', sql.Int, homeId)
      .query(`
        SELECT r.RoomID, r.Name, r.Description, r.FloorID,
               f.HomeID, f.Name AS FloorName, f.Level AS FloorLevel
        FROM Room r
        JOIN Floor f ON r.FloorID = f.FloorID
        WHERE f.HomeID = @homeId
        ORDER BY f.Level, r.Name
      `);
    return result.recordset;
  }

  async getRoomsByFloor(floorId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('floorId', sql.Int, floorId)
      .query(`
        SELECT r.RoomID, r.Name, r.Description, r.FloorID, f.HomeID
        FROM Room r
        JOIN Floor f ON r.FloorID = f.FloorID
        WHERE r.FloorID = @floorId ORDER BY r.Name
      `);
    return result.recordset;
  }

  async getRoomById(roomId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('roomId', sql.Int, roomId)
      .query(`
        SELECT r.RoomID, r.Name, r.Description, r.FloorID,
               f.HomeID, f.Name AS FloorName, f.Level AS FloorLevel
        FROM Room r
        JOIN Floor f ON r.FloorID = f.FloorID
        WHERE r.RoomID = @roomId
      `);
    return result.recordset[0] || null;
  }

  async createRoom(name, description, homeId, floorId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('floorId', sql.Int, floorId)
      .query(`
        INSERT INTO Room (Name, Description, FloorID)
        OUTPUT INSERTED.*
        VALUES (@name, @description, @floorId)
      `);
    return result.recordset[0];
  }

  async deleteRoom(roomId) {
    const pool = await getPool();
    await pool.request()
      .input('roomId', sql.Int, roomId)
      .query('DELETE FROM Room WHERE RoomID = @roomId');
  }

  // ==================== DEVICE TYPE ====================
  async getDeviceTypes() {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT TypeID, Code, Category, Protocol, ConfigSchema FROM DeviceType');
    return result.recordset;
  }

  async getDeviceTypeByCode(code) {
    const pool = await getPool();
    const result = await pool.request()
      .input('code', sql.NVarChar, code)
      .query('SELECT TypeID, Code, Category, Protocol FROM DeviceType WHERE Code = @code');
    return result.recordset[0] || null;
  }

  // ==================== DEVICE ====================
  async getAllDevices(homeId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('homeId', sql.Int, homeId)
      .query(`
        SELECT d.DeviceID, d.Name, d.Manufacturer, d.Is_active, d.Last_seen_at, d.Created_at,
               d.TypeID, d.RoomID,
               dt.Code AS TypeCode, dt.Category, dt.Protocol,
               sd.DataType, sd.Unit
        FROM Device d
        JOIN DeviceType dt ON d.TypeID = dt.TypeID
        JOIN Room r ON d.RoomID = r.RoomID
        JOIN Floor f ON r.FloorID = f.FloorID
        LEFT JOIN SensorDevice sd ON d.DeviceID = sd.SensorID
        WHERE f.HomeID = @homeId
        ORDER BY r.RoomID, d.Name
      `);
    return result.recordset;
  }

  async getDevicesByRoom(roomId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('roomId', sql.Int, roomId)
      .query(`
        SELECT d.DeviceID, d.Name, d.Manufacturer, d.Is_active, d.Last_seen_at, d.Created_at,
               d.TypeID, d.RoomID,
               dt.Code AS TypeCode, dt.Category, dt.Protocol,
               sd.DataType, sd.Unit
        FROM Device d
        JOIN DeviceType dt ON d.TypeID = dt.TypeID
        LEFT JOIN SensorDevice sd ON d.DeviceID = sd.SensorID
        WHERE d.RoomID = @roomId
        ORDER BY d.Name
      `);
    return result.recordset;
  }

  async createDevice(name, manufacturer, typeId, roomId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('manufacturer', sql.NVarChar, manufacturer)
      .input('typeId', sql.Int, typeId)
      .input('roomId', sql.Int, roomId)
      .query(`
        INSERT INTO Device (Name, Manufacturer, TypeID, RoomID)
        OUTPUT INSERTED.*
        VALUES (@name, @manufacturer, @typeId, @roomId)
      `);
    const device = result.recordset[0];

    // Check device type category and insert into SensorDevice or ControlDevice
    const typeResult = await pool.request()
      .input('typeId', sql.Int, typeId)
      .query('SELECT Category FROM DeviceType WHERE TypeID = @typeId');
    const category = typeResult.recordset[0]?.Category;

    if (category === 'sensor') {
      await pool.request()
        .input('sensorId', sql.Int, device.DeviceID)
        .query('INSERT INTO SensorDevice (SensorID) VALUES (@sensorId)');
    } else if (category === 'control') {
      await pool.request()
        .input('controlId', sql.Int, device.DeviceID)
        .query('INSERT INTO ControlDevice (ControlID) VALUES (@controlId)');
    }

    return device;
  }

  async updateDevice(deviceId, updates) {
    const pool = await getPool();
    const setClauses = [];
    const request = pool.request().input('deviceId', sql.Int, deviceId);

    if (updates.name !== undefined) {
      setClauses.push('Name = @name');
      request.input('name', sql.NVarChar, updates.name);
    }
    if (updates.isActive !== undefined) {
      setClauses.push('Is_active = @isActive');
      request.input('isActive', sql.Bit, updates.isActive);
    }
    if (updates.manufacturer !== undefined) {
      setClauses.push('Manufacturer = @manufacturer');
      request.input('manufacturer', sql.NVarChar, updates.manufacturer);
    }

    if (setClauses.length === 0) return null;

    setClauses.push('Last_seen_at = GETDATE()');

    const result = await request.query(`
      UPDATE Device SET ${setClauses.join(', ')}
      OUTPUT INSERTED.*
      WHERE DeviceID = @deviceId
    `);
    return result.recordset[0] || null;
  }

  async deleteDevice(deviceId) {
    const pool = await getPool();
    await pool.request()
      .input('deviceId', sql.Int, deviceId)
      .query('DELETE FROM Device WHERE DeviceID = @deviceId');
  }

  // ==================== SENSOR DATA ====================

  // Trả về { temperature: id, humidity: id, brightness: id }
  // dùng TypeCode để map, không hardcode ID
  // Trả về { temperature: DeviceID, humidity: DeviceID, brightness: DeviceID }
  async getSensorDeviceIdsByType() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT d.DeviceID, dt.Code
      FROM Device d
      JOIN DeviceType dt ON d.TypeID = dt.TypeID
      WHERE dt.Category = 'sensor'
      ORDER BY d.DeviceID
    `);
    const map = {};
    for (const row of result.recordset) {
      const code = row.Code;
      if (code === 'temperature-sensor') map.temperature = row.DeviceID;
      else if (code === 'humidity-sensor') map.humidity = row.DeviceID;
      else if (code === 'light-sensor') map.brightness = row.DeviceID;
    }
    return map;
  }

  async saveSensorData(deviceId, value) {
    const pool = await getPool();
    const result = await pool.request()
      .input('deviceId', sql.Int, deviceId)
      .input('value', sql.Float, value)
      .query(`
        INSERT INTO SensorData (DeviceID, Value)
        OUTPUT INSERTED.*
        VALUES (@deviceId, @value)
      `);
    return result.recordset[0];
  }

  async getSensorHistory(deviceId, hours = 6) {
    const pool = await getPool();
    const result = await pool.request()
      .input('deviceId', sql.Int, deviceId)
      .input('hours', sql.Int, hours)
      .query(`
        SELECT DataID, DeviceID, Value, Timestamp
        FROM SensorData
        WHERE DeviceID = @deviceId
          AND Timestamp >= DATEADD(HOUR, -@hours, GETDATE())
        ORDER BY Timestamp DESC
      `);
    return result.recordset;
  }

  // ==================== SCHEDULE ====================
  async getSchedules(userId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT s.ScheduleID, s.Name, s.RepeatType, s.RepeatDay, s.SpecificDays,
               s.Time, s.ApplyLevel, s.Status, s.CreatedBy, s.UpdatedAt
        FROM Schedule s
        WHERE s.CreatedBy = @userId
        ORDER BY s.UpdatedAt DESC
      `);

    // For each schedule, get its actions
    const schedules = [];
    for (const sched of result.recordset) {
      const actions = await this.getScheduleActions(sched.ScheduleID);
      schedules.push({ ...sched, actions });
    }
    return schedules;
  }

  // Lấy schedule đang active có Time để schedule executor chạy
  async getActiveSchedulesForExecution() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ScheduleID, Name, RepeatType, RepeatDay, Time, DurationMinutes, Status
      FROM Schedule WHERE Status = 'active' AND Time IS NOT NULL
    `);
    const schedules = [];
    for (const sched of result.recordset) {
      const actions = await this.getScheduleActionsWithType(sched.ScheduleID);
      schedules.push({ ...sched, actions });
    }
    return schedules;
  }

  // Lấy actions kèm TypeCode của thiết bị (cho schedule executor)
  async getScheduleActionsWithType(scheduleId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('scheduleId', sql.Int, scheduleId)
      .query(`
        SELECT ad.ActionDefID, ad.ControlID, ad.ActionType,
               dt.Code AS TypeCode
        FROM ScheduleAction sa
        JOIN ActionDefinition ad ON sa.ActionDefID = ad.ActionDefID
        JOIN Device d ON ad.ControlID = d.DeviceID
        JOIN DeviceType dt ON d.TypeID = dt.TypeID
        WHERE sa.ScheduleID = @scheduleId
      `);
    const actions = [];
    for (const action of result.recordset) {
      const params = await this.getActionParameters(action.ActionDefID);
      actions.push({ ...action, parameters: params });
    }
    return actions;
  }

  // Lấy TypeCode của thiết bị theo DeviceID
  async getDeviceTypeCode(deviceId) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('deviceId', sql.Int, deviceId)
        .query('SELECT dt.Code FROM Device d JOIN DeviceType dt ON d.TypeID = dt.TypeID WHERE d.DeviceID = @deviceId');
      return result.recordset[0]?.Code || null;
    } catch { return null; }
  }

  // Lấy DeviceID theo TypeCode (dùng cho logging manual/auto)
  async getControlDeviceByTypeCode(typeCode) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('typeCode', sql.NVarChar, typeCode)
        .query(`
          SELECT TOP 1 d.DeviceID
          FROM Device d
          JOIN DeviceType dt ON d.TypeID = dt.TypeID
          WHERE dt.Code = @typeCode AND dt.Category = 'control'
          ORDER BY d.DeviceID
        `);
      return result.recordset[0]?.DeviceID || null;
    } catch { return null; }
  }

  async getScheduleActions(scheduleId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('scheduleId', sql.Int, scheduleId)
      .query(`
        SELECT ad.ActionDefID, ad.ControlID, ad.ActionType, ad.CreatedAt,
               d.Name AS DeviceName
        FROM ScheduleAction sa
        JOIN ActionDefinition ad ON sa.ActionDefID = ad.ActionDefID
        JOIN Device d ON ad.ControlID = d.DeviceID
        WHERE sa.ScheduleID = @scheduleId
      `);

    // Get parameters for each action
    const actions = [];
    for (const action of result.recordset) {
      const params = await this.getActionParameters(action.ActionDefID);
      actions.push({ ...action, parameters: params });
    }
    return actions;
  }

  async getActionParameters(actionDefId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('actionDefId', sql.Int, actionDefId)
      .query(`
        SELECT ParamID, ParamName, ParamValue
        FROM ActionParameter WHERE ActionDefID = @actionDefId
      `);
    return result.recordset;
  }

  async createSchedule(name, repeatType, repeatDay, specificDays, applyLevel, status, createdBy, time, durationMinutes, actions) {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('repeatType', sql.NVarChar, repeatType)
      .input('repeatDay', sql.NVarChar, repeatDay)
      .input('specificDays', sql.NVarChar, specificDays || null)
      .input('time', sql.NVarChar, time || null)
      .input('duration', sql.Int, durationMinutes || null)
      .input('applyLevel', sql.NVarChar, applyLevel)
      .input('status', sql.NVarChar, status)
      .input('createdBy', sql.Int, createdBy)
      .query(`
        INSERT INTO Schedule (Name, RepeatType, RepeatDay, SpecificDays, Time, DurationMinutes, ApplyLevel, Status, CreatedBy)
        OUTPUT INSERTED.*
        VALUES (@name, @repeatType, @repeatDay, @specificDays, @time, @duration, @applyLevel, @status, @createdBy)
      `);
    const schedule = result.recordset[0];
    console.log('[dbService.createSchedule] Schedule created, ID:', schedule?.ScheduleID);

    // Tạo ActionDefinition + ActionParameter + ScheduleAction cho mỗi action
    console.log('[dbService.createSchedule] Processing actions, count:', Array.isArray(actions) ? actions.length : 0);
    // Map paramName → TypeCode (độc lập với mock ID từ frontend)
    const PARAM_TYPECODE = {
      fanSpeed: 'fan',
      rgbLevel: 'rgb-led',
      ledLevel: 'rgb-led',
      lcdText: 'lcd',
    };

    if (Array.isArray(actions) && actions.length > 0) {
      for (const action of actions) {
        const { actionType, parameters } = action;
        console.log('[dbService.createSchedule] Action:', { actionType, paramCount: parameters?.length || 0 });

        // Xác định TypeCode từ paramName, không dùng controlDeviceId từ frontend
        const paramName = parameters?.[0]?.paramName;
        const typeCode = PARAM_TYPECODE[paramName];
        if (!typeCode) {
          console.log('[dbService.createSchedule] ⚠️  Không xác định được typeCode từ paramName:', paramName);
          continue;
        }

        // Tìm DeviceID theo TypeCode, trỏ thẳng vào Device (không qua ControlDevice)
        const canonicalRow = await pool.request()
          .input('typeCode', sql.NVarChar, typeCode)
          .query(`
            SELECT TOP 1 d.DeviceID
            FROM Device d
            JOIN DeviceType dt ON d.TypeID = dt.TypeID
            WHERE dt.Code = @typeCode AND dt.Category = 'control'
            ORDER BY d.DeviceID
          `);
        const resolvedControlId = canonicalRow.recordset[0]?.DeviceID;
        if (!resolvedControlId) {
          console.log(`[dbService.createSchedule] ⚠️  Không tìm thấy Device cho typeCode=${typeCode}`);
          continue;
        }
        console.log('[dbService.createSchedule] Resolved ControlID:', resolvedControlId, 'cho typeCode:', typeCode);

        // Tạo ActionDefinition
        console.log('[dbService.createSchedule] Creating ActionDefinition for ControlID:', resolvedControlId);
        const actionDefResult = await pool.request()
          .input('controlId', sql.Int, resolvedControlId)
          .input('actionType', sql.NVarChar, actionType || 'SET')
          .query(`
            INSERT INTO ActionDefinition (ControlID, ActionType)
            OUTPUT INSERTED.*
            VALUES (@controlId, @actionType)
          `);
        const actionDef = actionDefResult.recordset[0];
        console.log('[dbService.createSchedule] ActionDefinition created, ID:', actionDef?.ActionDefID);

        // Tạo ActionParameter
        if (Array.isArray(parameters)) {
          console.log('[dbService.createSchedule] Processing', parameters.length, 'parameters');
          for (const param of parameters) {
            console.log('[dbService.createSchedule] Inserting param:', param.paramName, '=', param.paramValue);
            await pool.request()
              .input('actionDefId', sql.Int, actionDef.ActionDefID)
              .input('paramName', sql.NVarChar, param.paramName)
              .input('paramValue', sql.NVarChar, String(param.paramValue))
              .query(`
                INSERT INTO ActionParameter (ActionDefID, ParamName, ParamValue)
                VALUES (@actionDefId, @paramName, @paramValue)
              `);
            console.log('[dbService.createSchedule] ✅ ActionParameter inserted');
          }
        } else {
          console.log('[dbService.createSchedule] ⚠️  parameters is not array:', parameters);
        }

        // Liên kết Schedule ↔ ActionDefinition
        console.log('[dbService.createSchedule] Linking Schedule', schedule.ScheduleID, '→ ActionDef', actionDef.ActionDefID);
        await pool.request()
          .input('scheduleId', sql.Int, schedule.ScheduleID)
          .input('actionDefId', sql.Int, actionDef.ActionDefID)
          .query('INSERT INTO ScheduleAction (ScheduleID, ActionDefID) VALUES (@scheduleId, @actionDefId)');
        console.log('[dbService.createSchedule] ✅ ScheduleAction linked');
      }
    }

    console.log('[dbService.createSchedule] ✅ All actions processed, returning schedule');
    return schedule;
  }

  async updateSchedule(scheduleId, updates) {
    const pool = await getPool();
    const setClauses = ['UpdatedAt = GETDATE()'];
    const request = pool.request().input('scheduleId', sql.Int, scheduleId);

    if (updates.name !== undefined) {
      setClauses.push('Name = @name');
      request.input('name', sql.NVarChar, updates.name);
    }
    if (updates.status !== undefined) {
      setClauses.push('Status = @status');
      request.input('status', sql.NVarChar, updates.status);
    }
    if (updates.repeatType !== undefined) {
      setClauses.push('RepeatType = @repeatType');
      request.input('repeatType', sql.NVarChar, updates.repeatType);
    }
    if (updates.repeatDay !== undefined) {
      setClauses.push('RepeatDay = @repeatDay');
      request.input('repeatDay', sql.NVarChar, updates.repeatDay);
    }
    if (updates.time !== undefined) {
      setClauses.push('Time = @time');
      request.input('time', sql.NVarChar, updates.time || null);
    }

    const result = await request.query(`
      UPDATE Schedule SET ${setClauses.join(', ')}
      OUTPUT INSERTED.*
      WHERE ScheduleID = @scheduleId
    `);
    return result.recordset[0] || null;
  }

  async updateScheduleActionParam(scheduleId, paramValue) {
    const pool = await getPool();
    await pool.request()
      .input('scheduleId', sql.Int, scheduleId)
      .input('paramValue', sql.NVarChar, String(paramValue))
      .query(`
        UPDATE ap SET ap.ParamValue = @paramValue
        FROM ActionParameter ap
        JOIN ScheduleAction sa ON ap.ActionDefID = sa.ActionDefID
        WHERE sa.ScheduleID = @scheduleId
      `);
  }

  async deleteSchedule(scheduleId) {
    const pool = await getPool();
    await pool.request()
      .input('scheduleId', sql.Int, scheduleId)
      .query('DELETE FROM Schedule WHERE ScheduleID = @scheduleId');
  }

  // ==================== AUTO MODE CONFIG ====================
  async getAutoModeConfig() {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT TOP 1 * FROM AutoModeConfig ORDER BY ConfigID');
    if (result.recordset.length > 0) return result.recordset[0];
    // Tạo row mặc định nếu chưa có
    const insert = await pool.request().query(`
      INSERT INTO AutoModeConfig (FanTempLow, FanTempMid, FanTempHigh, FanSpeed1, FanSpeed2, FanSpeed3, HumiThreshold, HumiBoost, LedBrigOff, LedBrigYellow)
      OUTPUT INSERTED.*
      VALUES (25, 28, 32, 30, 60, 100, 70, 20, 60, 40)
    `);
    return insert.recordset[0];
  }

  async updateAutoModeConfig(updates) {
    const pool = await getPool();
    // Đảm bảo luôn có row để update
    await this.getAutoModeConfig();

    const allowed = ['FanTempLow','FanTempMid','FanTempHigh','FanSpeed1','FanSpeed2','FanSpeed3','HumiThreshold','HumiBoost','LedBrigOff','LedBrigYellow'];
    const setClauses = ['UpdatedAt = GETDATE()'];
    const request = pool.request();

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        setClauses.push(`${key} = @${key}`);
        const isInt = ['FanSpeed1','FanSpeed2','FanSpeed3','HumiBoost'].includes(key);
        request.input(key, isInt ? sql.Int : sql.Float, updates[key]);
      }
    }

    const result = await request.query(`
      UPDATE TOP(1) AutoModeConfig SET ${setClauses.join(', ')}
      OUTPUT INSERTED.*
    `);
    return result.recordset[0];
  }

  // ==================== SENSOR DATA ====================
  async getSensorDeviceByTypeCode(typeCode) {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('typeCode', sql.NVarChar, typeCode)
        .query(`
          SELECT TOP 1 d.DeviceID
          FROM Device d
          JOIN DeviceType dt ON d.TypeID = dt.TypeID
          WHERE dt.Code = @typeCode
        `);
      return result.recordset[0]?.DeviceID || null;
    } catch {
      return null;
    }
  }

  // ==================== ACTION EXECUTION (LOGS) ====================
  async getActionLogs(limit = 50, source = null, status = null) {
    const pool = await getPool();
    const request = pool.request().input('limit', sql.Int, limit);

    let whereClause = '';
    const conditions = [];
    if (source) {
      request.input('source', sql.NVarChar, source);
      conditions.push("ae.TriggerSource = @source");
    }
    if (status) {
      request.input('status', sql.NVarChar, status);
      conditions.push("ae.Status = @status");
    }
    if (conditions.length > 0) whereClause = 'WHERE ' + conditions.join(' AND ');

    const result = await request.query(`
      SELECT TOP (@limit) ae.ExecutionID, ae.ActionDefID, ae.ControlID,
             ae.TriggerSource, ae.TriggerID, ae.ExecutedAt, ae.Status, ae.Message,
             d.Name AS ControlDeviceName,
             s.Name AS ScheduleName,
             u.Name AS UserName
      FROM ActionExecution ae
      LEFT JOIN Device d ON ae.ControlID = d.DeviceID
      LEFT JOIN Schedule s ON ae.TriggerSource = 'SCHEDULE' AND ae.TriggerID = s.ScheduleID
      LEFT JOIN [User] u ON s.CreatedBy = u.UserID
      ${whereClause}
      ORDER BY ae.ExecutedAt DESC
    `);
    return result.recordset;
  }

  // actionDefId có thể NULL (cho manual/auto mode không có ActionDefinition)
  async logAction(actionDefId, controlId, triggerSource, triggerId, status, message, userId = null) {
    try {
      const pool = await getPool();
      const request = pool.request()
        .input('controlId', sql.Int, controlId)
        .input('triggerSource', sql.NVarChar, triggerSource)
        .input('triggerId', sql.Int, triggerId || null)
        .input('userId', sql.Int, userId || null)
        .input('status', sql.NVarChar, status)
        .input('message', sql.NVarChar, message || null);

      let query;
      if (actionDefId != null) {
        request.input('actionDefId', sql.Int, actionDefId);
        query = `INSERT INTO ActionExecution (ActionDefID, ControlID, TriggerSource, TriggerID, UserID, Status, Message)
                 OUTPUT INSERTED.* VALUES (@actionDefId, @controlId, @triggerSource, @triggerId, @userId, @status, @message)`;
      } else {
        query = `INSERT INTO ActionExecution (ActionDefID, ControlID, TriggerSource, TriggerID, UserID, Status, Message)
                 OUTPUT INSERTED.* VALUES (NULL, @controlId, @triggerSource, @triggerId, @userId, @status, @message)`;
      }

      const result = await request.query(query);
      return result.recordset[0];
    } catch (error) {
      console.error('❌ logAction failed:', error.message);
      return null;
    }
  }

  // ==================== THRESHOLD RULES ====================
  async getThresholdRules() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT tr.RuleID, tr.SensorID, tr.Operator, tr.ThresholdValue, tr.CooldownSeconds, tr.LastTriggerAt,
             d.Name AS SensorName, dt.Code AS SensorTypeCode
      FROM ThresholdRule tr
      JOIN Device d ON tr.SensorID = d.DeviceID
      JOIN DeviceType dt ON d.TypeID = dt.TypeID
      ORDER BY tr.RuleID
    `);
    return result.recordset;
  }

  async createThresholdRule(sensorId, operator, thresholdValue, cooldownSeconds) {
    const pool = await getPool();
    const result = await pool.request()
      .input('sensorId', sql.Int, sensorId)
      .input('operator', sql.NVarChar, operator)
      .input('thresholdValue', sql.Float, thresholdValue)
      .input('cooldownSeconds', sql.Int, cooldownSeconds || 300)
      .query(`
        INSERT INTO ThresholdRule (SensorID, Operator, ThresholdValue, CooldownSeconds)
        OUTPUT INSERTED.*
        VALUES (@sensorId, @operator, @thresholdValue, @cooldownSeconds)
      `);
    return result.recordset[0];
  }

  async deleteThresholdRule(ruleId) {
    const pool = await getPool();
    await pool.request()
      .input('ruleId', sql.Int, ruleId)
      .query('DELETE FROM ThresholdRule WHERE RuleID = @ruleId');
  }

  async updateRuleLastTrigger(ruleId) {
    try {
      const pool = await getPool();
      await pool.request()
        .input('ruleId', sql.Int, ruleId)
        .query('UPDATE ThresholdRule SET LastTriggerAt = GETDATE() WHERE RuleID = @ruleId');
    } catch { /* best effort */ }
  }

  // ==================== ALERTS ====================
  async saveAlert(ruleId, sensorId, message, level) {
    const pool = await getPool();
    const result = await pool.request()
      .input('ruleId', sql.Int, ruleId)
      .input('sensorId', sql.Int, sensorId)
      .input('message', sql.NVarChar, message)
      .input('level', sql.NVarChar, level || 'WARNING')
      .query(`
        INSERT INTO Alert (RuleID, SensorID, Message, Level)
        OUTPUT INSERTED.*
        VALUES (@ruleId, @sensorId, @message, @level)
      `);
    return result.recordset[0];
  }

  async getAlerts(limit = 50) {
    const pool = await getPool();
    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit) a.AlertID, a.RuleID, a.SensorID, a.Message, a.Level, a.CreatedAt, a.IsRead,
               d.Name AS SensorName, tr.Operator, tr.ThresholdValue
        FROM Alert a
        LEFT JOIN Device d ON a.SensorID = d.DeviceID
        LEFT JOIN ThresholdRule tr ON a.RuleID = tr.RuleID
        ORDER BY a.CreatedAt DESC
      `);
    return result.recordset;
  }

  async markAlertRead(alertId) {
    const pool = await getPool();
    await pool.request()
      .input('alertId', sql.Int, alertId)
      .query('UPDATE Alert SET IsRead = 1 WHERE AlertID = @alertId');
  }

  async markAllAlertsRead() {
    const pool = await getPool();
    await pool.request()
      .query("UPDATE Alert SET IsRead = 1 WHERE IsRead = 0");
  }

  // ==================== ACTIVITY LOG ====================
  async logActivity(category, description) {
    try {
      const pool = await getPool();
      await pool.request()
        .input('category', sql.NVarChar, category)
        .input('description', sql.NVarChar, description)
        .query(`INSERT INTO ActivityLog (Category, Description) VALUES (@category, @description)`);
    } catch { /* best effort — không làm gián đoạn luồng chính */ }
  }

  // ==================== DASHBOARD KPI ====================
  async getDashboardKPI() {
    const pool = await getPool();

    const [tempResult, fanResult, ledResult] = await Promise.all([
      // Nhiệt độ cao/thấp/trung bình + độ ẩm + ánh sáng hôm nay
      pool.request().query(`
        SELECT
          MAX(CASE WHEN dt.Code = 'temperature-sensor' THEN sd.Value END) AS TempMax,
          MIN(CASE WHEN dt.Code = 'temperature-sensor' THEN sd.Value END) AS TempMin,
          AVG(CASE WHEN dt.Code = 'temperature-sensor' THEN sd.Value END) AS TempAvg,
          AVG(CASE WHEN dt.Code = 'humidity-sensor' THEN sd.Value END) AS HumiAvg,
          AVG(CASE WHEN dt.Code = 'light-sensor' THEN sd.Value END) AS BrigAvg,
          MAX(CASE WHEN dt.Code = 'humidity-sensor' THEN sd.Value END) AS HumiMax,
          MAX(CASE WHEN dt.Code = 'light-sensor' THEN sd.Value END) AS BrigMax
        FROM SensorData sd
        JOIN Device d ON sd.DeviceID = d.DeviceID
        JOIN DeviceType dt ON d.TypeID = dt.TypeID
        WHERE dt.Code IN ('temperature-sensor','humidity-sensor','light-sensor')
          AND sd.Timestamp >= CAST(GETDATE() AS DATE)
      `),
      // Thời gian quạt bật 7 ngày: tính thực tế từ ON đến OFF bằng LEAD
      pool.request().query(`
        WITH fan_events AS (
          SELECT
            ae.ExecutedAt,
            CASE WHEN ae.Message LIKE N'%→ 0%' THEN 0 ELSE 1 END AS IsOn,
            LEAD(ae.ExecutedAt) OVER (ORDER BY ae.ExecutedAt) AS NextAt
          FROM ActionExecution ae
          JOIN Device d ON ae.ControlID = d.DeviceID
          JOIN DeviceType dt ON d.TypeID = dt.TypeID
          WHERE dt.Code = N'fan'
            AND ae.Status = N'SUCCESS'
            AND ae.ExecutedAt >= DATEADD(DAY, -7, GETDATE())
        )
        SELECT COALESCE(SUM(
          CASE WHEN IsOn = 1 THEN
            CASE WHEN DATEDIFF(MINUTE, ExecutedAt, COALESCE(NextAt, GETDATE())) > 1440
                 THEN 1440
                 ELSE DATEDIFF(MINUTE, ExecutedAt, COALESCE(NextAt, GETDATE()))
            END
          ELSE 0 END
        ), 0) AS FanOnMinutes
        FROM fan_events
      `),
      // Thời gian đèn bật 7 ngày: tính thực tế từ ON đến OFF bằng LEAD
      pool.request().query(`
        WITH led_events AS (
          SELECT
            ae.ExecutedAt,
            CASE WHEN ae.Message LIKE N'%mức 0%' OR ae.Message LIKE N'%→ 0%' THEN 0 ELSE 1 END AS IsOn,
            LEAD(ae.ExecutedAt) OVER (ORDER BY ae.ExecutedAt) AS NextAt
          FROM ActionExecution ae
          JOIN Device d ON ae.ControlID = d.DeviceID
          JOIN DeviceType dt ON d.TypeID = dt.TypeID
          WHERE dt.Code = N'rgb-led'
            AND ae.Status = N'SUCCESS'
            AND ae.ExecutedAt >= DATEADD(DAY, -7, GETDATE())
        )
        SELECT COALESCE(SUM(
          CASE WHEN IsOn = 1 THEN
            CASE WHEN DATEDIFF(MINUTE, ExecutedAt, COALESCE(NextAt, GETDATE())) > 1440
                 THEN 1440
                 ELSE DATEDIFF(MINUTE, ExecutedAt, COALESCE(NextAt, GETDATE()))
            END
          ELSE 0 END
        ), 0) AS LedOnMinutes
        FROM led_events
      `),
    ]);

    const temp = tempResult.recordset[0] || {};
    return {
      tempMax:  temp.TempMax  != null ? Number(temp.TempMax.toFixed(1))  : null,
      tempMin:  temp.TempMin  != null ? Number(temp.TempMin.toFixed(1))  : null,
      tempAvg:  temp.TempAvg  != null ? Number(temp.TempAvg.toFixed(1))  : null,
      humiAvg:  temp.HumiAvg  != null ? Number(temp.HumiAvg.toFixed(1))  : null,
      brig:     temp.BrigAvg  != null ? Number(temp.BrigAvg.toFixed(1))  : null,
      humiMax:  temp.HumiMax  != null ? Number(temp.HumiMax.toFixed(1))  : null,
      brigMax:  temp.BrigMax  != null ? Number(temp.BrigMax.toFixed(1))  : null,
      fanOnMinutes:  fanResult.recordset[0]?.FanOnMinutes || 0,
      ledOnMinutes:  ledResult.recordset[0]?.LedOnMinutes || 0,
    };
  }

  // Dữ liệu biểu đồ đường: nhiệt độ + độ ẩm + ánh sáng theo giờ (N giờ gần nhất)
  async getSensorChartData(hours = 24) {
    const pool = await getPool();
    const result = await pool.request()
      .input('hours', sql.Int, hours)
      .query(`
        SELECT
          DATEADD(HOUR, DATEDIFF(HOUR, 0, sd.Timestamp), 0) AS Hour,
          dt.Code AS SensorType,
          AVG(sd.Value) AS Avg,
          MAX(sd.Value) AS Max,
          MIN(sd.Value) AS Min
        FROM SensorData sd
        JOIN Device d ON sd.DeviceID = d.DeviceID
        JOIN DeviceType dt ON d.TypeID = dt.TypeID
        WHERE dt.Code IN ('temperature-sensor','humidity-sensor','light-sensor')
          AND sd.Timestamp >= DATEADD(HOUR, -@hours, GETDATE())
        GROUP BY DATEADD(HOUR, DATEDIFF(HOUR, 0, sd.Timestamp), 0), dt.Code
        ORDER BY Hour
      `);

    // Pivot thành mảng [{hour, temp, humi, brig}] để recharts dùng trực tiếp
    const map = new Map();
    for (const row of result.recordset) {
      const key = row.Hour.toISOString();
      if (!map.has(key)) map.set(key, { hour: key });
      const entry = map.get(key);
      if (row.SensorType === 'temperature-sensor') {
        entry.temp = Number(row.Avg.toFixed(1));
        entry.tempMax = Number(row.Max.toFixed(1));
      } else if (row.SensorType === 'humidity-sensor') {
        entry.humi = Number(row.Avg.toFixed(1));
      } else if (row.SensorType === 'light-sensor') {
        entry.brig = Number(row.Avg.toFixed(1));
      }
    }
    return [...map.values()];
  }

  // Dữ liệu biểu đồ cột: số lần kích hoạt thiết bị theo giờ (24h gần nhất)
  async getDeviceActivityChart() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        DATEADD(HOUR, DATEDIFF(HOUR, 0, ExecutedAt), 0) AS Hour,
        TriggerSource,
        COUNT(*) AS Count
      FROM ActionExecution
      WHERE ExecutedAt >= DATEADD(HOUR, -24, GETDATE())
        AND Status = 'SUCCESS'
      GROUP BY DATEADD(HOUR, DATEDIFF(HOUR, 0, ExecutedAt), 0), TriggerSource
      ORDER BY Hour
    `);

    const map = new Map();
    for (const row of result.recordset) {
      const key = row.Hour.toISOString();
      if (!map.has(key)) map.set(key, { hour: key, MANUAL: 0, SCHEDULE: 0, AUTO_MODE: 0, RULE: 0 });
      map.get(key)[row.TriggerSource] = row.Count;
    }
    return [...map.values()];
  }

  // ==================== EXPORT ====================
  async getActionLogsForExport(from, to) {
    const pool = await getPool();
    const result = await pool.request()
      .input('from', sql.DateTime, new Date(from))
      .input('to',   sql.DateTime, new Date(to + 'T23:59:59'))
      .query(`
        SELECT
          ae.ExecutedAt,
          d.Name AS DeviceName,
          ae.TriggerSource,
          ae.Status,
          ae.Message,
          u.Name AS UserName,
          s.Name AS ScheduleName
        FROM ActionExecution ae
        JOIN ControlDevice cd ON ae.ControlID = cd.ControlID
        JOIN Device d ON cd.ControlID = d.DeviceID
        LEFT JOIN [User] u ON ae.UserID = u.UserID
        LEFT JOIN Schedule s ON ae.TriggerID = s.ScheduleID
          AND ae.TriggerSource = 'SCHEDULE'
        WHERE ae.ExecutedAt BETWEEN @from AND @to
        ORDER BY ae.ExecutedAt DESC
      `);
    return result.recordset;
  }

  async getSensorDataForExport(from, to, deviceId = null) {
    const pool = await getPool();
    const request = pool.request()
      .input('from', sql.DateTime, new Date(from))
      .input('to',   sql.DateTime, new Date(to + 'T23:59:59'));
    const deviceFilter = deviceId ? 'AND sd.DeviceID = @deviceId' : '';
    if (deviceId) request.input('deviceId', sql.Int, deviceId);

    const result = await request.query(`
      SELECT
        sd.Timestamp,
        d.Name AS DeviceName,
        dt.Code AS SensorType,
        sd.Value,
        sdev.Unit
      FROM SensorData sd
      JOIN Device d ON sd.DeviceID = d.DeviceID
      JOIN DeviceType dt ON d.TypeID = dt.TypeID
      JOIN SensorDevice sdev ON sd.DeviceID = sdev.SensorID
      WHERE sd.Timestamp BETWEEN @from AND @to ${deviceFilter}
      ORDER BY sd.Timestamp DESC
    `);
    return result.recordset;
  }

  // ==================== DASHBOARD EXTENDED ====================

  // So sánh giá trị hiện tại vs 1 giờ trước (cho mũi tên xu hướng)
  async getSensorTrend() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        AVG(CASE WHEN dt.Code = 'temperature-sensor' AND sd.Timestamp >= DATEADD(HOUR,-1,GETDATE()) THEN sd.Value END) AS TempNow,
        AVG(CASE WHEN dt.Code = 'temperature-sensor' AND sd.Timestamp < DATEADD(HOUR,-1,GETDATE()) AND sd.Timestamp >= DATEADD(HOUR,-2,GETDATE()) THEN sd.Value END) AS TempPrev,
        AVG(CASE WHEN dt.Code = 'humidity-sensor'    AND sd.Timestamp >= DATEADD(HOUR,-1,GETDATE()) THEN sd.Value END) AS HumiNow,
        AVG(CASE WHEN dt.Code = 'humidity-sensor'    AND sd.Timestamp < DATEADD(HOUR,-1,GETDATE()) AND sd.Timestamp >= DATEADD(HOUR,-2,GETDATE()) THEN sd.Value END) AS HumiPrev,
        AVG(CASE WHEN dt.Code = 'light-sensor'       AND sd.Timestamp >= DATEADD(HOUR,-1,GETDATE()) THEN sd.Value END) AS BrigNow,
        AVG(CASE WHEN dt.Code = 'light-sensor'       AND sd.Timestamp < DATEADD(HOUR,-1,GETDATE()) AND sd.Timestamp >= DATEADD(HOUR,-2,GETDATE()) THEN sd.Value END) AS BrigPrev
      FROM SensorData sd
      JOIN Device d ON sd.DeviceID = d.DeviceID
      JOIN DeviceType dt ON d.TypeID = dt.TypeID
      WHERE dt.Code IN ('temperature-sensor','humidity-sensor','light-sensor')
        AND sd.Timestamp >= DATEADD(HOUR,-2,GETDATE())
    `);
    const r = result.recordset[0] || {};
    const round1 = (v) => v != null ? Number(v.toFixed(1)) : null;
    return {
      temp: { now: round1(r.TempNow), prev: round1(r.TempPrev) },
      humi: { now: round1(r.HumiNow), prev: round1(r.HumiPrev) },
      brig: { now: round1(r.BrigNow), prev: round1(r.BrigPrev) },
    };
  }

  // Biểu đồ hôm nay vs hôm qua theo giờ (0-23)
  async getSensorDualChart() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT DATEPART(HOUR, sd.Timestamp) AS Hr, 'today' AS Day,
        AVG(CASE WHEN dt.Code='temperature-sensor' THEN sd.Value END) AS Temp,
        AVG(CASE WHEN dt.Code='humidity-sensor'    THEN sd.Value END) AS Humi,
        AVG(CASE WHEN dt.Code='light-sensor'       THEN sd.Value END) AS Brig
      FROM SensorData sd
      JOIN Device d ON sd.DeviceID=d.DeviceID JOIN DeviceType dt ON d.TypeID=dt.TypeID
      WHERE sd.Timestamp >= CAST(GETDATE() AS DATE)
        AND dt.Code IN ('temperature-sensor','humidity-sensor','light-sensor')
      GROUP BY DATEPART(HOUR, sd.Timestamp)
      UNION ALL
      SELECT DATEPART(HOUR, sd.Timestamp) AS Hr, 'yesterday' AS Day,
        AVG(CASE WHEN dt.Code='temperature-sensor' THEN sd.Value END) AS Temp,
        AVG(CASE WHEN dt.Code='humidity-sensor'    THEN sd.Value END) AS Humi,
        AVG(CASE WHEN dt.Code='light-sensor'       THEN sd.Value END) AS Brig
      FROM SensorData sd
      JOIN Device d ON sd.DeviceID=d.DeviceID JOIN DeviceType dt ON d.TypeID=dt.TypeID
      WHERE sd.Timestamp >= CAST(DATEADD(DAY,-1,GETDATE()) AS DATE)
        AND sd.Timestamp < CAST(GETDATE() AS DATE)
        AND dt.Code IN ('temperature-sensor','humidity-sensor','light-sensor')
      GROUP BY DATEPART(HOUR, sd.Timestamp)
    `);

    const map = new Map();
    for (let h = 0; h < 24; h++) map.set(h, { hour: h });
    for (const row of result.recordset) {
      const entry = map.get(row.Hr);
      const round1 = (v) => v != null ? Number(v.toFixed(1)) : null;
      if (row.Day === 'today') {
        entry.tempToday = round1(row.Temp);
        entry.humiToday = round1(row.Humi);
        entry.brigToday = round1(row.Brig);
      } else {
        entry.tempYest = round1(row.Temp);
        entry.humiYest = round1(row.Humi);
        entry.brigYest = round1(row.Brig);
      }
    }
    return [...map.values()];
  }

  // Thời gian quạt/đèn bật: hôm nay và hôm qua
  async getDailyDeviceRuntime() {
    const pool = await getPool();
    const runQuery = (typeCode, isOffFilter, dateFilter) => pool.request().query(`
      WITH ev AS (
        SELECT ae.ExecutedAt,
          CASE WHEN ${isOffFilter} THEN 0 ELSE 1 END AS IsOn,
          LEAD(ae.ExecutedAt) OVER (ORDER BY ae.ExecutedAt) AS NextAt
        FROM ActionExecution ae
        JOIN Device d ON ae.ControlID=d.DeviceID
        JOIN DeviceType dt ON d.TypeID=dt.TypeID
        WHERE dt.Code=N'${typeCode}' AND ae.Status=N'SUCCESS'
          AND ${dateFilter}
      )
      SELECT COALESCE(SUM(
        CASE WHEN IsOn=1 THEN
          CASE WHEN DATEDIFF(MINUTE,ExecutedAt,COALESCE(NextAt,GETDATE()))>1440 THEN 1440
               ELSE DATEDIFF(MINUTE,ExecutedAt,COALESCE(NextAt,GETDATE())) END
        ELSE 0 END
      ),0) AS Minutes
      FROM ev
    `);

    const fanOff  = `ae.Message LIKE N'%→ 0%'`;
    const ledOff  = `(ae.Message LIKE N'%mức 0%' OR ae.Message LIKE N'%→ 0%')`;
    const today   = `ae.ExecutedAt >= CAST(GETDATE() AS DATE)`;
    const yest    = `ae.ExecutedAt >= CAST(DATEADD(DAY,-1,GETDATE()) AS DATE) AND ae.ExecutedAt < CAST(GETDATE() AS DATE)`;

    const [fanTodayR, fanYestR, ledTodayR, ledYestR] = await Promise.all([
      runQuery('fan',     fanOff, today),
      runQuery('fan',     fanOff, yest),
      runQuery('rgb-led', ledOff, today),
      runQuery('rgb-led', ledOff, yest),
    ]);

    return {
      fan: { today: fanTodayR.recordset[0]?.Minutes || 0, yesterday: fanYestR.recordset[0]?.Minutes || 0 },
      led: { today: ledTodayR.recordset[0]?.Minutes || 0, yesterday: ledYestR.recordset[0]?.Minutes || 0 },
    };
  }

  // Nhật ký hoạt động gần nhất (cho timeline)
  async getActivityTimeline(limit = 30) {
    const pool = await getPool();
    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP(@limit) Category, Description, CreatedAt
        FROM ActivityLog
        ORDER BY CreatedAt DESC
      `);
    return result.recordset;
  }
}

module.exports = new DbService();
