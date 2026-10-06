import {normalizeRestaurant,parseManualTags} from '../model.js';
import {fail,decodeUtf8,sha256Bytes,encodeBase64,assertPublicUrl,clone} from './common.js';
export const SHARED_COLUMNS=['タイトル','メモ','URL','タグ','コメント'];
export const MAX_SOURCE_BYTES=2*1024*1024;
const csvCell=s=>/[",\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;
export function scanCsv(text){
 const records=[];let start=0,startLine=1,line=1,cells=[],rawCells=[],cell='',cellStart=0,quoted=false,closed=false,atStart=true;
 const finishCell=end=>{if(cell.length>10000)fail('CSV_CELL','セルは10,000文字までです。');cells.push(cell);rawCells.push(text.slice(cellStart,end));if(cells.length>100)fail('CSV_COLUMNS','列は100列までです。');cell='';quoted=false;closed=false;atStart=true;};
 const finishRecord=end=>{finishCell(end);records.push({csvRecordNumber:records.length+1,physicalLineStart:startLine,physicalLineEnd:line,rawCsvRecord:text.slice(start,end),rawCells,cells});cells=[];rawCells=[];};
 for(let i=0;i<text.length;i++){
  const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"'){quoted=false;closed=true;}else{cell+=c;if(c==='\r'){if(text[i+1]==='\n')cell+=text[++i];line++;}else if(c==='\n')line++;}}
  else if(c===','){finishCell(i);cellStart=i+1;}
  else if(c==='\r'||c==='\n'){finishRecord(i);if(c==='\r'&&text[i+1]==='\n')i++;line++;start=i+1;cellStart=start;startLine=line;}
  else if(c==='"'){if(!atStart||closed)fail('CSV_QUOTES','引用符の位置が不正です。');quoted=true;atStart=false;}
  else{if(closed)fail('CSV_QUOTES','引用符の後は区切り文字が必要です。');cell+=c;atStart=false;}
  if(cell.length>10000)fail('CSV_CELL','セルは10,000文字までです。');
 }
 if(quoted)fail('CSV_QUOTES','引用符を閉じてください。');if(start<text.length)finishRecord(text.length);return records;
}
export async function readResearchCsv(bytes,filename,fieldSettings){
 if(typeof filename!=='string'||!filename.toLowerCase().endsWith('.csv'))fail('CSV_FILE','UTF-8 CSVを選択してください。');
 const text=decodeUtf8(bytes,MAX_SOURCE_BYTES),records=scanCsv(text);
 if(!records.length)fail('CSV_HEADER','CSVのヘッダーがありません。');const columns=records[0].cells;
 if(SHARED_COLUMNS.some(k=>columns.filter(c=>c===k).length!==1)||new Set(columns).size!==columns.length)fail('CSV_HEADER','タイトル・メモ・URL・タグ・コメントが各1列必要です。');
 const fileSha256=await sha256Bytes(bytes),emptyRecords=[],candidates=[];
 for(const record of records.slice(1)){
  if(record.rawCsvRecord===''){emptyRecords.push(record);continue;}
  if(candidates.length>=1000)fail('CSV_ROWS','候補は1,000件までです。');
  const {cells,...raw}=record,cellsByColumn=Object.fromEntries(SHARED_COLUMNS.map(k=>[k,cells[columns.indexOf(k)]??'']));
  const sourceRow={fileSha256,...raw,columns:[...columns],cellsByColumn};
  let baseRestaurant={name:cellsByColumn.タイトル,genre:'',phone:'',address:'',tags:[],memo:cellsByColumn.メモ,urls:[],customValues:{}},status='waiting',validationErrors=[];
  try{if(cells.length!==columns.length)fail('CSV_COLUMNS','行の列数がヘッダーと一致しません。');if(cellsByColumn.URL)baseRestaurant.urls=[assertPublicUrl(cellsByColumn.URL)];baseRestaurant.tags=parseManualTags(cellsByColumn.タグ);baseRestaurant=normalizeRestaurant(baseRestaurant,fieldSettings);}
  catch(error){status='invalid';validationErrors=[error.message];}
  candidates.push({sourceRow,baseRestaurant,status,validationErrors});
 }
 return {source:{filename,mediaType:'text/csv',byteLength:bytes.length,sha256:fileSha256,columns:[...columns],emptyRecords,bytesBase64:encodeBase64(bytes)},candidates};
}
export function projectPublicRow(sourceRow,url){
 assertPublicUrl(url);const cellsByColumn={タイトル:sourceRow.cellsByColumn.タイトル,メモ:'',URL:url,タグ:'',コメント:''};const cells=SHARED_COLUMNS.map(k=>cellsByColumn[k]);
 return {...clone(sourceRow),columns:[...SHARED_COLUMNS],rawCells:cells.map(csvCell),rawCsvRecord:cells.map(csvCell).join(','),cellsByColumn};
}
