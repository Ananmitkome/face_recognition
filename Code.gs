// --- ตั้งค่าพิกัดออฟฟิศของคุณ ---
const OFFICE_LAT = 13.7563; 
const OFFICE_LON = 100.5018;
const RADIUS_LIMIT = 100; // รัศมี 100 เมตร

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (f) {
    return res({"result": "error", "message": "Invalid JSON"});
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName("Users") || ss.insertSheet("Users");
  const attendSheet = ss.getSheetByName("Attendance") || ss.insertSheet("Attendance");

  // 1. ลงทะเบียน
  if (data.action === "register") {
    userSheet.appendRow([data.username, data.password, data.name, JSON.stringify(data.descriptor), new Date()]);
    return res({"result": "registered"});
  }

  // 2. เข้าสู่ระบบ
  if (data.action === "login") {
    const rows = userSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == data.username && rows[i][1] == data.password) {
        return res({"result": "success", "name": rows[i][2], "descriptor": rows[i][3]});
      }
    }
    return res({"result": "fail", "message": "Username หรือ Password ไม่ถูกต้อง"});
  }

  // 3. บันทึกเวลาเข้างาน
  if (data.action === "checkin") {
    const dist = calculateDistance(data.lat, data.lon, OFFICE_LAT, OFFICE_LON);
    let status, icon;
    if (dist <= RADIUS_LIMIT) {
      status = "เข้างานสำเร็จ";
      icon = "success";
    } else {
      status = "อยู่นอกพื้นที่";
      icon = "error";
    }
    
    attendSheet.appendRow([new Date(), data.name, status, dist.toFixed(2) + " ม.", data.lat + "," + data.lon]);
    return res({"result": "saved", "status": status, "icon": icon, "distance": dist});
  }
}

function doGet(e) {
  return res({"status": "API is running. Please use POST method."});
}

function res(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// สูตรคำนวณระยะทาง GPS (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
