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

  if (data.action === "register") {
    userSheet.appendRow([data.username, data.password, data.name, JSON.stringify(data.descriptor), new Date()]);
    return res({"result": "registered"});
  }

  if (data.action === "login") {
    const rows = userSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == data.username && rows[i][1] == data.password) {
        return res({"result": "success", "name": rows[i][2], "descriptor": rows[i][3]});
      }
    }
    return res({"result": "fail"});
  }

  if (data.action === "checkin") {
    const dist = calculateDistance(data.lat, data.lon, OFFICE_LAT, OFFICE_LON);
    const status = dist <= RADIUS_LIMIT ? "✅ เข้างานสำเร็จ" : "❌ นอกพื้นที่";
    attendSheet.appendRow([new Date(), data.name, status, dist.toFixed(2) + " ม.", data.lat + "," + data.lon]);
    return res({"result": "saved", "status": status, "distance": dist});
  }
}

function res(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
// ฟังก์ชัน doGet จะทำงานเมื่อหน้าเว็บเรียก Request แบบ GET (เพื่อดึงข้อมูลรายชื่อพนักงาน)
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName("Users");
    
    // ถ้ายังไม่มีข้อมูลเลย ให้ส่ง Array ว่างกลับไป
    if (!userSheet || userSheet.getLastRow() < 2) {
      return res([]);
    }

    const rows = userSheet.getDataRange().getValues();
    const users = [];

    // วนลูปเริ่มจากแถวที่ 2 (ข้ามหัวตาราง)
    for (let i = 1; i < rows.length; i++) {
      users.push({
        username: rows[i][0],
        name: rows[i][2],
        descriptor: rows[i][3] // ชุดตัวเลขใบหน้า
      });
    }

    return res(users);
  } catch (error) {
    return res({"result": "error", "message": error.toString()});
  }
}

// ฟังก์ชันช่วยส่งค่ากลับเป็น JSON (ถ้ามีอยู่แล้วไม่ต้องก๊อปปี้ซ้ำ)
function res(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
