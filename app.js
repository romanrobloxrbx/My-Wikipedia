(() => {
  "use strict";
  const KEY = "my-wikipedia-v1";
  const app = document.getElementById("app");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const accountLink = document.getElementById("account-link");

  const starterArticles = [
    {id:"internet",title:"Интернет",category:"Технологии",summary:"Глобальная система взаимосвязанных компьютерных сетей, использующая общие протоколы обмена данными.",body:"Интернет — глобальная система взаимосвязанных компьютерных сетей, которая позволяет устройствам обмениваться данными по всему миру. Он лежит в основе веб-сайтов, электронной почты, видеосвязи и многих других цифровых сервисов.\n\n## Как работает интернет\n\nУстройства обмениваются данными с помощью сетевых протоколов. Маршрутизаторы направляют пакеты данных между сетями, а система доменных имён (DNS) помогает находить нужные серверы по понятным человеку адресам.\n\n## История\n\nРазвитие интернета связано с исследовательскими сетями второй половины XX века. Всемирная паутина, созданная позднее, сделала публикацию и просмотр связанных документов доступными широкой аудитории.",updated:"2026-10-20",author:"Команда My Wikipedia"},
    {id:"solar-system",title:"Солнечная система",category:"Наука",summary:"Солнце и все небесные тела, связанные с ним гравитацией, включая восемь планет.",body:"Солнечная система — гравитационно связанная система, в центре которой находится Солнце. В неё входят восемь планет, их спутники, карликовые планеты, астероиды, кометы, пыль и другие малые тела.\n\n## Планеты\n\nЧетыре внутренние планеты — Меркурий, Венера, Земля и Марс — имеют каменистую поверхность. Юпитер и Сатурн относятся к газовым гигантам, а Уран и Нептун — к ледяным гигантам.\n\n## Исследование\n\nАстрономы изучают систему с помощью телескопов, автоматических межпланетных станций и наблюдений с Земли.",updated:"2026-10-19",author:"Редакторы"},
    {id:"photosynthesis",title:"Фотосинтез",category:"Биология",summary:"Процесс, при котором растения, водоросли и некоторые бактерии преобразуют световую энергию в химическую.",body:"Фотосинтез — биологический процесс преобразования энергии света в химическую энергию. У растений он происходит главным образом в хлоропластах клеток.\n\n## Основные этапы\n\nВ светозависимых реакциях энергия света используется для образования энергетически богатых молекул. Затем углекислый газ участвует в реакциях, в результате которых синтезируются углеводы.\n\n## Значение\n\nФотосинтез лежит в основе большинства пищевых цепей и играет важную роль в круговороте углерода и поддержании кислорода в атмосфере.",updated:"2026-10-18",author:"Редакторы"},
    {id:"renaissance",title:"Эпоха Возрождения",category:"История",summary:"Культурное движение в Европе, связанное с новым интересом к искусству, науке и наследию античности.",body:"Эпоха Возрождения — период культурного и интеллектуального развития Европы, начавшийся в Италии в позднем Средневековье и распространившийся на другие регионы.\n\n## Искусство и наука\n\nХудожники исследовали перспективу, пропорции и анатомию. Учёные и мыслители обращались к античным текстам и развивали наблюдательные методы.\n\n## Наследие\n\nВозрождение повлияло на европейское искусство, образование, архитектуру и научную мысль.",updated:"2026-10-17",author:"Редакторы"},
    {id:"javascript",title:"JavaScript",category:"Технологии",summary:"Язык программирования, широко используемый для создания интерактивных веб-страниц и приложений.",body:"JavaScript — язык программирования, который позволяет создавать интерактивные веб-интерфейсы и приложения. Он выполняется в современных браузерах и также используется на серверах и других платформах.\n\n## На веб-страницах\n\nJavaScript может реагировать на действия пользователя, изменять содержимое страницы, проверять формы и получать данные из сетевых сервисов. Вместе с HTML и CSS он является одной из основных технологий веб-разработки.\n\n## Экосистема\n\nЯзык поддерживает функции, объекты, модули и асинхронные операции. Его возможности расширяются многочисленными библиотеками и инструментами.",updated:"2026-10-16",author:"Редакторы"},
    {id:"ocean",title:"Мировой океан",category:"География",summary:"Непрерывная водная оболочка Земли, включающая океанические бассейны и моря.",body:"Мировой океан — основная часть гидросферы Земли, покрывающая большую часть поверхности планеты. Он влияет на климат, поддерживает разнообразные экосистемы и участвует в круговороте воды.\n\n## Океан и климат\n\nОкеан поглощает и переносит тепло, а морские течения влияют на погоду и климат в разных регионах. Он также поглощает часть углекислого газа из атмосферы.\n\n## Защита океана\n\nЗагрязнение, изменение климата и чрезмерный вылов рыбы создают серьёзные угрозы морским экосистемам.",updated:"2026-10-15",author:"Редакторы"}
  ];

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && Array.isArray(saved.articles)) return saved;
    } catch (_) {}
    return {articles:starterArticles,history:[],users:[],currentUser:null};
  }
  let state = loadState();
  if (!Array.isArray(state.history)) state.history = [];
  if (!Array.isArray(state.users)) state.users = [];
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function escapeHtml(value="") { return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])); }
  function slug(value) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9а-яё]+/gi,"-").replace(/^-|-$/g,"").slice(0,70); }
  function link(path,label,cls="") { return '<a class="'+cls+'" href="#/'+path+'">'+label+'</a>'; }
  function button(label,cls="button",type="button") { return '<button type="'+type+'" class="'+cls+'">'+label+'</button>'; }
  function articleCard(a) {
    return '<article class="article-card"><span class="tag">'+escapeHtml(a.category||"Без категории")+'</span><h3>'+link('article/'+encodeURIComponent(a.id),escapeHtml(a.title))+'</h3><p>'+escapeHtml(a.summary||"У этой статьи пока нет краткого описания.")+'</p><span class="meta">Обновлено: '+escapeHtml(a.updated||"—")+'</span></article>';
  }
  function renderHome() {
    const articles=[...state.articles].sort((a,b)=>(b.updated||"").localeCompare(a.updated||""));
    app.innerHTML='<section class="hero"><span class="eyebrow">Открытая энциклопедия</span><h1>Знания начинаются здесь.</h1><p>Исследуйте мир через статьи, написанные людьми и постоянно улучшаемые сообществом. Читайте, находите новое и делитесь тем, что знаете.</p><div class="hero-actions">'+link('search','Исследовать статьи','button')+link('editor','＋ Создать статью','button secondary')+'</div></section><div class="section-heading"><h2>Популярные темы</h2>'+link('categories','Все категории')+'</div><div class="category-list">'+["Наука","История","Технологии","Биология","География"].map(c=>'<a class="category-pill" href="#/category/'+encodeURIComponent(c)+'">'+escapeHtml(c)+'</a>').join("")+'</div><div class="section-heading"><h2>Последние статьи</h2>'+link('search','Посмотреть все →')+'</div><div class="article-grid">'+articles.slice(0,6).map(articleCard).join("")+'</div>';
  }
  function renderSearch(query="") {
    const q=query.trim().toLocaleLowerCase();
    const found=state.articles.filter(a=>!q||[a.title,a.summary,a.body,a.category].some(v=>(v||"").toLocaleLowerCase().includes(q)));
    app.innerHTML='<div class="section-heading"><h1>Поиск по энциклопедии</h1></div><p class="meta">'+(q?'Результаты по запросу «'+escapeHtml(query)+'»':'Все опубликованные статьи')+' · '+found.length+'</p>'+(found.length?'<div class="results-list">'+found.map(a=>'<article class="result-item"><span class="tag">'+escapeHtml(a.category||"Без категории")+'</span><h3>'+link('article/'+encodeURIComponent(a.id),escapeHtml(a.title))+'</h3><p>'+escapeHtml(a.summary||"")+'</p><span class="meta">Обновлено: '+escapeHtml(a.updated||"—")+'</span></article>').join("")+'</div>':'<div class="empty-state"><h2>Ничего не найдено</h2><p>Попробуйте изменить запрос или создайте новую статью.</p>'+link('editor','Создать статью','button')+'</div>');
    if(q) searchInput.value=query;
  }
  function renderArticle(id) {
    const a=state.articles.find(item=>item.id===id);
    if(!a){app.innerHTML='<div class="empty-state"><h1>Статья не найдена</h1><p>Возможно, её ещё не создали или ссылка устарела.</p>'+link('search','Вернуться к статьям','button')+'</div>';return;}
    const body=escapeHtml(a.body||"Содержимое пока не добавлено.").split(/\n\n+/).map(block=>{const trimmed=block.trim();if(trimmed.startsWith("## "))return '<h2>'+trimmed.slice(3)+'</h2>';return '<p>'+trimmed.replace(/\n/g,"<br>")+'</p>';}).join("");
    const isOwner=state.currentUser && (a.author===state.currentUser.email||state.currentUser.role==="admin");
    app.innerHTML='<article><header class="article-header"><span class="tag">'+escapeHtml(a.category||"Без категории")+'</span><h1>'+escapeHtml(a.title)+'</h1><p>'+escapeHtml(a.summary||"")+'</p><div class="meta">Последнее изменение: '+escapeHtml(a.updated||"—")+' · Автор: '+escapeHtml(a.author||"Сообщество")+'</div><div class="article-tools">'+link('editor/'+encodeURIComponent(a.id),'Редактировать','tool-link')+link('history/'+encodeURIComponent(a.id),'История статьи','tool-link')+'</div></header><div class="article-body">'+body+'</div><p class="meta">Эта статья создана для обмена знаниями. Проверяйте источники и дополняйте материал достоверной информацией.</p></article>';
  }
  function renderCategories() {
    const counts={};state.articles.forEach(a=>{const c=a.category||"Без категории";counts[c]=(counts[c]||0)+1;});
    app.innerHTML='<span class="eyebrow">Навигация</span><h1>Категории</h1><p>Выберите тему, чтобы просмотреть связанные статьи.</p><div class="category-list">'+Object.entries(counts).sort((a,b)=>a[0].localeCompare(b[0])).map(([c,n])=>'<a class="category-pill" href="#/category/'+encodeURIComponent(c)+'"><strong>'+escapeHtml(c)+'</strong><span class="meta">'+n+' '+(n===1?'статья':'статей')+'</span></a>').join("")+'</div>';
  }
  function renderCategory(category) {
    const found=state.articles.filter(a=>(a.category||"Без категории")===category);
    app.innerHTML='<div class="section-heading"><h1>'+escapeHtml(category)+'</h1></div><p class="meta">Статей в категории: '+found.length+'</p>'+(found.length?'<div class="article-grid">'+found.map(articleCard).join("")+'</div>':'<div class="empty-state">Пока в этой категории нет статей.</div>');
  }
  function renderEditor(id="") {
    const existing=id?state.articles.find(a=>a.id===id):null;
    if(id&&!existing){app.innerHTML='<div class="empty-state"><h1>Статья не найдена</h1>'+link('editor','Создать новую статью','button')+'</div>';return;}
    app.innerHTML='<section class="form-card"><span class="eyebrow">Вклад в энциклопедию</span><h1>'+(existing?'Редактировать статью':'Создать статью')+'</h1><div class="notice warning">Демо-режим: изменения сохраняются в этом браузере. Для общей энциклопедии с настоящими аккаунтами подключите Supabase или другой backend.</div><form id="article-form"><div class="field"><label for="title">Название статьи *</label><input id="title" name="title" required maxlength="120" value="'+escapeHtml(existing?.title||"")+'" placeholder="Например, Искусственный интеллект"></div><div class="field"><label for="category">Категория *</label><select id="category" name="category" required>'+["Наука","История","Технологии","Биология","География","Культура","Искусство","Другое"].map(c=>'<option'+((existing?.category||"Наука")===c?' selected':'')+'>'+c+'</option>').join("")+'</select></div><div class="field"><label for="summary">Краткое описание *</label><input id="summary" name="summary" required maxlength="240" value="'+escapeHtml(existing?.summary||"")+'" placeholder="Кратко объясните, о чём статья"></div><div class="field"><label for="body">Текст статьи *</label><textarea id="body" name="body" required minlength="30" placeholder="Напишите статью. Для подзаголовков начинайте строку с ## .">'+escapeHtml(existing?.body||"")+'</textarea><p class="help">Разделяйте абзацы пустой строкой. Подзаголовок можно начать с ## .</p></div><div class="form-actions"><button class="button" type="submit">Сохранить статью</button>'+link(existing?'article/'+encodeURIComponent(existing.id):'search','Отмена','button secondary')+'</div></form></section>';
    document.getElementById("article-form").addEventListener("submit",event=>{
      event.preventDefault();const fd=new FormData(event.currentTarget);const title=String(fd.get("title")).trim();const category=String(fd.get("category"));const summary=String(fd.get("summary")).trim();const body=String(fd.get("body")).trim();
      const articleId=existing?existing.id:(slug(title)||"article")+"-"+Date.now().toString(36);
      const author=state.currentUser?.email||"Гость (локально)";
      const entry={id:articleId,title,category,summary,body,updated:new Date().toISOString().slice(0,10),author};
      const previous=existing?{...existing}:null;
      if(existing)state.articles=state.articles.map(a=>a.id===articleId?entry:a);else state.articles.unshift(entry);
      state.history.unshift({id:articleId,title,action:existing?"Изменение":"Создание",date:new Date().toISOString(),author,previous,entry:{...entry}});
      save();location.hash="#/article/"+encodeURIComponent(articleId);
    });
  }
  function renderHistory(id="") {
    const history=state.history.filter(h=>!id||h.id===id);
    app.innerHTML='<h1>'+(id?'История статьи':'История изменений')+'</h1><p class="meta">Записи об изменениях, сделанных в этом браузере.</p>'+(history.length?history.map(h=>'<div class="history-item"><strong>'+escapeHtml(h.title)+' — '+escapeHtml(h.action)+'</strong><span class="meta">'+escapeHtml(new Date(h.date).toLocaleString())+' · '+escapeHtml(h.author)+'</span><div>'+link('article/'+encodeURIComponent(h.id),'Открыть статью')+'</div></div>').join(""):'<div class="empty-state">Пока нет сохранённых изменений. Создайте или отредактируйте статью, чтобы увидеть историю.</div>');
  }
  function renderLogin(register=false) {
    app.innerHTML='<section class="form-card"><span class="eyebrow">My Wikipedia</span><h1>'+(register?'Создать демо-аккаунт':'Войти')+'</h1><div class="notice warning">Это демонстрационная авторизация только для данного браузера, а не защищённый аккаунт. Не используйте настоящий пароль.</div><form id="auth-form">'+(register?'<div class="field"><label for="name">Имя пользователя *</label><input id="name" name="name" required maxlength="50" autocomplete="nickname"></div>':'')+'<div class="field"><label for="email">Электронная почта *</label><input id="email" name="email" type="email" required autocomplete="email"></div><div class="field"><label for="password">Пароль *</label><input id="password" name="password" type="password" required minlength="4" autocomplete="'+(register?'new-password':'current-password')+'"></div><div id="auth-error" class="help" role="alert"></div><div class="form-actions"><button class="button" type="submit">'+(register?'Создать демо-аккаунт':'Войти')+'</button></div></form><p>'+(register?'Уже есть демо-аккаунт? '+link('login','Войти'):'Нет демо-аккаунта? '+link('register','Зарегистрироваться'))+'</p></section>';
    document.getElementById("auth-form").addEventListener("submit",event=>{
      event.preventDefault();const fd=new FormData(event.currentTarget);const email=String(fd.get("email")).trim().toLowerCase();const password=String(fd.get("password"));const error=document.getElementById("auth-error");
      if(register){if(state.users.some(u=>u.email===email)){error.textContent="Этот email уже зарегистрирован в демо-режиме.";return;}state.users.push({email,name:String(fd.get("name")).trim(),password});state.currentUser={email,name:String(fd.get("name")).trim(),role:"user"};}
      else{const user=state.users.find(u=>u.email===email&&u.password===password);if(!user){error.textContent="Демо-аккаунт не найден или пароль неверный. Зарегистрируйтесь сначала.";return;}state.currentUser={email:user.email,name:user.name,role:"user"};}
      save();updateAccountLink();location.hash="#/";
    });
  }
  function updateAccountLink() {
    if(state.currentUser){accountLink.textContent=state.currentUser.name||state.currentUser.email;accountLink.href="#/profile";accountLink.title="Открыть демо-профиль";}
    else{accountLink.textContent="Войти";accountLink.href="#/login";}
  }
  function renderProfile() {
    if(!state.currentUser){location.hash="#/login";return;}
    app.innerHTML='<section class="form-card"><span class="eyebrow">Личный кабинет</span><h1>Привет, '+escapeHtml(state.currentUser.name||state.currentUser.email)+'!</h1><p>Вы вошли в локальный демо-режим. Ваш профиль и изменения не синхронизируются с другими пользователями.</p><p><strong>Email:</strong> '+escapeHtml(state.currentUser.email)+'</p><button class="button" id="logout">Выйти</button></section>';
    document.getElementById("logout").addEventListener("click",()=>{state.currentUser=null;save();updateAccountLink();location.hash="#/";});
  }
  function render() {
    const raw=decodeURIComponent(location.hash.slice(1)||"/");
    const parts=raw.split("/").filter(Boolean);
    const route=parts[0]||"";
    if(!route)renderHome();
    else if(route==="search")renderSearch(parts.slice(1).join("/"));
    else if(route==="article")renderArticle(parts[1]||"");
    else if(route==="categories")renderCategories();
    else if(route==="category")renderCategory(parts.slice(1).join("/")||"Без категории");
    else if(route==="editor")renderEditor(parts[1]||"");
    else if(route==="history")renderHistory(parts[1]||"");
    else if(route==="login")renderLogin(false);
    else if(route==="register")renderLogin(true);
    else if(route==="profile")renderProfile();
    else renderHome();
    updateAccountLink();
  }
  searchForm.addEventListener("submit",event=>{event.preventDefault();location.hash="#/search/"+encodeURIComponent(searchInput.value.trim());});
  window.addEventListener("hashchange",render);
  if(!location.hash)location.hash="#/";
  render();
})();