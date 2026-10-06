document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('accountForm');
            const status = document.getElementById('loginStatus');
            const nameField = document.getElementById('nameField');
            const confirmPasswordField = document.getElementById('confirmPasswordField');
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const brandPanel = document.querySelector('.brand-panel');
            const brandContent = document.querySelector('.brand-content');
            const formPanel = document.querySelector('.form-panel');
            const loginCard = document.querySelector('.login-card');
            const themeToggle = document.getElementById('themeToggle');
            const darkPalettes = ['forest', 'original', 'olive'];
            const savedDarkPalette = localStorage.getItem('schedgrup-dark-palette');
            document.body.dataset.darkPalette = darkPalettes.includes(savedDarkPalette) ? savedDarkPalette : 'forest';
            let themeTransitionTimer;

            const applyTheme = (isDark, animate = false) => {
                if (animate) {
                    window.clearTimeout(themeTransitionTimer);
                    document.body.classList.add('theme-transitioning');
                }

                document.body.classList.toggle('dark-theme', isDark);
                themeToggle.checked = isDark;
                localStorage.setItem('schedgrup-theme', isDark ? 'dark' : 'light');

                if (animate) {
                    themeTransitionTimer = window.setTimeout(() => {
                        document.body.classList.remove('theme-transitioning');
                    }, 720);
                }
            };

            applyTheme(localStorage.getItem('schedgrup-theme') === 'dark');
            themeToggle.addEventListener('change', () => {
                applyTheme(themeToggle.checked, true);
            });

            let isRegisterMode = false;

            const showStatus = (message, isError = false) => {
                status.textContent = message;
                status.classList.toggle('error', isError);
            };

            const toggleAccountMode = () => {
                const isMobileTransition = window.matchMedia('(max-width: 700px)').matches
                    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                const startingPositions = isMobileTransition
                    ? new Map([
                        [brandPanel, brandPanel.getBoundingClientRect().top],
                        [formPanel, formPanel.getBoundingClientRect().top]
                    ])
                    : null;

                isRegisterMode = !isRegisterMode;
                loginCard.classList.toggle('is-registering', isRegisterMode);
                brandPanel.setAttribute('aria-pressed', String(isRegisterMode));
                const registerFields = [nameField, confirmPasswordField];
                registerFields.forEach((field) => {
                    field.hidden = !isRegisterMode;
                    field.querySelector('input').required = isRegisterMode;
                });

                document.getElementById('formEyebrow').textContent = isRegisterMode ? 'Únete a Schedgrup' : 'Bienvenido de nuevo';
                document.getElementById('formTitle').textContent = isRegisterMode ? 'Crear cuenta' : 'Iniciar sesión';
                document.getElementById('formIntro').textContent = isRegisterMode
                    ? 'Crea tu perfil para guardar tu planificación semanal.'
                    : 'Ingresa tus datos para continuar con tu planificación.';
                document.getElementById('submitButton').textContent = isRegisterMode ? 'Crear cuenta' : 'Iniciar sesión';
                document.getElementById('brandKicker').textContent = isRegisterMode ? '¿Ya tienes una cuenta?' : '¿Primera vez aquí?';
                document.getElementById('brandTitle').textContent = isRegisterMode ? 'Iniciar\nSesión' : 'Crear\nCuenta';
                document.getElementById('brandCopy').textContent = isRegisterMode
                    ? 'Qué bueno tenerte de vuelta. Continúa organizando tu semana.'
                    : 'Organiza tu semana y guarda tus comidas en un solo lugar.';
                document.getElementById('modeToggleText').textContent = isRegisterMode ? 'Haz clic para volver' : 'Haz clic en este panel';
                brandPanel.setAttribute('aria-label', isRegisterMode ? 'Cambiar a iniciar sesión' : 'Cambiar a crear cuenta');
                document.getElementById('loginOptions').hidden = isRegisterMode;
                passwordInput.autocomplete = isRegisterMode ? 'new-password' : 'current-password';
                brandContent.classList.remove('is-text-transitioning');
                void brandContent.offsetWidth;
                brandContent.classList.add('is-text-transitioning');
                formPanel.classList.remove('is-text-transitioning');
                void formPanel.offsetWidth;
                formPanel.classList.add('is-text-transitioning');

                if (startingPositions) {
                    requestAnimationFrame(() => {
                        startingPositions.forEach((startingTop, panel) => {
                            const verticalOffset = startingTop - panel.getBoundingClientRect().top;
                            if (Math.abs(verticalOffset) < 1) return;

                            panel.animate(
                                [
                                    { transform: `translateY(${verticalOffset}px)` },
                                    { transform: 'translateY(0)' }
                                ],
                                {
                                    duration: 680,
                                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
                                }
                            );
                        });
                    });
                }

                showStatus('');
            };

            brandPanel.addEventListener('click', toggleAccountMode);
            brandPanel.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleAccountMode();
                }
            });

            const hashPassword = async (password) => {
                if (!window.crypto || !window.crypto.subtle) {
                    throw new Error('El navegador no permite proteger la contraseña en este contexto. Abre el sitio mediante HTTPS o localhost.');
                }

                const encodedPassword = new TextEncoder().encode(password);
                const hash = await window.crypto.subtle.digest('SHA-256', encodedPassword);
                return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
            };

            const readAccounts = () => {
                const savedAccounts = localStorage.getItem('schedgrup-accounts');
                if (!savedAccounts) {
                    return [];
                }

                const accounts = JSON.parse(savedAccounts);
                if (!Array.isArray(accounts)) {
                    throw new Error('No se pudieron leer las cuentas guardadas.');
                }

                return accounts;
            };

            form.addEventListener('submit', async (event) => {
                event.preventDefault();

                const email = document.getElementById('email').value.trim();
                const password = passwordInput.value;

                if (!form.reportValidity()) {
                    return;
                }

                try {
                    const accounts = readAccounts();
                    const normalizedEmail = email.toLowerCase();
                    let account;

                    if (isRegisterMode) {
                        const name = document.getElementById('name').value.trim();
                        if (password !== confirmPasswordInput.value) {
                            showStatus('Las contraseñas no coinciden.', true);
                            return;
                        }

                        if (accounts.some((savedAccount) => savedAccount.email === normalizedEmail)) {
                            showStatus('Ya existe una cuenta con ese correo.', true);
                            return;
                        }

                        account = {
                            id: Date.now().toString(),
                            name,
                            email: normalizedEmail,
                            username: normalizedEmail.split('@')[0],
                            passwordHash: await hashPassword(password)
                        };
                        accounts.push(account);
                        localStorage.setItem('schedgrup-accounts', JSON.stringify(accounts));
                    } else {
                        const passwordHash = await hashPassword(password);
                        account = accounts.find((savedAccount) =>
                            savedAccount.email === normalizedEmail && savedAccount.passwordHash === passwordHash
                        );

                        if (!account) {
                            showStatus('Correo o contraseña incorrectos.', true);
                            return;
                        }
                    }

                    const userProfile = {
                        id: account.id,
                        name: account.name,
                        email: account.email,
                        username: account.username,
                        loggedInAt: new Date().toISOString()
                    };
                    const sessionStore = document.getElementById('rememberMe').checked
                        ? localStorage
                        : window.sessionStorage;
                    [localStorage, window.sessionStorage].forEach((storage) => {
                        storage.removeItem('schedgrup-user');
                        storage.removeItem('schedgrup-session');
                    });
                    sessionStore.setItem('schedgrup-user', JSON.stringify(userProfile));
                    sessionStore.setItem('schedgrup-session', JSON.stringify(userProfile));
                    showStatus(isRegisterMode ? 'Cuenta creada correctamente.' : 'Inicio de sesión correcto.');

                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                } catch (error) {
                    showStatus(error.message || 'Ocurrió un error al procesar la cuenta.', true);
                }
            });
        });