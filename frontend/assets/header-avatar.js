(() => {
  const DEFAULT_AVATAR = './assets/images/default-profile.png';
  const run = () => {
    const currentUserRaw = localStorage.getItem('currentUser');
    if (!currentUserRaw) return;
    let email = '';
    try {
      email = JSON.parse(currentUserRaw).email || '';
    } catch {
      return;
    }
    if (!email) return;
    const avatars = Array.from(document.querySelectorAll('.header-avatar'));
    if (avatars.length === 0) return;
    avatars.forEach((img) => {
      img.src = DEFAULT_AVATAR;
      img.style.display = 'inline-block';
      img.style.visibility = 'visible';
    });
    fetch(`/api/profile?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        const src = (data.user && data.user.profile_image_url) ? data.user.profile_image_url : DEFAULT_AVATAR;
        avatars.forEach((img) => {
          img.src = src;
          img.style.display = 'inline-block';
          img.style.visibility = 'visible';
        });
      })
      .catch(() => {});
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
