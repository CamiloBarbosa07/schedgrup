
document.addEventListener('DOMContentLoaded', () => {
            const themeToggle = document.getElementById('themeToggle');
            const typeButtons = document.querySelectorAll('.type-trigger, .type-option');
            const mealForm = document.getElementById('mealForm');
            const foodInput = document.getElementById('nombre');
            const mealsList = document.getElementById('mealsList');
            const createScheduleButton = document.getElementById('createScheduleButton');
            const downloadScheduleButton = document.getElementById('downloadScheduleButton');
            const downloadSchedulePngButton = document.getElementById('downloadSchedulePngButton');
            const downloadStatus = document.getElementById('downloadStatus');
            const scheduleResult = document.getElementById('scheduleResult');
            const horarioSection = document.getElementById('horario');
            const scheduleNavLink = document.getElementById('scheduleNavLink');
            const MEAL_TYPES = {
                breakfast: { label: 'Desayuno', emoji: '☀' },
                lunch: { label: 'Almuerzo', emoji: '◐' },
                dinner: { label: 'Cena', emoji: '☾' }
            };
            const MEAL_BADGE_COLORS = {
                breakfast: '#d79a00',
                lunch: '#c65a2c',
                dinner: '#2f5a98'
            };
            const DARK_PALETTES = ['forest', 'original', 'olive'];
            const savedDarkPalette = localStorage.getItem('schedgrup-dark-palette');
            let darkPaletteIndex = DARK_PALETTES.indexOf(savedDarkPalette);
            if (darkPaletteIndex < 0) {
                darkPaletteIndex = 1;
            }

            const applyDarkPalette = () => {
                const palette = DARK_PALETTES[darkPaletteIndex];
                document.body.dataset.darkPalette = palette;
                localStorage.setItem('schedgrup-dark-palette', palette);
            };

            applyDarkPalette();

            const getAuthenticatedUser = () => {
                const candidates = [
                    localStorage.getItem('schedgrup-user'),
                    localStorage.getItem('schedgrup-session'),
                    sessionStorage.getItem('schedgrup-user'),
                    sessionStorage.getItem('schedgrup-session')
                ];

                for (const candidate of candidates) {
                    if (!candidate) continue;

                    try {
                        const parsed = JSON.parse(candidate);
                        if (parsed && (parsed.email || parsed.username || parsed.id)) {
                            return parsed;
                        }
                    } catch (error) {
                        // Ignored: if the stored value is not JSON, it is treated as unauthenticated.
                    }
                }

                return null;
            };

            const getMealsStorageKey = () => {
                const user = getAuthenticatedUser();
                if (!user) {
                    return null;
                }

                return `schedgrupMeals:${user.email || user.username || user.id}`;
            };

            const loadMeals = () => {
                const mealStorageKey = getMealsStorageKey();

                if (!mealStorageKey) {
                    localStorage.removeItem('schedgrupMeals');
                    return [];
                }

                const storedMeals = localStorage.getItem(mealStorageKey);
                return storedMeals ? JSON.parse(storedMeals) : [];
            };

            const persistMeals = (nextMeals) => {
                const mealStorageKey = getMealsStorageKey();

                if (!mealStorageKey) {
                    localStorage.removeItem('schedgrupMeals');
                    return;
                }

                localStorage.setItem(mealStorageKey, JSON.stringify(nextMeals));
            };

            let selectedMeal = 'breakfast';
            let editingIndex = null;
            let meals = loadMeals();

            const updateSelectedMeal = (mealKey) => {
                selectedMeal = mealKey;
                typeButtons.forEach((btn) => {
                    const isActive = btn.dataset.meal === mealKey;
                    btn.classList.toggle('is-active', isActive);
                    btn.setAttribute('aria-pressed', String(isActive));
                });
            };

            typeButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    updateSelectedMeal(button.dataset.meal);
                });
            });

            const renderMeals = () => {
                mealsList.innerHTML = '';
                createScheduleButton.disabled = meals.length === 0;

                if (!meals.length) {
                    const emptyState = document.createElement('p');
                    emptyState.className = 'empty-state';
                    emptyState.textContent = 'Todavía no agregaste comidas.';
                    mealsList.appendChild(emptyState);
                    return;
                }

                meals.forEach((meal, index) => {
                    const item = document.createElement('div');
                    item.className = 'meal-item';

                    const badge = document.createElement('span');
                    badge.className = `meal-badge ${meal.type}`;
                    badge.textContent = MEAL_TYPES[meal.type]?.emoji || '🍽️';
                    badge.style.color = MEAL_BADGE_COLORS[meal.type] || '#173F35';
                    badge.style.setProperty('-webkit-text-fill-color', MEAL_BADGE_COLORS[meal.type] || '#173F35');

                    const text = document.createElement('span');
                    text.className = 'meal-text';
                    text.textContent = meal.name;

                    const actions = document.createElement('div');
                    actions.className = 'meal-actions';

                    const editButton = document.createElement('button');
                    editButton.type = 'button';
                    editButton.className = 'edit-button';
                    editButton.setAttribute('aria-label', 'Editar comida');
                    editButton.textContent = '✎';
                    editButton.dataset.index = index;
                    editButton.addEventListener('click', () => {
                        editingIndex = index;
                        foodInput.value = meal.name;
                        updateSelectedMeal(meal.type);
                        foodInput.focus();
                        renderMeals();
                    });

                    actions.appendChild(editButton);
                    item.appendChild(badge);
                    item.appendChild(text);
                    item.appendChild(actions);
                    mealsList.appendChild(item);
                });
            };

            const submitMeal = () => {
                const name = foodInput.value.trim();
                if (!name) {
                    foodInput.focus();
                    return;
                }

                if (editingIndex !== null) {
                    meals[editingIndex] = {
                        ...meals[editingIndex],
                        name,
                        type: selectedMeal
                    };
                } else {
                    meals.push({
                        id: Date.now(),
                        name,
                        type: selectedMeal
                    });
                }

                persistMeals(meals);
                renderMeals();
                mealForm.reset();
                foodInput.focus();
                editingIndex = null;
            };

            mealForm.addEventListener('submit', (event) => {
                event.preventDefault();
                submitMeal();
            });

            foodInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    submitMeal();
                }
            });

            createScheduleButton.addEventListener('click', () => {
                const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                const scheduleTitle = document.createElement('h4');
                scheduleTitle.className = 'schedule-title';
                scheduleTitle.textContent = 'Horario semanal';

                const scheduleHeader = document.createElement('div');
                scheduleHeader.className = 'schedule-row schedule-header';
                const dayHeading = document.createElement('span');
                dayHeading.className = 'schedule-heading schedule-day-heading';
                dayHeading.textContent = 'Día';
                scheduleHeader.appendChild(dayHeading);

                Object.entries(MEAL_TYPES).forEach(([mealType, { label, emoji }]) => {
                    const heading = document.createElement('span');
                    heading.className = `schedule-heading schedule-heading-${mealType}`;
                    const icon = document.createElement('span');
                    icon.className = 'schedule-heading-icon';
                    icon.setAttribute('aria-hidden', 'true');
                    icon.textContent = emoji;
                    const headingLabel = document.createElement('span');
                    headingLabel.textContent = label;
                    heading.append(icon, headingLabel);
                    scheduleHeader.appendChild(heading);
                });

                const scheduleRows = days.map((day, dayIndex) => {
                    const row = document.createElement('div');
                    row.className = 'schedule-row schedule-day-row';

                    const dayLabel = document.createElement('strong');
                    dayLabel.className = 'schedule-day';
                    dayLabel.textContent = day;
                    row.appendChild(dayLabel);

                    Object.entries(MEAL_TYPES).forEach(([mealType, { label }]) => {
                        const options = meals.filter((meal) => meal.type === mealType);
                        const mealCell = document.createElement('div');
                        mealCell.className = `schedule-meal schedule-meal-${mealType}`;
                        const mealLabel = document.createElement('span');
                        mealLabel.className = 'schedule-meal-label';
                        mealLabel.textContent = label;
                        const mealName = document.createElement('span');
                        mealName.className = 'schedule-meal-name';
                        mealName.textContent = options.length
                            ? options[dayIndex % options.length].name
                            : 'Sin asignar';
                        mealCell.append(mealLabel, mealName);
                        row.appendChild(mealCell);
                    });

                    return row;
                });

                scheduleResult.replaceChildren(scheduleTitle, scheduleHeader, ...scheduleRows);
                downloadScheduleButton.disabled = false;
                downloadSchedulePngButton.disabled = false;
                document.querySelectorAll('.main-nav .nav-link').forEach((navLink) => {
                    navLink.classList.toggle('active', navLink === scheduleNavLink);
                });
                animateToSection(horarioSection);
            });

            downloadScheduleButton.addEventListener('click', () => {
                if (!downloadScheduleButton.disabled) {
                    window.print();
                }
            });

            downloadSchedulePngButton.addEventListener('click', () => {
                if (downloadSchedulePngButton.disabled) {
                    return;
                }

                downloadSchedulePngButton.disabled = true;
                downloadStatus.textContent = 'Preparando la imagen...';

                try {
                    const rows = Array.from(scheduleResult.querySelectorAll('.schedule-day-row'));
                    if (!rows.length) {
                        throw new Error('Primero crea el horario semanal.');
                    }

                    const canvas = document.createElement('canvas');
                    const scale = 2;
                    const width = 1200;
                    const padding = 48;
                    const dayColumnWidth = 142;
                    const columnGap = 12;
                    const mealColumnWidth = (width - padding * 2 - dayColumnWidth - columnGap * 2) / 3;
                    const rowHeight = 100;
                    const rowsTop = 158;
                    const height = rowsTop + rows.length * rowHeight + 100;
                    canvas.width = width * scale;
                    canvas.height = height * scale;

                    const context = canvas.getContext('2d');
                    if (!context) {
                        throw new Error('No se pudo crear el lienzo de imagen.');
                    }

                    context.scale(scale, scale);
                    context.fillStyle = getComputedStyle(scheduleResult.parentElement).backgroundColor;
                    context.fillRect(0, 0, width, height);

                    const pageFont = getComputedStyle(document.body).fontFamily;
                    const scheduleTitle = scheduleResult.querySelector('.schedule-title')?.textContent || 'Horario semanal';
                    context.fillStyle = getComputedStyle(scheduleResult.querySelector('.schedule-title') || horarioSection).color;
                    context.font = `800 30px ${pageFont}`;
                    context.fillText(scheduleTitle, padding, 76);

                    context.strokeStyle = getComputedStyle(scheduleResult.querySelector('.schedule-header')).borderBottomColor;
                    context.lineWidth = 1;
                    context.beginPath();
                    context.moveTo(padding, 100);
                    context.lineTo(width - padding, 100);
                    context.stroke();

                    const header = scheduleResult.querySelector('.schedule-header');
                    const mealTypes = ['breakfast', 'lunch', 'dinner'];
                    const mealStart = padding + dayColumnWidth + columnGap;
                    const headerY = 138;
                    const dayHeader = header.querySelector('.schedule-day-heading');
                    context.fillStyle = getComputedStyle(dayHeader).color;
                    context.font = `800 16px ${pageFont}`;
                    context.fillText(dayHeader.textContent, padding, headerY);

                    mealTypes.forEach((mealType, index) => {
                        const heading = header.querySelector(`.schedule-heading-${mealType}`);
                        const icon = heading.querySelector('.schedule-heading-icon');
                        const x = mealStart + index * (mealColumnWidth + columnGap);
                        const iconStyle = getComputedStyle(icon);
                        const headingStyle = getComputedStyle(heading);

                        context.fillStyle = iconStyle.backgroundColor;
                        context.beginPath();
                        context.arc(x + 14, headerY - 5, 14, 0, Math.PI * 2);
                        context.fill();
                        context.fillStyle = iconStyle.color;
                        context.font = `700 15px ${pageFont}`;
                        context.textAlign = 'center';
                        context.fillText(icon.textContent, x + 14, headerY);
                        context.textAlign = 'left';
                        context.fillStyle = headingStyle.color;
                        context.font = `800 16px ${pageFont}`;
                        context.fillText(heading.querySelector('span:last-child').textContent, x + 36, headerY);
                    });

                    rows.forEach((row, rowIndex) => {
                        const y = rowsTop + rowIndex * rowHeight;
                        const day = row.querySelector('.schedule-day');
                        context.fillStyle = getComputedStyle(day).color;
                        context.font = `800 18px ${pageFont}`;
                        context.fillText(day.textContent, padding, y + 48);

                        mealTypes.forEach((mealType, columnIndex) => {
                            const meal = row.querySelector(`.schedule-meal-${mealType}`);
                            const mealStyle = getComputedStyle(meal);
                            const x = mealStart + columnIndex * (mealColumnWidth + columnGap);
                            const cardY = y + 5;
                            const cardHeight = 82;
                            const cardRadius = 10;

                            context.fillStyle = mealStyle.backgroundColor;
                            context.beginPath();
                            context.roundRect(x, cardY, mealColumnWidth, cardHeight, cardRadius);
                            context.fill();
                            context.fillStyle = mealStyle.borderLeftColor;
                            context.beginPath();
                            context.roundRect(x, cardY, 5, cardHeight, [cardRadius, 0, 0, cardRadius]);
                            context.fill();

                            const label = meal.querySelector('.schedule-meal-label').textContent;
                            const name = meal.querySelector('.schedule-meal-name').textContent;
                            context.fillStyle = getComputedStyle(meal.querySelector('.schedule-meal-label')).color;
                            context.font = `800 12px ${pageFont}`;
                            context.fillText(label.toUpperCase(), x + 18, cardY + 24);
                            context.fillStyle = mealStyle.color;
                            context.font = `600 16px ${pageFont}`;
                            context.fillText(name, x + 18, cardY + 53, mealColumnWidth - 32);
                        });
                    });

                    const brandY = height - 42;
                    const brandColor = getComputedStyle(document.querySelector('.logo')).color;
                    context.strokeStyle = getComputedStyle(scheduleResult.querySelector('.schedule-header')).borderBottomColor;
                    context.beginPath();
                    context.moveTo(padding, brandY - 18);
                    context.lineTo(width - padding, brandY - 18);
                    context.stroke();
                    context.fillStyle = brandColor;
                    context.font = `800 18px ${pageFont}`;
                    context.fillText('Schedgrup', padding, brandY + 6);
                    context.fillStyle = getComputedStyle(document.body).color;
                    context.font = `500 13px ${pageFont}`;
                    context.textAlign = 'right';
                    context.fillText('Organiza tu semana', width - padding, brandY + 6);
                    context.textAlign = 'left';

                    const downloadLink = document.createElement('a');
                    downloadLink.href = canvas.toDataURL('image/png');
                    downloadLink.download = 'horario-semanal.png';
                    downloadLink.click();
                    downloadStatus.textContent = 'Horario descargado en PNG.';
                } catch (error) {
                    downloadStatus.textContent = error.message || 'No se pudo generar el PNG.';
                }

                downloadSchedulePngButton.disabled = false;
                downloadSchedulePngButton.focus();
            });

            let themeTransitionTimer = null;

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
                    }, 540);
                }
            };

            const savedTheme = localStorage.getItem('schedgrup-theme');
            if (savedTheme === 'dark') {
                applyTheme(true);
            } else {
                applyTheme(false);
            }

            themeToggle.addEventListener('change', () => {
                applyTheme(themeToggle.checked, true);
            });

            const sections = Array.from(document.querySelectorAll('main > section:not([hidden])'));
            const duration = 700;
            let isSectionScrolling = false;
            let scrollAnimationFrame = null;

            const updateActiveNavigation = (targetSection) => {
                const activeLink = targetSection === sections[0]
                    ? document.querySelector('.main-nav a[href="#top"]')
                    : document.querySelector(`.main-nav a[href="#${targetSection.id}"]`);

                if (activeLink) {
                    document.querySelectorAll('.main-nav .nav-link').forEach((navLink) => {
                        navLink.classList.toggle('active', navLink === activeLink);
                    });
                }
            };

            const animateToSection = (targetSection) => {
                if (scrollAnimationFrame !== null) {
                    cancelAnimationFrame(scrollAnimationFrame);
                }

                targetSection.scrollTop = 0;
                isSectionScrolling = true;
                document.documentElement.classList.add('wheel-scrolling');

                const topOffset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
                const startY = window.scrollY;
                const targetY = Math.max(0, targetSection.getBoundingClientRect().top + startY - topOffset);
                const startedAt = performance.now();
                updateActiveNavigation(targetSection);

                const animateScroll = (now) => {
                    const progress = Math.min((now - startedAt) / duration, 1);
                    const easedProgress = progress < 0.5
                        ? 4 * progress ** 3
                        : 1 - ((-2 * progress + 2) ** 3) / 2;

                    window.scrollTo(0, startY + (targetY - startY) * easedProgress);

                    if (progress < 1) {
                        scrollAnimationFrame = requestAnimationFrame(animateScroll);
                    } else {
                        document.documentElement.classList.remove('wheel-scrolling');
                        isSectionScrolling = false;
                        scrollAnimationFrame = null;
                    }
                };

                scrollAnimationFrame = requestAnimationFrame(animateScroll);
            };

            document.querySelectorAll('.main-nav a[href^="#"]').forEach((link) => {
                link.addEventListener('click', (event) => {
                    const targetSection = link.hash === '#top'
                        ? sections[0]
                        : document.querySelector(link.hash);

                    if (!targetSection) {
                        return;
                    }

                    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                        updateActiveNavigation(targetSection);
                        return;
                    }

                    event.preventDefault();
                    animateToSection(targetSection);
                });
            });

            window.addEventListener('wheel', (event) => {
                if (event.ctrlKey || event.deltaY === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    return;
                }

                if (isSectionScrolling) {
                    event.preventDefault();
                    return;
                }

                const topOffset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
                const activeLink = document.querySelector('.main-nav .nav-link.active');
                const activeTarget = activeLink?.hash === '#top'
                    ? sections[0]
                    : activeLink?.hash
                        ? document.querySelector(activeLink.hash)
                        : null;
                const currentIndex = sections.indexOf(activeTarget);

                if (currentIndex < 0) {
                    return;
                }

                let targetIndex = currentIndex;
                const currentSection = sections[currentIndex];
                const currentBounds = sections[currentIndex].getBoundingClientRect();
                const wheelDistance = Math.abs(event.deltaY);

                if (event.deltaY > 0 && currentIndex < sections.length - 1) {
                    const hasScrollableContent = currentSection.scrollHeight > window.innerHeight + 1;
                    if (hasScrollableContent && currentBounds.bottom > topOffset + wheelDistance + 20) {
                        return;
                    }
                    targetIndex++;
                } else if (event.deltaY < 0 && currentIndex > 0) {
                    if (currentBounds.top < topOffset - wheelDistance - 20) {
                        return;
                    }
                    targetIndex--;
                } else {
                    return;
                }

                event.preventDefault();
                animateToSection(sections[targetIndex]);
            }, { passive: false });

            renderMeals();
            updateSelectedMeal(selectedMeal);
        });





const formulario = document.querySelector("form");
const nombreInput = document.querySelector("#nombre");
const tipoInput = document.querySelector("#tipo");
const listaComidas = document.querySelector("ul");

// ============================================
// DÍAS DE LA SEMANA
// ============================================

const dias = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo"
];

// ============================================
// GUARDAR LAS COMIDAS
// ============================================

let comidas = [];


// ============================================
// AGREGAR UNA COMIDA
// ============================================

formulario.addEventListener("submit", function (evento) {

    evento.preventDefault();

    const nombre = nombreInput.value.trim();
    const tipo = tipoInput.value;

    if (nombre === "") {
        alert("Escribe el nombre de la comida.");
        return;
    }

    const nuevaComida = {
        nombre: nombre,
        tipo: tipo
    };

    comidas.push(nuevaComida);

    mostrarComidas();

    nombreInput.value = "";
});


// ============================================
// MOSTRAR LAS COMIDAS
// ============================================

function mostrarComidas() {

    listaComidas.innerHTML = "";

    comidas.forEach(function (comida) {

        const elemento = document.createElement("li");

        let emoji = "🍽️";

        if (comida.tipo === "desayuno") {
            emoji = "🌅";
        }

        if (comida.tipo === "almuerzo") {
            emoji = "☀️";
        }

        if (comida.tipo === "cena") {
            emoji = "🌙";
        }

        elemento.textContent =
            `${emoji} ${comida.nombre} — ${comida.tipo}`;

        listaComidas.appendChild(elemento);
    });
}


// ============================================
// MEZCLAR LAS COMIDAS
// ============================================

function mezclar(array) {

    const copia = [...array];

    for (let i = copia.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia;
}


// ============================================
// OBTENER COMIDAS POR TIPO
// ============================================

function obtenerComidas(tipo) {

    return comidas.filter(function (comida) {
        return comida.tipo === tipo;
    });
}



function generarMenu() {

    const desayunos = mezclar(obtenerComidas("desayuno"));
    const almuerzos = mezclar(obtenerComidas("almuerzo"));
    const cenas = mezclar(obtenerComidas("cena"));


    // Comprobar que haya comidas de cada tipo

    if (desayunos.length === 0) {
        alert("Agrega al menos un desayuno.");
        return;
    }

    if (almuerzos.length === 0) {
        alert("Agrega al menos un almuerzo.");
        return;
    }

    if (cenas.length === 0) {
        alert("Agrega al menos una cena.");
        return;
    }


    const diasHTML = document.querySelectorAll(
        "section:last-child article"
    );


    // Crear copias de las listas
    // para poder ir sacando las comidas utilizadas

    let listaDesayunos = [...desayunos];
    let listaAlmuerzos = [...almuerzos];
    let listaCenas = [...cenas];


    dias.forEach(function (dia, indice) {

        // Si ya no quedan comidas disponibles,
        // volvemos a llenar la lista y la mezclamos.

        if (listaDesayunos.length === 0) {
            listaDesayunos = mezclar(desayunos);
        }

        if (listaAlmuerzos.length === 0) {
            listaAlmuerzos = mezclar(almuerzos);
        }

        if (listaCenas.length === 0) {
            listaCenas = mezclar(cenas);
        }


        // Sacar una comida de cada lista

        const desayuno = listaDesayunos.shift();

        const almuerzo = listaAlmuerzos.shift();

        const cena = listaCenas.shift();


        // Mostrar el resultado

        const articulo = diasHTML[indice];

        articulo.innerHTML = `
            <h3>${dia}</h3>

            <p>🌅 Desayuno: ${desayuno.nombre}</p>

            <p>☀️ Almuerzo: ${almuerzo.nombre}</p>

            <p>🌙 Cena: ${cena.nombre}</p>
        `;

    });

}



// ============================================
// BOTÓN PARA GENERAR EL MENÚ
// ============================================

const botonMenu = document.createElement("button");

botonMenu.textContent = "✨ Generar menú semanal";

botonMenu.type = "button";

botonMenu.addEventListener("click", generarMenu);


// ============================================
// COLOCAR EL BOTÓN EN LA PÁGINA
// ============================================

const secciones = document.querySelectorAll("section");

const ultimaSeccion = secciones[secciones.length - 1];

ultimaSeccion.insertBefore(
    botonMenu,
    ultimaSeccion.children[1]
);
