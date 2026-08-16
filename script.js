(function(){
  'use strict';

  var state = {
    mode:null,
    subject:null,
    sound:true,
    profile:null,
    equipped:null,
    guest:false,
    guestName:null,
    pickMode:false,

    questions:[],
    questionIndex:0,
    correct:0,
    score:0,
    answered:false,
    quizTimer:null,
    quizTimeLeft:60
  };

  var API = 'https://quizlybackendd.onrender.com';

  var MATCH_API =
    location.pathname.replace(/\/[^/]*$/, '') +
    '/__server__/matchmaking';

  var QUIZ_API = API + '/generate-quiz';

  var trail = [];

  try{
    var saved = localStorage.getItem('quizlyProfile');
    if(saved) state.profile = JSON.parse(saved);
  }catch(_){}

  function saveSession(){
    try{
      if(state.profile){
        localStorage.setItem(
          'quizlyProfile',
          JSON.stringify(state.profile)
        );
      }else{
        localStorage.removeItem('quizlyProfile');
      }
    }catch(_){}
  }

  var screens = {};

  document.querySelectorAll('.screen').forEach(function(s){
    screens[s.id.replace('screen-','')] = s;
  });

  function show(name,isBack){
    var next = screens[name];
    var cur = document.querySelector('.screen.active');

    if(!next || next === cur) return;

    if(cur){
      if(!isBack){
        trail.push(cur.id.replace('screen-',''));
      }

      cur.classList.remove('active');
    }

    next.classList.add('active');

    var first = next.querySelector('.back,.btn');

    if(first){
      try{
        first.focus({preventScroll:true});
      }catch(_){}
    }
  }

  function back(fallback){
    show(trail.pop() || fallback || 'menu',true);
  }

  var toastEl = document.getElementById('toast');
  var tt;

  function toast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add('show');

    clearTimeout(tt);

    tt = setTimeout(function(){
      toastEl.classList.remove('show');
    },2000);
  }

  function applySession(){
    var coins = document.getElementById('coins');
    var shop = document.getElementById('shop-coins');
    var btn = document.getElementById('profile-btn');

    var txt = null;

    btn.childNodes.forEach(function(n){
      if(n.nodeType === 3 && n.textContent.trim()){
        txt = n;
      }
    });

    if(state.profile){

      var stars = Number(state.profile.stars || 0);

      coins.textContent = stars;

      if(shop){
        shop.textContent = stars;
      }

      if(txt){
        txt.textContent = state.profile.username;
      }

      btn.classList.add('logged');

    }else{

      coins.textContent = '0';

      if(shop){
        shop.textContent = '0';
      }

      if(txt){
        txt.textContent = 'Profile';
      }

      btn.classList.remove('logged');
    }
  }

  if(state.profile){
    applySession();
  }

  var loginOverlay = document.getElementById('login-overlay');
  var loginClose = document.getElementById('login-close');
  var registerOverlay = document.getElementById('register-overlay');
  var registerClose = document.getElementById('register-close');
  var registerBack = document.getElementById('register-back');
  var registerForm = document.getElementById('register-form');
  var registerMessage = document.getElementById('register-message');
  var profileBtn = document.getElementById('profile-btn');
  var loginForm = document.getElementById('login-form');
  var loginMessage = document.getElementById('login-message');
  var profileMenuOverlay = document.getElementById('profilemenu-overlay');
  var profileMenuClose = document.getElementById('profilemenu-close');

  var _cameFromChoice = false;

  function showLoginStep(step){

    var choice = document.getElementById('login-choice');
    var form = document.getElementById('login-form');
    var guest = document.getElementById('login-guest');
    var title = document.getElementById('login-title');
    var sub = document.getElementById('login-sub');
    var backCh = document.getElementById('back-to-choice');

    choice.style.display =
      step === 'choice' ? '' : 'none';

    form.style.display =
      step === 'form' ? '' : 'none';

    guest.style.display =
      step === 'guest' ? '' : 'none';

    backCh.style.display =
      step === 'form' && _cameFromChoice ? '' : 'none';

    if(step === 'choice'){

      title.textContent = 'Ready to play?';
      sub.textContent =
        'Log in to save your progress, or jump straight in';

    }else if(step === 'guest'){

      title.textContent = 'Pick a name';
      sub.textContent =
        'This is what other players will see';

      setTimeout(function(){
        document.getElementById('guest-name').focus();
      },50);

    }else{

      title.textContent = 'Log In';
      sub.textContent =
        'Enter your account to continue';

      setTimeout(function(){
        document.getElementById('login-username').focus();
      },50);
    }
  }

  function openLogin(step){

    _cameFromChoice = step === 'choice';

    loginOverlay.classList.add('show');
    loginOverlay.setAttribute('aria-hidden','false');

    loginMessage.textContent = '';

    showLoginStep(step === 'choice' ? 'choice' : 'form');
  }

  function closeLogin(){

    loginOverlay.classList.remove('show');
    loginOverlay.setAttribute('aria-hidden','true');
  }

  function openRegister(){

    closeLogin();

    registerOverlay.classList.add('show');
    registerOverlay.setAttribute('aria-hidden','false');

    registerMessage.textContent = '';

    setTimeout(function(){
      document.getElementById('register-email').focus();
    },50);
  }

  function closeRegister(){

    registerOverlay.classList.remove('show');
    registerOverlay.setAttribute('aria-hidden','true');
  }

  profileBtn.addEventListener('click',function(){

    blip(660);

    if(state.profile){
      openProfileMenu();
    }else{
      openLogin();
    }
  });

  document.getElementById('choice-login')
    .addEventListener('click',function(){

      blip(720);
      showLoginStep('form');
    });

  document.getElementById('choice-guest')
    .addEventListener('click',function(){

      blip(780);

      document.getElementById('guest-message').textContent = '';

      document.getElementById('guest-name').value =
        state.guestName || '';

      showLoginStep('guest');
    });

  document.getElementById('guest-back')
    .addEventListener('click',function(){

      blip(430);
      showLoginStep('choice');
    });

  function submitGuestName(){

    var input = document.getElementById('guest-name');
    var msg = document.getElementById('guest-message');

    var name =
      input.value.trim().replace(/\s+/g,' ');

    if(name.length < 2){

      msg.style.color = '#e05583';
      msg.textContent =
        'Please type a name (at least 2 letters).';

      input.focus();
      blip(430);
      return;
    }

    if(name.length > 16){
      name = name.slice(0,16);
    }

    state.guestName = name;
    state.guest = true;

    blip(860);

    closeLogin();

    toast(
      'Playing as ' +
      name +
      ' — progress will not be saved'
    );

    show('mode');
  }

  document.getElementById('guest-go')
    .addEventListener('click',submitGuestName);

  document.getElementById('guest-name')
    .addEventListener('keydown',function(e){

      if(e.key === 'Enter'){
        e.preventDefault();
        submitGuestName();
      }
    });

  document.getElementById('back-to-choice')
    .addEventListener('click',function(){

      blip(430);

      loginMessage.textContent = '';

      showLoginStep('choice');
    });

  function openProfileMenu(){

    document.getElementById('pm-username')
      .textContent = state.profile.username;

    document.getElementById('pm-stars')
      .textContent = state.profile.stars || 0;

    profileMenuOverlay.classList.add('show');

    profileMenuOverlay.setAttribute(
      'aria-hidden',
      'false'
    );
  }

  function closeProfileMenu(){

    profileMenuOverlay.classList.remove('show');

    profileMenuOverlay.setAttribute(
      'aria-hidden',
      'true'
    );
  }

  profileMenuClose.addEventListener(
    'click',
    function(){
      blip(430);
      closeProfileMenu();
    }
  );

  profileMenuOverlay.addEventListener(
    'click',
    function(e){

      if(e.target === profileMenuOverlay){
        closeProfileMenu();
      }
    }
  );

  document.getElementById('pm-characters')
    .addEventListener('click',function(){

      blip(560);
      closeProfileMenu();

      renderCharacters(false);

      show('characters');
    });

  document.getElementById('pm-inventory')
    .addEventListener('click',function(){

      blip(560);
      closeProfileMenu();

      show('inventory');
    });

  document.getElementById('pm-logout')
    .addEventListener('click',function(){

      blip(430);

      closeProfileMenu();

      state.profile = null;
      state.guest = false;

      applySession();
      saveSession();

      toast('Logged out');
    });

  loginClose.addEventListener('click',function(){

    blip(430);
    closeLogin();
  });

  loginOverlay.addEventListener('click',function(e){

    if(e.target === loginOverlay){
      closeLogin();
    }
  });

  loginForm.addEventListener('submit',function(e){

    e.preventDefault();

    var username =
      document.getElementById('login-username')
        .value.trim();

    var password =
      document.getElementById('login-password')
        .value;

    if(!username || !password){

      loginMessage.textContent =
        'Please enter your username and password.';

      return;
    }

    function renderLoginMsg(txt,ok){

      loginMessage.style.color =
        ok ? '#37a337' : '#e05583';

      loginMessage.textContent = txt;
    }

    fetch(API + '/login',{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        username:username,
        password:password
      })
    })
    .then(function(r){
      return r.json();
    })
    .then(function(data){

      if(data.profile){

        state.profile = data.profile;
        state.guest = false;

        applySession();
        saveSession();

        renderLoginMsg(
          'Welcome back, ' +
          state.profile.username +
          '!',
          true
        );

        blip(880);

        toast(
          'Logged in as ' +
          state.profile.username
        );

        closeLogin();

      }else{

        renderLoginMsg(
          data.message ||
          'Incorrect username or password',
          false
        );

        blip(430);
      }
    })
    .catch(function(){

      renderLoginMsg(
        'Server error. Please try again.',
        false
      );
    });
  });

  document.getElementById('forgot-btn')
    .addEventListener('click',function(){

      loginMessage.textContent =
        'Password recovery will be connected to the backend later.';

      blip(520);
    });

  document.getElementById('register-btn')
    .addEventListener('click',function(){

      blip(720);
      openRegister();
    });

  registerClose.addEventListener(
    'click',
    function(){

      blip(430);
      closeRegister();
    }
  );

  registerBack.addEventListener(
    'click',
    function(){

      blip(660);

      closeRegister();
      openLogin();
    }
  );

  registerOverlay.addEventListener(
    'click',
    function(e){

      if(e.target === registerOverlay){
        closeRegister();
      }
    }
  );

  registerForm.addEventListener(
    'submit',
    function(e){

      e.preventDefault();

      var email =
        document.getElementById('register-email')
          .value.trim();

      var username =
        document.getElementById('register-username')
          .value.trim();

      var password =
        document.getElementById('register-password')
          .value;

      if(!email || !username || !password){

        registerMessage.textContent =
          'Please fill in all fields.';

        return;
      }

      blip(880);

      fetch(API + '/register',{
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          username:username,
          email:email,
          password:password
        })
      })
      .then(function(r){
        return r.json();
      })
      .then(function(data){

        registerMessage.style.color =
          data.profile ? '#37a337' : '#e05583';

        registerMessage.textContent =
          data.message || '';

        if(data.profile){

          state.profile = data.profile;
          state.guest = false;

          applySession();
          saveSession();

          blip(880);

          closeRegister();

          toast(
            'Account created. Welcome, ' +
            state.profile.username + '!'
          );

        }else{

          blip(430);
        }
      })
      .catch(function(){

        registerMessage.style.color =
          '#e05583';

        registerMessage.textContent =
          'Server error. Please try again.';
      });
    }
  );

  var actx;

  function blip(f){

    if(!state.sound) return;

    try{

      actx =
        actx ||
        new(window.AudioContext ||
        window.webkitAudioContext)();

      if(actx.state === 'suspended'){
        actx.resume();
      }

      var o = actx.createOscillator();
      var g = actx.createGain();

      o.type = 'triangle';
      o.frequency.value = f || 600;

      g.gain.setValueAtTime(
        .0001,
        actx.currentTime
      );

      g.gain.exponentialRampToValueAtTime(
        .05,
        actx.currentTime + .01
      );

      g.gain.exponentialRampToValueAtTime(
        .0001,
        actx.currentTime + .15
      );

      o.connect(g);
      g.connect(actx.destination);

      o.start();

      o.stop(actx.currentTime + .17);

    }catch(_){}
  }

  function renderProfile(){

    var p = state.profile;

    var uname =
      document.getElementById('prof-username');

    var stars =
      document.getElementById('prof-stars');

    var count =
      document.getElementById('prof-count');

    var empty =
      document.getElementById('prof-empty');

    var list =
      document.getElementById('prof-chars-list');

    if(!p){

      uname.textContent = 'guest';
      stars.textContent = '0';
      count.textContent = '0 owned';

      empty.style.display = '';

      empty.querySelector('h3')
        .textContent = 'Log in first';

      empty.querySelector('p')
        .textContent =
        'Tap Profile on the menu to log in.';

      list.innerHTML = '';

      return;
    }

    uname.textContent = p.username;
    stars.textContent = p.stars || 0;

    var chars = p.characters || [];

    count.textContent =
      chars.length + ' owned';

    if(!chars.length){

      empty.style.display = '';

      empty.querySelector('h3')
        .textContent = 'No characters yet';

      empty.querySelector('p')
        .textContent =
        'Win quizzes to unlock characters.';

      list.innerHTML = '';

      return;
    }

    empty.style.display = 'none';

    list.className = 'char-grid';
    list.innerHTML = '';

    chars.forEach(function(cid){

      var b =
        document.createElement('div');

      b.className = 'char-tile';

      var av =
        document.createElement('span');

      av.className = 'av';

      paintAvatar(av,cid);

      var nm =
        document.createElement('span');

      nm.textContent = label(cid);

      b.appendChild(av);
      b.appendChild(nm);

      list.appendChild(b);
    });
  }

  var STARTER_CHARS = [
    'Rani',
    'Mark',
    'Euwin',
    'Kyle',
    'Moyo'
  ];

  var CHAR_DIR =
    'assets/img/characters/';

  var CHAR_TUNE = {

    Rani:{
      scale:.76,
      y:-38
    },

    Mark:{
      scale:.60,
      y:-92
    },

    Kyle:{
      scale:.34,
      y:-215
    },

    Moyo:{
      scale:.36,
      y:-152
    },

    Euwin:{
      scale:1.05,
      y:-70,
      x:14
    }
  };

  function allChars(){

    var owned =
      state.profile ?
      (state.profile.characters || []) :
      [];

    var out =
      STARTER_CHARS.slice();

    owned.forEach(function(c){

      if(out.indexOf(c) === -1){
        out.push(c);
      }
    });

    return out;
  }

  function label(cid){

    return cid.charAt(0).toUpperCase() +
      cid.slice(1);
  }

  function paintAvatar(el,cid){

    if(!el) return;

    el.innerHTML = '';

    if(!cid){

      el.innerHTML =
        '<svg width="34" height="34">' +
        '<use href="#i-face"/>' +
        '</svg>';

      return;
    }

    var img =
      document.createElement('img');

    img.src =
      CHAR_DIR + cid + '.png';

    img.alt = cid;

    img.onerror = function(){

      el.innerHTML =
        '<svg width="34" height="34">' +
        '<use href="#i-face"/>' +
        '</svg>';
    };

    el.appendChild(img);
  }

  var charIndex = 0;

  function showChar(i,quiet){

    var chars = allChars();

    if(!chars.length) return;

    charIndex =
      (i + chars.length) %
      chars.length;

    var cid = chars[charIndex];

    state.equipped = cid;

    var img =
      document.getElementById('char-img');

    img.onerror = function(){

      img.onerror = null;
      img.removeAttribute('src');
      img.alt = cid + ' (image missing)';
    };

    img.src =
      CHAR_DIR + cid + '.png';

    img.alt = cid;

    var t =
      CHAR_TUNE[cid] || {};

    img.style.setProperty(
      '--cs',
      t.scale != null ? t.scale : 1
    );

    img.style.setProperty(
      '--cx',
      (t.x != null ? t.x : 0) + 'px'
    );

    img.style.setProperty(
      '--cy',
      (t.y != null ? t.y : 0) + 'px'
    );

    img.style.animation = 'none';

    void img.offsetWidth;

    img.style.animation = '';

    document.getElementById('char-name')
      .textContent = label(cid);

    var dots =
      document.getElementById('char-dots');

    Array.prototype.forEach.call(
      dots.children,
      function(d,n){
        d.classList.toggle(
          'on',
          n === charIndex
        );
      }
    );

    if(!quiet){
      blip(700);
    }
  }

  function renderCharacters(forGame){

    var msg =
      document.getElementById('char-msg');

    var cont =
      document.getElementById('char-continue');

    var backBtn =
      document.getElementById('char-back');

    var dots =
      document.getElementById('char-dots');

    var chars = allChars();

    state.pickMode = !!forGame;

    document.getElementById('char-title')
      .textContent =
      forGame ?
      'Choose your character' :
      'Characters';

    document.getElementById('char-sub')
      .textContent =
      forGame ?
      'Swipe through and pick your player' :
      'Pick who you play as';

    cont.style.display =
      forGame ? '' : 'none';

    backBtn.dataset.back =
      forGame ? 'ready' : 'menu';

    document.getElementById(
      'char-continue-label'
    ).innerHTML =
      state.mode === 'Compete' ?
      'CONTINUE<small>Find a player</small>' :
      'CONTINUE<small>Start the quiz</small>';

    msg.textContent = '';

    dots.innerHTML = '';

    chars.forEach(function(cid,n){

      var d =
        document.createElement('button');

      d.type = 'button';

      d.setAttribute(
        'aria-label',
        label(cid)
      );

      d.addEventListener(
        'click',
        function(){
          showChar(n);
        }
      );

      dots.appendChild(d);
    });

    var start =
      state.equipped ?
      chars.indexOf(state.equipped) :
      0;

    showChar(
      start < 0 ? 0 : start,
      true
    );
  }

  document.getElementById('char-prev')
    .addEventListener(
      'click',
      function(){
        showChar(charIndex - 1);
      }
    );

  document.getElementById('char-next')
    .addEventListener(
      'click',
      function(){
        showChar(charIndex + 1);
      }
    );

  (function(){

    var stage =
      document.getElementById('char-stage');

    var x0 = null;

    stage.addEventListener(
      'touchstart',
      function(e){
        x0 =
          e.changedTouches[0].clientX;
      },
      {passive:true}
    );

    stage.addEventListener(
      'touchend',
      function(e){

        if(x0 === null) return;

        var dx =
          e.changedTouches[0].clientX - x0;

        if(Math.abs(dx) > 40){

          showChar(
            charIndex +
            (dx < 0 ? 1 : -1)
          );
        }

        x0 = null;
      },
      {passive:true}
    );

  })();

  document.addEventListener(
    'keydown',
    function(e){

      if(!screens.characters ||
         !screens.characters.classList.contains('active')){
        return;
      }

      if(e.key === 'ArrowLeft'){
        showChar(charIndex - 1);
      }

      if(e.key === 'ArrowRight'){
        showChar(charIndex + 1);
      }
    }
  );

  document.addEventListener(
    'click',
    function(e){

      var el =
        e.target.closest(
          '[data-go],[data-back],[data-mode],[data-subject]'
        );

      if(!el) return;

      if(el.dataset.go){

        blip(660);

        if(
          el.dataset.go === 'mode' &&
          !state.profile &&
          !state.guest
        ){

          openLogin('choice');

          return;
        }

        if(el.dataset.go === 'profile'){
          renderProfile();
        }

        show(el.dataset.go);

        return;
      }

      if(el.dataset.back){

        if(screens.quiz.classList.contains('active')){
          stopQuizTimer();
        }

        blip(430);

        back(el.dataset.back);

        return;
      }

      if(el.dataset.mode){

        state.mode =
          el.dataset.mode;

        document.getElementById(
          'sub-line'
        ).textContent =
          state.mode + ' mode';

        blip(720);

        show('subject');

        return;
      }

      if(el.dataset.subject){

        state.subject =
          el.dataset.subject;

        var timed =
          state.mode === 'Compete';

        document.getElementById(
          'ready-title'
        ).textContent =
          state.mode +
          ' · ' +
          state.subject;

        document.getElementById(
          'ready-sub'
        ).textContent =
          '10 questions · ' +
          (timed ?
          '60 seconds' :
          'no timer');

        blip(780);

        show('ready');
      }
    }
  );

  document.getElementById('start-btn')
    .addEventListener(
      'click',
      function(){

        blip(880);

        renderCharacters(true);

        show('characters');
      }
    );

  document.getElementById('char-continue')
    .addEventListener(
      'click',
      function(){

        if(!state.equipped){

          document.getElementById(
            'char-msg'
          ).textContent =
            'Pick a character first!';

          blip(430);

          return;
        }

        blip(820);

        if(state.mode === 'Compete'){
          startMatchmaking();
        }else{
          generateQuiz();
        }
      }
    );

  var mmTimer = null;
  var mmTick = null;
  var mmRoom = null;

  function myName(){

    return state.profile ?
      state.profile.username :
      (state.guestName || 'Guest');
  }

  var myId = (function(){

    var k = 'quizlyClientId';
    var v = null;

    try{
      v = localStorage.getItem(k);
    }catch(_){}

    if(!v){

      v =
        'c' +
        Date.now().toString(36) +
        Math.random().toString(36)
          .slice(2,10);

      try{
        localStorage.setItem(k,v);
      }catch(_){}
    }

    return v;
  })();

  function startMatchmaking(){

    mmRoom = null;

    document.getElementById(
      'mm-countdown'
    ).style.display = 'none';

    document.getElementById(
      'mm-vote'
    ).style.display = '';

    document.getElementById(
      'mm-tally'
    ).textContent = '';

    document.getElementById(
      'mm-sub'
    ).textContent =
      'Looking for players…';

    renderLobby(null);

    show('matchmaking');

    pollRoom(true);
  }

  function pollRoom(first){

    clearTimeout(mmTimer);

    fetch(
      MATCH_API + '/matchmake',
      {
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          id:myId,
          name:myName(),
          character:state.equipped,
          subject:state.subject
        })
      }
    )
    .then(function(r){
      return r.json();
    })
    .then(function(room){

      if(
        !screens.matchmaking.classList.contains(
          'active'
        )
      ){
        return;
      }

      applyRoom(room);

      mmTimer =
        setTimeout(
          pollRoom,
          1500
        );
    })
    .catch(function(){

      if(
        !screens.matchmaking.classList.contains(
          'active'
        )
      ){
        return;
      }

      document.getElementById(
        'mm-sub'
      ).textContent =
        'Cannot reach the matchmaking server.';

      document.getElementById(
        'mm-vote'
      ).style.display = 'none';

      if(first){
        toast(
          'Matchmaking server is not running'
        );
      }
    });
  }

  function applyRoom(room){

    mmRoom = room;

    renderLobby(room);

    var full =
      room.count >= room.size;

    var starting =
      room.status === 'starting';

    document.getElementById(
      'mm-sub'
    ).textContent =
      starting ?
      (
        full ?
        'Room is full!' :
        'Everyone voted to start!'
      ) :
      'Waiting for players… (' +
      room.count +
      '/' +
      room.size +
      ')';

    document.getElementById(
      'mm-vote'
    ).style.display =
      starting ? 'none' : '';

    if(starting){

      startCountdown(
        room.countdownMs
      );

    }else{

      stopCountdown();

      renderTally(room);
    }
  }

  function renderLobby(room){

    var lobby =
      document.getElementById(
        'mm-lobby'
      );

    var size =
      room ? room.size : 4;

    var players =
      room ? room.players : [];

    var html = '';

    for(var i=0;i<size;i++){

      var p = players[i];

      if(p){

        var mine =
          p.id === myId;

        var tick =
          p.vote === true ?
          '<span class="tick yes">&#10003;</span>' :
          p.vote === false ?
          '<span class="tick no">&times;</span>' :
          '';

        html +=
          '<div class="slot filled' +
          (mine ? ' me' : '') +
          '">' +
          tick +
          '<span class="av" data-char="' +
          escAttr(p.character) +
          '"></span>' +
          '<span class="nm">' +
          escHtml(p.name) +
          '</span>' +
          '</div>';

      }else{

        html +=
          '<div class="slot empty">' +
          '<span class="av">' +
          '<svg width="22" height="22" style="opacity:.35">' +
          '<use href="#i-face"/>' +
          '</svg>' +
          '</span>' +
          '<span class="nm">waiting…</span>' +
          '</div>';
      }
    }

    lobby.innerHTML = html;

    Array.prototype.forEach.call(
      lobby.querySelectorAll(
        '.av[data-char]'
      ),
      function(el){

        paintAvatar(
          el,
          el.getAttribute('data-char')
        );
      }
    );
  }

  function renderTally(room){

    var yes =
      room.players.filter(
        function(p){
          return p.vote === true;
        }
      ).length;

    var no =
      room.players.filter(
        function(p){
          return p.vote === false;
        }
      ).length;

    var el =
      document.getElementById(
        'mm-tally'
      );

    if(no > 0){

      el.style.color =
        '#e05583';

      el.textContent =
        'Someone is not ready — waiting for a full room.';

    }else if(yes > 0){

      el.style.color =
        '#37a337';

      el.textContent =
        yes +
        ' of ' +
        room.count +
        ' ready — everyone must agree to start early.';

    }else{

      el.textContent = '';
    }
  }

  function startCountdown(ms){

    var box =
      document.getElementById(
        'mm-countdown'
      );

    var num =
      document.getElementById(
        'mm-cd-num'
      );

    box.style.display = '';

    if(mmTick) return;

    var endAt =
      Date.now() +
      (ms == null ? 5000 : ms);

    var last = null;

    mmTick =
      setInterval(
        function(){

          var left =
            Math.max(
              0,
              Math.ceil(
                (endAt - Date.now()) /
                1000
              )
            );

          if(left !== last){

            num.textContent = left;

            last = left;

            if(left > 0){
              blip(
                760 +
                left * 20
              );
            }
          }

          if(left <= 0){

            stopCountdown();

            clearTimeout(mmTimer);

            blip(950);

            generateQuiz();
          }

        },
        100
      );
  }

  function stopCountdown(){

    if(mmTick){

      clearInterval(mmTick);
      mmTick = null;
    }

    document.getElementById(
      'mm-countdown'
    ).style.display = 'none';
  }

  function sendVote(vote){

    blip(vote ? 820 : 470);

    document.getElementById(
      'mm-vote-yes'
    ).classList.toggle(
      'dim',
      !vote
    );

    document.getElementById(
      'mm-vote-no'
    ).classList.toggle(
      'dim',
      vote
    );

    fetch(
      MATCH_API + '/vote',
      {
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          id:myId,
          vote:vote
        })
      }
    )
    .then(function(r){
      return r.json();
    })
    .then(function(room){

      if(room && room.players){
        applyRoom(room);
      }
    })
    .catch(function(){});
  }

  document.getElementById(
    'mm-vote-yes'
  ).addEventListener(
    'click',
    function(){
      sendVote(true);
    }
  );

  document.getElementById(
    'mm-vote-no'
  ).addEventListener(
    'click',
    function(){
      sendVote(false);
    }
  );

  function leaveRoom(){

    clearTimeout(mmTimer);

    stopCountdown();

    try{

      fetch(
        MATCH_API + '/leave',
        {
          method:'POST',
          headers:{
            'Content-Type':'application/json'
          },
          body:JSON.stringify({
            id:myId
          })
        }
      ).catch(function(){});

    }catch(_){}
  }

  document.getElementById(
    'mm-cancel'
  ).addEventListener(
    'click',
    function(){

      blip(430);

      leaveRoom();

      document.getElementById(
        'mm-vote-yes'
      ).classList.remove('dim');

      document.getElementById(
        'mm-vote-no'
      ).classList.remove('dim');

      back('characters');
    }
  );

  window.addEventListener(
    'beforeunload',
    function(){

      if(
        screens.matchmaking &&
        screens.matchmaking.classList.contains(
          'active'
        )
      ){
        leaveRoom();
      }
    }
  );

  function escHtml(s){

    return String(s || '')
      .replace(
        /[&<>"]/g,
        function(c){

          return {
            '&':'&amp;',
            '<':'&lt;',
            '>':'&gt;',
            '"':'&quot;'
          }[c];
        }
      );
  }

  function escAttr(s){
    return escHtml(s);
  }

  /* =========================
     AI QUIZ
  ========================= */

  function generateQuiz(){

    stopQuizTimer();

    document.getElementById(
      'question-text'
    ).textContent =
      'Creating your quiz...';

    document.getElementById(
      'answers'
    ).innerHTML =
      '<div class="note">' +
      '<div class="big">' +
      '<svg width="34" height="34">' +
      '<use href="#i-book"/>' +
      '</svg>' +
      '</div>' +
      '<h3>AI is preparing your questions</h3>' +
      '<p>Please wait a moment...</p>' +
      '</div>';

    document.getElementById(
      'quiz-feedback'
    ).textContent = '';

    document.getElementById(
      'next-question'
    ).style.display = 'none';

    document.getElementById(
      'quiz-subject-label'
    ).textContent =
      state.subject || 'Quiz';

    document.getElementById(
      'quiz-player'
    ).textContent =
      myName();

    paintAvatar(
      document.getElementById('quiz-avatar'),
      state.equipped
    );

    show('quiz');

    fetch(
      QUIZ_API,
      {
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          subject:state.subject,
          mode:state.mode,
          amount:10,
          questions:10
        })
      }
    )
    .then(function(r){

      if(!r.ok){
        throw new Error(
          'Quiz server returned ' +
          r.status
        );
      }

      return r.json();
    })
    .then(function(data){

      var questions =
        extractQuestions(data);

      if(!questions.length){
        throw new Error(
          'No questions were returned.'
        );
      }

      state.questions =
        questions.slice(0,10);

      state.questionIndex = 0;
      state.correct = 0;
      state.score = 0;

      document.getElementById(
        'quiz-score'
      ).textContent = '0';

      showQuestion();

    })
    .catch(function(err){

      console.error(
        'QUIZ ERROR:',
        err
      );

      document.getElementById(
        'question-text'
      ).textContent =
        'Unable to create the quiz.';

      document.getElementById(
        'answers'
      ).innerHTML =
        '<div class="note">' +
        '<div class="big">' +
        '<svg width="34" height="34">' +
        '<use href="#i-help"/>' +
        '</svg>' +
        '</div>' +
        '<h3>Something went wrong</h3>' +
        '<p>Check that the AI quiz server is running.</p>' +
        '</div>';

      document.getElementById(
        'quiz-feedback'
      ).textContent =
        'Quiz server error';

      document.getElementById(
        'quiz-feedback'
      ).className =
        'quiz-feedback bad';
    });
  }

  function extractQuestions(data){

    var list = [];

    if(Array.isArray(data)){
      list = data;
    }else if(data && Array.isArray(data.questions)){
      list = data.questions;
    }else if(data && Array.isArray(data.quiz)){
      list = data.quiz;
    }else if(data && data.data &&
             Array.isArray(data.data.questions)){
      list = data.data.questions;
    }else if(
      data &&
      data.result &&
      Array.isArray(data.result.questions)
    ){
      list = data.result.questions;
    }

    return list
      .map(normalizeQuestion)
      .filter(function(q){
        return q.question &&
               q.options.length >= 2 &&
               q.answer !== '';
      });
  }

  function normalizeQuestion(q){

    q = q || {};

    var question =
      q.question ||
      q.questionText ||
      q.text ||
      q.prompt ||
      '';

    var options =
      q.options ||
      q.choices ||
      q.answers ||
      [];

    if(!Array.isArray(options)){
      options = [];
    }

    options = options.map(function(o){

      if(typeof o === 'string'){
        return o;
      }

      if(o && typeof o === 'object'){
        return o.text ||
          o.label ||
          o.answer ||
          '';
      }

      return '';
    }).filter(function(o){
      return o !== '';
    });

    var answer =
      q.answer ??
      q.correctAnswer ??
      q.correct ??
      q.correct_option ??
      q.correctOption ??
      '';

    if(typeof answer === 'object' &&
       answer !== null){

      answer =
        answer.text ||
        answer.label ||
        answer.answer ||
        '';
    }

    answer = String(answer);

    var answerIndex = -1;

    if(q.answerIndex != null){
      answerIndex =
        Number(q.answerIndex);
    }

    if(q.correctIndex != null){
      answerIndex =
        Number(q.correctIndex);
    }

    if(answerIndex >= 0 &&
       answerIndex < options.length){

      answer =
        options[answerIndex];
    }

    if(
      answer.length === 1 &&
      answer.toUpperCase() >= 'A' &&
      answer.toUpperCase() <= 'Z'
    ){

      var index =
        answer.toUpperCase().charCodeAt(0) -
        65;

      if(index >= 0 &&
         index < options.length){

        answer =
          options[index];
      }
    }

    var correct =
      options.find(function(o){
        return o.trim().toLowerCase() ===
          answer.trim().toLowerCase();
      });

    if(correct){
      answer = correct;
    }

    return {
      question:String(question),
      options:options,
      answer:String(answer),
      explanation:
        q.explanation ||
        q.reason ||
        ''
    };
  }

  function showQuestion(){

    clearTimeout(state.quizTimer);

    state.answered = false;

    var q =
      state.questions[
        state.questionIndex
      ];

    if(!q){

      finishQuiz();

      return;
    }

    var total =
      state.questions.length;

    var number =
      state.questionIndex + 1;

    document.getElementById(
      'quiz-number'
    ).textContent =
      'Question ' +
      number +
      ' of ' +
      total;

    document.getElementById(
      'quiz-progress-fill'
    ).style.width =
      (number / total * 100) + '%';

    document.getElementById(
      'question-text'
    ).textContent =
      q.question;

    document.getElementById(
      'quiz-feedback'
    ).textContent = '';

    document.getElementById(
      'quiz-feedback'
    ).className =
      'quiz-feedback';

    document.getElementById(
      'next-question'
    ).style.display = 'none';

    var answers =
      document.getElementById('answers');

    answers.innerHTML = '';

    var letters = [
      'A',
      'B',
      'C',
      'D'
    ];

    q.options.forEach(
      function(option,index){

        var button =
          document.createElement('button');

        button.type = 'button';

        button.className =
          'answer-btn';

        var letter =
          document.createElement('span');

        letter.className =
          'answer-letter';

        letter.textContent =
          letters[index] ||
          String(index + 1);

        var text =
          document.createElement('span');

        text.textContent =
          option;

        button.appendChild(letter);
        button.appendChild(text);

        button.addEventListener(
          'click',
          function(){

            answerQuestion(
              index
            );
          }
        );

        answers.appendChild(button);
      }
    );

    state.quizTimeLeft =
      state.mode === 'Compete' ?
      60 :
      0;

    updateQuizTimer();

    if(state.mode === 'Compete'){

      startQuizTimer();
    }
  }

  function answerQuestion(index){

    if(state.answered) return;

    state.answered = true;

    stopQuizTimer();

    var q =
      state.questions[
        state.questionIndex
      ];

    var buttons =
      document.querySelectorAll(
        '#answers .answer-btn'
      );

    var selected =
      q.options[index];

    var correct =
      selected.trim().toLowerCase() ===
      q.answer.trim().toLowerCase();

    buttons.forEach(
      function(btn,i){

        btn.classList.add('disabled');

        btn.disabled = true;

        if(
          q.options[i].trim().toLowerCase() ===
          q.answer.trim().toLowerCase()
        ){

          btn.classList.add('correct');
        }
      }
    );

    var feedback =
      document.getElementById(
        'quiz-feedback'
      );

    if(correct){

      state.correct++;

      var points =
        state.mode === 'Compete' ?
        2 :
        1;

      state.score += points;

      document.getElementById(
        'quiz-score'
      ).textContent =
        state.score;

      buttons[index].classList.add(
        'correct'
      );

      feedback.textContent =
        'Correct! +' +
        points +
        ' star' +
        (points === 1 ? '' : 's') +
        ' ⭐';

      feedback.className =
        'quiz-feedback good';

      blip(880);

    }else{

      buttons[index].classList.add(
        'wrong'
      );

      feedback.textContent =
        'Not quite! The correct answer is ' +
        q.answer;

      feedback.className =
        'quiz-feedback bad';

      blip(430);
    }

    if(q.explanation){

      feedback.textContent +=
        ' ' +
        q.explanation;
    }

    var next =
      document.getElementById(
        'next-question'
      );

    next.style.display = '';

    if(
      state.questionIndex >=
      state.questions.length - 1
    ){

      document.getElementById(
        'next-question-text'
      ).textContent =
        'SEE RESULTS';

    }else{

      document.getElementById(
        'next-question-text'
      ).textContent =
        'NEXT QUESTION';
    }
  }

  function timeoutQuestion(){

    if(state.answered) return;

    state.answered = true;

    var q =
      state.questions[
        state.questionIndex
      ];

    var buttons =
      document.querySelectorAll(
        '#answers .answer-btn'
      );

    buttons.forEach(
      function(btn,i){

        btn.disabled = true;

        btn.classList.add(
          'disabled'
        );

        if(
          q.options[i].trim().toLowerCase() ===
          q.answer.trim().toLowerCase()
        ){

          btn.classList.add(
            'correct'
          );
        }
      }
    );

    var feedback =
      document.getElementById(
        'quiz-feedback'
      );

    feedback.textContent =
      'Time is up! The correct answer is ' +
      q.answer;

    feedback.className =
      'quiz-feedback bad';

    document.getElementById(
      'next-question'
    ).style.display = '';

    if(
      state.questionIndex >=
      state.questions.length - 1
    ){

      document.getElementById(
        'next-question-text'
      ).textContent =
        'SEE RESULTS';
    }

    blip(400);
  }

  function startQuizTimer(){

    clearInterval(
      state.quizTimer
    );

    state.quizTimeLeft = 60;

    updateQuizTimer();

    state.quizTimer =
      setInterval(
        function(){

          state.quizTimeLeft--;

          updateQuizTimer();

          if(state.quizTimeLeft <= 0){

            clearInterval(
              state.quizTimer
            );

            state.quizTimer = null;

            timeoutQuestion();
          }

        },
        1000
      );
  }

  function updateQuizTimer(){

    var el =
      document.getElementById(
        'quiz-time'
      );

    var timer =
      document.getElementById(
        'quiz-timer'
      );

    if(state.mode !== 'Compete'){

      timer.style.display = 'none';

      return;
    }

    timer.style.display = 'flex';

    el.textContent =
      Math.max(
        0,
        state.quizTimeLeft
      );

    if(state.quizTimeLeft <= 10){

      timer.style.color =
        '#e05583';

    }else{

      timer.style.color =
        '';
    }
  }

  function stopQuizTimer(){

    if(state.quizTimer){

      clearInterval(
        state.quizTimer
      );

      state.quizTimer = null;
    }
  }

  document.getElementById(
    'next-question'
  ).addEventListener(
    'click',
    function(){

      if(
        state.questionIndex >=
        state.questions.length - 1
      ){

        finishQuiz();

        return;
      }

      state.questionIndex++;

      blip(720);

      showQuestion();
    }
  );

  function finishQuiz(){

    stopQuizTimer();

    var total =
      state.questions.length;

    var percent =
      total ?
      Math.round(
        state.correct / total * 100
      ) :
      0;

    var starsEarned =
      state.score;

    document.getElementById(
      'results-correct'
    ).textContent =
      state.correct;

    document.getElementById(
      'results-stars'
    ).textContent =
      starsEarned;

    document.getElementById(
      'results-percent'
    ).textContent =
      percent + '%';

    var title =
      document.getElementById(
        'results-title'
      );

    var sub =
      document.getElementById(
        'results-sub'
      );

    if(percent === 100){

      title.textContent =
        'Perfect Score! ⭐';

      sub.textContent =
        'Amazing! You answered everything correctly.';

    }else if(percent >= 70){

      title.textContent =
        'Great Job! 🎉';

      sub.textContent =
        'You did really well!';

    }else if(percent >= 50){

      title.textContent =
        'Good Try! 👍';

      sub.textContent =
        'Keep practicing and you will improve.';

    }else{

      title.textContent =
        'Keep Practicing! 💪';

      sub.textContent =
        'Try again and see if you can beat your score.';
    }

    var resultCharacter =
      document.getElementById(
        'results-character'
      );

    resultCharacter.innerHTML = '';

    paintAvatar(
      resultCharacter,
      state.equipped
    );

    if(state.profile){

      addStarsToProfile(
        starsEarned
      );
    }

    blip(1000);

    show('results');
  }

  function addStarsToProfile(amount){

    if(!state.profile) return;

    state.profile.stars =
      Number(state.profile.stars || 0) +
      amount;

    applySession();

    saveSession();

    document.getElementById(
      'pm-stars'
    ).textContent =
      state.profile.stars;
  }

  document.getElementById(
    'play-again'
  ).addEventListener(
    'click',
    function(){

      blip(880);

      state.questionIndex = 0;
      state.correct = 0;
      state.score = 0;

      generateQuiz();
    }
  );

  document.getElementById(
    'results-menu'
  ).addEventListener(
    'click',
    function(){

      blip(660);

      stopQuizTimer();

      state.questions = [];
      state.questionIndex = 0;
      state.correct = 0;
      state.score = 0;

      trail = [];

      show('menu',true);
    }
  );

  var icon =
    document.getElementById(
      'sound-icon'
    );

  var sBtn =
    document.getElementById(
      'sound-btn'
    );

  var swSound =
    document.getElementById(
      'sw-sound'
    );

  function applySound(on){

    state.sound = on;

    icon.setAttribute(
      'href',
      on ? '#i-sound' : '#i-mute'
    );

    sBtn.classList.toggle(
      'off',
      !on
    );

    swSound.classList.toggle(
      'on',
      on
    );

    swSound.setAttribute(
      'aria-checked',
      String(on)
    );
  }

  sBtn.addEventListener(
    'click',
    function(){

      applySound(
        !state.sound
      );

      blip(520);
    }
  );

  document.querySelectorAll('.sw')
    .forEach(
      function(sw){

        sw.addEventListener(
          'click',
          function(){

            var on =
              !sw.classList.contains(
                'on'
              );

            if(sw === swSound){

              applySound(on);

            }else{

              sw.classList.toggle(
                'on',
                on
              );

              sw.setAttribute(
                'aria-checked',
                String(on)
              );

              if(sw.id === 'sw-anim'){

                document.body.classList.toggle(
                  'no-anim',
                  !on
                );
              }
            }

            blip(560);
          }
        );
      }
    );

  document.addEventListener(
    'keydown',
    function(e){

      if(e.key === 'Escape'){

        if(
          profileMenuOverlay.classList.contains(
            'show'
          )
        ){

          closeProfileMenu();
          return;
        }

        if(
          registerOverlay.classList.contains(
            'show'
          )
        ){

          closeRegister();
          return;
        }

        if(
          loginOverlay.classList.contains(
            'show'
          )
        ){

          closeLogin();
          return;
        }

        var cur =
          document.querySelector(
            '.screen.active'
          );

        if(
          cur &&
          cur.id !== 'screen-menu' &&
          cur.id !== 'screen-quiz'
        ){

          back('menu');
        }
      }
    }
  );

  var _preloaded = [];

  (function preloadChars(){

    allChars().forEach(
      function(cid){

        var im =
          new Image();

        im.decoding =
          'async';

        im.src =
          CHAR_DIR +
          cid +
          '.png';

        _preloaded.push(im);
      }
    );
  })();

})();
