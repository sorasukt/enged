const TARGET_LAT = 17.5398426;
const TARGET_LNG = 101.7219437;
const MAX_DISTANCE_METERS = 100;

// ==========================================
// 1. ฟังก์ชันส่งข้อมูลตารางเวลาให้หน้าเว็บ (เมื่อหน้าเว็บโหลด)
// ==========================================
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Time Table");
    if (!sheet) throw new Error("ไม่พบแผ่นงาน 'Time Table'");

    // getDisplayValues จะดึงค่าข้อความแบบที่ตาเห็นบน Sheet เพื่อป้องกันวันที่เพี้ยน
    const data = sheet.getDataRange().getDisplayValues();
    const schedule = [];

    for (let i = 1; i < data.length; i++) {
      // ตรวจสอบว่ามีข้อมูลครบทั้ง 5 คอลัมน์ (A ถึง E)
      if (data[i][0] && data[i][1] && data[i][2] && data[i][3] && data[i][4]) {
        schedule.push({
          name: data[i][0].trim(),
          open: data[i][1].trim() + " " + data[i][2].trim(),
          close: data[i][3].trim() + " " + data[i][4].trim()
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "data": schedule
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "message": error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 2. ฟังก์ชันรับข้อมูลบันทึกเวลาจากหน้าเว็บ
// ==========================================
function doPost(e) {
  try {
    // เช็คว่าระบบเปิดอยู่หรือไม่ โดยดึงเวลาจาก Sheet สดๆ
    if (!isSystemOpen()) {
      return ContentService.createTextOutput(JSON.stringify({
        "status": "error", 
        "message": "ถูกปฏิเสธ: นอกเวลาทำการ ไม่สามารถบันทึกข้อมูลได้"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ตรวจสอบรหัสนักศึกษาจากแผ่นงาน "รายชื่อ"
    const listSheet = ss.getSheetByName("รายชื่อ");
    if (!listSheet) throw new Error("ไม่พบแผ่นงาน 'รายชื่อ'");

    const listData = listSheet.getDataRange().getValues();
    let isStudentFound = false;

    for (let i = 1; i < listData.length; i++) {
      if (String(listData[i][0]).trim() === String(data.studentId).trim()) {
        isStudentFound = true;
        break;
      }
    }

    if (!isStudentFound) {
      return ContentService.createTextOutput(JSON.stringify({
        "status": "error",
        "message": `ถูกปฏิเสธ: ไม่พบรหัสนักศึกษา ${data.studentId} ในระบบ`
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ตรวจสอบระยะทาง GPS
    const distance = calculateHaversineDistance(data.lat, data.lng, TARGET_LAT, TARGET_LNG);
    if (distance > MAX_DISTANCE_METERS) {
      return ContentService.createTextOutput(JSON.stringify({
        "status": "error", 
        "message": `ถูกปฏิเสธ: อยู่นอกพื้นที่กิจกรรม (ระยะห่าง ${Math.round(distance)} เมตร)`
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // บันทึกข้อมูลลงแผ่นงาน "system"
    const logSheet = ss.getSheetByName("system");
    if (!logSheet) throw new Error("ไม่พบแผ่นงาน 'system'");

    const locationMapLink = `http://googleusercontent.com/maps.google.com/?q=${data.lat},${data.lng}`;
    
    logSheet.appendRow([
      new Date(), 
      data.studentId, 
      data.name, 
      locationMapLink
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error", "message": error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ฟังก์ชันตรวจสอบเวลาเปิดระบบ (ดึงจาก Sheet ทุกครั้งที่ยิงข้อมูลมา)
function isSystemOpen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Time Table");
  if (!sheet) return false;

  const data = sheet.getDataRange().getDisplayValues();
  const now = new Date().getTime();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][1] && data[i][2] && data[i][3] && data[i][4]) {
      const openStr = data[i][1].trim() + " " + data[i][2].trim();
      const closeStr = data[i][3].trim() + " " + data[i][4].trim();

      const openTime = new Date(openStr.replace(/-/g, '/')).getTime();
      const closeTime = new Date(closeStr.replace(/-/g, '/')).getTime();

      // ถ้าระบบเจออย่างน้อย 1 ช่วงเวลาที่กำลังเปิดอยู่ ให้ถือว่าระบบ "เปิด"
      if (now >= openTime && now < closeTime) {
        return true; 
      }
    }
  }
  return false;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; 
  const toRad = (value) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
