/* 서브페이지 공통 움직임 — 헤더 숨기기 · 단어 올라오기 · 블록 올라오기 · 지금 보는 항목 표시(목차·탭) */
(() => {
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 단어 올라오기 (메인과 같은 방식): 화면에 들어올 때마다 다시 재생
  const wrapWords = el => {
    [...el.childNodes].forEach(node => {
      if (node.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(document.createTextNode(part)); return; }
        const w = document.createElement('span'); w.className = 'w';
        const i = document.createElement('span'); i.textContent = part;
        w.append(i); frag.append(w);
      });
      node.replaceWith(frag);
    });
    el.querySelectorAll('.w > span').forEach((s, n) => { s.style.transitionDelay = (n * 60) + 'ms'; });
  };
  const reveals = document.querySelectorAll('[data-reveal]');
  reveals.forEach(wrapWords);
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (e.intersectionRatio >= .2) e.target.classList.add('is-on');
    else if (!e.isIntersecting) e.target.classList.remove('is-on');
  }), { threshold: [0, .2] });
  reveals.forEach(el => rio.observe(el));

  // ── 블록 올라오기 (.rise: 글 묶음 — 투명→등장 / .lift: 사진 묶음 — 보이는 채로 약하게): 한 번만
  const bio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-on'); bio.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.rise, .lift').forEach(el => reduce ? el.classList.add('is-on') : bio.observe(el));

  // ── 헤더: 내려가면 숨고 올리면 나타남, 조금이라도 내려가면 바탕을 깐다
  const hd = document.querySelector('[data-hd]');
  let lastY = scrollY, tick = false;
  const updateHeader = () => {
    const y = scrollY;
    hd.classList.toggle('is-solid', y > 10);
    if (y > 200 && y > lastY + 4) hd.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 200) hd.classList.remove('is-hidden');
    lastY = y; tick = false;
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(updateHeader); } }, { passive: true });
  hd.addEventListener('focusin', () => hd.classList.remove('is-hidden'));
  updateHeader();

  // ── 지금 보는 항목 표시: data-spy 링크(목차·탭)가 가리키는 구역이 화면 가운데를 지나면 표시
  const spies = [...document.querySelectorAll('[data-spy] a[href^="#"]')];
  const targets = spies.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const sio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    spies.forEach(a => a.classList.toggle('is-now', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  targets.forEach(t => sio.observe(t));
})();
