let API = localStorage.getItem('iw_api')||'http://localhost:5000';
document.getElementById('apiInput').value=API;
let allUsers=[],allPosts=[],currentFilter=null;

function saveBase(){
  API=document.getElementById('apiInput').value.replace(/\/$/,'');
  localStorage.setItem('iw_api',API);
  toast('Endpoint saved');loadAll();
}
function toast(msg,ms=2500){
  const el=document.getElementById('toast');
  el.textContent=msg;el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),ms);
}
function initials(n){return n.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase()}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

const viewTitles={posts:'All posts',users:'Authors',write:'Write a post',newuser:'New author'};
const viewOrder=['posts','users','write','newuser'];

function switchView(v){
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
  document.getElementById('view-'+v).classList.add('active');
  document.querySelectorAll('.nav-item')[viewOrder.indexOf(v)].classList.add('active');
  document.getElementById('pageTitle').textContent=viewTitles[v];
  if(v==='posts'){renderPosts();updateCount()}
  if(v==='users'){renderUsers();updateCount()}
  if(v==='write')populateAuthorSelect();
  document.getElementById('countPill').textContent=v==='posts'||v==='users'?''+'':''
  updateCount();
}

function updateCount(){
  const pill=document.getElementById('countPill');
  const active=document.querySelector('.view.active').id.replace('view-','');
  if(active==='posts')pill.textContent=allPosts.length+(allPosts.length===1?' post':' posts');
  else if(active==='users')pill.textContent=allUsers.length+(allUsers.length===1?' author':' authors');
  else pill.textContent='';
}

async function req(path,opts={}){
  try{
    const r=await fetch(API+path,{headers:{'Content-Type':'application/json'},...opts});
    if(!r.ok){const t=await r.text();throw new Error(t||r.status)}
    if(r.status===204)return null;
    return r.json();
  }catch(e){toast('Error: '+e.message);throw e}
}

async function loadAll(){
  try{
    allUsers=await req('/users/');
    const nested=await Promise.all(allUsers.map(u=>req('/users/'+u.id+'/posts').then(ps=>ps.map(p=>({...p,_author:u.name,_uid:u.id}))).catch(()=>[])));
    allPosts=nested.flat();
    renderPosts();renderUsers();buildFilterBtns();updateCount();
  }catch(e){}
}

function buildFilterBtns(){
  const row=document.getElementById('authorFilters');
  row.innerHTML='<span class="filter-label">Filter</span><button class="filter-btn active" onclick="filterPosts(null,this)">All</button>';
  allUsers.forEach(u=>{
    const b=document.createElement('button');
    b.className='filter-btn';
    b.textContent=u.name.split(' ')[0];
    b.onclick=function(){filterPosts(u.id,b)};
    row.appendChild(b);
  });
}

function filterPosts(uid,btn){
  currentFilter=uid;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderPosts();
}

function renderPosts(){
  const posts=currentFilter?allPosts.filter(p=>p._uid===currentFilter):allPosts;
  const el=document.getElementById('postsContainer');
  if(!posts.length){
    el.innerHTML=`<div class="empty"><div class="empty-glyph">◇</div><div class="empty-title">No posts yet</div><div class="empty-sub">Write the first post to get started</div></div>`;
    return;
  }
  el.innerHTML='<div class="posts-list">'+posts.map((p,i)=>`
    <div class="post-row">
      <div class="post-num">${String(i+1).padStart(2,'0')}</div>
      <div>
        <div class="post-meta">
          <span class="post-author-tag">${esc(p._author||'Unknown')}</span>
          <span class="post-id-tag">ID ${p.id}</span>
        </div>
        <div class="post-title">${esc(p.title)}</div>
        <div class="post-excerpt">${esc(p.content)}</div>
      </div>
      <div class="post-actions">
        <button class="act-btn" onclick='openEdit(${p.id},${JSON.stringify(p.title)},${JSON.stringify(p.content)})'>Edit</button>
        <button class="act-btn danger" onclick="deletePost(${p.id})">Delete</button>
      </div>
    </div>
  `).join('')+'</div>';
}

function renderUsers(){
  const el=document.getElementById('usersContainer');
  if(!allUsers.length){
    el.innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="empty-glyph">○</div><div class="empty-title">No authors yet</div><div class="empty-sub">Add the first author to begin</div></div>`;
    return;
  }
  el.innerHTML=allUsers.map(u=>{
    const pc=allPosts.filter(p=>p._uid===u.id).length;
    return `<div class="user-tile">
      <div class="user-avatar">${initials(u.name)}</div>
      <div class="user-name">${esc(u.name)}</div>
      <div class="user-email">${esc(u.email)}</div>
      <div class="user-post-count">${pc} post${pc!==1?'s':''}</div>
      <div class="user-tile-actions">
        <button class="act-btn" onclick="viewByUser(${u.id})">View posts</button>
        <button class="act-btn danger" onclick="deleteUser(${u.id})">Delete</button>
      </div>
    </div>`;
  }).join('');
}

function viewByUser(uid){
  switchView('posts');
  currentFilter=uid;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  renderPosts();
}

function populateAuthorSelect(){
  const sel=document.getElementById('postAuthor');
  sel.innerHTML='<option value="">Select author…</option>'+allUsers.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join('');
}

async function createPost(){
  const uid=document.getElementById('postAuthor').value;
  const title=document.getElementById('postTitle').value.trim();
  const content=document.getElementById('postContent').value.trim();
  if(!uid||!title||!content){toast('Please fill in all fields');return}
  try{
    await req('/users/'+uid+'/posts',{method:'POST',body:JSON.stringify({title,content})});
    toast('Post published ✓');
    document.getElementById('postTitle').value='';
    document.getElementById('postContent').value='';
    await loadAll();switchView('posts');
  }catch(e){}
}

async function createUser(){
  const name=document.getElementById('newName').value.trim();
  const email=document.getElementById('newEmail').value.trim();
  if(!name||!email){toast('Please fill in all fields');return}
  try{
    await req('/users/',{method:'POST',body:JSON.stringify({name,email})});
    toast('Author created ✓');
    document.getElementById('newName').value='';
    document.getElementById('newEmail').value='';
    await loadAll();switchView('users');
  }catch(e){}
}

async function deletePost(id){
  if(!confirm('Delete this post permanently?'))return;
  try{
    await req('/posts/'+id,{method:'DELETE'});
    allPosts=allPosts.filter(p=>p.id!==id);
    renderPosts();updateCount();toast('Post deleted');
  }catch(e){}
}

async function deleteUser(id){
  if(!confirm('Delete this author and all their posts?'))return;
  try{
    await req('/users/'+id,{method:'DELETE'});
    allUsers=allUsers.filter(u=>u.id!==id);
    allPosts=allPosts.filter(p=>p._uid!==id);
    renderUsers();renderPosts();buildFilterBtns();updateCount();toast('Author removed');
  }catch(e){}
}

function openEdit(id,title,content){
  document.getElementById('editId').value=id;
  document.getElementById('editTitle').value=title;
  document.getElementById('editContent').value=content;
  document.getElementById('editModal').classList.add('open');
}
function closeModal(){document.getElementById('editModal').classList.remove('open')}
document.getElementById('editModal').addEventListener('click',function(e){if(e.target===this)closeModal()});

async function saveEdit(){
  const id=document.getElementById('editId').value;
  const title=document.getElementById('editTitle').value.trim();
  const content=document.getElementById('editContent').value.trim();
  if(!title||!content){toast('Fields cannot be empty');return}
  try{
    await req('/posts/'+id,{method:'PUT',body:JSON.stringify({title,content})});
    toast('Post updated ✓');closeModal();await loadAll();
  }catch(e){}
}

function refresh(){loadAll();toast('Refreshed')}
loadAll();
