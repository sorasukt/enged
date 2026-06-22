// ==========================================
// Google Apps Script - Auth0 Profile Updater
// ==========================================
// แนะนำให้คัดลอกโค้ดนี้ไปวางในโปรเจกต์ของ Google Apps Script 
// (https://script.google.com/) แล้ว Deploy เป็น Web App

const CONFIG = {
  // ตั้งค่าข้อมูลจาก Auth0 (Machine to Machine Application)
  AUTH0_DOMAIN: "dev-your-tenant.auth0.com",
  CLIENT_ID: "YOUR_M2M_CLIENT_ID",
  CLIENT_SECRET: "YOUR_M2M_CLIENT_SECRET",
  
  // ตั้งค่า Google Drive Folder ID สำหรับเก็บรูป
  // เช่น จากลิงก์ https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ
  DRIVE_FOLDER_ID: "YOUR_DRIVE_FOLDER_ID"
};

function doPost(e) {
  try {
    // 1. รับข้อมูลจาก Frontend
    const data = JSON.parse(e.postData.contents);
    const { access_token, name, imageBase64, imageMimeType, imageFileName } = data;
    
    if (!access_token) {
      return responseJson({ error: "Missing access token" }, 401);
    }

    // 2. ตรวจสอบยืนยันตัวตนกับ Auth0 (Get User Info)
    const userinfoUrl = `https://${CONFIG.AUTH0_DOMAIN}/userinfo`;
    const userinfoRes = UrlFetchApp.fetch(userinfoUrl, {
      method: "get",
      headers: { "Authorization": `Bearer ${access_token}` },
      muteHttpExceptions: true
    });
    
    if (userinfoRes.getResponseCode() !== 200) {
      return responseJson({ error: "Invalid Token or Unauthorized" }, 401);
    }
    
    const user = JSON.parse(userinfoRes.getContentText());
    const userId = user.sub; // เช่น auth0|123456...
    
    let pictureUrl = null;
    
    // 3. ถ้ามีการอัปโหลดรูปภาพ ให้อัปโหลดลง Google Drive
    if (imageBase64) {
      const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
      
      // แปลง Base64 กลับเป็น Blob (ไฟล์)
      // ตัดส่วนหัวที่เป็น "data:image/jpeg;base64," ออก
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      const decodedData = Utilities.base64Decode(base64Data);
      
      const fileName = imageFileName || `profile_${userId}_${new Date().getTime()}.jpg`;
      const mimeType = imageMimeType || MimeType.JPEG;
      
      const blob = Utilities.newBlob(decodedData, mimeType, fileName);
      const file = folder.createFile(blob);
      
      // ตั้งค่าให้ใครที่มีลิงก์ก็ดูรูปได้
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      // สร้าง URL สำหรับให้เว็บดึงรูปไปแสดงได้โดยตรง
      const fileId = file.getId();
      pictureUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    // 4. ขอ Token แบบ Management API (M2M)
    const tokenUrl = `https://${CONFIG.AUTH0_DOMAIN}/oauth/token`;
    const tokenRes = UrlFetchApp.fetch(tokenUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        grant_type: "client_credentials",
        client_id: CONFIG.CLIENT_ID,
        client_secret: CONFIG.CLIENT_SECRET,
        audience: `https://${CONFIG.AUTH0_DOMAIN}/api/v2/`
      }),
      muteHttpExceptions: true
    });

    if (tokenRes.getResponseCode() !== 200) {
      return responseJson({ error: "Failed to get Management Token", details: tokenRes.getContentText() }, 500);
    }

    const managementToken = JSON.parse(tokenRes.getContentText()).access_token;
    
    // 5. อัปเดตข้อมูลไปยัง Auth0 Management API
    const updatePayload = {};
    if (name && name.trim() !== "") updatePayload.name = name.trim();
    if (pictureUrl) updatePayload.picture = pictureUrl;
    
    if (Object.keys(updatePayload).length > 0) {
      const updateUrl = `https://${CONFIG.AUTH0_DOMAIN}/api/v2/users/${userId}`;
      const updateRes = UrlFetchApp.fetch(updateUrl, {
        method: "patch",
        headers: { "Authorization": `Bearer ${managementToken}` },
        contentType: "application/json",
        payload: JSON.stringify(updatePayload),
        muteHttpExceptions: true
      });

      if (updateRes.getResponseCode() !== 200) {
        return responseJson({ error: "Failed to update user profile", details: updateRes.getContentText() }, 500);
      }
    }
    
    // สำเร็จ! คืนค่ากลับไปให้ Frontend
    return responseJson({ 
      success: true, 
      message: "Profile updated successfully",
      picture: pictureUrl || user.picture,
      name: updatePayload.name || user.name
    });
    
  } catch (error) {
    return responseJson({ error: error.toString() }, 500);
  }
}

// ฟังก์ชันสำหรับรองรับ CORS (เวลา Frontend ยิงแบบ Preflight)
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Helper สำหรับตอบกลับ JSON
function responseJson(data, statusCode = 200) {
  // หมายเหตุ: GAS ไม่สามารถกำหนด HTTP Status Code ได้ตรงๆ จึงส่งเป็น Success 200 พร้อม status ใน body แทน
  const response = {
    ...data,
    statusCode: statusCode
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
