// 브라우저 FaceLandmarker(앱과 같은 0.10.35 · CPU)로 테스트 사진의 랜드마크를 뽑아 web-landmarks/ 에 저장한다.
// 준비: 아무 폴더에서 npm i playwright-core@1.56 후 NODE_PATH 로 지정. 크롬은 ~/Library/Caches/ms-playwright 의 headless shell 을 쓴다.
// 실행: NODE_PATH=<그 폴더>/node_modules node run.js <사진 폴더> <web-landmarks 폴더>
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright-core');
const [imgDir,outDir]=process.argv.slice(2);
const srv=http.createServer((q,s)=>{const u=decodeURIComponent(q.url);
 if(u.startsWith('/img/')){s.end(fs.readFileSync(path.join(imgDir,path.basename(u))));}
 else{s.setHeader('content-type','text/html');s.end(fs.readFileSync(path.join(__dirname,'page.html')));}}).listen(0,async()=>{
 const port=srv.address().port;
 const exe=path.join(process.env.HOME,'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell');
 const b=await chromium.launch({executablePath:exe});
 const p=await b.newPage(); p.on('console',m=>{if(m.type()==='error')console.error('console:',m.text())});
 await p.goto(`http://127.0.0.1:${port}/`); await p.waitForFunction('window.ready');
 const names=fs.readdirSync(imgDir).filter(n=>/\.(png|jpe?g)$/i.test(n)).sort();
 const res=await p.evaluate(n=>window.run(n),names);
 fs.mkdirSync(outDir,{recursive:true});
 for(const [n,v] of Object.entries(res)){fs.writeFileSync(path.join(outDir,n.replace(/\.\w+$/,'.json')),JSON.stringify({image:n,source:'@mediapipe/tasks-vision 0.10.35 FaceLandmarker (CPU)',generated_at:new Date().toISOString(),...v}));console.log(n,v.width+'x'+v.height,v.landmarks?v.landmarks.length+'점':'얼굴 없음');}
 await b.close(); srv.close();});
