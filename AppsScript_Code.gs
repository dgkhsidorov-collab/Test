/**
 * Google Apps Script (deploy as Web App):
 * - Project: "Anticorruption Quiz Backend"
 * - Enable "Deploy > Test deployments > Web app" with "Anyone with the link"
 * - Copy the deployment URL and paste it into the HTML (SERVER_URL).
 *
 * Spreadsheet:
 * - On first run, script auto-creates "results" sheet with header.
 */

const SHEET_NAME = 'results';

function _getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1,1,1,9).setValues([[
      'timestamp','session','name','score','total','percent','timePerQuestion','userAgent','ip'
    ]]);
  }
  return sh;
}

function doPost(e) {
  try {
    const sh = _getSheet_();
    const data = JSON.parse(e.postData.contents || '{}');
    const ts = new Date();
    const ua = e?.parameter?.ua || '';
    const ip = e?.parameter?.ip || '';

    const row = [
      ts,
      data.session || 'default',
      data.name || 'anonymous',
      Number(data.score || 0),
      Number(data.total || 0),
      Number(data.percent || 0),
      Number(data.timePerQuestion || 0),
      ua,
      ip
    ];
    sh.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ok:true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const sh = _getSheet_();
    const session = (e.parameter.session || 'default').trim();
    const values = sh.getDataRange().getValues();
    const header = values.shift();

    const rows = values
      .filter(r => String(r[1]||'').trim() === session)
      .map(r => ({
        timestamp: r[0] instanceof Date ? r[0].toISOString() : r[0],
        session: r[1],
        name: r[2],
        score: r[3],
        total: r[4],
        percent: r[5],
        timePerQuestion: r[6],
        userAgent: r[7],
        ip: r[8]
      }));

    // sort by percent desc, score desc, name
    rows.sort((a,b)=> (b.percent - a.percent) || (b.score - a.score) || String(a.name).localeCompare(String(b.name)));

    return ContentService.createTextOutput(JSON.stringify({ok:true, session, rows}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}