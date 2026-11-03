// ── Arranque ──
(async()=>{
  document.querySelector('.app').style.display='none';
  if(await checkInvitacion()) return;
  const {data:{session}}=await db.auth.getSession();
  if(session && await setupUser(session.user)) showApp();
  else document.getElementById('login-screen').style.display='flex';
})();
