const CATEGORIES = {
  "Study": {color:"#e9f2ff",text:"#3977bd",keywords:["study","exam","lecture","chapter","assignment","homework","math","physics","chemistry","biology","history","revision","notes","class","semester","syllabus","formula","theorem","derive"]},
  "Work": {color:"#e9f8f1",text:"#23875e",keywords:["work","project","client","deadline","meeting","task","presentation","report","office","team","email","interview","resume","career","internship"]},
  "Ideas": {color:"#fff2df",text:"#bd7b25",keywords:["idea","concept","imagine","invent","create","brainstorm","startup","solution","design","maybe","what if","could build","app idea"]},
  "Personal": {color:"#fcecf2",text:"#b64f78",keywords:["personal","family","friend","birthday","travel","trip","goal","habit","journal","remember","shopping","weekend","life"]},
  "Tech": {color:"#eeebff",text:"#6758d8",keywords:["code","coding","javascript","python","java","c++","html","css","api","database","programming","software","developer","bug","function","react","github","machine learning","ai","algorithm"]},
  "Finance": {color:"#e8f7f7",text:"#27858a",keywords:["money","budget","bank","loan","emi","expense","salary","payment","invest","saving","tax","price","cost","finance"]}
};
const $ = id => document.getElementById(id);
let notes = JSON.parse(localStorage.getItem("sortnote-notes") || "[]");
let activeFilter = "All", editingId = null, deferredPrompt = null;

function categorize(text) {
  const lower = text.toLowerCase();
  let scores = Object.entries(CATEGORIES).map(([name, data]) => {
    let score = 0;
    data.keywords.forEach(word => {
      const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, "gi");
      const matches = lower.match(re);
      if (matches) score += matches.length * (word.includes(" ") ? 2 : 1);
    });
    return {name, score};
  }).sort((a,b) => b.score-a.score);
  return scores[0].score ? {name:scores[0].name, score:scores[0].score} : {name:"Unsorted",score:0};
}
function persist(){localStorage.setItem("sortnote-notes",JSON.stringify(notes));}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function dateLabel(ts){return new Date(ts).toLocaleDateString(undefined,{month:"short",day:"numeric"});}
function updateSuggestion(){
  const text = $("noteTitle").value + " " + $("noteBody").value;
  const result = categorize(text);
  $("detectedCategory").textContent = result.name;
  $("detectedReason").textContent = result.score ? `Detected from ${result.score} topic match${result.score===1?"":"es"}` : "Keep writing to help SortNote find a topic";
}
function renderNav(){
  const counts = {"All":notes.length};
  Object.keys(CATEGORIES).forEach(c=>counts[c]=notes.filter(n=>n.category===c).length);
  counts["Unsorted"]=notes.filter(n=>n.category==="Unsorted").length;
  $("allCount").textContent=notes.length;
  $("categoryNav").innerHTML = [...Object.keys(CATEGORIES),"Unsorted"].map(c=>{
    const color=CATEGORIES[c]?.text||"#9ba1af";
    return `<button class="nav-item ${activeFilter===c?"active":""}" data-filter="${c}"><span class="cat-dot" style="background:${color}"></span>${c}<span class="count">${counts[c]||0}</span></button>`;
  }).join("");
  document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter; $("currentView").textContent=activeFilter==="All"?"All notes":activeFilter; $("pageTitle").textContent=activeFilter==="All"?"All notes":activeFilter; renderNav();renderNotes();}));
  document.querySelector('[data-filter="All"]').classList.toggle("active",activeFilter==="All");
}
function renderNotes(){
  const q=$("searchInput").value.toLowerCase();
  let list=notes.filter(n=>(activeFilter==="All"||n.category===activeFilter)&&(`${n.title} ${n.body} ${n.category}`).toLowerCase().includes(q));
  const sort=$("sortSelect").value;
  list.sort((a,b)=>sort==="az"?a.title.localeCompare(b.title):sort==="created"?b.created-a.created:b.updated-a.updated);
  $("resultCount").textContent=`${list.length} note${list.length===1?"":"s"}`;
  $("listHeading").textContent=q?"Search results":activeFilter==="All"?"Recent notes":`${activeFilter} notes`;
  $("notesGrid").innerHTML=list.map(n=>{
    const style=CATEGORIES[n.category]||{color:"#f0f1f4",text:"#737b8d"};
    return `<article class="note-card" data-open="${n.id}"><div class="note-card-top"><span class="tag" style="background:${style.color};color:${style.text}">${escapeHtml(n.category)}</span><span class="note-date">${dateLabel(n.updated)}</span></div><h3>${escapeHtml(n.title||"Untitled note")}</h3><p>${escapeHtml(n.body||"No additional text")}</p><div class="note-card-bottom"><button class="delete-note" data-delete="${n.id}">Delete ×</button></div></article>`;
  }).join("");
  const empty=list.length===0;
  $("emptyState").style.display=empty?"block":"none";
  $("notesGrid").style.display=empty?"none":"grid";
  $("emptyState").querySelector("h3").textContent=notes.length===0?"Your notes have room to grow.":"No notes found";
  $("emptyState").querySelector("p").textContent=notes.length===0?"Create your first note. As you type, SortNote will suggest a category automatically.":"Try another search or choose a different category.";
  document.querySelectorAll("[data-open]").forEach(card=>card.addEventListener("click",e=>{if(e.target.closest("[data-delete]"))return;openNote(card.dataset.open);}));
  document.querySelectorAll("[data-delete]").forEach(btn=>btn.addEventListener("click",e=>{e.stopPropagation();notes=notes.filter(n=>n.id!==btn.dataset.delete);persist();renderNav();renderNotes();showToast("Note deleted");}));
}
function clearEditor(){editingId=null;$("noteTitle").value="";$("noteBody").value="";$("saveBtn").innerHTML='Save note <span>↗</span>';updateSuggestion();}
function openNote(id){const n=notes.find(x=>x.id===id);if(!n)return;editingId=id;$("noteTitle").value=n.title;$("noteBody").value=n.body;updateSuggestion();$("editorCard").scrollIntoView({behavior:"smooth",block:"center"});$("saveBtn").innerHTML='Update note <span>↗</span>';}
function saveNote(){
  const title=$("noteTitle").value.trim(), body=$("noteBody").value.trim();
  if(!title&&!body){showToast("Write something before saving");return;}
  const now=Date.now(), cat=categorize(title+" "+body).name;
  if(editingId){const n=notes.find(x=>x.id===editingId);Object.assign(n,{title:title||"Untitled note",body,category:cat,updated:now});}
  else notes.unshift({id:crypto.randomUUID?crypto.randomUUID():String(now),title:title||"Untitled note",body,category:cat,created:now,updated:now});
  persist();clearEditor();renderNav();renderNotes();showToast(`Saved in ${cat}`);
}
function showToast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2100);}
function newNote(){$("noteTitle").focus();$("editorCard").scrollIntoView({behavior:"smooth",block:"center"});clearEditor();}
["noteTitle","noteBody"].forEach(id=>$(id).addEventListener("input",updateSuggestion));
$("saveBtn").addEventListener("click",saveNote);
["newNoteBtn","headingNewBtn","emptyNewBtn"].forEach(id=>$(id).addEventListener("click",newNote));
$("searchInput").addEventListener("input",renderNotes);$("sortSelect").addEventListener("change",renderNotes);
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").hidden=false;});
$("installBtn").addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installBtn").hidden=true;});
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
renderNav();renderNotes();updateSuggestion();
