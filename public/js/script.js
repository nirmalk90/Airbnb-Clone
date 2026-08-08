(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })

  // Theme Toggle (Dark Mode)
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  if (themeToggle && themeIcon) {
      const updateIcon = (isDark) => {
          if (isDark) {
              themeIcon.className = 'fa-solid fa-sun fs-5';
          } else {
              themeIcon.className = 'fa-solid fa-moon fs-5';
          }
      };

      // Set initial icon state
      updateIcon(document.documentElement.classList.contains('dark-mode'));

      themeToggle.addEventListener('click', () => {
          const isDark = document.documentElement.classList.toggle('dark-mode');
          localStorage.setItem('theme', isDark ? 'dark' : 'light');
          updateIcon(isDark);
      });
  }
})()