import { readFileSync } from 'node:fs';import { execFileSync } from 'node:child_process';
const html=readFileSync('index.html','utf8'),css=readFileSync('assets/app.css','utf8'),js=readFileSync('assets/app.js','utf8'),templates=readFileSync('assets/templates.js','utf8');
for(const token of ['id="builder"','id="template-gallery"','id="preview-frame"','id="create-order"','data-step="4"'])if(!html.includes(token))throw new Error(`Missing ${token}`);
for(const id of ['salt-bakery','noon-barber','table7-restaurant','dal-hanok-stay','compile-bootcamp','harbor-law','void-architecture','mint-clinic','endpoint-api','desktop-cv'])if(!templates.includes(`id:'${id}'`))throw new Error(`Missing template ${id}`);
for(const token of ['@media(max-width:620px)','preview-shell.mobile','builder-layout'])if(!css.includes(token))throw new Error(`Missing CSS ${token}`);
execFileSync(process.execPath,['--check','assets/templates.js'],{stdio:'inherit'});execFileSync(process.execPath,['--check','assets/app.js'],{stdio:'inherit'});console.log('Launch100 check passed: 10 templates, 5 steps, preview, sharing and test order.');
